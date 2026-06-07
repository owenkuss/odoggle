import {
  applyMatchResult,
  DEFAULT_ELO,
  generateRoomCode,
  MATCHMAKING_BUCKETS,
  MIN_VOTES_REQUIRED,
  TOP_DOG_RANK,
} from "@odoggle/shared";
import type { MatchOutcome, PlayerProfile, RoomInfo } from "@odoggle/shared";
import { v4 as uuidv4 } from "uuid";
import {
  redisAddRoomPresence,
  redisClearRoomPresence,
  redisGetRoom,
  redisGetRoomPresence,
  redisSaveRoom,
  isRedisEnabled,
} from "./redis/client";
import { cachePlayer, memoryMergePlayers, persistMatchOutcome } from "./store/players";

export interface QueuedPlayer {
  id: string;
  displayName: string;
  elo: number;
  socketId: string;
  isPro: boolean;
  joinedAt: number;
  bucketIndex: number;
}

export interface ActiveMatch {
  id: string;
  player1: QueuedPlayer;
  player2: QueuedPlayer;
  spectators: string[];
  votes: Map<string, string>;
  phase: "connecting" | "battle" | "voting" | "done";
  startedAt?: number;
  votingStartedAt?: number;
  voteExtended?: boolean;
  roomCode?: string;
  unranked?: boolean;
  outcome?: MatchOutcome;
}

export class Matchmaker {
  private queue: QueuedPlayer[] = [];
  private matches = new Map<string, ActiveMatch>();
  private rooms = new Map<string, RoomInfo>();
  private roomPresence = new Map<string, Set<string>>();
  private players = new Map<string, PlayerProfile>();
  private totalMatchesCompleted = 0;

  getQueueSize(): number {
    return this.queue.length;
  }

  getActiveMatchCount(): number {
    return [...this.matches.values()].filter((m) => m.phase !== "done").length;
  }

  upsertPlayer(profile: Partial<PlayerProfile> & { id: string; displayName: string }): PlayerProfile {
    const existing = this.players.get(profile.id);
    const player: PlayerProfile = {
      id: profile.id,
      displayName: profile.displayName,
      elo: profile.elo ?? existing?.elo ?? DEFAULT_ELO,
      peakElo: profile.peakElo ?? existing?.peakElo ?? DEFAULT_ELO,
      wins: profile.wins ?? existing?.wins ?? 0,
      losses: profile.losses ?? existing?.losses ?? 0,
      isPro: profile.isPro ?? existing?.isPro ?? false,
      isGuest: profile.isGuest ?? existing?.isGuest ?? true,
      lastPdl: profile.lastPdl ?? existing?.lastPdl,
    };
    this.players.set(player.id, player);
    cachePlayer(player);
    return player;
  }

  mergeProfiles(guestId: string, accountId: string, displayName: string): PlayerProfile {
    const merged = memoryMergePlayers(this.players, guestId, accountId, displayName);
    cachePlayer(merged);
    return merged;
  }

  getPlayer(id: string): PlayerProfile | undefined {
    return this.players.get(id);
  }

  private toQueuedPlayer(
    player: Omit<QueuedPlayer, "joinedAt" | "bucketIndex">
  ): QueuedPlayer {
    return { ...player, joinedAt: Date.now(), bucketIndex: 0 };
  }

  joinQueue(player: Omit<QueuedPlayer, "joinedAt" | "bucketIndex">): ActiveMatch | null {
    this.leaveQueue(player.id);
    this.queue.push(this.toQueuedPlayer(player));
    this.upsertPlayer({
      id: player.id,
      displayName: player.displayName,
      elo: player.elo,
      isPro: player.isPro,
      isGuest: true,
    });
    this.queue.sort(
      (a, b) =>
        Number(b.isPro) - Number(a.isPro) || a.joinedAt - b.joinedAt
    );
    return this.tryMatch();
  }

  leaveQueue(playerId: string): void {
    this.queue = this.queue.filter((p) => p.id !== playerId);
  }

