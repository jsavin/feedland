# Repository Guidelines

## Project Structure & Module Organization
FeedLand ships as a Node.js service. `feedland.js` is the entry point exposing `start()` and wires the HTTP server, socket notifications, and background feed checks. `blog.js` manages publishing and feed generation. Supporting packages live in subdirectories: `database/` contains the feedlandDatabase integration, `utils/` holds shared helpers plus the sample `config.json`, and `docs/` stores OPML starter lists and templates shipped with the service. Keep assets such as `emailtemplate.html` and operational notes (`worknotes.md`) up to date when changing user-facing flows.

## Build, Test, and Development Commands
Run `npm install` at the repo root to sync dependencies across the server, database, and utility layers. Start a development node from the CLI with `node -e 'require("./feedland").start()'`; this loads configuration via `daveappserver` and brings up the HTTP endpoints. Use `node blog.js` to exercise publishing helpers in isolation, and prefer `npm update <pkg>` when bumping Dave-owned packages so lock-step versions stay aligned.

## Coding Style & Naming Conventions
All runtime code is CommonJS with tab-based indentation; match the existing layout and keep trailing spaces trimmed. Use `const` for immutable imports, `let` for mutable locals, and camelCase for functions and identifiers (`getScreenname`, `startFeedChecker`). Inline comments follow the `//MM/DD/YY by DW` convention when documenting behavior changes; extend that pattern rather than introducing new styles. Avoid modern syntax that would break on the Node LTS currently used in production.

## Testing Guidelines
There is no automated test suite yet; rely on manual smoke tests. After starting the service, hit representative endpoints (for example `curl http://localhost:1410/getriver?screenname=test`) and watch stdout for SQL and feed-processing logs. Exercise OPML flows by loading templates from `docs/`, and verify background jobs by toggling flags in `config.json` and tailing database activity. Capture the checks you ran in the PR description until we introduce regression coverage.

## Commit & Pull Request Guidelines
Keep commits focused and write imperative subject lines (`Fix socket renewal timing`) that reference the affected subsystem. Link related worknotes entries when the change adjusts operational expectations. Pull request summaries should outline the motivation, the main code touchpoints (e.g., `feedland.js`, `database/database.js`), and the manual validation performed; attach screenshots or API transcripts whenever behavior is user-visible.

## Configuration & Security Notes
The sample credentials in `utils/config.json` are placeholders—do not commit real secrets. Provide deployment-specific overrides through environment files ignored by Git, and confirm any new configuration keys are propagated before `database.start()` to keep runtime and SQL defaults synchronized.
