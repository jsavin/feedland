// Validates saveItem wiring: normalizes fields, omits undefined feedId, and persists via SQL.

const test = require ("node:test");
const assert = require ("node:assert/strict");

const withModuleStubs = require ("../helpers/moduleStubs.js");

withModuleStubs ((stubs) => {
	const database = require ("../../database/database.js");

	test ("saveItem strips undefined feedId and coerces enclosure length", async () => {
		const originalRunSqltext = stubs.davesql.runSqltext;
		const originalEncodeValues = stubs.davesql.encodeValues;
		let encodedRecord;
		stubs.davesql.encodeValues = function (obj) {
			encodedRecord = Object.assign ({}, obj);
			return originalEncodeValues.call (this, obj);
			};

		let capturedSql;
		stubs.davesql.runSqltext = (sql, callback) => {
			capturedSql = sql;
			callback (undefined, {insertId: 101});
			};

		const item = {
			feedUrl: "http://example.com/feed.xml",
			feedId: undefined,
			guid: "guid-1",
			title: "Test item",
			description: "Body",
			enclosureLength: "",
			likes: "",
			pubDate: new Date ("2025-10-31T08:00:00Z"),
			whenCreated: new Date ("2025-10-31T08:00:00Z"),
			whenUpdated: new Date ("2025-10-31T08:00:00Z"),
			metadata: "{}"
			};

		try {
			await new Promise ((resolve, reject) => {
				database.saveItem (item, (err) => {
					if (err) {
						reject (err);
						}
					else {
						resolve ();
						}
					});
				});

			assert.ok (capturedSql.startsWith ("replace into items"), "Expected REPLACE INTO statement");
			assert.equal (item.id, 101, "saveItem should expose insertId on the record");
			assert.equal (item.enclosureLength, 0, "Empty string enclosureLength coerces to numeric zero");
			assert.ok (!Object.prototype.hasOwnProperty.call (encodedRecord, "feedId"), "feedId omitted when undefined");
			assert.equal (encodedRecord.enclosureLength, 0);
			}
		finally {
			stubs.davesql.runSqltext = originalRunSqltext;
			stubs.davesql.encodeValues = originalEncodeValues;
			}
		});
	});
