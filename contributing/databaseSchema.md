# FeedLand Database Cheat Sheet

FeedLand uses MySQL via `davesql`, with connection details supplied through `config.database`. Tables are managed with MySQL `REPLACE` semantics (so each logical key must stay unique), and foreign keys are enforced in code rather than in SQL. Below is a field-level map distilled from `database/database.js` (v0.8.3) as shipped in this repo.

## `feeds`
- **Keying**: unique on `feedUrl`; optional auto-increment `feedId` when `config.flFeedsHaveIds` discovers the column.
- **Core columns**: `feedUrl`, `feedId`, `title`, `htmlUrl`, `description`, `pubDate`, `whenCreated`, `whenUpdated`.
- **Counters/health**: `ctItems`, `ctSubs`, `ctSecs` (last read duration), `ctChecks`, `ctErrors`, `ctConsecutiveErrors`, `errorString`.
- **Timestamps**: `whenChecked`, `whenLastError`, `whenLastCloudRenew`.
- **rssCloud**: `urlCloudServer`, `ctCloudRenews`.
- **Source metadata**: `copyright`, `generator`, `language`, `managingEditor`, `webMaster`, `docs`, `ttl`, `twitterAccount`.
- **Image block**: `imageUrl`, `imageTitle`, `imageLink`, `imageWidth`, `imageHeight`, `imageDescription`.
- **Provenance**: `whoFirstSubscribed` captures the first user to add the feed.

## `items`
- **Keying**: unique on (`feedUrl`, `guid`); optional `feedId` when feeds have IDs.
- **Core columns**: `id` (auto-increment), `feedUrl`, `feedId`, `guid`, `title`, `link`, `description`, `pubDate`.
- **Timestamps**: `whenCreated` (ingest time), `whenUpdated` (last change).
- **Content variants**: `markdowntext`, `outlineJsontext` (serialized outline payloads).
- **Enclosures**: `enclosureUrl`, `enclosureType`, `enclosureLength`.
- **Engagement**: `likes` (comma-delimited usernames), `ctLikes` is derived at runtime.
- **Lifecycle**: `flDeleted` toggled when pruning.
- **Metadata**: `metadata` (JSON string added in v0.8.2 for WordPress IDs and similar).
- **Indexes**: code expects an index named `itemsIndex2` covering feed identity (feedId/ feedUrl) and `pubDate` for river queries.

## `subscriptions`
- **Keying**: unique on (`listName`, `feedUrl`, `urlReadingList`), implemented with `REPLACE`.
- **Core columns**: `listName` (user screenname), `feedUrl`, `feedId` (when available), `whenUpdated`.
- **Categorisation**: `categories` stored as a lowercase comma-wrapped string (`,all,tech,nyt,`), enabling SQL `LIKE` lookups.
- **Reading lists**: `urlReadingList` non-empty when the sub originates from a reading list; blank/NULL for direct subs.
- **Notes**: `addSubscription` seeds `",all,"` and refreshes `feeds.ctSubs` via `setFeedSubsCount`.

## `users`
- **Identity**: `screenname` (primary), `emailAddress`, `emailSecret` (invite/login shared secret), `role`.
- **Lifecycle**: `whenCreated`, `whenUpdated`, `ctStartups`, `whenLastStartup`.
- **Preferences**: `categories`, `homePageCategories`, `newsproductCategoryList`, `newsproductTitle`, `newsproductDescription`, `newsproductImage`, `newsproductStyle`, `newsproductScript`.
- **Personal feed**: `myFeedTitle`, `myFeedDescription`.
- **Apps**: `apps` JSON blob (stored as text; parsed on read).
- **Security**: `emailSecret` is stripped before returning user data to callers.

## `likes`
- **Keying**: unique on (`listName`, `itemId`) via `REPLACE`.
- **Columns**: `listName` (screenname), `itemId` (foreign key to `items.id`), `emotion` (currently 1), `whenCreated`.
- **Feed generation**: `buildLikesFeed` joins `likes` to `items` to publish RSS when `config.flLikesFeeds` is enabled.

## `readinglists`
- **Keying**: unique on `opmlUrl`.
- **Columns**: `opmlUrl`, `title`, `description`, `whenCreated`, `whenChecked`, `ctChecks`, `whoFirstSubscribed`, `feedUrls` (JSON array of subscribed feeds).
- **Usage**: `checkReadingList` refreshes the outline, updates `feedUrls`, and drives subscription diffs against `subscriptions`.

## `readinglistsubscriptions`
- **Keying**: unique on (`screenname`, `opmlUrl`).
- **Columns**: `screenname`, `opmlUrl`, `whenCreated`.
- **Workflow**: drives batch subscribe/unsubscribe operations into `subscriptions` with `urlReadingList` populated so individual feeds can later be cleaned up.

## Operational Notes
- Backups: `backupDatabase` (opt-in) writes JSON snapshots (`feeds.json`, `items/YYYY/MM/DD.json`, etc.) under `data/backups/` and, if configured, mirrors to GitHub/S3.
- Cleanup: `config.ctRiverCutoffDays` works with `flDeleted` to age out river data; ensure pruning jobs respect both `items` and `subscriptions`.
- rssCloud: `rssCloudRenew` fields on `feeds` are critical—renewals run every ~23 hours when `config.flRenewSubscriptions` is true.
- Feed IDs: When the `feedId` column exists, new code paths prefer integer joins (`flFeedsHaveIds` / `flCanUseFeedIds`). Keep `items`, `feeds`, and `subscriptions` in sync if you add the column manually.
