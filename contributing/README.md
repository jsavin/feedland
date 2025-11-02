# FeedLand Agent Guide

## Purpose
This directory hosts quick-reference docs to help AI coding agents ramp up on the FeedLand codebase. Keep the guidance concise, actionable, and in sync with the main project documentation.

## Getting Started
- Entry point: `feedland.js` exports `start()` (HTTP server, sockets, feed checker).
- Publishing helpers: run `node blog.js` to exercise feed generation logic in isolation.
- Project relies on CommonJS modules with tab indentation; avoid newer Node features that might break the current LTS runtime.

## Key Commands
- Install dependencies: `npm install`
- Start dev server: `node -e 'require("./feedland").start()'`
- Blog utilities: `node blog.js`

## Configuration Notes
- Default config lives in `utils/config.json`; never commit real credentials.
- Ensure any new config values are set before `database.start()` so they persist to the database layer.
- Operational assets (e.g. `emailtemplate.html`, `worknotes.md`) must stay aligned with user-facing changes.

## Recent History (see `worknotes.md` for detail)
- **10/26/25**: Released feedlanddatabase v0.8.3; `/getRiver` reimplemented using a join-based query.
- **9/5/25**: Added `metadata` JSON column support (feedlanddatabase v0.8.2); wpidentity bumped to v0.5.25.
- **3/23/24**: Introduced `/getuserinfowithwordpresstoken` endpoint.
- **3/17/24**: Increased feed checker frequency; review `startFeedChecker`.
- **2/26/24**: Added `config.httpRequestTimeoutSecs` (default 1) for the feed reader.

## Contribution Reminders
- Follow `//MM/DD/YY by DW` comment style when documenting behavior changes.
- Prefer manual smoke tests; record what you exercised when proposing changes.
- Keep `emailtemplate.html` and other shipped assets current when flows change.

