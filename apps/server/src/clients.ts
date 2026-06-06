import type { WebSocket } from "ws";
import { matchmaker } from "./matchmaker";

export interface ClientMeta {
  playerId: string;
  displayName: string;
  elo: number;
  isPro: boolean;
}

const clients = new Map<WebSocket, ClientMeta>();

export function registerClient(ws: WebSocket, meta: ClientMeta): void {
  clients.set(ws, meta);
}

export function unregisterClient(ws: WebSocket): void {
  const meta = clients.get(ws);
  if (meta) {
    matchmaker.leaveQueue(meta.playerId);
  }
  clients.delete(ws);
}

export function getClientMeta(ws: WebSocket): ClientMeta | undefined {
  return clients.get(ws);
}

export function broadcast(message: unknown, exclude?: WebSocket): void {
  const payload = JSON.stringify(message);
  for (const [ws] of clients) {
    if (ws !== exclude && ws.readyState === ws.OPEN) {
      ws.send(payload);
    }
  }
}

export function send(ws: WebSocket, message: unknown): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

export function getOnlineCount(): number {
  return clients.size;
}
