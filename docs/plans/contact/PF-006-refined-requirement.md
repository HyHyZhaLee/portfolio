# PF-006 — Refined requirements

> Living document. The backlog entry or the user's description was the starting point; this is the complete, current requirement as clarified in conversation, and it wins over the original wording. It says **what** to build; the plan says **how**. Sole author: the background refinement agent.

**Ticket**: PF-006 — Contact form: the contact_message table, POST /api/v1/contact-messages with a honeypot and a rate limit, email delivery with retries, and the form with field errors · **Plan**: [PF-006-contact-form.md](PF-006-contact-form.md) · **Master plan section**: `../portfolio-implementation-plan.md` §5.1, §5.2, §5.5, §6.3, §6.5, §7 Phase 5 · **Status**: **Confirmed** · **Last updated**: 2026-11-23

## 1. Problem and goal

A visitor (a recruiter or a hiring manager) wants to reach the owner from the site without hunting for an email address, and the owner wants those messages in his inbox without ever publishing his address. The Contact section gains a form that sends a message to the owner through the backend, which stores it first and emails it through Resend, retrying when the provider fails. PF-006 builds on PF-004's platform (client info, rate limiter, problem JSON, correlation IDs). Non-Negotiables 1 (the section works without the API), 4 (abuse limits and a honeypot), 5 (explicit errors), 6 (Flyway), 7 (no transaction during network I/O), 8 (free tier, email over HTTPS), and 9 (no personal data in logs) apply.

## 2. Scope

**In scope**

- A Flyway migration for the `contact_message` table.
- `POST /api/v1/contact-messages` (202) with Bean Validation, a honeypot, and the 3-per-hour rate limit.
- The outbox: save `PENDING`, email the owner with no transaction open, record `SENT` or `FAILED`.
- The `EmailSender` port, the Resend adapter (timeouts, bounded retry), and a logging sender for the local profile.
- A scheduled job that resends `FAILED` messages, up to 3 delivery attempts in total.
- WireMock standing in for Resend in integration tests.
- The contact form with field errors, the pending, success, and failure states, and a reusable `ErrorNote`.
- Docs updates, including SITE-004 reworded per D2 and D4.

**Out of scope (deferred)**

- The Resend API key, the recipient address, and a verified sending domain: owner steps for PF-012 (D14).
- An admin screen for messages: the owner reads rows with SQL in the Neon console; an authenticated admin view stays a stretch goal.
- Automatic recovery of a message left `PENDING` by a crash between the save and the outcome (D9).
- Deleting old messages: retention is the owner's, by SQL (D16).
- A CAPTCHA: the honeypot and the rate limit are enough for a personal site.

## 3. Functional requirements

