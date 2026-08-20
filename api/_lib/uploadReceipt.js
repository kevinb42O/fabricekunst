import { createHmac, timingSafeEqual } from 'node:crypto';

const receiptPayload = ({ objectKey, contentType, size, userId }) => (
  `${objectKey}\n${contentType}\n${size}\n${userId}`
);

export const createUploadReceipt = (metadata, secret) => createHmac('sha256', secret)
  .update(receiptPayload(metadata))
  .digest('base64url');

export const verifyUploadReceipt = (receipt, metadata, secret) => {
  if (typeof receipt !== 'string' || !receipt) return false;
  const expected = createHmac('sha256', secret).update(receiptPayload(metadata)).digest();
  let supplied;
  try { supplied = Buffer.from(receipt, 'base64url'); } catch { return false; }
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
};
