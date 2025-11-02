# FeedLand Backup & Recovery Review

#### 10/31/25; 12:44:55 AM by JES -- Nightly backup coverage audit

Context
- Topic / subsystem: `database.backupDatabase` implementation and related config flags (`flNightlyBackup`, `flBackupOnStartup`).
- Goal: confirm what data is captured nightly, identify gaps, and outline lightweight improvements for a small team.

What the code does today
- `backupDatabase` (database/database.js:2510+) runs `select *` against four core tables—`feeds`, `subscriptions`, `likes`, `users`—and writes JSON files under `data/backups/`.
- Item backups are scoped to **yesterday only**: `select * from items where date(whenCreated) = '<yesterday>'` and saved under `items/YYYY/MM/DD.json`.
- Hotlist data is exported separately using `getHotlist`.
- Optional GitHub uploads mirror the same JSON if `config.githubBackup.enabled` is true.
- The job runs at startup when `flBackupOnStartup` is set and at midnight when `flNightlyBackup` is true.

Gaps & Risks
1. **Partial table coverage**
   - Reading list state (`readinglists`, `readinglistsubscriptions`) and other tables (e.g., `readinglists` feed URLs, any future metadata tables) are omitted. Losing the DB means losing those features entirely.
2. **Items newer than “yesterday” are never captured**
   - The nightly run only exports records whose `whenCreated` falls on the previous day. If a failure happens before midnight, the entire current day’s activity is missing.
   - Manual restart mid-day doesn’t help: `dateYesterday` still points to the prior day.
3. **No restore tooling or documentation**
   - We rely on manual MySQL imports from raw JSON; there’s no script or README guidance describing how to restore.
   - Backups aren’t versioned/rotated; operators must track success via console logs.
4. **Success not monitored**
   - Failures are only logged to stdout. There’s no alerting if filesystem writes or SQL queries fail, nor a checksum to confirm upload success.

Immediate Mitigations (low effort)
- Extend `backupDatabase` with additional queries for `readinglists`, `readinglistsubscriptions`, and any other critical tables we identify (e.g., `readinglists` feed URLs).
- Add a “current day” export (or simply remove the `date()` filter) so the JSON represents the whole `items` table. Even dumping a rolling 7-day window would reduce risk without generating massive files.
- Record backup success/failure to a simple status file (`data/backups/last-status.json`) so operators can check the timestamp quickly.
- Document manual restore steps (e.g., node script or MySQL import commands) in `notes/codeReviews/restoreGuide.md` once verified.

Future Hardening Ideas
- Rotate/trim old JSON backups to keep disk usage predictable.
- Send backup success metrics/events to logging/monitoring once that stack is in place.
- Consider a more compact export format (gzip) or incremental approach when data volume grows.
- Provide an automated restore script to replay JSON into MySQL, including safety checks.

Next Actions
- [ ] Update `backupDatabase` to dump reading list tables and the full `items` dataset (or current-day append). (Owner TBD)
- [ ] Run a manual restore drill using the generated JSON and capture the process in a new `restoreGuide`. (Owner TBD)
- [ ] Add a simple success marker (timestamp + status) and document where operators should look after each backup run. (Owner TBD)
