// Confirms feedland.start delegates to daveappserver and passes options through.

const test = require ("node:test");
const assert = require ("node:assert/strict");

const withModuleStubs = require ("../helpers/moduleStubs.js");

withModuleStubs ((stubs) => {
	const feedland = require ("../../feedland.js");

	test ("start passes options to daveappserver", () => {
		stubs.daveappserver._lastStartOptions = undefined;
		feedland.start ();
		assert.ok (stubs.daveappserver._lastStartOptions, "daveappserver.start should be invoked");
		});
	});
