// Test helper that intercepts module loading to provide lightweight stubs for
// Dave-owned packages and other dependencies that expect production services.
// Each test suite calls `withModuleStubs` to install the stubs temporarily.

const Module = require("module");

const STUBS = {
	marked: () => "",
	request: (_options, callback) => {
		if (typeof _options === "function") {
			callback = _options;
		}
		if (callback) {
			callback(undefined, {statusCode: 200}, "{}");
		}
	},
	"sanitize-html": (dirty, options={}) => {
		if (dirty === undefined || dirty === null) {
			return "";
		}
		const allowed = options.allowedTags || [];
		return dirty.toString().replace(/<[^>]+>/g, (tag) => {
			const name = tag.replace(/<\/?/, "").split(/\s+/)[0].toLowerCase();
			return allowed.includes(name) ? tag : "";
		});
	},
	md5: (s) => `md5-${s}`,
	daveutils: new Proxy({}, {
		get: (_target, prop) => {
			if (prop === "jsonStringify") {
				return JSON.stringify;
			}
			if (prop === "trimWhitespace") {
				return (s) => (s === undefined || s === null) ? "" : s.toString().trim();
			}
			if (prop === "filledString") {
				return (char, count) => new Array(count + 1).join(char);
			}
			if (prop === "gigabyteString") {
				return () => "0 GB";
			}
			if (prop === "maxStringLength") {
				return (s, max) => {
					if (s === undefined || s === null) {
						return s;
					}
					const str = s.toString();
					return (str.length > max) ? str.slice(0, max) : str;
				};
			}
			if (prop === "jsonConcat") {
				return (a, b) => Object.assign({}, a, b);
			}
			if (prop === "secondsSince") {
				return () => 0;
			}
			if (prop === "stringLower") {
				return (s) => (s === undefined || s === null) ? s : s.toString().toLowerCase();
			}
			if (prop === "padWithZeros") {
				return (n, count) => String(n).padStart(count, "0");
			}
			if (prop === "dateYesterday") {
				return () => new Date(Date.now() - 86400000);
			}
			if (prop === "multipleReplaceAll") {
				return (s) => s;
			}
			if (prop === "getBoolean") {
				return (value) => Boolean(value);
			}
			return () => {};
		}
	}),
	daverss: {},
	daves3: {},
	davesql: {
		start: (_config, callback) => {
			if (callback) {
				callback();
			}
		},
		runSqltext: (_sql, callback) => {
			if (callback) {
				callback(undefined, []);
			}
		}
	},
	feedlanddatabase: {
		start: (_config, callback) => {
			if (callback) {
				callback();
			}
		}
	},
	davetwitter: {},
	daveappserver: {
		_lastStartOptions: undefined,
		start: (options, callback) => {
			STUBS.daveappserver._lastStartOptions = options;
			if (callback) {
				callback({
					database: {}
				});
			}
		},
		getStats: () => ({}),
		saveStats: () => {},
		writeWholeFile: (_screenname, _relpath, _text, callback) => {
			if (callback) {
				callback();
			}
		},
		readWholeFile: (_screenname, _relpath, callback) => {
			if (callback) {
				callback({message: "not implemented"});
			}
		},
		getConfig: () => ({})
	},
	opml: {},
	reallysimple: {
		setConfig: () => {}
	},
	davegithub: {},
	feedhunter: {
		huntForFeed: (_url, _options, callback) => {
			if (callback) {
				callback(undefined);
			}
		}
	},
	wpidentity: {},
	sqllog: {},
	xml2js: {
		Parser: function () {
			this.parseString = (xml, callback) => {
				if (callback) {
					callback(undefined, {xml});
				}
			};
		}
	}
};

function withModuleStubs(callback) {
	const originalLoad = Module._load;
	Module._load = function (request, parent, isMain) {
		if (Object.prototype.hasOwnProperty.call(STUBS, request)) {
			return STUBS[request];
		}
		return originalLoad.call(this, request, parent, isMain);
	};
	try {
		return callback(STUBS);
	}
	finally {
		Module._load = originalLoad;
	}
}

withModuleStubs.STUBS = STUBS;

module.exports = withModuleStubs;
