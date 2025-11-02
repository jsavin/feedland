// Exercises convertDatabaseItem to ensure it normalizes metadata, likes and enclosure fields.

const test = require ("node:test");
const assert = require ("node:assert/strict");

const withModuleStubs = require ("../helpers/moduleStubs.js");

withModuleStubs (() => {
	const database = require ("../../database/database.js");

	test ("convertDatabaseItem normalizes metadata and enclosure values", () => {
		const now = new Date ("2025-10-30T12:00:00Z");
		const itemRec = {
			feedUrl: "http://example.com/feed.xml",
			guid: "guid-1",
			title: "Example <b>title</b>",
			link: "http://example.com/post",
			description: "<p>Hello</p><script>alert(1)</script>",
			id: 42,
			pubDate: now,
			whenCreated: now,
			whenUpdated: now,
			likes: ",davewiner,alice,",
			metadata: "{\"wpPostId\":123}",
			enclosureUrl: "http://example.com/audio.mp3",
			enclosureType: "audio/mpeg",
			enclosureLength: "2048",
			outlineJsontext: "{\"kind\":\"note\"}",
			markdowntext: "**Markdown** body"
			};

		const result = database.convertDatabaseItem (itemRec);

		assert.equal (result.feedUrl, itemRec.feedUrl);
		assert.equal (result.guid, itemRec.guid);
		assert.equal (result.likes.length, 2);
		assert.deepEqual (result.metadata, {wpPostId: 123});
		assert.equal (result.enclosure.url, itemRec.enclosureUrl);
		assert.equal (result.enclosure.type, itemRec.enclosureType);
		assert.equal (result.enclosure.length, 2048);
		assert.ok (Array.isArray (result.likes));
		assert.equal (result.pubDate, now.toUTCString ());
		assert.equal (result.whenReceived, now.toUTCString ());
		assert.equal (result.whenUpdated, now.toUTCString ());
		assert.equal (result.ctLikes, 2);
		assert.equal (result.description, "<p>Hello</p><script>alert(1)</script>");
		});

	test ("convertDatabaseItem handles invalid metadata JSON", () => {
		const itemRec = {
			feedUrl: "http://example.com/feed.xml",
			guid: "guid-2",
			description: "<p>Hi</p>",
			metadata: "not-json",
			likes: "",
			pubDate: undefined,
			whenCreated: undefined,
			whenUpdated: undefined
			};

		const result = database.convertDatabaseItem (itemRec);
		assert.deepEqual (result.metadata, {});
		assert.equal (result.pubDate, undefined);
		assert.equal (result.ctLikes, 0);
		});
	});
