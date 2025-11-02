# FeedLand Performance Baselines

#### Template
- Date / environment: …
- Command: `FEEDLAND_HOST=… node scripts/bench-getriver.js`
- Result: … ms
- Notes: dataset size, concurrent load, observed anomalies.

#### 11/01/25; 10:45:25 PM by JES -- Local mock server sanity check
- Date / environment: 11/01/25 local dev; mock HTTP server on 127.0.0.1:18888 serving static JSON (no database)
- Command: `FEEDLAND_HOST=http://127.0.0.1:18888 FEEDLAND_BENCH_SCREENNAME=test node scripts/bench-getriver.js`
- Result: 45.97 ms
- Notes: Validates benchmarking script mechanics only; capture real baseline against staging once feed ingestion data is available.

#### 11/01/25; 10:52:41 PM by JES -- Mock river endpoint with artificial latency
- Date / environment: 11/01/25 local dev; mock `/getriver` responder on 127.0.0.1:18888 delaying 20ms before replying
- Command: `FEEDLAND_HOST=http://127.0.0.1:18888 FEEDLAND_BENCH_SCREENNAME=test node scripts/bench-getriver.js`
- Result: 70.61 ms
- Notes: Confirms bench script captures increased latency; replace with staging results when available.

Populate entries here as benchmarks are collected.
