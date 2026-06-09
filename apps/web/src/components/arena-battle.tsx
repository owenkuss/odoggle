"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MATCH_DURATION_SEC } from "@odoggle/shared";
import type { PdlResult } from "@odoggle/shared";
import { CameraCheck } from "@/components/camera-check";
import { ReportButton } from "@/components/report-button";
import { usePlayer } from "@/lib/player-context";
import { syncPdlToServer } from "@/lib/pdl-sync";
import { SignalClient } from "@/lib/signal-client";
import { WebRTCClient } from "@/lib/webrtc-client";

interface ArenaProps {
  roomCode?: string;
}

export function ArenaBattle({ roomCode }: ArenaProps) {
  const { player, updateElo, recordWin, recordLoss, setPdl } = usePlayer();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const signalRef = useRef<SignalClient | null>(null);
  const webrtcRef = useRef<WebRTCClient | null>(null);
  const opponentIdRef = useRef<string | null>(null);
  const matchIdRef = useRef<string | null>(null);
  const isPlayer1Ref = useRef(false);

  const [phase, setPhase] = useState<
    "camera_check" | "queued" | "waiting_room" | "matched" | "battle" | "result"
  >("camera_check");
  const [matchId, setMatchId] = useState<string | null>(null);
  const [opponentName, setOpponentName] = useState("Opponent");
  const [opponentElo, setOpponentElo] = useState(0);
  const [connectionState, setConnectionState] = useState<string>("");
  const [videoMuted, setVideoMuted] = useState(false);
  const [timer, setTimer] = useState(MATCH_DURATION_SEC);
  const [resultText, setResultText] = useState("");
  const [eloDelta, setEloDelta] = useState(0);
  const [newElo, setNewElo] = useState<number | null>(null);
  const [myPdl, setMyPdl] = useState<number | null>(null);
  const [oppPdl, setOppPdl] = useState<number | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const cleanup = useCallback(() => {
    signalRef.current?.leaveQueue();
    webrtcRef.current?.destroy();
    webrtcRef.current = null;
    signalRef.current?.disconnect();
    signalRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  useEffect(() => {
    if (phase !== "battle") return;
    const iv = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(iv);
          if (matchIdRef.current) signalRef.current?.battleEnd(matchIdRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [phase]);

  useEffect(() => {
    if (phase !== "waiting_room" || !roomCode) return;
    const iv = setInterval(() => {
      signalRef.current?.enterRoom(roomCode);
    }, 3000);
    return () => clearInterval(iv);
  }, [phase, roomCode]);

  const enterArena = useCallback(async (arenaPdl: PdlResult) => {
    setServerError(null);
    setPhase(roomCode ? "waiting_room" : "queued");

    try {
      const signal = new SignalClient();
      signalRef.current = signal;
      await signal.connect();
      await signal.registerAndWait(
        player.id,
        player.displayName,
        player.elo,
        player.isPro,
        arenaPdl
      );

    const webrtc = new WebRTCClient({
      onRemoteStream: (stream) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
      },
      onSignal: (payload) => {
        const opp = opponentIdRef.current;
        if (opp) signal.relaySignal(opp, payload);
      },
      onConnectionState: (state) => {
        setConnectionState(state);
        if (state === "connected" && matchIdRef.current) {
          signal.battleReady(matchIdRef.current);
        }
      },
    });
    webrtcRef.current = webrtc;
    const local = await webrtc.startLocalVideo();
    if (localVideoRef.current) localVideoRef.current.srcObject = local;

    signal.onMessage(async (msg) => {
      if (msg.type === "error") {
        setServerError(String(msg.message ?? "Server error"));
        return;
      }

      if (msg.type === "room_error") {
        setServerError(String(msg.message ?? "Room error"));
        setPhase("camera_check");
        cleanup();
        return;
      }

      if (msg.type === "room_waiting") setPhase("waiting_room");

      if (msg.type === "match_found") {
        const mid = String(msg.matchId);
        matchIdRef.current = mid;
        setMatchId(mid);
        const p1 = msg.player1 as { id: string; displayName: string; elo: number };
        const p2 = msg.player2 as { id: string; displayName: string; elo: number };
        isPlayer1Ref.current = p1.id === player.id;
        const opp = isPlayer1Ref.current ? p2 : p1;
        opponentIdRef.current = opp.id;
        setOpponentName(opp.displayName);
        setOpponentElo(opp.elo);
        setPhase("matched");

        if (player.id < opp.id) {
          const offer = await webrtc.createOffer();
          signal.relaySignal(opp.id, { offer });
        }
      }

      if (msg.type === "signal" && msg.payload) {
        await webrtc.handleSignal(msg.payload as Record<string, unknown>);
      }

      if (msg.type === "battle_start") {
        setPhase("battle");
        setTimer(Number(msg.duration ?? 15));
      }
      if (msg.type === "match_cancelled") {
        cleanup();
        setPhase("camera_check");
        setConnectionState("");
        setMatchId(null);
        matchIdRef.current = null;
        return;
      }

      if (msg.type === "match_result") {
        const winnerId = String(msg.winnerId);
        const won = winnerId === player.id;
        const delta = won ? Number(msg.winnerEloDelta ?? 0) : Number(msg.loserEloDelta ?? 0);
        const newEloVal = won
          ? Number(msg.winnerElo ?? player.elo)
          : Number(msg.loserElo ?? player.elo);
        const p1Pdl = Number(msg.player1Pdl ?? 0);
        const p2Pdl = Number(msg.player2Pdl ?? 0);
        const selfPdl = isPlayer1Ref.current ? p1Pdl : p2Pdl;
        const otherPdl = isPlayer1Ref.current ? p2Pdl : p1Pdl;

        updateElo(newEloVal);
        if (won) recordWin();
        else recordLoss();

        setMyPdl(selfPdl);
        setOppPdl(otherPdl);
        setNewElo(newEloVal);
        setEloDelta(delta);
        setResultText(
          Boolean(msg.unranked)
            ? won
              ? `You won · PDL ${selfPdl.toFixed(1)} vs ${otherPdl.toFixed(1)} (unranked)`
              : `${opponentName} won · PDL ${otherPdl.toFixed(1)} vs ${selfPdl.toFixed(1)} (unranked)`
            : won
              ? `Victory! PDL ${selfPdl.toFixed(1)} beat ${otherPdl.toFixed(1)} · +${delta} ELO`
              : `Defeat. PDL ${otherPdl.toFixed(1)} beat ${selfPdl.toFixed(1)} · ${delta} ELO`
        );
        setPhase("result");
      }
    });

    if (roomCode) signal.enterRoom(roomCode);
    else signal.joinQueue();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Could not connect to game server");
      setPhase("camera_check");
      cleanup();
    }
  }, [player, roomCode, opponentName, updateElo, recordWin, recordLoss, cleanup]);

  const handleCameraPass = useCallback(
    (arenaPdl: PdlResult) => {
      setPdl(arenaPdl);
      if (player.isPro) void syncPdlToServer(player.id, arenaPdl);
      void enterArena(arenaPdl);
    },
    [enterArena, player.id, player.isPro, setPdl]
  );

  const resetToCameraCheck = useCallback(() => {
    if (matchIdRef.current) signalRef.current?.skip(matchIdRef.current);
    else signalRef.current?.skip();
    cleanup();
    setPhase("camera_check");
    setMatchId(null);
    matchIdRef.current = null;
    setConnectionState("");
    setResultText("");
    setEloDelta(0);
    setNewElo(null);
    setMyPdl(null);
    setOppPdl(null);
  }, [cleanup]);

  return (
    <div className="max-w-4xl mx-auto">
      {phase === "camera_check" && (
        <div>
          {serverError && (
            <div className="mb-4 rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-300">
              {serverError}
              <p className="text-xs text-red-400/80 mt-2">
                The game server may be waking up — wait 30s and try again. Private rooms need both players on the same code.
              </p>
            </div>
          )}
          <p className="text-zinc-500 text-center text-sm mb-6">
            {roomCode
              ? "Frame your dog for the private match — we check lighting and framing before connecting."
              : "Frame your dog to join the queue — we score your PDL on-device, then matchmake."}
          </p>
          <CameraCheck
            key={roomCode ?? "ranked"}
            continueLabel={roomCode ? "Join private match →" : "Join arena →"}
            onPass={handleCameraPass}
          />
        </div>
      )}
      {phase === "queued" && (
        <div className="text-center text-zinc-400 py-8">
          <div className="animate-pulse mb-2">Finding opponent...</div>
          <button
            onClick={resetToCameraCheck}
            className="px-4 py-2 bg-zinc-800 rounded-lg text-sm"
          >
            Leave queue
          </button>
        </div>
      )}
      {phase === "waiting_room" && (
        <div className="text-center text-zinc-400 py-8">
          Waiting for friend in room{" "}
          <span className="font-mono text-amber-400">{roomCode}</span>
          ...
          <p className="text-xs text-zinc-600 mt-4">
            Share the room code — your friend can open the same link or join on /room
          </p>
          <button
            onClick={resetToCameraCheck}
            className="mt-4 px-4 py-2 bg-zinc-800 rounded-lg text-sm"
          >
            Leave room
          </button>
        </div>
      )}
      {(phase === "matched" || phase === "battle") && (
        <>
          {phase === "matched" && connectionState !== "connected" && (
            <div className="text-center text-sm text-zinc-500 mb-4">
              Connecting video... ({connectionState || "negotiating"})
            </div>
          )}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="text-xs text-zinc-500 mb-1">
                You · {player.displayName} · {player.elo} ELO
              </div>
              <video
                ref={localVideoRef}
                className="w-full rounded-lg bg-black aspect-video object-cover"
                muted
                playsInline
                autoPlay
              />
            </div>
            <div className="flex-1">
              <div className="text-xs text-zinc-500 mb-1">
                {opponentName} · {opponentElo} ELO
              </div>
              <video
                ref={remoteVideoRef}
                className="w-full rounded-lg bg-black aspect-video object-cover"
                muted
                playsInline
                autoPlay
              />
            </div>
          </div>
          {phase === "battle" && (
            <div className="text-center mt-4">
              <div className="text-4xl font-bold text-amber-400 tabular-nums">{timer}s</div>
              <div className="text-xs text-zinc-600 mt-1">Bark battle — winner decided by PDL when timer ends</div>
            </div>
          )}
          <div className="flex gap-3 mt-4 justify-center flex-wrap">
            <button
              onClick={() => setVideoMuted(webrtcRef.current?.toggleVideoMute() ?? false)}
              className="px-4 py-2 bg-zinc-800 rounded-lg text-sm"
            >
              {videoMuted ? "Show cam" : "Hide cam"}
            </button>
            <button onClick={resetToCameraCheck} className="px-4 py-2 bg-zinc-800 rounded-lg text-sm">
              Skip
            </button>
            {matchId && <ReportButton matchId={matchId} />}
          </div>
        </>
      )}
      {phase === "result" && (
        <div className="text-center py-8">
          <div className="text-3xl font-bold mb-2">{resultText}</div>
          {myPdl !== null && oppPdl !== null && (
            <div className="text-zinc-500 mb-6">
              Your PDL {myPdl.toFixed(1)} · {opponentName} {oppPdl.toFixed(1)}
            </div>
          )}
          {newElo !== null && (
            <div className="text-zinc-500 mb-6">
              {eloDelta !== 0 && <span className="mr-2">{eloDelta > 0 ? "+" : ""}{eloDelta} ELO ·</span>}
              New rating: {newElo}
            </div>
          )}
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={resetToCameraCheck}
              className="bg-amber-500 text-black px-6 py-3 rounded-lg font-semibold"
            >
              Queue again
            </button>
            <Link href="/leaderboard" className="border border-zinc-700 px-6 py-3 rounded-lg">
              Leaderboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
