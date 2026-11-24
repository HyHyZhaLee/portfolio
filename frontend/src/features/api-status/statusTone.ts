import type { StatusTone } from '../../components/StatusDot';
import type { ApiState, DatabaseState } from './types';

/** Green when the service answered, amber while it wakes, red when it is down, grey while not known yet (PF-023 D6). */
export const apiTone: Record<ApiState, StatusTone> = { checking: 'idle', waking: 'wake', online: 'ok', unreachable: 'down' };
export const databaseTone: Record<DatabaseState, StatusTone> = { waiting: 'idle', connected: 'ok', unavailable: 'down', unknown: 'idle' };
