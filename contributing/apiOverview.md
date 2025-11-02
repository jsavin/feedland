# FeedLand HTTP API Reference

The server bootstraps `daveappserver` with `handleHttpRequest` (see `feedland.js`). Requests are split on verb, and most JSON responses go through `httpReturn`, which emits `application/json`. Routes that call `returnOpml`, `returnHtml`, or `returnPlainText` change the MIME type accordingly.

Authentication relies on `callWithScreenname`, which in turn calls `getScreenname` (Twitter/email cookie checks inside `daveappserver`). Any route wrapped with `callWithScreenname` requires the caller to be logged in; others are open.

## POST Endpoints
- `POST /opmlsubscribe` *(auth required)* — Subscribes the current user to every feed in an OPML outline posted in the body. Optional query flag `flDeleteEnabled` prunes feeds no longer present.
- `POST /sendprefs` *(auth required)* — Batch updates user preferences from the raw POST body (JSON).
- `POST config.rssCloud.feedUpdatedCallback` (defaults to `/feedupdated`) — Incoming rssCloud webhook; expects a URL-encoded body with `url`, responds with a plain-text acknowledgment.

## GET Endpoints

### Feed Fetching & Metadata
- `GET /returnjson` — Proxy `reallysimple.readFeed`, returning parsed feed JSON for `url`.
- `GET /returnopml` — Same as above but serialized to OPML (XML).
- `GET /checkfeednow` *(open)* — Triggers `database.checkOneFeed(url)` to refresh immediately.
- `GET /getupdatedfeed` *(open)* — Reads the feed (and latest items) fresh from the network, then returns the normalized feed record.
- `GET /getfeedrec` *(open)* — Returns the raw database row for `url`.
- `GET /getfeed` *(open)* — Returns the converted API feed record from the database (no network touch).
- `GET /getfeeditems` *(open)* — Returns recent items for `url`; optional `maxItems`.
- `GET /getfeedlist` *(open)* — Lists every `feedUrl` currently stored.
- `GET /getfeedlistfromopml` *(open)* — Fetches a remote OPML, returning the contained feed URLs and metadata.
- `GET /getfeedsearch` *(open)* — Full-text search against feed titles (see `database.getFeedSearch`).
- `GET /setfeedsubscount` *(open)* — Recounts subscribers for `url` and updates `feeds.ctSubs`.
- `GET /checkfeednow`, `/getupdatedfeed`, `/getfeedrec`, `/getfeed` respect `config.flCheckForDeleted` and may omit logically deleted items.

### Likes & Engagement
- `GET /togglelike` *(auth required)* — Toggles the caller’s like for `id` (an item primary key); updates both `items.likes` and the `likes` table.
- `GET /getlikes` *(auth required)* — Returns the like roster for item `id`.
- `GET /getalotoflikes` *(auth required)* — Intended to batch-fetch likes given an `idarray`. The current `database` module in this repo no longer exports `getALotOLikes`, so this route will throw unless that helper is restored.
- `GET /getlikesxml` — Triggers `database.buildLikesFeed`, returning RSS XML (requires `config.flLikesFeeds`).
- `GET /getfollowers` — Returns the list of users subscribed to `url`.

### Subscriptions & Categories
- `GET /subscribe` *(auth required)* — Adds the feed at `url` to the caller’s list; auto-creates OPML entries when `flMaintainFeedsOpml` is true.
- `GET /unsubscribe` *(auth required)* — Removes the feed at `url` from the caller.
- `GET /unsublist` *(auth required)* — Bulk unsubscribe; `list` query param must be a JSON array of feed URLs.
- `GET /isusersubscribed` *(auth required)* — Returns `{flSubscribed, theSubscription}` for the caller. Accepts `urlreadinglist` to scope to a specific reading list.
- `GET /getusersubcriptions` *(open)* — Returns the subscription array for `screenname` (defaults to caller if omitted).
- `GET /setsubscriptioncategories` *(auth required)* — Updates the category set for a subscription (`jsontext` is a JSON array of category names).
- `GET /getfeedsincategory` *(auth required)* — Returns the caller’s feeds filtered by `catname`. Pass `screenname` to inspect someone else’s categories.
- `GET /getusercategories` *(open)* — Retrieves `categories` and `homePageCategories` for `screenname`.
- `GET /getrecentsubscriptions` — Returns a log of latest subscriptions across the system.
- `GET /opml` — Produces an OPML subscription list for `screenname` (optionally filtered by `catname`).
- `GET /opmlhotlist` — Returns the system hotlist as OPML.
- `GET /gethotlist` — Returns hotlist metadata in JSON.

