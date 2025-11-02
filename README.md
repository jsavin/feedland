# feedLand

This is the source code for the NPM package <a href="https://www.npmjs.com/package/feedland?activeTab=readme">feedland</a>. 

### How to use?

If you want to install a FeedLand server, follow the <a href="https://github.com/scripting/feedlandInstall/blob/main/docs/setup.md">instructions</a> in the feedlandInstall repo.

If you want to build a new server application around FeedLand you can use this package. 

If you want to build around just the database and not the API, you can use the feedlandDatabase NPM package, whose source is in the <a href="https://github.com/scripting/feedland/tree/main/database">feedlandDatabase</a> folder here. 

- ### Scripts

- `scripts/setup.js` &mdash; interactive helper that collects the answers needed for `config.json` (ports, SMTP, MySQL, optional S3/GitHub) and can run `npm install` afterwards. Supply flags to run non-interactively, for example:

  ``
  node scripts/setup.js \
    --non-interactive --port=1452 --domain=localhost:1452 --base-url=http://localhost:1452/ \
    --mysql-host=localhost --mysql-user=feedland --mysql-password=secret --mysql-database=feedland \
    --install-local-mysql --schema=../feedlandInstall/docs/setup.sql
  ``

- `scripts/smoke.sh` &mdash; curl-based smoke test for a running instance. Configure `FEEDLAND_HOST` (and optionally `FEEDLAND_EMAIL`/`FEEDLAND_CODE`).
- `scripts/bench-getriver.js` &mdash; quick latency probe for `/getriver`; set `FEEDLAND_HOST` and `FEEDLAND_BENCH_SCREENNAME`.
- `scripts/run-tests.sh` &mdash; provisioning harness that installs MySQL via Homebrew when needed, creates a timestamped temporary database (for example, `feedland_test_20250308112233`) in `/tmp`, runs `npm test`, and drops the database afterwards. Override MySQL root credentials via `MYSQL_ROOT_USER` / `MYSQL_ROOT_PASS`. Capture output with something like `./scripts/run-tests.sh | tee /tmp/feedland-test.log` if you want a log file.

### This repo is public

It was announced as public in <a href="http://scripting.com/2023/04/24/151114.html">this post</a> on Scripting News on April 24, 2023. 
