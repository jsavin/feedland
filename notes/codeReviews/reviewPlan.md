# FeedLand Review Plan

#### 10/30/25; 11:46:44 PM by JES -- Early production review tracks

Context:
- Topic / subsystem: cross-cutting review plan for early production rollout
- Related files or endpoints: feedland.js, database/database.js, utils/config.json, HTTP API surface documented in `contributing/apiOverview.md`

Highlights:
- Security assessment: perform end-to-end threat modeling (auth flows via `daveappserver`, email-secret handling, websocket notifications), review input sanitization for feed ingestion, and audit npm dependencies (`feedlanddatabase`, `wpidentity`, `sqllog`, `reallysimple`, etc.) for known CVEs.
- Privacy & data handling: confirm storage/retention rules for user emails and secrets, document export/erase workflows, and validate that public rivers do not leak private metadata (e.g., `metadata` JSON column).
- Reliability & recovery: exercise backup/restore paths (`database.backupDatabase`, nightly jobs), test failure scenarios for feed polling, and ensure rssCloud renewals degrade gracefully.
- Observability & incident response: standardize logging levels, add alerting around feed-check failures and socket backlogs, and publish an incident playbook.
- Performance & scale: load-test key endpoints (`/getriver`, `/subscribe`), profile river SQL (`itemsIndex2` usage), and establish capacity targets ahead of marketing-driven traffic.
- Dependency & supply chain hygiene: lock npm versions, enable automated advisories, and define an update cadence aligned with worknotes releases.
- Documentation & support readiness: expand operator notes (`worknotes.md`, `notes/`), clarify onboarding steps for new communities, and prepare customer-facing FAQs in sync with marketing.
- Legal/compliance sweep: verify licenses for bundled packages and craft terms-of-service / privacy statements before broad adoption.
- Testing strategy: formalize a test pyramid covering unit coverage for critical helpers (`database`, `blog`), integration smoke tests for HTTP endpoints, and regression scripts for feed ingestion and reading-list flows; integrate into release checklists before future marketing pushes.

Follow-up:
- [ ] Schedule a formal security review (threat model + dependency audit) and capture outcomes in `notes/codeReviews/security.md`. (Owner TBD)
- [ ] Draft data handling and retention guidelines for operators, referencing email secret flows. (Owner TBD)
- [ ] Run disaster-recovery drills using `database.backupDatabase` outputs and document results. (Owner TBD)
- [ ] Configure monitoring/alerting stack (logs, rssCloud renewals, feed checker) before the marketing push ramps traffic. (Owner TBD)
- [ ] Conduct load testing on river and subscription endpoints; note fixes in `worknotes.md`. (Owner TBD)
- [ ] Publish a testing roadmap (unit/integration/smoke) in `notes/codeReviews/testing.md` and align it with release processes. (Owner TBD)
