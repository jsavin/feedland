// Verifies selected HTTP handlers by capturing the callback registered with daveappserver.

const test = require ("node:test");
const assert = require ("node:assert/strict");

const withModuleStubs = require ("../helpers/moduleStubs.js");

function runRequest (handler, requestOptions) {
	return new Promise ((resolve) => {
		const req = {
			method: requestOptions.method,
			lowerpath: requestOptions.lowerpath,
			params: requestOptions.params || {},
			postBody: requestOptions.postBody,
			httpReturn: function (statusCode, contentType, body, headers) {
				resolve ({statusCode, contentType, body, headers});
				}
			};
		handler (req);
		});
	}

withModuleStubs ((stubs) => {
	const previousDatabase = stubs.feedlanddatabase;
	const previousAppStart = stubs.daveappserver.start;

	stubs.feedlanddatabase = {
		start: function (config, callback) {
			if (callback !== undefined) {
				callback (undefined);
				}
			},
		updateNextFeedIfReady: function () {},
		checkNextReadingListfReady: function () {},
		clearCachedRivers: function () {},
		getFeed: function (url, callback) {
			callback (undefined, {
				feedUrl: url,
				title: "Example title"
				});
			},
		checkOneFeed: function (url, callback) {
			callback (undefined, {url});
			},
		setCategoriesForSubscription: function (_screenname, _url, _jsontext, callback) {
			if (callback !== undefined) {
				callback (undefined, {message: "ok"});
				}
			},
		getFeedSearch: function (_searchfor, callback) {
			callback (undefined, []);
			},
		getUserInfo: function (screenname, callback) {
			callback (undefined, {screenname});
			},
		getFeedItems: function (url, maxItems, callback) {
			callback (undefined, [{feedUrl: url, guid: "g1"}]);
			}
		};

	stubs.daveappserver.start = function (options, callback) {
		stubs.daveappserver._lastStartOptions = options;
		if (callback !== undefined) {
			callback ({database: {}});
			}
		};

	delete require.cache[require.resolve("../../feedland.js")];
	const feedland = require ("../../feedland.js");
	feedland.start ();
	const handler = stubs.daveappserver._lastStartOptions.httpRequest;

	test ("GET /getfeed returns JSON feed info", async () => {
		const response = await runRequest (handler, {
			method: "GET",
			lowerpath: "/getfeed",
			params: {
				url: "http://example.com/feed.xml"
				}
			});
		assert.equal (response.statusCode, 200);
		assert.equal (response.contentType, "application/json");
		const parsed = JSON.parse (response.body);
		assert.equal (parsed.feedUrl, "http://example.com/feed.xml");
		assert.equal (parsed.title, "Example title");
		});

	test ("GET /getfeeditems returns array", async () => {
		const response = await runRequest (handler, {
			method: "GET",
			lowerpath: "/getfeeditems",
			params: {
				url: "http://example.com/feed.xml",
				maxItems: "5"
				}
			});
		assert.equal (response.statusCode, 200);
		const parsed = JSON.parse (response.body);
		assert.ok (Array.isArray (parsed));
		assert.equal (parsed[0].guid, "g1");
		});

	test.after (() => {
		stubs.feedlanddatabase = previousDatabase;
		stubs.daveappserver.start = previousAppStart;
		delete require.cache[require.resolve("../../feedland.js")];
		});
	});
