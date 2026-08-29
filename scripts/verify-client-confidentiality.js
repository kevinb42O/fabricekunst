import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_REMBRANDT_PROJECT } from "../src/data/defaultRembrandtProject.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetsDirectory = path.join(root, "dist", "assets");
const sentinels = [
  DEFAULT_REMBRANDT_PROJECT.settings.summary.nl,
  ...DEFAULT_REMBRANDT_PROJECT.updates.slice(0, 3).map((update) => update.title.nl),
];

const leakingFiles = fs.readdirSync(assetsDirectory)
  .filter((name) => name.endsWith(".js"))
  .filter((name) => {
    const contents = fs.readFileSync(path.join(assetsDirectory, name), "utf8");
    return sentinels.some((sentinel) => sentinel && contents.includes(sentinel));
  });

if (leakingFiles.length) {
  throw new Error(`Private Rembrandt Project seed leaked into browser bundles: ${leakingFiles.join(", ")}`);
}

console.log("Verified: private Rembrandt Project seed is absent from browser bundles.");
