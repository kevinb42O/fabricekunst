import { createHash, randomBytes } from 'node:crypto';

export const PREVIEW_TOKEN_BYTES = 32;
export const PREVIEW_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export const hashPreviewToken = (token) =>
  createHash('sha256').update(String(token), 'utf8').digest('hex');

export const createPreviewToken = () => {
  const token = randomBytes(PREVIEW_TOKEN_BYTES).toString('base64url');
  return { token, tokenHash: hashPreviewToken(token) };
};

export const isValidPreviewToken = (token) =>
  typeof token === 'string' && PREVIEW_TOKEN_PATTERN.test(token);
