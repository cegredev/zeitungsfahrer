const { join } = require("path");

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
	// Changes the cache location for Puppeteer.
	cacheDirectory: process.env.CHANGE_PUPPETEER_DIR ? join(__dirname, ".cache", "puppeteer") : undefined,
};
