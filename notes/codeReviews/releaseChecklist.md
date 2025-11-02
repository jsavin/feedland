# Release Checklist

#### 11/01/25; 10:44:45 PM by JES -- Codifying pre-release validation steps

Context:
- Topic / subsystem: pre-release validation workflow for FeedLand service
- Related files or endpoints: scripts/run-tests.sh, scripts/smoke.sh, scripts/bench-getriver.js, notes/codeReviews/testing.md

Highlights:
- Prepare environment: ensure dependencies match `package.json`, then run `scripts/run-tests.sh` (drops/creates temp DB, executes `npm test`, captures logs with `tee` when needed).
- Manual smoke verification: set `FEEDLAND_HOST`, optionally `FEEDLAND_EMAIL` / `FEEDLAND_CODE`, and execute `./scripts/smoke.sh`; save output for release notes.
- Performance spot-check: run `FEEDLAND_HOST=… node scripts/bench-getriver.js` to confirm `/getriver` latency remains within expected bounds, updating `notes/codeReviews/perfBaselines.md`.
- Operator sign-off: review latest entries in `notes/codeReviews/testing.md` and `notes/codeReviews/security.md` to confirm open follow-ups are acknowledged before announcing the build.
- Local dry run (11/01/25): verified `scripts/run-tests.sh`, `scripts/smoke.sh`, and `scripts/bench-getriver.js` using mock endpoints to confirm tooling works in isolation; staging validation remains outstanding.

Follow-up:
- [ ] Validate smoke script against staging or production data and capture evidence (Owner JES)
- [ ] Update checklist if new automation (CI, alerts) lands (Owner JES)
