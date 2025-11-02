# FeedLand Project Structure & Dependencies

## Service Layout
- `feedland.js` is the Node entry point; it wires `start()` to the HTTP server, websocket notifications, and scheduled feed checks.
- `blog.js` hosts publishing helpers and feed generation logic; run with `node blog.js` for isolated exercise.
- `database/` integrates the `feedlandDatabase` package; keep schema-related config values (`flFeedsHaveIds`, `httpRequestTimeoutSecs`, `metadata` JSON column support) synchronized before `database.start()`.
- `utils/` contains shared helpers plus the sample `config.json`; remember to provide instance-specific overrides outside source control.
- `docs/` ships OPML documentation and templates referenced across the app (news products, onboarding, categories, personal feed guidance).
- `contributing/` centralizes onboarding briefs (project structure, OPML notes, API overview); `tests/` is staged for future automation.

## User-Facing Flows (from OPML docs)
- Feed discovery centers on the Feed List (sortable columns, inline previews, category tags, subscriber counts) with universal read access across users.
- Reading modes include multi-tab rivers (category tabs), feed-specific rivers, and a mailbox view; settings govern defaults and live update behavior.
- Categories drive News pages, News Products, and OPML exports (`/opml?screenname=&catname=`); assignments persist in real time via the feed list tag dialog.
- News Products render on `my.feedland.org/<screenname>` using template outlines that can pull categories, includes, and custom HTML under `divNewsProduct`.
- Every account exposes a personal feed (`data.feedland.org/feeds/<screenname>.xml`) supporting Markdown + HTML content, linkblog bookmarklets, and RSS enclosures.
- Engagement features include outline-based bookmarks and per-user Likes feeds (`data.feedland.org/likes/<screenname>.xml`).

## Dependencies & Integrations
- Core NPM packages mentioned in worknotes: `feedlanddatabase` (v0.8.3), `wpidentity` (v0.5.25), `sqllog`, and the Dave-owned `daveappserver`.
- Feed fetching leverages the `reallySimple` reader (tied to `config.httpRequestTimeoutSecs`), with rssCloud renewal for instant updates when supported.
- External apps referenced by docs: Drummer (outliner/bookmarks), Radio3 (default linkblog target), OPML viewers (xmlviewer.scripting.com).
- Websocket update socket defaults to `wss://drummer.land/`, matching OPML head metadata.

## Configuration & Operations
- Keep `worknotes.md` aligned with behavior changes; many config defaults (e.g., `flCanUseFeedIds`, `flFeedsHaveIds`) are documented there chronologically.
- `config.json` samples must never include production secrets; ensure any new keys are injected before startup to propagate into database config mirrors.
- rssCloud renewals run roughly every 23 hours; manual feed refresh and stats are surfaced on Feed Info pages for troubleshooting.
- Bookmarklet and template URLs in docs should be treated as canonical references when restoring user-facing flows.
