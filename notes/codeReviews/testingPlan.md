# FeedLand Testing Implementation Plan

#### 10/31/25; 04:28:26 PM by JES -- Standing up automated coverage with `node:test`

Decision & Rationale
- **Testing harness:** use Node’s built-in `node:test` runner plus `node:assert`. This keeps dependencies at zero, matches our CommonJS environment, and avoids the maintenance overhead of adopting a larger framework.
- **Trade-offs:** we forego advanced features (watch mode, snapshot testing) offered by third-party tools, but gain simplicity, fast adoption, and no need to chase upstream updates. If the needs grow, we can layer a library later without rewriting initial tests.
- **Execution:** tests live under `tests/`, run via `node --test` (aliased to `npm test`), and rely on local fixtures/config stubs. Production code remains untouched unless we expose helpers deliberately.

Work Breakdown (chronological)

1. **Environment scaffolding**
   - Create `tests/` directory with README describing how to run tests.
   - Add `npm test` script (`"node --test"`).
   - Provide a `tests/helpers/config.js` that loads a safe default config (in-memory DB or temp schema) without real credentials.
   - Supply `scripts/setup.js` for generating configs (interactive or via CLI) and optionally provisioning local MySQL for test runs.

2. **Unit Test Suites**
   - *database/saveItem.test.js* — cover saving new items, updates, metadata JSON parsing.
   - *database/subscribeToFeed.test.js* — ensure feed creation, subscription count updates, category defaults.
   - *database/toggleItemLike.test.js* — verify like/unlike flows, socket notification stub.
   - *blog/publishHelpers.test.js* — validate blog formatting functions using sample fixtures.
   - *utils/sanitization.test.js* (if needed) — exercise `getItemDescription` sanitization logic with representative input.

3. **Integration Tests**
   - Minimal handler coverage via stubbed `daveappserver` harness: hit core GET endpoints (`/getfeed`, `/getfeeditems`) and verify responses.
   - Future enhancements: expand to authenticated flows once session strategy is finalized.

4. **Smoke/E2E Scripts**
   - Scripted curl wrapper (e.g., `scripts/smoke.sh`) that hits a handful of representative endpoints and checks HTTP 200; documented in the release checklist (`notes/codeReviews/releaseChecklist.md`).
   - Optional blog publishing smoke (`node blog.js` with fixtures) to mimic manual checks Dave performs.

5. **Performance Baselines (optional stretch)**
   - Add a script (e.g., `scripts/bench-getriver.js`) to time `getRiver` with a fixture dataset.
   - Store baseline numbers in `notes/codeReviews/perfBaselines.md` for future comparison.

Supporting Tasks
- Fixtures: create small JSON/SQL files representing feeds, items, subscriptions, reading lists.
- DB setup: add helper to spin up test schema (could reuse `davesql` with separate config pointing to a local MySQL instance; consider SQLite fallback if feasible).
- Documentation: update `README.md` and `notes/codeReviews/testing.md` with run commands and developer expectations.
- Automation helper: `scripts/run-tests.sh` installs MySQL via Homebrew when needed, provisions a temporary DB using `scripts/setup.js`, runs `npm test`, and tears everything down.

Tracking & Ownership
- [x] Scaffold test environment (`tests/`, npm script, helper config). (Owner JES)
- [x] Implement database unit tests. (Owner JES)
- [x] Implement blog/utils unit tests. (Owner JES)
- [x] Add HTTP integration tests with temporary DB. (Owner JES)
- [x] Document smoke test script and include in release checklist (`notes/codeReviews/releaseChecklist.md`). (Owner JES)
- [x] Capture performance baseline (mock run logged in `notes/codeReviews/perfBaselines.md`; stage run still pending). (Owner JES)