### Rivers & News Products
- `GET /getriver` — Dual-mode: if `url` is provided, builds a river from an OPML list; otherwise fetches the river for `screenname` (defaults to caller).
- `GET /getriverfromlist` — River from a JSON or comma-separated list of feed URLs.
- `GET /getriverfromopml` — River from a remote OPML file.
- `GET /getriverfromcategory` — River for `screenname` limited to `catname`.
- `GET /getriverfromeverything` — Global river (`items` newest first).
- `GET /getriverfromhotlist` — River from the current hotlist.
- `GET /getriverfromuserfeeds` — Union river for every user’s feed list.
- `GET /getriverfromreadinglist` — River sourced from a reading list OPML.
- `GET /newsproduct` — Renders a full HTML page. Supply `username` to render a user’s product, or `template`/`spec` (OPML or JSON) for template-driven output.

### Reading Lists
- `GET /checkreadinglist` — Refreshes `readinglists` entry for `url`; adds missing feeds to the database.
- `GET /subscribetoreadinglist` *(auth required)* — Subscribes the caller to the specified OPML reading list (updates `readinglistsubscriptions` and `subscriptions`).
- `GET /unsubreadinglist` *(auth required)* — Removes the caller from a reading list and cleans up related subscriptions.
- `GET /getreadinglistsubscriptions` — Lists all reading lists a `screenname` follows.
- `GET /getreadinglisstinfo` — Batch fetch metadata for multiple reading lists (`jsontext` is a JSON array of OPML URLs).
- `GET /getreadinglistfollowers` — Lists followers of a reading list.
- `GET /checkmyreadinglistsubs` *(auth required)* — Forces a reconciliation between the caller and a particular reading list.

### User & Identity
- `GET /sendprefs` *(auth required)* — Legacy GET variant; prefer POST.
- `GET /getallusers` — Returns user summaries joined with subscription counts (`config.maxGetAllUsers` limit).
- `GET /getuserprefs` *(auth required)* — Returns the caller’s preference record (email secret stripped).
- `GET /getuserinfo` — Public-safe user info for `screenname`.
- `GET /isuserindatabase` — Simple existence check for `screenname`.
- `GET /isemailindatabase` — Validates whether an email is registered (used during login).
- `GET /getuserinfowithwordpresstoken` — Resolves a WordPress token to user info via `wpidentity`.
- `GET /regenerateemailsecret` *(auth required)* — Issues a new email login secret and updates the `users` table.
- `GET /getserverconfig` — Exposes runtime config summary (optionally tailored per `screenname`).

### Blog Utilities
- `GET /updateblogsettings`, `GET /newblogpost`, `GET /updateblogpost` *(auth required)* — Thin wrappers around `blog.js` for managing personal feed posts (the params are JSON payloads).

### Utility & Diagnostics
- `GET /memoryusage` — Node.js heap stats.
- `GET /getitem` — Returns a single item (converted) by `id`.
- `GET /getfeedsearch`, `/getfollowers`, `/isfeedinriver` — Search and diagnostic helpers.
- `GET /getcurrentriverbuildlog` — Returns the active river build log (if `config.flRiverBuildLogEnabled`).
- `GET /getfeedlist` — Dump of all feed URLs.
- `GET /isfeedinriver` — Checks whether a feed is currently present in a cached river (requires `cachekey`).
- `GET /returnjson`, `/returnopml` double as debugging proxies for feed URLs.
- `GET config.rssCloud.feedUpdatedCallback` — Responds to rssCloud handshake challenges by echoing the `challenge` query param.

## Response Conventions
- Success replies are usually JSON; OPML-producing routes send `text/xml`, `newsproduct` returns HTML, rssCloud callbacks return plain text.
- Errors bubble through `returnError`, returning HTTP 500 with `{message}`.
- `REPLACE`-style mutations often return the row as acknowledged by MySQL (e.g., subscriptions, likes).

## Known Gaps
- `GET /getalotoflikes` references `database.getALotOLikes`, which is not defined in `database/database.js` in this repo snapshot. Restore the helper or remove the route before exposing it.
- Some admin-leaning routes (`/setfeedsubscount`, `/getcurrentriverbuildlog`) lack explicit auth checks; gate them via the proxy or add role checks if you deploy multi-tenant instances.
