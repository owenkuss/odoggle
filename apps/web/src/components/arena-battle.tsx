"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MATCH_DURATION_SEC } from "@odoggle/shared";
import { ReportButton } from "@/components/report-button";
import { usePlayer } from "@/lib/player-context";
import { SignalClient } from "@/lib/signal-client";
import { WebRTCClient } from "@/lib/webrtc-client";

interface ArenaProps {
  roomCode?: string;
}

export function ArenaBattle({ roomCode }: ArenaProps) {
  const { player, updateElo, recordWin, recordLoss } = usePlayer();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const signalRef = useRef<SignalClient | null>(null);
  const webrtcRef = useRef<WebRTCClient | null>(null);
  const opponentIdRef = useRef<string | null>(null);
  const matchIdRef = useRef<string | null>(null);

  const [phase, setPhase] = useState<
    "idle" | "queued" | "waiting_room" | "matched" | "battle" | "voting" | "result"
  >("idle");
  const [matchId, setMatchId] = useState<string | null>(null);
  const [opponentName, setOpponentName] = useState("Opponent");
  const [timer, setTimer] = useState(MATCH_DURATION_SEC);
  const [voteCount, setVoteCount] = useState(0);
  const [resultText, setResultText] = useState("");
  const [eloDelta, setEloDelta] = useState(0);
  const [newElo, setNewElo] = useState<number | null>(null);

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

  const enterArena = useCallback(async () => {
    setPhase(roomCode ? "waiting_room" : "queued");
    const signal = new SignalClient();
    signalRef.current = signal;
    await signal.connect();
    signal.register(player.id, player.displayName, player.elo, player.isPro);

    const webrtc = new WebRTCClient({
      onRemoteStream: (stream) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
      },
      onSignal: (payload) => {
        const opp = opponentIdRef.current;
        if (opp) signal.relaySignal(opp, payload);
      },
      onConnectionState: (state) => {
        if (state === "connected" && matchIdRef.current) {
          signal.battleReady(matchIdRef.current);
        }
      },
    });
    webrtcRef.current = webrtc;
    const local = await webrtc.startLocalVideo();
    if (localVideoRef.current) localVideoRef.current.srcObject = local;

    signal.onMessage(async (msg) => {
      if (msg.type === "room_waiting") {
        setPhase("waiting_room");
      }

      if (msg.type === "match_found") {
        const mid = String(msg.matchId);
        matchIdRef.current = mid;
        setMatchId(mid);
        const p1 = msg.player1 as { id: string; displayName: string; elo: number };
        const p2 = msg.player2 as { id: string; displayName: string; elo: number };
        const opp = p1.id === player.id ? p2 : p1;
        opponentIdRef.current = opp.id;
        setOpponentName(opp.displayName);
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
      if (msg.type === "voting_start") {
        setPhase("voting");
        setVoteCount(0);
      }
      if (msg.type === "voting_extended") {
        setVoteCount((c) => c);
      }
      if (msg.type === "vote_recorded") setVoteCount(Number(msg.totalVotes ?? 0));

      if (msg.type === "match_result") {
        const winnerId = String(msg.winnerId);
        const won = winnerId === player.id;
        const delta = won
          ? Number(msg.winnerEloDelta ?? 0)
          : Number(msg.loserEloDelta ?? 0);
        const newEloVal = won
          ? Number(msg.winnerElo ?? player.elo)
          : Number(msg.loserElo ?? player.elo);

        updateElo(newEloVal);
        if (won) recordWin();
        else recordLoss();

        setNewElo(newEloVal);
        setEloDelta(delta);
        setResultText(
          Boolean(msg.unranked)
            ? won
              ? "You won! (unranked)"
              : "You lost. (unranked)"
            : won
              ? `You won! +${delta} ELO`
              : `You lost. ${delta} ELO`
        );
        setPhase("result");
      }
    });

    if (roomCode) signal.enterRoom(roomCode);
    else signal.joinQueue();
  }, [player, roomCode, updateElo, recordWin, recordLoss]);

  return (
    <div className="max-w-4xl mx-auto">
      {phase === "idle" && (
        <button
          onClick={enterArena}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl text-lg"
        >
          {roomCode ? "ENTER PRIVATE MATCH →" : "ENTER ARENA →"}
        </button>
      )}
      {phase === "queued" && (
        <div className="text-center text-zinc-400 py-8">
          Finding opponent...
          <p className="text-xs text-zinc-600 mt-2">You may be pulled as jury to vote on other matches</p>
        </div>
      )}
      {phase === "waiting_room" && (
        <div className="text-center text-zinc-400 py-8">
          Waiting for friend to join room <span className="font-mono text-amber-400">{roomCode}</span>...
        </div>
      )}
      {(phase === "matched" || phase === "battle" || phase === "voting") && (
        <>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="text-xs text-zinc-500 mb-1">You · {player.displayName}</div>
              <video ref={localVideoRef} className="w-full rounded-lg bg-black aspect-video" muted playsInline autoPlay />
            </div>
            <div className="flex-1">
              <div className="text-xs text-zinc-500 mb-1">{opponentName}</div>
              <video ref={remoteVideoRef} className="w-full rounded-lg bg-black aspect-video" muted playsInline autoPlay />
            </div>
          </div>
          {phase === "battle" && (
            <div className="text-center mt-4 text-3xl font-bold text-amber-400">{timer}s</div>
          )}
          {phase === "voting" && (
            <div className="text-center mt-4 text-zinc-400">
              Audience voting... ({voteCount} / 3 votes)
              <p className="text-xs text-zinc-600 mt-2">
                Share <a href="/spectate" className="text-amber-400 hover:underline">/spectate</a> for friends to vote
              </p>
            </div>
          )}
          <div className="flex gap-3 mt-4 justify-center">
            <button onClick={() => webrtcRef.current?.mute()} className="px-4 py-2 bg-zinc-800 rounded-lg text-sm">
              Mute
            </button>
            <button onClick={() => signalRef.current?.skip()} className="px-4 py-2 bg-zinc-800 rounded-lg text-sm">
              Skip
            </button>
            {matchId && <ReportButton matchId={matchId} />}
          </div>
        </>
      )}
      {phase === "result" && (
        <div className="text-center py-8">
          <div className="text-2xl font-bold mb-2">{resultText}</div>
          {eloDelta !== 0 && newElo !== null && (
            <div className="text-zinc-500 mb-4">New ELO: {newElo}</div>
          )}
          <button
            onClick={() => {
              cleanup();
              setPhase("idle");
              setResultText("");
              setEloDelta(0);
              setNewElo(null);
            }}
            className="bg-amber-500 text-black px-6 py-3 rounded-lg font-semibold"
          >
            Queue again
          </button>
        </div>
      )}
    </div>
  );
}
