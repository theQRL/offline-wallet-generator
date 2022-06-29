const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.resolve("dist", "index.html"), "utf8");

var pattern = /<script defer="defer" type="module".*?>(.+?)\s/g;

let cleaned = html.replace(pattern, '<script ');
cleaned = html.replace(' nomodule', '');

fs.writeFileSync(path.resolve("dist", "offline.html"), cleaned);
