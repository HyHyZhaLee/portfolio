import type { StatusTone } from '../../components/StatusDot';
import type { ApiState, DatabaseState } from './types';

/** Green only when the API answered; amber only while it wakes; grey otherwise (FR-10, FR-11). */
export const apiTone: Record<ApiState, StatusTone> = { checking: 'idle', waking: 'wake', online: 'ok', unreachable: 'idle' };
export const databaseTone: Record<DatabaseState, StatusTone> = { waiting: 'idle', connected: 'ok', unavailable: 'idle', unknown: 'idle' };
