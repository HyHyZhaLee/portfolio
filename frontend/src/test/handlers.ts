import { http, HttpResponse, type RequestHandler } from 'msw';

/** A healthy backend: the response every page test gets unless it overrides it with `server.use(...)`. */
export const healthUp = http.get('*/actuator/health', () => HttpResponse.json({ status: 'UP', components: { db: { status: 'UP' } } }));

/** A recorded page view: 202 with no body. The beacon only posts from production builds (PF-005 P17). */
export const visitRecorded = http.post('*/api/v1/visits', () => new HttpResponse(null, { status: 202 }));

/** An empty database: every page renders the footer counter, which asks once health answers (PF-005 P17). */
export const statsEmpty = http.get('*/api/v1/stats/summary', () => HttpResponse.json({ totalViews: 0, uniqueVisitors: 0, since: null }));

/** An accepted contact message: 202 with no body, and the correlation ID every response carries (PF-006 P22). */
export const contactAccepted = http.post(
    '*/api/v1/contact-messages',
    () => new HttpResponse(null, { status: 202, headers: { 'X-Correlation-Id': 'contact-default-reference' } }),
);

/** Default API handlers shared by every test; override per test with `server.use(...)`. */
export const handlers: RequestHandler[] = [healthUp, visitRecorded, statsEmpty, contactAccepted];
