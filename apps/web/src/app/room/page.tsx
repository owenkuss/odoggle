"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { SignalClient } from "@/lib/signal-client";
import { usePlayer } from "@/lib/player-context";

export default function RoomPage() {
  const { player } = usePlayer();
  const signalRef = useRef<SignalClient | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [joinedCode, setJoinedCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [unranked, setUnranked] = useState(false);

  async function getSignal(): Promise<SignalClient> {
    if (signalRef.current?.connected) return signalRef.current;
    const signal = new SignalClient();
    await signal.connect();
    await signal.registerAndWait(player.id, player.displayName, player.elo, player.isPro);
    signalRef.current = signal;
    return signal;
  }

  async function createRoom() {
    setError("");
    setLoading(true);
    try {
      const signal = await getSignal();
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          off();
          reject(new Error("Timed out creating room"));
        }, 15_000);
        const off = signal.onMessage((msg) => {
          if (msg.type === "room_created") {
            clearTimeout(timeout);
            off();
            const room = msg.room as { code: string };
            setCreatedCode(room.code);
            resolve();
          }
          if (msg.type === "error") {
            clearTimeout(timeout);
            off();
            reject(new Error(String(msg.message)));
          }
        });
        signal.createRoom(unranked);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not connect to game server");
    } finally {
      setLoading(false);
    }
  }

  async function joinRoom() {
    setError("");
    const code = joinCode.toUpperCase();
    if (code.length !== 4) {
      setError("Enter a 4-letter code");
      return;
    }
    setLoading(true);
    try {
      const signal = await getSignal();
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          off();
          reject(new Error("Timed out joining room"));
        }, 15_000);
        const off = signal.onMessage((msg) => {
          if (msg.type === "room_joined") {
            clearTimeout(timeout);
            off();
            setJoinedCode(code);
            resolve();
          }
          if (msg.type === "error") {
            clearTimeout(timeout);
            off();
            reject(new Error(String(msg.message)));
          }
        });
        signal.joinRoom(code);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join room");
    } finally {
      setLoading(false);
    }
  }

  const activeCode = createdCode ?? joinedCode;

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-center text-hero">Private Room</h1>
      <p className="text-muted text-sm text-center mb-8">
        Create a code, share it, then both enter the arena with the same code.
      </p>

      <div className="glass-card p-6 mb-6">
        <h2 className="font-semibold mb-4">Create room</h2>
        <label className="flex items-center gap-2 text-sm text-muted mb-4">
          <input
            type="checkbox"
            checked={unranked}
            onChange={(e) => setUnranked(e.target.checked)}
            className="rounded"
          />
          Unranked (no ELO change)
        </label>
        <button
          onClick={() => void createRoom()}
          disabled={loading}
          className="w-full btn-accent disabled:opacity-50 py-3 font-semibold"
        >
          {loading && !createdCode ? "Connecting..." : "Generate 4-letter code"}
        </button>
        {createdCode && (
          <div className="mt-4 text-center">
            <div className="text-3xl font-mono font-bold text-accent-bright">{createdCode}</div>
            <p className="text-xs text-muted mt-2">Share this code with your friend</p>
          </div>
        )}
      </div>

      <div className="glass-card p-6 mb-6">
        <h2 className="font-semibold mb-4">Join with code</h2>
        <input
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          maxLength={4}
          placeholder="ABCD"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-center font-mono text-xl mb-3 focus:border-accent/40 outline-none"
        />
        <button
          onClick={() => void joinRoom()}
          disabled={loading}
          className="w-full btn-ghost disabled:opacity-50 py-3"
        >
          {loading && !joinedCode ? "Connecting..." : "Join →"}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

      {activeCode && (
        <div className="text-center glass-card border-accent/30 p-6">
          <p className="text-sm text-muted mb-3">Room {activeCode} ready — both players tap below</p>
          <Link
            href={`/arena?room=${activeCode}`}
            className="inline-block w-full btn-arena font-semibold py-3"
          >
            Enter arena →
          </Link>
        </div>
      )}
    </div>
  );
}
