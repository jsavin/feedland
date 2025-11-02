# FeedLand Tests

Run the automated suites with:

```
npm test
```

This invokes Node’s built-in `node:test` runner. The tests load feedland modules with lightweight stubs for external dependencies (see `tests/helpers/moduleStubs.js`) so they can execute without a full MySQL/S3/github environment.

## Smoke & bench scripts

- `scripts/smoke.sh` — curl-based checks to run against a live instance. Set `FEEDLAND_HOST`, and optionally `FEEDLAND_EMAIL` / `FEEDLAND_CODE` for authenticated calls.
- `scripts/bench-getriver.js` — simple latency probe for `/getriver`. Configure `FEEDLAND_HOST` and `FEEDLAND_BENCH_SCREENNAME`.
- `scripts/setup.js` — generate `config.json` interactively or via flags (e.g., `--non-interactive`, `--install-local-mysql`, `--schema=...`) when provisioning test environments.
- `scripts/run-tests.sh` — wrap setup + `npm test` in a clean environment (installs MySQL via Homebrew if required, creates/drops a timestamped temporary database, writes a throwaway config under `/tmp`).
- Capture logs by piping through `tee`, for example: `./scripts/run-tests.sh | tee /tmp/feedland-test.log`.

Keep tests isolated—each file should prepare only the fixtures it needs and avoid touching production resources.
