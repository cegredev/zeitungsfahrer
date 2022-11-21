const { join } = require("path");
const env = require("ckey");

console.log("own env:", env);
console.log("process.env", process.env);

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
	// Changes the cache location for Puppeteer.
	cacheDirectory: env.CHANGE_PUPPETEER_DIR ? join(__dirname, ".cache", "puppeteer") : undefined,
};
