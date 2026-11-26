# PF-029 — Progress handoff

## §0 CURRENT STATE (read this first when resuming)

**Ticket**: PF-029 — Launch audit: security, reliability, SEO, accessibility, content · **Done means**: all ten slices of the Approved plan built, PRs A–F merged through staging, and release v1.1.0 · **Branch**: `fix/PF-029-site-audit` · **Updated**: 2026-11-26

### Where things stand

- **S1 Docs and decisions: built.** ADR 0001 (`docs/architecture/adr/0001-where-data-lives.md`) and its index; PF-014 and PF-020 plan and requirement docs marked Dropped; `docs/plans/README.md` domains; PF-012 plan and refined requirement synced (diagram approvals, items moved to PF-029, analytics dropped); backlog (PF-029 In progress; PF-014, PF-019, PF-020 Dropped; PF-028 Done).
- **S2 Backend privacy and abuse: built and tested.** `ClientAddress` (IPv6 /64, masking), masked marker probe in `ClientInfoResolver` (raw PF-004 D3 log removed), `ClientInfo.gpc`, `RateLimit.CONTACT_GLOBAL`, P5 text patterns, P7 visit paths, `ClientProperties` secret redacted in `toString` (the 32-character minimum was removed on 2026-11-26, D15), HSTS / `Referrer-Policy` / API CSP and the CSRF comment in `SecurityConfig`; frontend `trackedPath()` and the contact character rule; `make openapi` run (snapshot changed in 5 lines, frontend types unchanged). Docs: backend guide, overview, product guide (SITE-002, SITE-004, SITE-006 as approved), both package guides, knowledge (`vite preview` proxy).
- `/review PF-029` ran on 2026-11-26: four findings, all fixed (a DNS lookup on `.::1`-style input in `ClientAddress`; the global contact limit now skips honeypot hits and the 429 text is neutral, refined requirement D14; docs that stated pending steps as done; four small acceptance-test gaps). Nothing is committed. PR A = S1 + S2 is ready for `/create-pr`.
- S3 to S10 are not started.

### Source-of-truth docs (read these; don't re-derive them)

| Doc | What it holds |
|---|---|
| `docs/plans/site/PF-029-site-audit.md` | how it is built: slices, PR grouping, flows F1–F3, content table (approved 2026-11-25), owner checklist |
| `docs/plans/site/PF-029-refined-requirement.md` | what it must do: FR-1 to FR-44, D1–D13, AC-1 to AC-29 (Confirmed) |
| `../portfolio-implementation-plan.md` §5, §8, §9, §12 | the master plan sections it maps to |

### Decisions and why

- Data is kept forever (D3, owner): no retention job; SITE-006 says so.
- The visitor-hash secret has no minimum length (D15, owner 2026-11-26): a longer secret was not worth forcing a secret change on both Render services; only the `toString` redaction stays.
- Full static prerender stays in this ticket (D4), the projects API is removed and Vercel Analytics dropped (D5), length rule 300–800 / 80–180 (D6), visit path allowlist (D10): defaults confirmed by the plan approval.
- The text rule uses explicit ranges in one negated character class (P5): an alternation like `(?:[\t\n\r]|[^…])*` recurses per character in Java's regex engine and can overflow the stack on a 10,000-character message.
- `ClientAddress` parses IPv4 by hand and passes only strings with a colon to `InetAddress`: `InetAddress.getByName` falls back to DNS for an unreadable dotted string such as `999.1.1.1` or `abc.def`.

### Gotchas (verified; don't relearn them)

- The global contact bucket (20 per hour) is in memory and shared by every integration test in one JVM; about 10 tokens are used. Do not add an integration test that drains it; `RateLimiterTest` proves the limit.
- Test writers sometimes report green faster than a real run; rerun their scoped tests with `--rerun` before trusting the result.
- `pnpm --dir frontend format` formats the whole package; check `git status` afterwards for unrelated changes (none so far).

### What's next (in order)

1. `/create-pr` for PR A (S1 + S2); after merge, staging deploys it.
2. Owner, after PR A is on staging: run the probe curl from plan §8 owner checklist item 1, share the masked line, set `TRUSTED_PROXY_HOPS` if needed, delete `LOG_FORWARDED_FOR_ONCE` on both services, confirm `ALLOWED_ORIGINS`; then record the layout in `docs/knowledge/hosting.md` (FR-6).
3. Owner: agree to dismiss CodeQL alert #1 (Claude runs the `gh api` call on that OK).
4. `/dev PF-029` continues with S3 (backend reliability and projects removal) and S4 (ops) as PR B.

### Open questions

- Code Race date: the owner checks the certificate; the site keeps 04/2023 until then.

### Resume recipe

```bash
git switch fix/PF-029-site-audit && git status --short
./backend/gradlew -p backend testUnit --tests "*ClientAddressTest" --tests "*ClientInfoResolverTest" --tests "*RateLimiterTest" --tests "*PlatformPropertiesTest"   # last run: 36 green
./backend/gradlew -p backend testIT --tests "*ContactApiIT" --tests "*VisitApiIT" --tests "*PlatformWebIT"   # last run: 34 green
scripts/with-node.sh pnpm --dir frontend test --run src/features/contact/validation.test.ts src/features/visits/useTrackPageView.test.tsx   # last run: 30 green
```

Key files: `backend/src/main/java/com/huygialy/portfolio/platform/client/ClientInfoResolver.java`, `backend/src/main/java/com/huygialy/portfolio/platform/client/ClientAddress.java`, `backend/src/main/java/com/huygialy/portfolio/platform/security/SecurityConfig.java`, `frontend/src/features/visits/tracking.ts`.

## Log

- 2026-11-26: owner reversed the 32-character secret minimum (D15); `ClientProperties`, `PlatformPropertiesTest`, `application-test.yml`, `.env.example`, plan, and requirement reverted to no length rule.
- 2026-11-26: `/review PF-029` for PR A; findings 1–4 fixed; scoped tests green (backend unit 47, integration 38, frontend 41).

- 2026-11-25: plan Approved; S1 and S2 built and tested in the planning session.
