# MustDo Issues

#### 11/01/25; 11:03:00 PM by JES -- Consolidating urgent remediation items

Context:
- Topic / subsystem: cross-cutting risks that require action before broader rollout
- Related files or endpoints: feedland.js (`getriver` and related endpoints), utils/config.json, scripts/setup.js

Highlights:
- Protect user secrets in URLs: several authenticated GET routes (for example `/getriver?emailcode=...`) surface secrets in browser history, logs, and Referer headers. We need an alternate auth channel (headers or POST body) and a transition plan for existing clients.
- Configuration via environment variables: FeedLand only reads `utils/config.json`, which blocks containerized or orchestrated deployments (Docker, Synology GUI). Introduce an env-aware config layer or an entrypoint helper that renders `config.json` from env vars to unblock automated provisioning.
- HTML sanitization controls: untrusted feed content currently flows through with minimal filtering; we should define an allowlist-based sanitizer (akin to the historical `html.sanitize` helper) to prevent XSS while preserving legitimate markup.

Follow-up:
- [ ] Replace query-string secrets with a safer auth mechanism and deprecate the legacy pattern. (Owner TBD)
- [ ] Design and implement an environment-driven configuration story (core code support or official entrypoint script). (Owner TBD)
- [ ] Specify and wire an allowlist HTML sanitizer, documenting operations steps for adjusting allowed tags. (Owner TBD)
