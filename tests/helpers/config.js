// Shared configuration used by tests so they never touch production endpoints.

const config = {
	urlForFeeds: "http://localhost:1410/feeds/",
	urlFeedlandApp: "http://localhost:1410/",
	urlStarterFeeds: "http://localhost:1410/starterfeeds.opml"
	};

module.exports = config;
