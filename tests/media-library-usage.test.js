import test from "node:test";
import assert from "node:assert/strict";
import { isHistoricalMediaUsage } from "../api/_lib/mediaLibrary.js";

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
