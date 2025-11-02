#!/usr/bin/env node
// Measures the latency of a /getriver request against a running FeedLand instance.
// Usage:
//   FEEDLAND_HOST="http://localhost:1410" node scripts/bench-getriver.js

const {performance} = require("node:perf_hooks");

const host = process.env.FEEDLAND_HOST || "http://localhost:1410";
const screenname = process.env.FEEDLAND_BENCH_SCREENNAME || "test";

async function main () {
	const url = `${host}/getriver?screenname=${encodeURIComponent(screenname)}`;
	const start = performance.now ();
	try {
		const response = await fetch (url);
		if (!response.ok) {
			throw new Error (`HTTP ${response.status}`);
			}
		await response.text (); // drain body
		const elapsed = performance.now () - start;
		console.log (`${url} -> ${elapsed.toFixed (2)} ms`);
		}
	catch (err) {
		console.error (`Failed to benchmark ${url}: ${err.message}`);
		process.exitCode = 1;
		}
	}

main ();
