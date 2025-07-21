import { Match } from '../types/shared';

// Global state storage
export const MATCHES: { [key: number]: Match } = {};
export const PLAYER_MATCH = new Map<string, number>(); 