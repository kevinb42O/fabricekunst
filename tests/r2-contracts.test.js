import test from 'node:test';
import assert from 'node:assert/strict';
import { containsForbiddenImageSource } from '../api/_lib/publicContent.js';
import { createUploadReceipt, verifyUploadReceipt } from '../api/_lib/uploadReceipt.js';
import { classifyProvenanceImageUrl, validateProvenanceShape } from '../api/save-provenance.js';

const metadata = {
  objectKey: 'provenance/hero/123-example.webp',
  contentType: 'image/webp',
  size: 123456,
  userId: 'admin-user-id',
};
const secret = 'unit-test-only-secret';

test('R2 upload receipts bind key, type, size and administrator', () => {
  const receipt = createUploadReceipt(metadata, secret);
  assert.equal(verifyUploadReceipt(receipt, metadata, secret), true);
  assert.equal(verifyUploadReceipt(receipt, { ...metadata, size: metadata.size + 1 }, secret), false);
  assert.equal(verifyUploadReceipt(receipt, { ...metadata, userId: 'another-admin' }, secret), false);
  assert.equal(verifyUploadReceipt(`${receipt}tampered`, metadata, secret), false);
});

test('public snapshots reject base64 and Supabase Storage images', () => {
  assert.equal(containsForbiddenImageSource({ image: 'data:image/png;base64,AAAA' }), true);
  assert.equal(containsForbiddenImageSource({ image: 'https://project.supabase.co/storage/v1/object/public/file.jpg' }), true);
  assert.equal(containsForbiddenImageSource({ image: 'https://pub-example.r2.dev/provenance/hero/file.webp' }), false);
});

test('provenance image policy accepts only this project R2 bucket', () => {
  process.env.R2_PUBLIC_URL = 'https://pub-managed.r2.dev';
  assert.deepEqual(
    classifyProvenanceImageUrl('https://pub-managed.r2.dev/provenance/hero/file.webp'),
    { kind: 'r2', objectKey: 'provenance/hero/file.webp' }
  );
  assert.equal(classifyProvenanceImageUrl('/images/local.jpg'), null);
  assert.equal(classifyProvenanceImageUrl('https://another-bucket.r2.dev/provenance/hero/file.webp'), null);
  assert.equal(classifyProvenanceImageUrl('https://project.supabase.co/storage/v1/object/file.jpg'), null);
});

test('provenance payload guard rejects oversized and deeply nested content', () => {
  assert.doesNotThrow(() => validateProvenanceShape({ hero: { title: 'Valid' } }));
  assert.throws(() => validateProvenanceShape({ title: 'x'.repeat(30_001) }));
  assert.throws(() => validateProvenanceShape({ a: { b: { c: { d: { e: { f: { g: { h: { i: {} } } } } } } } } }));
});
