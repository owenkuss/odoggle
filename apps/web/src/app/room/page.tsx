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
      <h1 className="text-3xl font-bold mb-2 text-center">Private Room</h1>
      <p className="text-zinc-500 text-sm text-center mb-8">
        Create a code, share it, then both enter the arena with the same code.
      </p>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
        <h2 className="font-semibold mb-4">Create room</h2>
        <label className="flex items-center gap-2 text-sm text-zinc-400 mb-4">
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
          className="w-full bg-amber-500 disabled:opacity-50 text-black py-3 rounded-lg font-semibold"
        >
          {loading && !createdCode ? "Connecting..." : "Generate 4-letter code"}
        </button>
        {createdCode && (
          <div className="mt-4 text-center">
            <div className="text-3xl font-mono font-bold text-amber-400">{createdCode}</div>
            <p className="text-xs text-zinc-500 mt-2">Share this code with your friend</p>
          </div>
        )}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
        <h2 className="font-semibold mb-4">Join with code</h2>
        <input
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          maxLength={4}
          placeholder="ABCD"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-center font-mono text-xl mb-3"
        />
        <button
          onClick={() => void joinRoom()}
          disabled={loading}
          className="w-full border border-zinc-600 disabled:opacity-50 py-3 rounded-lg"
        >
          {loading && !joinedCode ? "Connecting..." : "Join →"}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

      {activeCode && (
        <div className="text-center bg-zinc-900 border border-amber-500/30 rounded-xl p-6">
          <p className="text-sm text-zinc-400 mb-3">Room {activeCode} ready — both players tap below</p>
          <Link
            href={`/arena?room=${activeCode}`}
            className="inline-block w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-3 rounded-lg"
          >
            Enter arena →
          </Link>
        </div>
      )}
    </div>
  );
}
