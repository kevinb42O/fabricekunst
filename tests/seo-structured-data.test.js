import test from "node:test";
import assert from "node:assert/strict";
import { buildPageSeo, buildStructuredData } from "../src/utils/seo.js";
import { cloneDefaultRembrandtProject } from "../src/data/defaultRembrandtProject.js";

const canonical = "https://www.atelierrembrandt.com/collectie/test-item";

function catalogItem(price) {
  return {
    id: "test-item",
    ref: "TEST-001",
    title: "Testobject",
    description: "Beschrijving van het testobject.",
    category: "old-masters",
    price,
    status: "Beschikbaar",
    images: [{ url: "/images/test.jpg" }],
  };
}

function productFrom(structuredData) {
  return structuredData["@graph"].find((entry) => entry["@type"] === "Product");
}

test("priced catalog items publish a Product with a valid Offer", () => {
  const structuredData = buildStructuredData({
    page: "item",
    item: catalogItem("€ 1.250"),
    canonical,
  });

  const product = productFrom(structuredData);
  assert.equal(product?.offers?.price, 1250);
  assert.equal(product?.offers?.priceCurrency, "EUR");
});

test("price-on-request catalog items do not publish incomplete Product markup", () => {
  const structuredData = buildStructuredData({
    page: "item",
    item: catalogItem("Prijs op aanvraag"),
    canonical,
  });

  assert.equal(productFrom(structuredData), undefined);
  assert.ok(
    structuredData["@graph"].some((entry) => entry["@type"] === "WebPage"),
  );
  assert.ok(
    structuredData["@graph"].some(
      (entry) => entry["@type"] === "BreadcrumbList",
    ),
  );
});

test("The Rembrandt Project publishes an AboutPage with only public research updates", () => {
  const project = cloneDefaultRembrandtProject();
  project.updates.push({
    ...project.updates[0],
    id: "private-draft",
    slug: "private-draft",
    status: "draft",
  });
  const structuredData = buildStructuredData({
    page: "rembrandtProject",
    canonical: "https://www.atelierrembrandt.com/rembrandt-project",
    projectData: project,
  });

  const page = structuredData["@graph"].find(
    (entry) => entry["@type"] === "AboutPage",
  );
  const updates = structuredData["@graph"].find((entry) =>
    entry["@id"]?.endsWith("#research-updates"),
  );
  assert.equal(page?.name, "The Rembrandt Project");
  assert.equal(updates?.numberOfItems, project.updates.length - 1);
  assert.ok(
    updates?.itemListElement.every(
      (entry) => entry.item["@type"] === "Article",
    ),
  );
});

test("a disabled Rembrandt Project publishes no research structured data", () => {
  const project = cloneDefaultRembrandtProject();
  project.isEnabled = false;
  const structuredData = buildStructuredData({
    page: "rembrandtProject",
    canonical: "https://www.atelierrembrandt.com/rembrandt-project",
    projectData: project,
  });
  assert.ok(
    !structuredData["@graph"].some((entry) => entry["@type"] === "AboutPage"),
  );
  assert.ok(
    !structuredData["@graph"].some((entry) =>
      entry["@id"]?.endsWith("#research-updates"),
    ),
  );
});

test("a private Rembrandt preview is always noindex", () => {
  const project = cloneDefaultRembrandtProject();
  const seo = buildPageSeo({
    page: "rembrandtProject",
    pathname: "/rembrandt-project/preview",
    projectData: project,
  });
  assert.equal(seo.robots, "noindex, nofollow");
  assert.equal(seo.canonical, "https://www.atelierrembrandt.com/rembrandt-project");
});
