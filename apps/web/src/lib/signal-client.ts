"use client";

import type { PdlResult } from "@odoggle/shared";
import { getSignalUrl, wakeServer } from "@/lib/api";

type MessageHandler = (msg: Record<string, unknown>) => void;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class SignalClient {
  private ws: WebSocket | null = null;
  private handlers = new Set<MessageHandler>();
  private url: string;

  constructor(url?: string) {
    this.url = url ?? getSignalUrl();
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  async connect(retries = 4): Promise<void> {
    await wakeServer();
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        await this.connectOnce();
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error("WebSocket failed");
        if (attempt < retries - 1) {
          await sleep(1500 * (attempt + 1));
          await wakeServer();
        }
      }
    }

    throw lastError ?? new Error("Could not connect to game server");
  }

  private connectOnce(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws?.close();
      this.ws = new WebSocket(this.url);
      this.ws.onopen = () => resolve();
      this.ws.onerror = () => reject(new Error(`WebSocket failed (${this.url})`));
      this.ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data as string) as Record<string, unknown>;
          this.handlers.forEach((h) => h(msg));
        } catch {
          /* ignore */
        }
      };
    });
  }

  onMessage(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  send(msg: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  async registerAndWait(
    playerId: string,
    displayName: string,
    elo: number,
    isPro: boolean,
    lastPdl?: PdlResult
  ): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        off();
        reject(new Error("Server registration timed out"));
      }, 20_000);

      const off = this.onMessage((msg) => {
        if (msg.type === "registered") {
          clearTimeout(timeout);
          off();
          resolve();
        }
        if (msg.type === "error") {
          clearTimeout(timeout);
          off();
          reject(new Error(String(msg.message ?? "Registration failed")));
        }
      });

      this.register(playerId, displayName, elo, isPro, lastPdl);
    });
  }

  register(
    playerId: string,
    displayName: string,
    elo: number,
    isPro: boolean,
    lastPdl?: PdlResult
  ): void {
    this.send({ type: "register", playerId, displayName, elo, isPro, lastPdl });
  }

  joinQueue(): void {
    this.send({ type: "join_queue" });
  }

  leaveQueue(): void {
    this.send({ type: "leave_queue" });
  }

  createRoom(unranked = false): void {
    this.send({ type: "create_room", unranked });
  }

  joinRoom(code: string): void {
    this.send({ type: "join_room", code });
  }

  enterRoom(code: string): void {
    this.send({ type: "enter_room", code });
  }

  relaySignal(targetId: string, payload: unknown): void {
    this.send({ type: "signal", targetId, payload });
  }

  battleReady(matchId: string): void {
    this.send({ type: "battle_ready", matchId });
  }

  battleEnd(matchId: string): void {
    this.send({ type: "battle_end", matchId });
  }

  skip(matchId?: string): void {
    this.send({ type: "skip", ...(matchId ? { matchId } : {}) });
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }
}