  widenQueues(): void {
    if (this.queue.length === 0) return;
    const oldest = this.queue.reduce((a, b) => (a.joinedAt < b.joinedAt ? a : b));
    oldest.bucketIndex = Math.min(oldest.bucketIndex + 1, MATCHMAKING_BUCKETS.length - 1);
    this.tryMatch();
  }

  private tryMatch(): ActiveMatch | null {
    if (this.queue.length < 2) return null;

    for (let i = 0; i < this.queue.length; i++) {
      for (let j = i + 1; j < this.queue.length; j++) {
        const p1 = this.queue[i];
        const p2 = this.queue[j];
        const bucket = MATCHMAKING_BUCKETS[Math.min(p1.bucketIndex, p2.bucketIndex)];
        if (Math.abs(p1.elo - p2.elo) <= bucket) {
          this.queue.splice(j, 1);
          this.queue.splice(i, 1);
          return this.createMatch(p1, p2);
        }
      }
    }
    return null;
  }

  createMatch(p1: QueuedPlayer, p2: QueuedPlayer, roomCode?: string, unranked = false): ActiveMatch {
    const match: ActiveMatch = {
      id: uuidv4(),
      player1: p1,
      player2: p2,
      spectators: [],
      votes: new Map(),
      phase: "connecting",
      roomCode,
      unranked,
    };
    this.matches.set(match.id, match);
    return match;
  }

  getMatch(matchId: string): ActiveMatch | undefined {
    return this.matches.get(matchId);
  }

  addSpectator(matchId: string, socketId: string): void {
    const match = this.matches.get(matchId);
    if (match && !match.spectators.includes(socketId)) {
      match.spectators.push(socketId);
    }
  }

  pullJuryFromQueue(matchId: string, count = 2): string[] {
    const match = this.matches.get(matchId);
    if (!match) return [];
    const jury: string[] = [];
    const blocked = new Set([match.player1.id, match.player2.id]);
    const toRemove: string[] = [];
    for (let i = 0; i < this.queue.length && jury.length < count; i++) {
      const candidate = this.queue[i];
      if (!blocked.has(candidate.id)) {
        jury.push(candidate.id);
        toRemove.push(candidate.id);
        if (!match.spectators.includes(candidate.id)) {
          match.spectators.push(candidate.id);
        }
      }
    }
    for (const id of toRemove) this.leaveQueue(id);
    return jury;
  }

  getVotingMatches() {
    return [...this.matches.values()]
      .filter((m) => m.phase === "voting")
      .map((m) => ({
        matchId: m.id,
        player1: {
          id: m.player1.id,
          displayName: m.player1.displayName,
          elo: m.player1.elo,
        },
        player2: {
          id: m.player2.id,
          displayName: m.player2.displayName,
          elo: m.player2.elo,
        },
        votes: m.votes.size,
        minVotes: MIN_VOTES_REQUIRED,
        unranked: m.unranked ?? false,
      }));
  }

  getMatchSummary(matchId: string) {
    const m = this.matches.get(matchId);
    if (!m || m.phase !== "voting") return null;
    return {
      matchId: m.id,
      player1: { id: m.player1.id, displayName: m.player1.displayName, elo: m.player1.elo },
      player2: { id: m.player2.id, displayName: m.player2.displayName, elo: m.player2.elo },
      votes: m.votes.size,
      minVotes: MIN_VOTES_REQUIRED,
      phase: m.phase,
    };
  }

  startBattle(matchId: string): ActiveMatch | undefined {
    const match = this.matches.get(matchId);
    if (!match || match.phase !== "connecting") return undefined;
    match.phase = "battle";
    match.startedAt = Date.now();
    return match;
  }

  beginVoting(matchId: string): ActiveMatch | undefined {
    const match = this.matches.get(matchId);
    if (!match || match.phase !== "battle") return undefined;
    match.phase = "voting";
    match.votingStartedAt = Date.now();
    match.voteExtended = false;
    return match;
  }

