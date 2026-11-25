# Knowledge Base

Verified facts about the tools, libraries, and hosting providers this site depends on: the things you would otherwise rediscover the hard way. Each entry was confirmed in practice, by a test, a probe against a running service, or generated output.

## Rules

- Record a fact only after verifying it. Guesses, "probably", and free-tier limits read on a blog do not belong here; a limit belongs here once it was observed on the running site.
- Record it once. Search first, and extend an existing entry rather than adding a near-duplicate.
- Facts only. How a ticket was built belongs in its plan; product rules belong in `docs/product/`; design rules for code belong in the design guides (`docs/architecture/backend.md`, `docs/architecture/frontend.md`), which may link here as evidence.
- Dated facts (versions, defaults, availability, free-tier behavior) carry their verification date, so a reader can judge whether to re-check.
- When an entry turns out to be wrong or outdated, fix or delete it in the same change that discovers it.

## Files

| File | Covers |
|---|---|
| [tooling.md](tooling.md) | Spring Boot 4, Gradle 9, Testcontainers 2, Jackson 3, PostgreSQL, shell and Docker, GitHub Actions, Node and frontend tooling, the AWS Architecture Icons package; carried over from the owner's earlier scaffold and to be re-checked when the code lands |
| [hosting.md](hosting.md) | Vercel, Render, and Neon behavior observed on this site's projects: pnpm and Node selection, the Vercel CLI with a Root Directory, `VITE_` variable types, Hobby environments and Deployment Protection, alias probes, Render's Root Directory, deploy hooks, and shared free hours, the Neon JDBC URL, and Neon's per-project quota |

Add one file per area when needed and list it here.

## Entry format

```markdown
### {Short topic}
- **Rule / Behavior**: {one-line fact}
- **Source**: {file, component, command, or documentation page}
- **Verified**: {how and when: test name, probe command, generated output; YYYY-MM-DD}
- **Discovered in**: {PF-NNN}
```
