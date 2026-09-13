import test from "node:test";
import assert from "node:assert/strict";
import {
  findMediaAssets,
  groupMediaByCollection,
  normalizeMediaSearchText,
} from "../src/utils/mediaSearch.js";

const asset = (id, overrides = {}) => ({
  id,
  filename: `${id}.jpg`,
  status: "ready",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  metadata: { title: { nl: "" }, caption: {}, alt: {}, objectLabel: {}, tags: [] },
  media_asset_usages: [],
  catalog_contexts: [],
  ...overrides,
});

const scarron = asset("scarron", {
  metadata: {
    title: { nl: "Titelprent van Paul Scarron" },
    caption: { nl: "Amsterdam, 1713" },
    alt: { nl: "Gravure uit Oeuvres de Scarron" },
    objectLabel: {},
    tags: ["gravure", "boek"],
  },
  media_asset_usages: [{ consumer_type: "catalog", consumer_id: "book-1", placement: "gallery:1" }],
  catalog_contexts: [{
    item_id: "book-1",
    title: "Oeuvres de Monsieur Scarron",
    author: "Paul Scarron",
    year: "1713",
    collection_group: "books",
    placements: ["gallery:1"],
  }],
});
const portrait = asset("portrait", {
  metadata: { title: { nl: "Portret" }, caption: {}, alt: {}, objectLabel: {}, tags: ["schilderij"] },
  media_asset_usages: [{ consumer_type: "catalog", consumer_id: "art-1", placement: "gallery:1" }],
  catalog_contexts: [{
    item_id: "art-1",
    title: "Portret van een geleerde",
    collection_group: "art",
    placements: ["gallery:1"],
  }],
});
const unused = asset("unused");

test("media search matches multiple terms across metadata and collection context", () => {
  const found = findMediaAssets([portrait, scarron, unused], { query: "Paul 1713" });
  assert.deepEqual(found.map(({ asset: result }) => result.id), ["scarron"]);
});

test("media search is accent and ligature insensitive", () => {
  assert.equal(normalizeMediaSearchText("Œuvres d’Été"), "oeuvres d ete");
  const found = findMediaAssets([scarron], { query: "oeuvres" });
  assert.equal(found[0].asset.id, "scarron");
});

test("scope, collection and work filters do not leak images from another work", () => {
  assert.deepEqual(
    findMediaAssets([portrait, scarron, unused], { scope: "unused" }).map(({ asset: result }) => result.id),
    ["unused"],
  );
  assert.deepEqual(
    findMediaAssets([portrait, scarron], { collectionGroup: "art" }).map(({ asset: result }) => result.id),
    ["portrait"],
  );
  assert.deepEqual(
    findMediaAssets([portrait, scarron], { workId: "book-1" }).map(({ asset: result }) => result.id),
    ["scarron"],
  );
});

test("relevance promotes a title match and grouped view retains each work boundary", () => {
  const titleMatch = asset("title-match", {
    metadata: { title: { nl: "Scarron" }, caption: {}, alt: {}, objectLabel: {}, tags: [] },
  });
  const results = findMediaAssets([scarron, titleMatch], { query: "scarron" });
  assert.equal(results[0].asset.id, "title-match");
  const groups = groupMediaByCollection(findMediaAssets([portrait, scarron, unused], { sort: "collection" }));
  assert.deepEqual(groups.map((group) => group.key), ["art-1", "book-1", "unassigned"]);
});
