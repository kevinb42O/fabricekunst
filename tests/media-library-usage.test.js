import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCatalogContexts,
  isHistoricalMediaUsage,
} from "../api/_lib/mediaLibrary.js";

test("only retained Provenance publication revisions are historical media usages", () => {
  assert.equal(
    isHistoricalMediaUsage({
      consumer_type: "provenance",
      consumer_id: "revision:abc",
    }),
    true,
  );
  assert.equal(
    isHistoricalMediaUsage({
      consumer_type: "provenance",
      consumer_id: "main:live",
    }),
    false,
  );
  assert.equal(
    isHistoricalMediaUsage({
      consumer_type: "provenance",
      consumer_id: "main:draft",
    }),
    false,
  );
  assert.equal(
    isHistoricalMediaUsage({ consumer_type: "catalog", consumer_id: "item-1" }),
    false,
  );
});

test("catalog media contexts show the extended work title and retain all placements", () => {
  const contexts = buildCatalogContexts(
    [
      { asset_id: "media-1", consumer_type: "catalog", consumer_id: "work-1", placement: "gallery:1" },
      { asset_id: "media-1", consumer_type: "catalog", consumer_id: "work-1", placement: "gallery:2" },
    ],
    [{ id: "work-1", title: "Basisnaam", collection_group: "books" }],
    [{ key: "item_ext_work-1", value: JSON.stringify({ title: "Uitgebreide werknaam", author: "Auteur" }) }],
  );
  assert.deepEqual(contexts.get("media-1"), [{
    item_id: "work-1",
    title: "Uitgebreide werknaam",
    title_en: "",
    title_fr: "",
    author: "Auteur",
    year: "",
    item_type: "",
    collection_group: "books",
    placements: ["gallery:1", "gallery:2"],
  }]);
});
