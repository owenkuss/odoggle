"use client";

type MessageHandler = (msg: Record<string, unknown>) => void;

export class SignalClient {
  private ws: WebSocket | null = null;
  private handlers = new Set<MessageHandler>();
  private url: string;

  constructor(url?: string) {
    this.url = url ?? process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001/signal";
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = () => resolve();
      this.ws.onerror = () => reject(new Error("WebSocket failed"));
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

  register(playerId: string, displayName: string, elo: number, isPro: boolean): void {
    this.send({ type: "register", playerId, displayName, elo, isPro });
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

  vote(matchId: string, votedForId: string): void {
    this.send({ type: "vote", matchId, votedForId });
  }

  spectate(matchId: string): void {
    this.send({ type: "spectate", matchId });
  }

  skip(matchId?: string): void {
    this.send({ type: "skip", ...(matchId ? { matchId } : {}) });
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }
}
