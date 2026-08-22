import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStructuredData } from '../src/utils/seo.js';

const canonical = 'https://www.atelierrembrandt.com/collectie/test-item';

function catalogItem(price) {
  return {
    id: 'test-item',
    ref: 'TEST-001',
    title: 'Testobject',
    description: 'Beschrijving van het testobject.',
    category: 'old-masters',
    price,
    status: 'Beschikbaar',
    images: [{ url: '/images/test.jpg' }]
  };
}

function productFrom(structuredData) {
  return structuredData['@graph'].find((entry) => entry['@type'] === 'Product');
}

test('priced catalog items publish a Product with a valid Offer', () => {
  const structuredData = buildStructuredData({
    page: 'item',
    item: catalogItem('€ 1.250'),
    canonical
  });

  const product = productFrom(structuredData);
  assert.equal(product?.offers?.price, 1250);
  assert.equal(product?.offers?.priceCurrency, 'EUR');
});

test('price-on-request catalog items do not publish incomplete Product markup', () => {
  const structuredData = buildStructuredData({
    page: 'item',
    item: catalogItem('Prijs op aanvraag'),
    canonical
  });

  assert.equal(productFrom(structuredData), undefined);
  assert.ok(structuredData['@graph'].some((entry) => entry['@type'] === 'WebPage'));
  assert.ok(structuredData['@graph'].some((entry) => entry['@type'] === 'BreadcrumbList'));
});