- **FR-1**: Each accepted message is stored in `contact_message` with its name, email, message, an outbox status (`PENDING`, `SENT`, `FAILED`, `SPAM`), the number of delivery attempts started, the last failure as a reason code, the provider's message ID once sent, the sender's visitor hash, and a version for optimistic locking. No column holds an IP address or a user agent. Source: implementation plan §5.2, backend guide principle 6, Non-Negotiable 3
- **FR-2**: `POST /api/v1/contact-messages` accepts `{name, email, message, website?}` and answers 202 with no body once the message is saved, whether delivery then succeeds, fails, or the message is spam. Source: implementation plan §5.1, REST rules, D1
- **FR-3**: `name` is required, 1 to 100 characters, with no control character; `email` is required, a valid address of at most 254 characters; `message` is required, 10 to 2000 characters, with no control character except tab, line feed, and carriage return; `website` is optional, at most 2048 characters. Invalid input answers 400 `VALIDATION_FAILED` with field errors and stores nothing; a body that is not JSON or is over 64 KB answers 400 `VALIDATION_FAILED` without field errors. Source: SITE-004, Non-Negotiable 4, D5
- **FR-4**: A message whose `website` honeypot is not blank is stored as `SPAM` with no delivery attempt, answered with the same 202, and never emailed. Source: SITE-004
- **FR-5**: Each client address may send at most 3 messages per hour, honeypot hits included; the limit is checked before any other work, and more answer 429 `RATE_LIMITED` with `Retry-After`. Source: SITE-004, PF-004 D6, D4
- **FR-6**: Delivery follows the outbox: the message is committed as `PENDING` first, emailed with no database transaction open, and then marked `SENT` or `FAILED`. If recording the outcome fails after a successful send, the visitor still gets 202 and the failure is logged with the message ID only. Source: Non-Negotiable 7, backend guide principle 5, D1
- **FR-7**: The email to the owner is plain text. Its subject is `New portfolio contact message (#{id})` and never holds message content; its body holds the name, the email, the received time in ISO-8601 UTC, the message ID, and the message; replying goes to the visitor's email. Source: backend guide (Contact messages), D6
- **FR-8**: Email goes to Resend over HTTPS with a 2-second connect timeout and a 5-second read timeout. Within one delivery attempt, timeouts, connection errors, 429, and 5xx answers are retried up to 3 tries in total with exponential backoff (500 ms, then 1 s) and one idempotency key; any other provider answer is not retried within the attempt. A failure is recorded as a reason code (`HTTP_{status}` or `IO_ERROR`), never as provider text. Source: backend guide principle 8, D3, D7, D8
- **FR-9**: A scheduled job runs every 10 minutes, first 1 minute after startup, and resends `FAILED` messages below the attempt limit, oldest first, one batch per run. It claims each message with a compare-and-set, so two instances never send the same attempt, and a message gets at most 3 delivery attempts in total. The `app.contact.retry-enabled` switch turns the job off. Source: SITE-004, implementation plan §5.5, backend guide principle 6, D2
- **FR-10**: The local profile never sends email: it logs the message ID only. Every other profile fails at startup without `RESEND_API_KEY` or `CONTACT_TO_EMAIL`; `CONTACT_FROM_EMAIL` is optional and defaults to `Portfolio <onboarding@resend.dev>`. Source: backend guide principles 8 and 12, D14
- **FR-11**: A visitor's name, email, and message never appear in logs, problem responses, caches, or the email subject. Source: Non-Negotiable 9
- **FR-12**: The Contact section shows a form with labelled name, email, and message fields next to the LinkedIn and GitHub links. The form checks the same limits as the server before sending and shows each mistake under its field; nothing is sent while a field is invalid. Source: implementation plan §6.5, D13
- **FR-13**: While sending, the button is disabled and reads "Sending…", and a cold-start hint shows for the whole wait, which lasts up to 75 seconds. On success the form is replaced by a thank-you note with the request's reference (its correlation ID) and a button to send another message. On failure the values stay, and a note explains what happened with the error code and the reference: field errors are marked on their fields, a rate limit suggests trying later or LinkedIn, an unreachable API suggests trying again in a minute or LinkedIn, and anything else says something went wrong. Source: implementation plan §6.3, frontend principles 8 and 9, D11, D12, D18
- **FR-14**: The honeypot field is hidden from people and from assistive technology, is out of the tab order, is not autofilled, and is sent as typed. Source: SITE-004, D17
- **FR-15**: Integration tests stub Resend with WireMock; no test, script, or demo sends a real email. Source: backend guide principle 14, `/dev` test budget

## 4. Product rules and edge cases

- **SITE-004** now says explicitly that a message gets at most 3 delivery attempts in total (D2) and that honeypot hits count toward the 3-per-hour limit (D4); the owner approved these under the blanket approval of 2026-11-23, and /dev writes them into `docs/product/product-guide.md`.
- A delivery failure is the owner's problem, never the visitor's: the message is safe in the database, the visitor sees success, and the job retries it (D1, D10).
- A message left `PENDING` by a crash between the save and the outcome is not retried automatically; the owner finds it with SQL (D9).
- A message at the attempt limit stays `FAILED`; the owner may give it one more attempt with SQL after fixing the cause.
- `SENT` and `SPAM` are final. The application never deletes a message (D16). Spam rows keep their content, so the owner can find a real message that a browser autofilled into the honeypot.
- **Cold start:** the form waits up to 75 seconds for a sleeping API, with the hint shown; if the client gives up after the server saved the message, the network note says the message may not have arrived, and the rate limit caps duplicates.
- **API down or asleep:** the note and the LinkedIn and GitHub links show at once and work without the API; the form always renders, and a failed send shows the network note pointing to LinkedIn (Non-Negotiable 1).
- **Privacy:** the database keeps the name, email, and message (sent only to the owner), the visitor hash, and delivery metadata. It never keeps an IP address, a user agent, or a referrer, and logs only message IDs, attempts, and reason codes (Non-Negotiables 3 and 9).
- **Abuse:** server-side Bean Validation with explicit lengths, 3 messages per hour per client address (spam included), the honeypot, and the 64 KB body cap (Non-Negotiable 4). The client's checks are a convenience.

