# FeedLand Security Review

#### 10/31/25; 12:24:15 AM by JES -- Authentication & XSS first-pass findings

Context
- We looked at how people log in with email “secrets,” how the app handles untrusted content, and where attackers could inject scripts.
- Goal: highlight high-risk issues and outline fixes a very small team can implement.

Plain-English Summary
- FeedLand relies on short “email secrets” for login. Right now those secrets are stored and sent in ways that make them easy to steal.
- Anyone who sees a URL with `emailcode=` can impersonate the user. Browser history, analytics, and screenshots routinely expose it.
- Those secrets live in the database as clear text, so a database leak gives attackers instant access.
- News product pages allow arbitrary HTML/JS in user-configured fields. Without sanitization, a malicious paste or rogue user could run JavaScript for everyone who visits the page.

Detailed Findings
1. **Secrets stored and compared verbatim**
   - New or regenerated secrets are saved directly in `users.emailSecret` (feedland.js:710–812). Nothing is hashed.
   - Login (`getUserRecFromEmail`) simply checks whether the incoming secret matches that column exactly (feedland.js:892–905).
   - Impact: if the DB leaks, or if someone reads a secret via logs/screenshots, they have full access until the secret is reset.
2. **Secrets appear in every authenticated URL**
   - `getScreenname` expects `emailaddress` and `emailcode` on each request (feedland.js:945+).
   - When a route is called via GET, the URL looks like `/getriver?emailcode=<secret>`. Those URLs end up in multiple places: browser history, Referer headers, server logs, analytics, etc.
   - Practical effect: a single intercepted URL equals a full session; regenerating the secret only helps after you realize it was leaked.
3. **News product fields are inserted into HTML without sanitization**
   - Preferences such as `newsproductTitle`, `newsproductDescription`, `newsproductImage`, `newsproductStyle`, and `newsproductScript` are stored verbatim and later merged into HTML via template substitution.
   - There’s no escaping or allowlist, so any HTML—including `<script>` tags—executes in visitors’ browsers (stored XSS).
   - Feed item descriptions do pass through `sanitize-html` (allowing only `<p>` and `<br>` by default), but titles and other fields remain unfiltered.

Immediate Mitigations (minimal effort)
1. **Stop putting secrets in the URL**
   - Switch sensitive calls to POST with JSON bodies, or require credentials in a header (e.g., `Authorization: Email ...`).
   - Provide helper/client guidance so contributors know how to authenticate after the change.
   - Reject `emailcode` in query strings once clients are updated.
2. **Hash secrets in the database**
   - Store a salted hash (bcrypt/PBKDF2) instead of the raw string.
   - On login, compare against the hash. Regenerate secrets so existing values get re-hashed.
   - Document that secrets will be reset once the change ships.
3. **Sanitize user-supplied HTML before rendering**
   - Reuse the existing `sanitize-html` helper (expanding its allowlist to cover the tags we want to support) when injecting `newsproduct*` fields and other rich-text preferences into templates.
   - Treat custom CSS/JS (`newsproductStyle` / `newsproductScript`) as a deliberate “power-user” feature. If we keep it, gate it behind explicit trusted/admin use; otherwise, strip disallowed tags when saving.
4. **Communicate operational guidance**
   - Update README/worknotes to warn against sharing URLs that contain secrets and to highlight that news product fields are sanitized going forward.
   - Encourage immediate secret regeneration after admins or users suspect a leak.

Future Hardening (for the backlog)
- Session tokens or cookies so the secret isn’t needed on every request.
- Rate limiting around login/secret regeneration to slow brute-force attempts.
- Audit logging for secret changes and failed logins.
- Auto-expire secrets after first use or after a short window.
- Admin-configurable HTML allowlist (similar to the legacy `html.sanitize`) so instances can decide which tags to permit.

Next Steps
- [ ] Prototype header-based auth for a representative route (e.g., `/getriver`) and confirm client updates are straightforward. (Owner TBD)
- [ ] Implement hashed secret storage + migration/reset script. (Owner TBD)
- [ ] Apply `sanitize-html` (or equivalent) to news product preferences; define/communicate allowed tags. (Owner TBD)
- [ ] Document how to authenticate post-change and remind contributors not to share URLs containing credentials. (Owner TBD)

Templating & XSS Notes
- Feed item descriptions are currently sanitized to allow only `<p>` and `<br>` tags; titles remain raw strings and must be escaped by consuming clients.
- News product prefs bypass sanitization entirely today—this is the highest-priority XSS vector.
- Longer term, adopt a configurable allowlist so trusted environments can opt-in to additional tags while keeping defaults tight.
