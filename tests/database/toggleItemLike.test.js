// Covers toggleItemLike flows for adding and removing likes without touching live services.

const test = require ("node:test");
const assert = require ("node:assert/strict");

const withModuleStubs = require ("../helpers/moduleStubs.js");

withModuleStubs ((stubs) => {
	const database = require ("../../database/database.js");

	function buildItemRec (overrides={}) {
		return Object.assign ({
			id: 25,
			feedUrl: "http://example.com/feed.xml",
			guid: "guid-25",
			title: "Sample",
			link: "http://example.com/post",
			description: "Body",
			pubDate: new Date ("2025-10-31T08:00:00Z"),
			whenCreated: new Date ("2025-10-31T08:00:00Z"),
			whenUpdated: new Date ("2025-10-31T08:00:00Z"),
			likes: "",
			metadata: "{}"
			}, overrides);
		}

	test ("toggleItemLike adds the caller when not yet liked", async () => {
		const originalRunSqltext = stubs.davesql.runSqltext;
		const originalEncodeValues = stubs.davesql.encodeValues;

		const existingItem = buildItemRec ({likes: ",alice,"});
		let capturedItemRecord;
		let likesOperations = [];

		stubs.davesql.encodeValues = function (obj) {
			if (Object.prototype.hasOwnProperty.call (obj, "feedUrl")) {
				capturedItemRecord = Object.assign ({}, obj);
				}
			return originalEncodeValues.call (this, obj);
			};

		stubs.davesql.runSqltext = (sql, callback) => {
			if (sql.startsWith ("select * from items")) {
				callback (undefined, [Object.assign ({}, existingItem)]);
				return;
				}
			if (sql.startsWith ("replace into items")) {
				callback (undefined, {insertId: existingItem.id});
				return;
				}
			if (sql.startsWith ("replace into likes")) {
				likesOperations.push ("add");
				callback (undefined, {});
				return;
				}
			callback (undefined, []);
			};

		try {
			const result = await new Promise ((resolve, reject) => {
				database.toggleItemLike ("bob", existingItem.id, (err, data) => {
					if (err) {
						reject (err);
						}
					else {
						resolve (data);
						}
					});
				});

			assert.deepEqual (result.likes.sort (), ["alice", "bob"]);
			assert.equal (result.ctLikes, 2);
			assert.equal (capturedItemRecord.likes, ",alice,bob,");
			assert.equal (capturedItemRecord.ctLikes, 2);
			assert.deepEqual (likesOperations, ["add"]);
			}
		finally {
			stubs.davesql.runSqltext = originalRunSqltext;
			stubs.davesql.encodeValues = originalEncodeValues;
			}
		});

	test ("toggleItemLike removes the caller when already liked", async () => {
		const originalRunSqltext = stubs.davesql.runSqltext;
		const originalEncodeValues = stubs.davesql.encodeValues;

		const existingItem = buildItemRec ({likes: ",alice,bob,"});
		let capturedItemRecord;
		let likesOperations = [];

		stubs.davesql.encodeValues = function (obj) {
			if (Object.prototype.hasOwnProperty.call (obj, "feedUrl")) {
				capturedItemRecord = Object.assign ({}, obj);
				}
			return originalEncodeValues.call (this, obj);
			};

		stubs.davesql.runSqltext = (sql, callback) => {
			if (sql.startsWith ("select * from items")) {
				callback (undefined, [Object.assign ({}, existingItem)]);
				return;
				}
			if (sql.startsWith ("replace into items")) {
				callback (undefined, {insertId: existingItem.id});
				return;
				}
			if (sql.startsWith ("delete from likes")) {
				likesOperations.push ("remove");
				callback (undefined, {});
				return;
				}
			callback (undefined, []);
			};

		try {
			const result = await new Promise ((resolve, reject) => {
				database.toggleItemLike ("bob", existingItem.id, (err, data) => {
					if (err) {
						reject (err);
						}
					else {
						resolve (data);
						}
					});
				});

			assert.deepEqual (result.likes, ["alice"]);
			assert.equal (result.ctLikes, 1);
			assert.equal (capturedItemRecord.likes, ",alice,");
			assert.equal (capturedItemRecord.ctLikes, 1);
			assert.deepEqual (likesOperations, ["remove"]);
			}
		finally {
			stubs.davesql.runSqltext = originalRunSqltext;
			stubs.davesql.encodeValues = originalEncodeValues;
			}
		});
	});
