"use client";

import { useState } from "react";
import { SignalClient } from "@/lib/signal-client";
import { usePlayer } from "@/lib/player-context";
import Link from "next/link";

export default function RoomPage() {
  const { player } = usePlayer();
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [joinedCode, setJoinedCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [unranked, setUnranked] = useState(false);

  async function createRoom() {
    setError("");
    const signal = new SignalClient();
    await signal.connect();
    signal.register(player.id, player.displayName, player.elo, player.isPro);
    signal.onMessage((msg) => {
      if (msg.type === "room_created") {
        const room = msg.room as { code: string };
        setCreatedCode(room.code);
      }
    });
    signal.createRoom(unranked);
  }

  async function joinRoom() {
    setError("");
    const code = joinCode.toUpperCase();
    if (code.length !== 4) {
      setError("Enter a 4-letter code");
      return;
    }
    const signal = new SignalClient();
    await signal.connect();
    signal.register(player.id, player.displayName, player.elo, player.isPro);
    signal.onMessage((msg) => {
      if (msg.type === "room_joined") {
        setJoinedCode(code);
      }
      if (msg.type === "error") setError(String(msg.message));
    });
    signal.joinRoom(code);
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">Private Room</h1>
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
        <button onClick={createRoom} className="w-full bg-amber-500 text-black py-3 rounded-lg font-semibold">
          Generate 4-letter code
        </button>
        {createdCode && (
          <div className="mt-4 text-center">
            <div className="text-3xl font-mono font-bold text-amber-400">{createdCode}</div>
            <p className="text-xs text-zinc-500 mt-2">Share this code with your friend</p>
            <Link href={`/arena?room=${createdCode}`} className="text-sm text-amber-400 mt-2 block hover:underline">
              Enter arena →
            </Link>
          </div>
        )}
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="font-semibold mb-4">Join with code</h2>
        <input
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          maxLength={4}
          placeholder="ABCD"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-center font-mono text-xl mb-3"
        />
        <button onClick={joinRoom} className="w-full border border-zinc-600 py-3 rounded-lg">
          Join →
        </button>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        {joinedCode && (
          <Link href={`/arena?room=${joinedCode}`} className="block text-center text-amber-400 mt-4 hover:underline">
            Enter arena →
          </Link>
        )}
      </div>
    </div>
  );
}