## 5. Interface decisions

**API**: One endpoint, `POST /api/v1/contact-messages` (operationId `createContactMessage`), body `{name, email, message, website?}` with the limits in FR-3. It answers 202 with no body (FR-2), 400 `VALIDATION_FAILED` (with `errors` for invalid fields), 429 `RATE_LIMITED` with `Retry-After`, and 500 `INTERNAL_ERROR` only when the first save fails. No new `ErrorCode` (D10).

**UI**: The Contact section keeps its note and links first and adds the form after them; at wide screens the links sit in a narrow column with the form beside them, in the same order for reading and focus (D13). The form has a "Send a message" sub-heading, the three fields, the hidden honeypot, and a "Send message" button; the pending, success, and failure states are in FR-13, and the failure note is a reusable `ErrorNote` showing the code and a selectable reference (D18). No route, title, or meta description changes. The strings are UI strings in `src/i18n/en.ts`, listed in the plan.

**Content**: None: PF-006 adds no portfolio copy. The contact note stays the PF-003 placeholder.

## 6. Open questions

None. Every clarifying question took its recommended default, pre-approved by the owner (blanket approval, 2026-11-23).

## 7. Decision log

| ID | Date | Decision | Rationale |
|---|---|---|---|
| D1 | 2026-11-23 | The request saves the message, sends it synchronously with no transaction open, records the outcome, and answers 202 whatever the delivery outcome. | No orphaned `PENDING` row when the free-tier instance stops after answering, and no extra executor; the send is bounded (D3) and the job covers failures. Pre-approved by the owner (blanket approval, 2026-11-23). |
| D2 | 2026-11-23 | A message gets at most 3 delivery attempts in total, the request's attempt included; the job runs every 10 minutes, so attempts are about 10 minutes apart. | SITE-004's "up to 3 attempts" read as a total, which bounds the provider calls per message. Pre-approved by the owner (blanket approval, 2026-11-23). |
| D3 | 2026-11-23 | Resend calls use a 2 s connect and a 5 s read timeout and up to 3 tries per attempt with 500 ms and 1 s backoff on timeouts, connection errors, 429, and 5xx. | A short provider blip does not cost an attempt or 10 minutes; the worst case (about 22.5 s) fits the 75 s client timeout. Pre-approved by the owner (blanket approval, 2026-11-23). |
| D4 | 2026-11-23 | The rate limit is checked before any work, and honeypot hits count toward the 3 per hour. | Backend guide principle 10; a bot learns nothing, and spam cannot fill the table faster than real messages. Pre-approved by the owner (blanket approval, 2026-11-23). |
| D5 | 2026-11-23 | The name and the message reject control characters (the message keeps tab and line breaks). | PostgreSQL rejects NUL, which would otherwise answer 500 and log a stack trace (the PF-005 D10 lesson). Pre-approved by the owner (blanket approval, 2026-11-23). |
| D6 | 2026-11-23 | The email is plain text with a subject of `New portfolio contact message (#{id})`, and its reply-to is the visitor's email. | The subject never holds content (backend guide); the owner replies straight to the visitor. Pre-approved by the owner (blanket approval, 2026-11-23). |
| D7 | 2026-11-23 | The idempotency key is `contact-message-{id}-attempt-{n}`: shared by the tries within one attempt, new for each attempt. | A timed-out request that landed is not sent twice, and a cached failure cannot block a later attempt. Pre-approved by the owner (blanket approval, 2026-11-23). |
| D8 | 2026-11-23 | A failure is stored and logged as a reason code (`HTTP_{status}`, `IO_ERROR`), never as provider text. | Provider bodies can echo the visitor's address (Non-Negotiables 5 and 9). Pre-approved by the owner (blanket approval, 2026-11-23). |
| D9 | 2026-11-23 | No automatic recovery of stale `PENDING` rows; the owner finds them with SQL. | A staleness rule risks a double send, and a crash between save and outcome is rare. Pre-approved by the owner (blanket approval, 2026-11-23). |
| D10 | 2026-11-23 | No new `ErrorCode`: a delivery failure never reaches the visitor. | REST rules: an upstream outage with a fallback is not an error. Pre-approved by the owner (blanket approval, 2026-11-23). |
| D11 | 2026-11-23 | The success note shows the request's correlation ID as a reference. | The owner can match a visitor's report to the logs. Pre-approved by the owner (blanket approval, 2026-11-23). |
| D12 | 2026-11-23 | The cold-start hint shows for the whole pending time. | Implementation plan §6.3 literally; no shared timer hook for one line of text. Pre-approved by the owner (blanket approval, 2026-11-23). |
| D13 | 2026-11-23 | The note and links come first and the form after them; at wide screens they sit side by side with the visual order equal to the DOM order. | The links work without the API and are the quickest path; reading and focus order match. Pre-approved by the owner (blanket approval, 2026-11-23). |
| D14 | 2026-11-23 | Non-local profiles fail at startup without `RESEND_API_KEY` or `CONTACT_TO_EMAIL`; the local profile needs neither and never sends. The key, the recipient, and the verified domain are PF-012 owner steps. | Backend guide principle 12; `make backend` keeps working with the empty values `.env.example` exports. Pre-approved by the owner (blanket approval, 2026-11-23). |
| D15 | 2026-11-23 | The Resend client is built from Spring Framework's `RestClient.builder()` with the Boot-configured `JsonMapper`, with no new Boot module. | `spring-boot-starter-restclient` 4.2.0 was published inside the one-week age rule; one client needs no auto-configuration. Pre-approved by the owner (blanket approval, 2026-11-23). |
| D16 | 2026-11-23 | The application never deletes contact messages; retention is the owner's. | No retention rule is needed for a handful of messages; the owner deletes by SQL. Pre-approved by the owner (blanket approval, 2026-11-23). |
| D17 | 2026-11-23 | The honeypot is an off-screen `website` input inside an `aria-hidden` wrapper, with `tabIndex` -1 and autocomplete off, not `display: none`. | Hidden from people and assistive technology without failing the focusable-hidden check; some bots skip fields that are not displayed. Pre-approved by the owner (blanket approval, 2026-11-23). |
| D18 | 2026-11-23 | `ErrorNote` shows the reference as selectable text (one click selects it), with no copy button. | Frontend principle 8 asks for a copyable correlation ID; selectable text needs no clipboard permission or state. Pre-approved by the owner (blanket approval, 2026-11-23). |

