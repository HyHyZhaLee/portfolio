# Product guide

> Start here. What the site is for, who it serves, what is on it, and the rules every feature follows. Rule changes are proposed by agents and written here only once the owner agrees. The private content plan (`cv-portfolio-content-plan.md` in the parent folder) is the full source for content decisions; this page is the public-safe summary agents work from.

## 1. Purpose

A personal portfolio for Will Ly, Full-stack Software Engineer, used when applying for full-stack roles in Vietnam and internationally. It has two jobs:

1. **Depth for an interested reader.** The CV proves fit in 10 seconds; the site gives a hiring manager case studies, decisions and trade-offs, and how Will works.
2. **A live full-stack demo.** The site's own code, tests, docs, and deployment (React on Vercel, Spring Boot on Render, PostgreSQL on Neon, CI) are evidence of the skills it describes.

## 2. Audience and the 10-second test

| Reader | Needs |
|---|---|
| Recruiter | Within 10 seconds on a laptop, without scrolling: who (name, "Full-stack Software Engineer"), what stack, three proof points, and two actions (Download CV, Contact) |
| Hiring manager | A case study one click from the home page; role and scope stated honestly; the trade-offs behind decisions |
| Engineer reviewing the code | A clean repository with a README, an architecture overview, tests, and CI |

## 3. Site map

Rows whose ticket has not run yet are planned.

| Route or section | Content | Ticket |
|---|---|---|
| `/` Hero | Portrait, name, title, one-line pitch (≤ 20 words), three proof chips, buttons View work · Download CV · Contact, and a live system panel with the API and database status; the header brand reads "Portfolio" so the name appears once (PF-012, 2026-11-24) | PF-003, PF-012 |
| `/` About | 120–180 words in the first person | PF-003 |
| `/` Experience | Timeline of roles, right after About (PF-012, 2026-11-24) | PF-003, PF-012 |
| `/` Featured work | Employer project cards, the capstone, and this site; each links to `/work/<slug>` | PF-003 |
| `/` How I work | Five or six principles, each with one example | PF-003 |
| `/` Skills | Grouped as on the CV; each skill links to the case studies that used it | PF-003 |
| `/` Education & awards | Degrees and awards, one line each; each award opens its certificate in a dialog (PF-012, 2026-11-24) | PF-003, PF-012 |
| `/` Contact | LinkedIn and GitHub with their addresses (PF-003), then the form in a raised card (PF-006, PF-012); no phone | PF-003, PF-006, PF-012 |
| `/` Footer | API status dot, "View source" link, privacy note (PF-003); visit counter (PF-005) | PF-003, PF-005 |
| `/work/<slug>` | One case study, 500–800 words | PF-003 |
| `*` | Not-found page | PF-003 |

## 4. Product rules

### SITE-001: Content never waits for the API
Every route renders its content from static files. API-backed parts (counter, open source, contact, status dot) show a loading state, then their data or a quiet fallback. Non-Negotiable 1.

### SITE-002: What counts as a visit
A page view is counted when the frontend posts it to `POST /api/v1/visits` from a production build. Each route the visitor opens counts as one view: the first load, the home page, and each case study; anchor jumps within a page and query changes do not count (PF-005 D1). Requests whose user agent looks like a bot are dropped. Views are not counted when the visitor has opened `?notrack=1` on that browser (the owner's devices) or when Global Privacy Control is on; opening `?notrack=0` removes the opt-out and re-enables tracking in that browser (PF-005 D5). Where the browser blocks storage, the opt-out cannot be remembered, so it lasts until the page reloads. Each client address may record at most 30 views per minute, whatever its user agent: the limit is checked before the bot filter, so bot-flagged requests count toward it too (PF-005 D7). "Unique visitors" is the number of distinct visitor hashes. Non-Negotiable 3.

### SITE-003: Application reference tags
A link may carry `?ref=<tag>` to show which application it was sent with. A tag is stored with each view of that session only when it matches `^[a-z0-9-]{1,64}$`, and the frontend removes it from the address bar after reading it.

### SITE-004: Contact messages
A message has a name (1–100 characters), a valid email (at most 254), and a message (10–2000 characters), with no control characters except tab and line breaks in the message. Each client address may send 3 per hour, honeypot hits included (PF-006 D4). An accepted message is stored as `PENDING`, delivered to the owner's inbox, and marked `SENT`, or marked `FAILED` and retried, with at most 3 delivery attempts in total (PF-006 D2). A message that fills the hidden honeypot field is stored as `SPAM`, never emailed, and answered exactly like a success. The visitor's name, email, and message are never logged. Non-Negotiables 4 and 9.

### SITE-005: Open-source projects (retired 2026-11-24)
The owner removed the Open source section from the home page on 2026-11-24 (PF-012). The backend endpoint `GET /api/v1/projects` (PF-007) still exists, but no page calls it. The rule as it stood: the list shows the owner's public GitHub repositories that are neither forks nor archived, featured repositories first. It is cached for an hour. When GitHub is unavailable, the list falls back to the last good result, then to the static list in the frontend. Private repositories are never listed. The home page shows the first six, in a section that keeps its height whether the list is static or live, and links to the GitHub profile for the rest (PF-007 D2, D3, D7).

### SITE-006: Privacy
No raw IP address, full user agent, or full referrer URL is stored or logged; the referrer is kept as its host only. The site sets no tracking cookies. The footer says so in one line.

### SITE-007: Public content follows the disclosure tiers
Every public text follows section 5. Nothing is invented, and facts match the master CV, which is also the public CV PDF (full length, without the phone). Non-Negotiable 2.

## 5. Disclosure tiers

| Tier | What | Rule |
|---|---|---|
| **A — public OK** | What the master CV states; general engineering techniques described without internal names; personal projects; degrees and awards; product names, each with a descriptor ("Name - descriptor") | Use freely, consistent with the CV |
| **B — owner approval per item** | Numbers and stories not in the master CV; design, trade-off, and root-cause stories; generic architecture diagrams of employer systems; the growth story outside the About section | Stays out of the repository until the owner approves that item; the ticket's refined requirement records the approval |
| **C — never** | Customer, tenant, patient, or caregiver names and data; colleague names; internal ticket IDs, repository, branch, and class names, internal URLs and hostnames, account IDs; screenshots, source code, or documents from employer systems; the location of security vulnerabilities; performance-review content; lines-of-code counts; anything the source material marks "do not claim", "not merged", or "feature branch only"; the phone number | Never in a file, commit, branch name, pull request, or issue |

`/create-pr` runs a machine-local scrub (`.local/scrub-patterns.txt`) for known Tier C patterns before anything is pushed.

## 6. Glossary

| Term | Meaning |
|---|---|
| Master CV | The private, complete list of claims the owner has approved; the ceiling for anything public |
| Content pack | Owner-reviewed drafts of every text block and case study, kept privately until approved |
| Visitor hash | `HMAC-SHA256(secret, ip + "|" + user agent)` as 64 hex characters; identifies a visitor without storing who they are |
| Rate-limit key | `HMAC-SHA256(secret, ip)`: rate limits apply per client address, so a changed user agent does not reset them; it is never stored or logged |
| Ref tag | The `?ref=` value that ties a visit to the application link it came from |
| Cold start | The free-tier backend sleeps after 15 minutes without traffic and needs up to about a minute to wake |
