import fs = require("node:fs");

export const readmeExists = fs.existsSync("README.md");