  extendVoting(matchId: string): ActiveMatch | undefined {
    const match = this.matches.get(matchId);
    if (!match || match.phase !== "voting" || match.voteExtended) return undefined;
    match.voteExtended = true;
    return match;
  }

  castVote(matchId: string, voterId: string, votedForId: string): ActiveMatch | null {
    const match = this.matches.get(matchId);
    if (!match || match.phase !== "voting") return null;
    if (voterId === match.player1.id || voterId === match.player2.id) return null;
    if (votedForId !== match.player1.id && votedForId !== match.player2.id) return null;
    match.votes.set(voterId, votedForId);
    if (match.votes.size >= MIN_VOTES_REQUIRED) {
      return this.resolveMatch(matchId);
    }
    return match;
  }

  injectJuryVotes(matchId: string): ActiveMatch | null {
    const match = this.matches.get(matchId);
    if (!match || match.phase !== "voting") return null;
    const juryIds = ["jury_a", "jury_b", "jury_c"];
    for (const juryId of juryIds) {
      if (match.votes.size >= MIN_VOTES_REQUIRED) break;
      if (match.votes.has(juryId)) continue;
      const voteFor = Math.random() > 0.5 ? match.player1.id : match.player2.id;
      match.votes.set(juryId, voteFor);
    }
    if (match.votes.size >= MIN_VOTES_REQUIRED) {
      return this.resolveMatch(matchId);
    }
    return match;
  }

  resolveMatch(matchId: string): ActiveMatch | null {
    const match = this.matches.get(matchId);
    if (!match) return null;

    const voteCounts = new Map<string, number>();
    for (const votedFor of match.votes.values()) {
      voteCounts.set(votedFor, (voteCounts.get(votedFor) ?? 0) + 1);
    }

    let winnerId = match.player1.id;
    let loserId = match.player2.id;
    const p1Votes = voteCounts.get(match.player1.id) ?? 0;
    const p2Votes = voteCounts.get(match.player2.id) ?? 0;

    if (p2Votes > p1Votes) {
      winnerId = match.player2.id;
      loserId = match.player1.id;
    } else if (p1Votes === p2Votes && match.votes.size > 0) {
      if (match.player2.elo > match.player1.elo) {
        winnerId = match.player1.id;
        loserId = match.player2.id;
      }
    }

    let outcome: MatchOutcome = {
      matchId,
      winnerId,
      loserId,
      winnerEloDelta: 0,
      loserEloDelta: 0,
      winnerElo: match.player1.elo,
      loserElo: match.player2.elo,
      unranked: match.unranked,
    };

    if (!match.unranked) {
      const winner = this.players.get(winnerId) ?? this.upsertPlayer({ id: winnerId, displayName: "Player", elo: DEFAULT_ELO });
      const loser = this.players.get(loserId) ?? this.upsertPlayer({ id: loserId, displayName: "Player", elo: DEFAULT_ELO });
      const result = applyMatchResult(winner.elo, loser.elo);
      winner.elo = result.winnerNew;
      winner.peakElo = Math.max(winner.peakElo, winner.elo);
      winner.wins += 1;
      loser.elo = result.loserNew;
      loser.losses += 1;
      this.players.set(winnerId, winner);
      this.players.set(loserId, loser);
      outcome = {
        matchId,
        winnerId,
        loserId,
        winnerEloDelta: result.winnerDelta,
        loserEloDelta: result.loserDelta,
        winnerElo: winner.elo,
        loserElo: loser.elo,
        unranked: false,
      };
    }

    match.outcome = outcome;
    match.phase = "done";
    this.totalMatchesCompleted += 1;
    if (!match.unranked) {
      cachePlayer(this.players.get(winnerId)!);
      cachePlayer(this.players.get(loserId)!);
    }
    void persistMatchOutcome(outcome, match.votes.size);
    return match;
  }

  createRoom(hostId: string, unranked = false): RoomInfo {
    let code = generateRoomCode();
    while (this.rooms.has(code)) code = generateRoomCode();
    const room: RoomInfo = {
      code,
      hostId,
      unranked,
      expiresAt: Date.now() + 86400 * 1000,
    };
    this.rooms.set(code, room);
    void redisSaveRoom(room);
    return room;
  }

