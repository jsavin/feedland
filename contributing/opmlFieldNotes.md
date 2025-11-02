# FeedLand OPML Field Notes

## `about.opml`
- FeedLand frames feeds, news, and people as a shared community; all feed lists and categories are public.
- The Feed List page is the primary control surface: sortable columns, inline five-item previews, category tagging, and quick subscription toggles.
- Feed Info pages surface feed metadata (link, description, categories, subscribers, read time, rssCloud status) and expose manual refresh plus subscribe/unsubscribe actions.
- Reading views include a multi-tab river (category-driven), per-feed rivers, and a mailbox view; navigation menus adjust contextually (e.g., View menu on feed info).
- Settings dialog tabs: Categories, News Products, Linker (default Radio3 URL for linkblogging), and Misc (news-as-home toggle, live ticker, background update suppression).

## `categories.opml`
- Users define custom categories (comma-separated) and can optionally choose a subset for News page tabs.
- Feed-level category assignment uses a live checkbox dialog (tag icon) with immediate persistence and next/prev feed navigation.
- Categories can drive News Product tabs by specifying outline attributes (`type`, `screenname`, `catname`) and can be exported as OPML (`/opml?screenname=&catname=`).
- "All" acts as an implicit catch-all if included; removing a category leaves existing feed labels intact.

## `firstThings.opml`
- New users log in with email, seed subscriptions via hotlists/user lists, and are encouraged to onboard gradually rather than bulk-importing OPML.
- Feed discovery emphasizes community transparency—every user's feed list is visible and subscribable.
- News reading starts from the Feed List (wedge expanders) or the My News river view.

## `hello.opml`
- Context setter from Dave Winer: FeedLand began summer 2022 with a small tester cohort; participation is curated but documentation is open to all.

## `misc.opml`
- Bookmarks feature mirrors Drummer's outline-based menu: timeline bookmark icon or "Add Bookmark" menu entry writes to a shared outline, edited via the standard outliner UX.
- Likes generate per-user RSS feeds (`data.feedland.org/likes/<screenname>.xml`) once the first item is liked; only logged-in users can like content.

## `newsProducts.opml`
- News Products are one-page sites (e.g., `my.feedland.org/<screenname>`) populated by FeedLand categories; custom domains can CNAME to these.
- News Product setup flows through Settings → Categories (third textbox defines product tabs) and Settings → News Products (title, description, hero image, inline CSS/JS).
- Advanced templates leverage OPML outlines with includes, category tabs, and editable HTML sections (must retain `divNewsProduct` root; river injects beneath `idRiverContent`).
- Feeds need at least one subscriber for content to appear—FeedLand skips fetching unsubscribed feeds.
- Template macros surface previously defined metadata; questions are tracked via feedlandSupport issue discussions.

## `tech.opml`
- Documents app surface types: single-category rivers, single-feed rivers, multi-tab rivers (My news), mailbox reader, feed list, subscription log, and hotlist archives.
- Feed List instrumentation: wedge expanders, subscription checkboxes (hot updates), category dialog access, subscriber counts, and stats tooltips.
- Highlights operational constraints like anonymous river access and plans for hotlist archives.

## `yourFeed.opml`
- Every user gets a personal feed (`data.feedland.org/feeds/<screenname>.xml`) editable via the My Feed page (create, update, cancel controls).
- Feed items store both HTML and `source:markdown`, encouraging Markdown-first authoring while preserving HTML output.
- April 2023 additions: editable title/link/enclosure metadata, bookmarklet for linkblogging (`https://feedland.org/?linkblog=true&…`), and optional Linker setting swap to loop the retweet icon back into FeedLand.
- Saved enclosures yield RSS `<enclosure>` elements with type and size; bookmarklet text pre-fills edit boxes when invoked.
