// Right now the source template has no text placeholders — all the dynamic
// data lives inside the generated SVGs (assets/*.svg), referenced by a
// relative path that doesn't change. So "building" README.md is just a copy
// of readme.source.md.
//
// If you later want to interpolate live numbers directly into the markdown
// text (not just inside the SVGs), add {{PLACEHOLDER}} tokens to
// readme.source.md and .replace() them here before writing README.md.
import fs from "node:fs";

const source = fs.readFileSync("readme.source.md", "utf8");
fs.writeFileSync("README.md", source, "utf8");
console.log("Wrote README.md from readme.source.md");
