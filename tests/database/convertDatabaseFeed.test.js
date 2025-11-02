// Validates convertDatabaseFeed formatting and date handling for feed records.

const test = require ("node:test");
const assert = require ("node:assert/strict");

const withModuleStubs = require ("../helpers/moduleStubs.js");

withModuleStubs (() => {
	const database = require ("../../database/database.js");

	test ("convertDatabaseFeed returns normalized feed structure", () => {
		const now = new Date ("2025-10-30T08:00:00Z");
		const feedRec = {
			feedUrl: "http://example.com/feed.xml",
			feedId: 99,
			title: "Example",
			htmlUrl: "http://example.com/",
			description: "<p>Desc</p>",
			pubDate: now,
			whenCreated: now,
			whenUpdated: now,
			ctItems: 10,
			whoFirstSubscribed: "alice",
			ctSubs: 5,
			ctSecs: 1.2,
			ctErrors: 0,
			ctConsecutiveErrors: 0,
			errorString: "",
			whenChecked: now,
			ctChecks: 3,
			whenLastError: now,
			urlCloudServer: "http://rsscloud",
			whenLastCloudRenew: now,
			ctCloudRenews: 2,
			copyright: "Copyright",
			generator: "Generator",
			language: "en",
			twitterAccount: "@example",
			managingEditor: "me@example.com",
			webMaster: "web@example.com",
			lastBuildDate: now,
			docs: "http://docs",
			ttl: 60,
			imageUrl: "http://example.com/image.png",
			imageTitle: "Image",
			imageLink: "http://example.com/",
			imageWidth: 144,
			imageHeight: 168,
			imageDescription: "The image"
			};

		const result = database.convertDatabaseFeed (feedRec);
		assert.equal (result.feedUrl, feedRec.feedUrl);
		assert.equal (result.feedId, feedRec.feedId);
		assert.equal (result.title, feedRec.title);
		assert.equal (result.link, feedRec.htmlUrl);
		assert.equal (result.description, feedRec.description);
		assert.equal (result.pubDate, now.toUTCString ());
		assert.equal (result.whenUpdated, now.toUTCString ());
		assert.equal (result.ctItems, 10);
		assert.equal (result.ctSubs, 5);
		assert.equal (result.ctChecks, 3);
		assert.equal (result.urlCloudServer, feedRec.urlCloudServer);
		assert.equal (result.imageUrl, feedRec.imageUrl);
		});
	});
