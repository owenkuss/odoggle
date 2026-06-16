import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import Stripe from "stripe";
import { WebSocketServer, WebSocket } from "ws";
import { DEFAULT_ELO, generateGuestId, type PdlResult } from "@odoggle/shared";
import { getClientMeta, getOnlineCount, registerClient, send, unregisterClient } from "./clients";
import { initDb } from "./db/pool";
import { persistReport } from "./db/reports";
import { matchmaker } from "./matchmaker";
import { checkRateLimit } from "./redis/client";
import {
  fetchLeaderboard,
  fetchTotalMatches,
  loadPlayer,
  mergeGuestIntoAccount,
} from "./store/players";

dotenv.config();

const PORT = Number(process.env.PORT ?? 3001);

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: "/signal" });

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const configured = process.env.WEB_ORIGIN ?? "http://localhost:3000";
      const allowed = configured.split(",").map((o) => o.trim());
      if (allowed.includes(origin)) return callback(null, true);
      if (process.env.NODE_ENV !== "production" && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS blocked: ${origin}`));
    },
  })
);

app.post("/api/pro/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const creemSecret = process.env.CREEM_WEBHOOK_SECRET;
  const creemSig = req.headers["creem-signature"];
  if (creemSecret && typeof creemSig === "string") {
    const crypto = await import("crypto");
    const expected = crypto
      .createHmac("sha256", creemSecret)
      .update(req.body as Buffer)
      .digest("hex");
    if (creemSig !== expected) return res.status(400).json({ error: "Invalid Creem signature" });
    try {
      const event = JSON.parse((req.body as Buffer).toString()) as {
        type?: string;
        data?: { metadata?: { playerId?: string } };
      };
      if (event.type === "checkout.completed" || event.type === "order.paid") {
        const playerId = event.data?.metadata?.playerId;
        if (playerId) {
          const player = matchmaker.getPlayer(playerId);
          if (player) {
            player.isPro = true;
            matchmaker.upsertPlayer(player);
          }
        }
      }
      return res.json({ received: true });
    } catch (err) {
      return res.status(400).json({ error: String(err) });
    }
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!secret || !stripeKey) {
    return res.status(503).json({ error: "Stripe not configured" });
  }

  const stripe = new Stripe(stripeKey);
  const sig = req.headers["stripe-signature"];
  if (!sig || typeof sig !== "string") {
    return res.status(400).json({ error: "Missing signature" });
  }

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, secret);
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const playerId = session.metadata?.playerId;
      if (playerId) {
        const player = matchmaker.getPlayer(playerId) ?? {
          id: playerId,
          displayName: "Player",
          elo: DEFAULT_ELO,
          peakElo: DEFAULT_ELO,
          wins: 0,
          losses: 0,
          isPro: true,
          isGuest: true,
        };
        player.isPro = true;
        matchmaker.upsertPlayer(player);
      }
    }
    res.json({ received: true });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, online: getOnlineCount() });
});

app.get("/api/stats", async (_req, res) => {
  const base = matchmaker.getStats();
  const totalMatches = await fetchTotalMatches(base.totalMatches);
  res.json({
    ...base,
    totalMatches,
    activePlayers: getOnlineCount(),
  });
});

app.get("/api/leaderboard", async (req, res) => {
  const limit = Number(req.query.limit ?? 100);
  const entries = await fetchLeaderboard(limit, () => matchmaker.getLeaderboard(limit));
  res.json({ entries });
});

app.get("/api/player/:id", async (req, res) => {
  const player =
    matchmaker.getPlayer(req.params.id) ?? (await loadPlayer(req.params.id));
  if (!player) return res.status(404).json({ error: "Not found" });
  res.json(player);
});

app.post("/api/player/pdl", async (req, res) => {
  const { playerId, pdl } = req.body;
  if (!playerId || !pdl) return res.status(400).json({ error: "playerId and pdl required" });
  const existing = matchmaker.getPlayer(String(playerId)) ?? (await loadPlayer(String(playerId)));
  if (!existing?.isPro) {
    return res.status(403).json({ error: "Pro required for Lab PDL scans" });
  }
  const profile = matchmaker.upsertPlayer({
    id: String(playerId),
    displayName: existing?.displayName ?? "Player",
    elo: existing?.elo ?? DEFAULT_ELO,
    peakElo: existing?.peakElo,
    wins: existing?.wins,
    losses: existing?.losses,
    isPro: existing?.isPro,
    isGuest: existing?.isGuest,
    lastPdl: pdl,
  });
  res.json({ ok: true, lastPdl: profile.lastPdl });
});

app.post("/api/player/merge", async (req, res) => {
  const { guestId, accountId, displayName, googleId } = req.body;
  if (!guestId || !accountId || !displayName) {
    return res.status(400).json({ error: "guestId, accountId, displayName required" });
  }
  const merged = await mergeGuestIntoAccount(
    String(guestId),
    String(accountId),
    String(displayName),
    (g, a, d) => matchmaker.mergeProfiles(g, a, d),
    googleId ? String(googleId) : undefined
  );
  res.json(merged);
});

app.post("/api/report", async (req, res) => {
  const { reporterId, matchId, reason, details } = req.body;
  if (!reporterId || !reason) {
    return res.status(400).json({ error: "reporterId and reason required" });
  }
  const allowed = await checkRateLimit("report", String(reporterId), 5, 3600);
  if (!allowed) return res.status(429).json({ error: "Report rate limit exceeded" });

  const report = await persistReport({
    reporterId: String(reporterId),
    matchId: matchId ? String(matchId) : undefined,
    reason,
    details,
  });
  res.json({ ok: true, reportId: report.id });
});

app.post("/api/match/outcome", (req, res) => {
  const { matchId } = req.body;
  if (!matchId) return res.status(400).json({ error: "matchId required" });
  const match = matchmaker.getMatch(String(matchId));
  if (!match?.outcome) return res.status(404).json({ error: "Match outcome not found" });
  res.json(match.outcome);
});

app.post("/api/guest", (_req, res) => {
  const id = generateGuestId();
  const player = matchmaker.upsertPlayer({
    id,
    displayName: `Guest${id.slice(-4)}`,
    elo: DEFAULT_ELO,
    isGuest: true,
  });
  res.json(player);
});

function iterateClients(): [WebSocket, NonNullable<ReturnType<typeof getClientMeta>>][] {
  const result: [WebSocket, NonNullable<ReturnType<typeof getClientMeta>>][] = [];
  wss.clients.forEach((client) => {
    const meta = getClientMeta(client as WebSocket);
    if (meta) result.push([client as WebSocket, meta]);
  });
  return result;
}

function parseLastPdl(value: unknown): PdlResult | undefined {
  if (!value || typeof value !== "object") return undefined;
  const p = value as Record<string, unknown>;
  if (typeof p.composite !== "number" || typeof p.scannedAt !== "number") return undefined;
  return value as unknown as PdlResult;
}

function sendToMatch(matchId: string, message: unknown): void {
  const match = matchmaker.getMatch(matchId);
  if (!match) return;
  const ids = new Set([match.player1.id, match.player2.id]);
  for (const [ws, meta] of iterateClients()) {
    if (ids.has(meta.playerId)) send(ws, message);
  }
}

function sendToPlayer(playerId: string, message: unknown): void {
  for (const [ws, meta] of iterateClients()) {
    if (meta.playerId === playerId) send(ws, message);
  }
}

function relaySignal(from: WebSocket, targetId: string, msg: Record<string, unknown>): void {
  for (const [ws, meta] of iterateClients()) {
    if (meta.playerId === targetId) {
      send(ws, { type: "signal", from: getClientMeta(from)?.playerId, payload: msg.payload });
      return;
    }
  }
}

function broadcastMatchResult(matchId: string, match: NonNullable<ReturnType<typeof matchmaker.getMatch>>): void {
  const outcome = match.outcome;
  if (!outcome) return;

  sendToMatch(matchId, {
    type: "match_result",
    matchId,
    winnerId: outcome.winnerId,
    loserId: outcome.loserId,
    winnerElo: outcome.winnerElo,
    loserElo: outcome.loserElo,
    winnerEloDelta: outcome.winnerEloDelta,
    loserEloDelta: outcome.loserEloDelta,
    unranked: outcome.unranked,
    player1Pdl: outcome.player1Pdl,
    player2Pdl: outcome.player2Pdl,
  });
}

setInterval(() => matchmaker.widenQueues(), 5000);
setInterval(() => matchmaker.cleanupOldMatches(), 600_000);

const wsQueues = new WeakMap<WebSocket, Promise<void>>();

wss.on("connection", (ws) => {
  send(ws, { type: "connected", online: getOnlineCount() });

  ws.on("message", (raw) => {
    const run = wsQueues.get(ws) ?? Promise.resolve();
    const next = run
      .then(async () => {
        try {
          const msg = JSON.parse(raw.toString()) as Record<string, unknown>;
          await handleMessage(ws, msg);
        } catch {
          send(ws, { type: "error", message: "Invalid message" });
        }
      })
      .catch(() => {});
    wsQueues.set(ws, next);
  });

  ws.on("close", () => unregisterClient(ws));
});

async function handleMessage(ws: WebSocket, msg: Record<string, unknown>): Promise<void> {
  switch (msg.type) {
    case "register": {
      const playerId = String(msg.playerId ?? generateGuestId());
      const displayName = String(msg.displayName ?? "Guest");
      const elo = Number(msg.elo ?? DEFAULT_ELO);
      const isPro = Boolean(msg.isPro);
      registerClient(ws, { playerId, displayName, elo, isPro });
      const stored = (await loadPlayer(playerId)) ?? undefined;
      const lastPdl = parseLastPdl(msg.lastPdl) ?? stored?.lastPdl;
      matchmaker.upsertPlayer({
        id: playerId,
        displayName: stored?.displayName ?? displayName,
        elo: stored?.elo ?? elo,
        peakElo: stored?.peakElo,
        wins: stored?.wins,
        losses: stored?.losses,
        isPro: stored?.isPro ?? isPro,
        isGuest: stored?.isGuest ?? true,
        lastPdl,
      });
      const profile = matchmaker.getPlayer(playerId)!;
      send(ws, { type: "registered", playerId, elo: profile.elo, isPro: profile.isPro });
      break;
    }
    case "join_queue": {
      const meta = getClientMeta(ws);
      if (!meta) return send(ws, { type: "error", message: "Not registered" });
      const allowed = await checkRateLimit("queue", meta.playerId, 20, 60);
      if (!allowed) return send(ws, { type: "error", message: "Queue rate limit exceeded" });

      const profile = matchmaker.getPlayer(meta.playerId);
      const match = matchmaker.joinQueue({
        id: meta.playerId,
        displayName: meta.displayName,
        elo: profile?.elo ?? meta.elo,
        socketId: meta.playerId,
        isPro: profile?.isPro ?? meta.isPro,
      });
      if (match) {
        sendToMatch(match.id, {
          type: "match_found",
          matchId: match.id,
          player1: { id: match.player1.id, displayName: match.player1.displayName, elo: match.player1.elo },
          player2: { id: match.player2.id, displayName: match.player2.displayName, elo: match.player2.elo },
        });
      } else {
        send(ws, { type: "queued", position: matchmaker.getQueueSize() });
      }
      break;
    }
    case "leave_queue": {
      const meta = getClientMeta(ws);
      if (meta) matchmaker.leaveQueue(meta.playerId);
      send(ws, { type: "queue_left" });
      break;
    }
    case "create_room": {
      const meta = getClientMeta(ws);
      if (!meta) return send(ws, { type: "error", message: "Not registered" });
      const room = matchmaker.createRoom(meta.playerId, Boolean(msg.unranked));
      send(ws, { type: "room_created", room });
      break;
    }
    case "join_room": {
      const meta = getClientMeta(ws);
      if (!meta) return send(ws, { type: "error", message: "Not registered" });
      const code = String(msg.code ?? "").toUpperCase();
      const room = await matchmaker.joinRoom(code, meta.playerId);
      if (!room) return send(ws, { type: "error", message: "Room not found or full" });
      send(ws, { type: "room_joined", room });
      sendToPlayer(room.hostId, { type: "room_guest_joined", room });
      break;
    }
    case "enter_room": {
      const meta = getClientMeta(ws);
      if (!meta) return send(ws, { type: "error", message: "Not registered" });
      const code = String(msg.code ?? "").toUpperCase();
      const profile = matchmaker.getPlayer(meta.playerId);
      const result = await matchmaker.enterRoomArena(code, {
        id: meta.playerId,
        displayName: meta.displayName,
        elo: profile?.elo ?? meta.elo,
        socketId: meta.playerId,
        isPro: profile?.isPro ?? meta.isPro,
      });
      if (result.match) {
        sendToMatch(result.match.id, {
          type: "match_found",
          matchId: result.match.id,
          player1: {
            id: result.match.player1.id,
            displayName: result.match.player1.displayName,
            elo: result.match.player1.elo,
          },
          player2: {
            id: result.match.player2.id,
            displayName: result.match.player2.displayName,
            elo: result.match.player2.elo,
          },
          roomCode: code,
        });
      } else if (result.reason === "not_found") {
        send(ws, { type: "room_error", code, reason: "not_found", message: "Room not found. Check the code or create a new room." });
      } else if (result.reason === "full") {
        send(ws, { type: "room_error", code, reason: "full", message: "Room is full." });
      } else {
        send(ws, { type: "room_waiting", code });
      }
      break;
    }
    case "signal":
      relaySignal(ws, String(msg.targetId ?? ""), msg);
      break;
    case "battle_ready": {
      const matchId = String(msg.matchId ?? "");
      const match = matchmaker.startBattle(matchId);
      if (match) sendToMatch(matchId, { type: "battle_start", matchId, duration: 15 });
      break;
    }
    case "battle_end": {
      const matchId = String(msg.matchId ?? "");
      const match = matchmaker.finishBattle(matchId);
      if (match?.outcome) broadcastMatchResult(matchId, match);
      break;
    }
    case "skip": {
      const meta = getClientMeta(ws);
      if (!meta) return;
      const matchId = String(msg.matchId ?? "");
      if (matchId) {
        const match = matchmaker.getMatch(matchId);
        if (
          match &&
          match.phase !== "done" &&
          (match.player1.id === meta.playerId || match.player2.id === meta.playerId)
        ) {
          matchmaker.cancelMatch(matchId);
          sendToMatch(matchId, { type: "match_cancelled", matchId, by: meta.playerId });
          return;
        }
      }
      matchmaker.leaveQueue(meta.playerId);
      send(ws, { type: "skipped" });
      break;
    }
    default:
      send(ws, { type: "error", message: `Unknown type: ${msg.type}` });
  }
}

async function start(): Promise<void> {
  await initDb();

  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} is already in use. Close the other dev server or set PORT in apps/server/.env`
      );
      process.exit(1);
    }
    throw err;
  });

  httpServer.listen(PORT, () => {
    console.log(`Odoggle server listening on :${PORT}`);
  });
}

void start();

export { app, httpServer, wss };