## 8. Acceptance criteria (refined)

- **AC-1**: A valid `POST /api/v1/contact-messages` answers 202 with no body; its row is `SENT` with attempts 1, the provider's message ID, and a 64-hex sender hash, and holds no IP address or user agent; the email the provider received has the visitor's address as reply-to and a subject without the message text.
- **AC-2**: A blank name, an invalid email, a message under 10 characters, or a control character such as NUL answers 400 `VALIDATION_FAILED` with an error on that field, and nothing is stored or sent.
- **AC-3**: A filled honeypot answers 202, stores the row as `SPAM` with attempts 0, and sends nothing.
- **AC-4**: The fourth message within an hour from one client address, spam included, answers 429 `RATE_LIMITED` with `Retry-After`.
- **AC-5**: With the provider failing on every try, the visitor still gets 202 and the row is `FAILED` with attempts 1 and a reason code such as `HTTP_503`.
- **AC-6**: The Resend adapter retries 5xx, 429, and timeouts up to 3 tries with one idempotency key and returns the provider ID after a recovery; it does not retry a 400; it reports `HTTP_{status}` or `IO_ERROR` when every try fails.
- **AC-7**: The retry job sends a `FAILED` message below the limit with a new attempt's key and marks it `SENT` with attempts 2; it leaves a message at 3 attempts untouched; two claims of the same row succeed once; with the switch off it does nothing.
- **AC-8**: The local profile starts without the Resend settings and never sends email; a non-local profile without `RESEND_API_KEY` or `CONTACT_TO_EMAIL` fails at startup.
- **AC-9**: No log line holds a visitor's name, email, or message.
- **AC-10**: The form shows field errors before sending and sends nothing while a field is invalid; while sending, the button is disabled with "Sending…" and the cold-start hint; on 202 the thank-you note shows the reference, and "Send another message" brings back an empty form.
- **AC-11**: A `VALIDATION_FAILED`, `RATE_LIMITED`, or network failure shows its own message with the code and the reference, keeps the values, and marks invalid fields; the honeypot is not reachable by role or tab and is still sent.
- **AC-12**: The migration runs through Flyway on an empty database; the OpenAPI snapshot and the generated frontend types include `createContactMessage` with `name`, `email`, and `message` required and `website` optional.