  async loadRoom(code: string): Promise<RoomInfo | null> {
    const upper = code.toUpperCase();
    const cached = this.rooms.get(upper);
    if (cached) return cached;
    if (isRedisEnabled()) {
      const fromRedis = await redisGetRoom(upper);
      if (fromRedis) {
        this.rooms.set(upper, fromRedis);
        return fromRedis;
      }
    }
    return null;
  }

  async joinRoom(code: string, guestId: string): Promise<RoomInfo | null> {
    const room = await this.loadRoom(code);
    if (!room || room.guestId || room.hostId === guestId) return null;
    room.guestId = guestId;
    this.rooms.set(room.code, room);
    void redisSaveRoom(room);
    return room;
  }

  async enterRoomArena(
    code: string,
    player: Omit<QueuedPlayer, "joinedAt" | "bucketIndex">
  ): Promise<ActiveMatch | null> {
    const room = await this.loadRoom(code);
    if (!room) return null;
    if (player.id !== room.hostId && player.id !== room.guestId) return null;

    const upper = room.code;
    if (!this.roomPresence.has(upper)) this.roomPresence.set(upper, new Set());
    this.roomPresence.get(upper)!.add(player.id);
    void redisAddRoomPresence(upper, player.id);

    const present = this.roomPresence.get(upper)!;
    if (isRedisEnabled()) {
      const redisPresent = await redisGetRoomPresence(upper);
      for (const id of redisPresent) present.add(id);
    }

    if (!room.guestId || !present.has(room.hostId) || !present.has(room.guestId)) {
      return null;
    }

    const hostProfile = this.players.get(room.hostId);
    const guestProfile = this.players.get(room.guestId);
    const p1 = this.toQueuedPlayer({
      id: room.hostId,
      displayName: hostProfile?.displayName ?? "Host",
      elo: hostProfile?.elo ?? DEFAULT_ELO,
      socketId: room.hostId,
      isPro: hostProfile?.isPro ?? false,
    });
    const p2 = this.toQueuedPlayer({
      id: room.guestId,
      displayName: guestProfile?.displayName ?? "Guest",
      elo: guestProfile?.elo ?? DEFAULT_ELO,
      socketId: room.guestId,
      isPro: guestProfile?.isPro ?? false,
    });

    this.roomPresence.delete(upper);
    void redisClearRoomPresence(upper);
    return this.createMatch(p1, p2, upper, room.unranked);
  }

  leaveRoomArena(code: string, playerId: string): void {
    this.roomPresence.get(code.toUpperCase())?.delete(playerId);
  }

  getLeaderboard(limit = 100) {
    return [...this.players.values()]
      .sort((a, b) => b.elo - a.elo)
      .slice(0, limit)
      .map((p, i) => ({
        rank: i + 1,
        id: p.id,
        displayName: p.displayName,
        elo: p.elo,
        peakElo: p.peakElo,
        wins: p.wins,
        losses: p.losses,
        isPro: p.isPro,
        isTopDog: i < TOP_DOG_RANK,
      }));
  }

  getStats() {
    return {
      totalMatches: this.totalMatchesCompleted,
      activePlayers: this.queue.length + this.getActiveMatchCount() * 2,
      countries: 42,
      hoursPerDay: 18,
    };
  }

  cancelMatch(matchId: string): ActiveMatch | null {
    const match = this.matches.get(matchId);
    if (!match || match.phase === "done") return null;
    match.phase = "done";
    return match;
  }

  cleanupOldMatches(maxAgeMs = 3600_000): void {
    const cutoff = Date.now() - maxAgeMs;
    for (const [id, match] of this.matches) {
      if (match.phase === "done" && (match.startedAt ?? 0) < cutoff) {
        this.matches.delete(id);
      }
    }
  }
}

export const matchmaker = new Matchmaker();
