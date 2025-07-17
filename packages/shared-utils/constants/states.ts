import { Match } from "@shared/types/types";

export const MATCHES: { [matchId: number]: Match } = {};
export let WAITING_USERS: string[] = [];
export const PLAYER_MATCH: Map<string, number> = new Map();
