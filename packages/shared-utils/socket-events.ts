// Socket event names and TypeScript payload definitions shared between client and server
// This allows strict typing when emitting or listening for events.

import { PlayerState, Match } from './types/types';

// String literal constants for every event name
export const SOCKET_EVENTS = {
  // client → server
  FIND_MATCH: 'findMatch',
  PLAYER_READY: 'playerReady',
  PLAYER_MOVED: 'playerMoved',
  PLAYER_INPUT: 'playerInput',
  PLAYER_ATTACK: 'playerAttack',

  // server → client
  MATCH_FOUND: 'matchFound',
  PLAYERS_CONNECTED: 'playersConnected',
  GAME_STATE_UPDATE: 'gameStateUpdate',
  TIMER_UPDATE: 'timerUpdate',
  PLAYER_ATTACKED: 'playerAttacked',
  PLAYER_HIT: 'playerHit',
  MATCH_ENDED: 'matchEnded',
  PLAYER_DISCONNECTED: 'playerDisconnected',
  YOUR_PLAYER_ID: 'yourPlayerId',
} as const;

// Convenience type of the event name union
export type SocketEventName = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];

// ---------------- Payload typings ---------------- //

// Client → server payloads
export interface FindMatchPayload {}

export interface PlayerReadyPayload {
  player1?: { x: number; y: number };
  player2?: { x: number; y: number };
}

export interface PlayerMovedPayload {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  flipX: boolean;
  anim: string;
  tick?: number;
}

// New compact input payload the client sends instead of full positions
export interface PlayerInputPayload {
  seq: number;            // monotonically increasing sequence per client
  dirX: -1 | 0 | 1;       // -1 left, 1 right, 0 none
  jump: boolean;          // true when jump pressed this frame
  run: boolean;           // holding run key (shift)
  attack: boolean;        // attack button pressed this frame
}

export interface PlayerAttackPayload {
  x: number;
  y: number;
  attackWidth: number;
  attackHeight: number;
  flipX: boolean;
}

// Server → client payloads
export interface MatchFoundPayload {
  room: string;
  players: {
    player1: { id: string; name: string; position: 'left'; x: number; y: number; flipX: boolean; health: number };
    player2: { id: string; name: string; position: 'right'; x: number; y: number; flipX: boolean; health: number };
  };
  matchDuration: number;
  formattedTime: string;
  selectedMap?: Record<string, unknown>;
}

export interface PlayersConnectedPayload {
  room: string;
  selectedMap: Record<string, unknown>;
  player1: PlayerState;
  player2: PlayerState;
}

export interface GameStateUpdatePayload {
  player1: PlayerState;
  player2: PlayerState;
  roomId: string;
}

export interface TimerUpdatePayload { remainingTime: number; formattedTime: string }

export interface PlayerAttackedPayload extends PlayerAttackPayload { id: string }

export interface PlayerHitPayload { id: string; health: number; attackerId: string }

export interface MatchEndedPayload {
  reason: 'timeout' | 'knockout' | 'opponentLeft';
  winner: string | { id: string; name?: string } | null;
  loser: string | { id: string; name?: string } | null;
  finalHealth?: { player1: number; player2: number };
}

export interface PlayerDisconnectedPayload { id: string }

// Your personal id
export type YourPlayerIdPayload = string;

// ---------------- Socket type maps ---------------- //
export interface ClientToServerEvents {
  [SOCKET_EVENTS.FIND_MATCH]: (payload: FindMatchPayload) => void;
  [SOCKET_EVENTS.PLAYER_READY]: (payload: PlayerReadyPayload) => void;
  [SOCKET_EVENTS.PLAYER_MOVED]: (payload: PlayerMovedPayload) => void;
  [SOCKET_EVENTS.PLAYER_INPUT]: (payload: PlayerInputPayload) => void;
  [SOCKET_EVENTS.PLAYER_ATTACK]: (payload: PlayerAttackPayload) => void;
}

export interface ServerToClientEvents {
  [SOCKET_EVENTS.MATCH_FOUND]: (payload: MatchFoundPayload) => void;
  [SOCKET_EVENTS.PLAYERS_CONNECTED]: (payload: PlayersConnectedPayload) => void;
  [SOCKET_EVENTS.GAME_STATE_UPDATE]: (payload: GameStateUpdatePayload) => void;
  [SOCKET_EVENTS.TIMER_UPDATE]: (payload: TimerUpdatePayload) => void;
  [SOCKET_EVENTS.PLAYER_ATTACKED]: (payload: PlayerAttackedPayload) => void;
  [SOCKET_EVENTS.PLAYER_HIT]: (payload: PlayerHitPayload) => void;
  [SOCKET_EVENTS.MATCH_ENDED]: (payload: MatchEndedPayload) => void;
  [SOCKET_EVENTS.PLAYER_DISCONNECTED]: (payload: PlayerDisconnectedPayload) => void;
  [SOCKET_EVENTS.YOUR_PLAYER_ID]: (payload: YourPlayerIdPayload) => void;
} 