const { join, dirname } = require("path");
const { fileURLToPath } = require("url");

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
	// Changes the cache location for Puppeteer.
	cacheDirectory: join(__dirname, ".cache", "puppeteer"),
};
