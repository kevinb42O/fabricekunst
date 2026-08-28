import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { INITIAL_CATALOG } from "../src/data/initialCatalog.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readLocalEnv() {
  const values = {};
  for (const filename of [".env", ".env.local"]) {
    const envPath = path.resolve(__dirname, `../${filename}`);
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator < 1) continue;
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed
        .slice(separator + 1)
        .trim()
        .replace(/^(['"])(.*)\1$/, "$2");
      values[key] = value;
    }
  }
  return values;
}

export async function loadCatalogForBuild() {
  const localEnv = readLocalEnv();
  const r2PublicUrl = process.env.R2_PUBLIC_URL || localEnv.R2_PUBLIC_URL;

  if (r2PublicUrl) {
    try {
      const baseUrl = r2PublicUrl.replace(/\/$/, "");
      const pointerResponse = await fetch(`${baseUrl}/site-data/current.json`, {
        headers: { Accept: "application/json" },
      });
      if (!pointerResponse.ok)
        throw new Error(`pointer request returned ${pointerResponse.status}`);
      const pointer = await pointerResponse.json();
      if (
        pointer?.schemaVersion !== 2 ||
        typeof pointer?.key !== "string" ||
        !/^site-data\/public-content-[a-zA-Z0-9-]+\.json$/.test(pointer.key) ||
        pointer.key.includes("..")
      ) {
        throw new Error("pointer contains an invalid snapshot key");
      }
      const snapshotResponse = await fetch(`${baseUrl}/${pointer.key}`, {
        headers: { Accept: "application/json" },
      });
      if (!snapshotResponse.ok)
        throw new Error(`snapshot request returned ${snapshotResponse.status}`);
      const snapshot = await snapshotResponse.json();
      if (
        snapshot?.schemaVersion === 2 &&
        Array.isArray(snapshot?.catalog) &&
        snapshot.catalog.length
      ) {
        return {
          items: snapshot.catalog,
          project: snapshot.rembrandtProject || null,
          snapshot,
          source: "R2 public snapshot",
        };
      }
    } catch (error) {
      console.warn(`R2 catalog fetch warning: ${error.message}`);
    }
  }

  return {
    items: INITIAL_CATALOG,
    project: null,
    snapshot: null,
    source: "initial catalog fallback",
  };
}
