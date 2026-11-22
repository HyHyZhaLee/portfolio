import type { RequestHandler } from 'msw';

/** Default API handlers shared by every test; override per test with `server.use(...)`. Features add theirs from PF-005. */
export const handlers: RequestHandler[] = [];
