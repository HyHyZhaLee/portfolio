import { http, HttpResponse, type RequestHandler } from 'msw';

/** A healthy backend: the response every page test gets unless it overrides it with `server.use(...)`. */
export const healthUp = http.get('*/actuator/health', () => HttpResponse.json({ status: 'UP', components: { db: { status: 'UP' } } }));

/** Default API handlers shared by every test; override per test with `server.use(...)`. */
export const handlers: RequestHandler[] = [healthUp];
