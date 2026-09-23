import test from "node:test";
import assert from "node:assert/strict";
import {
  createReceipt,
  hasAllowedOrigin,
  matchesAttachmentSignature,
  paintingSubmissionObjectKey,
  readReceipt,
  validateAttachments,
} from "../api/_lib/paintingSubmissionsEndpoint.js";

const originalSalt = process.env.INQUIRY_RATE_LIMIT_SALT;

test.beforeEach(() => {
  process.env.INQUIRY_RATE_LIMIT_SALT = "quality-audit-secret-that-is-longer-than-thirty-two-bytes";
});

test("painting attachments must match their declared file signature", () => {
  assert.equal(matchesAttachmentSignature('image/jpeg', Buffer.from([0xff, 0xd8, 0xff, 0xdb])), true);
  assert.equal(matchesAttachmentSignature('image/png', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), true);
  assert.equal(matchesAttachmentSignature('image/webp', Buffer.from('RIFF0000WEBP')), true);
  assert.equal(matchesAttachmentSignature('application/pdf', Buffer.from('%PDF-1.7')), true);
  assert.equal(matchesAttachmentSignature('image/jpeg', Buffer.from('<html>')), false);
  assert.equal(matchesAttachmentSignature('application/pdf', Buffer.from('not a pdf')), false);
});

test.after(() => {
  if (originalSalt === undefined) delete process.env.INQUIRY_RATE_LIMIT_SALT;
  else process.env.INQUIRY_RATE_LIMIT_SALT = originalSalt;
});

const attachment = (overrides = {}) => {
  const payload = {
    uploadId: "11111111-1111-4111-8111-111111111111",
    path: "pending/2026-09-07/11111111-1111-4111-8111-111111111111/photo.jpg",
    filename: "photo.jpg",
    contentType: "image/jpeg",
    size: 1024,
    expiresAt: Date.now() + 60_000,
    ...overrides,
  };
  return {
    uploadId: payload.uploadId,
    path: payload.path,
    receipt: createReceipt(payload),
  };
};

test("painting upload receipts reject tampering, expiry and duplicate paths", () => {
  const valid = attachment();
  assert.equal(readReceipt(valid.receipt)?.path, valid.path);
  assert.equal(validateAttachments([valid])?.[0]?.storage, 'r2');
  assert.equal(validateAttachments([valid, valid]), null);
  assert.equal(readReceipt(`${valid.receipt}x`), null);
  assert.equal(readReceipt(attachment({ expiresAt: Date.now() - 1 }).receipt), null);
  const validWithWrongId = { ...valid, uploadId: "22222222-2222-4222-8222-222222222222" };
  assert.equal(validateAttachments([validWithWrongId]), null);
});

test("painting attachments resolve only inside the private R2 prefix", () => {
  assert.equal(
    paintingSubmissionObjectKey("pending/2026-09-07/11111111-1111-4111-8111-111111111111/photo.jpg"),
    "painting-submissions/pending/2026-09-07/11111111-1111-4111-8111-111111111111/photo.jpg",
  );
  assert.equal(paintingSubmissionObjectKey("../catalog/public.jpg"), null);
  assert.equal(paintingSubmissionObjectKey("catalog/public.jpg"), null);
});

test("painting attachment receipts enforce type and combined size limits", () => {
  assert.equal(validateAttachments([attachment({ contentType: "text/html" })]), null);
  assert.equal(validateAttachments([attachment({ size: 16 * 1024 * 1024 })]), null);
  const large = attachment({ size: 14 * 1024 * 1024 });
  const second = attachment({ path: "pending/2026-09-07/22222222-2222-4222-8222-222222222222/photo.jpg", size: 14 * 1024 * 1024 });
  const third = attachment({ path: "pending/2026-09-07/33333333-3333-4333-8333-333333333333/photo.jpg", size: 14 * 1024 * 1024 });
  const fourth = attachment({ path: "pending/2026-09-07/44444444-4444-4444-8444-444444444444/photo.jpg", size: 14 * 1024 * 1024 });
  assert.equal(validateAttachments([large, second, third, fourth]), null);
  assert.equal(validateAttachments([]), null);
});

test("production origin checks allow the deployment host but reject localhost", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousVercelEnv = process.env.VERCEL_ENV;
  const previousAllowed = process.env.INQUIRY_ALLOWED_ORIGINS;
  process.env.NODE_ENV = "production";
  process.env.VERCEL_ENV = "production";
  delete process.env.INQUIRY_ALLOWED_ORIGINS;
  try {
    const request = (origin) => ({
      headers: {
        origin,
        host: "www.atelierrembrandt.com",
      },
    });
    assert.equal(hasAllowedOrigin(request("https://www.atelierrembrandt.com")), true);
    assert.equal(hasAllowedOrigin(request("http://localhost:3000")), false);
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousVercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previousVercelEnv;
    if (previousAllowed === undefined) delete process.env.INQUIRY_ALLOWED_ORIGINS;
    else process.env.INQUIRY_ALLOWED_ORIGINS = previousAllowed;
  }
});
