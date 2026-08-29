import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import {
  getR2Client,
  REMBRANDT_PROJECT_ACCESS_KEY,
  streamToString,
} from './r2.js';

const ACCESS_CACHE_CONTROL = 'no-store, max-age=0';

export const hiddenProjectAccess = () => ({
  schemaVersion: 1,
  enabled: false,
  updatedAt: null,
});

export const normalizeProjectAccess = (value) => ({
  schemaVersion: 1,
  enabled: value?.schemaVersion === 1 && value?.enabled === true,
  updatedAt: typeof value?.updatedAt === 'string' ? value.updatedAt : null,
});

export async function readRembrandtProjectAccess() {
  try {
    const object = await getR2Client().send(new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: REMBRANDT_PROJECT_ACCESS_KEY,
    }));
    const parsed = JSON.parse(await streamToString(object.Body));
    return normalizeProjectAccess(parsed);
  } catch (error) {
    if (
      error?.$metadata?.httpStatusCode !== 404 &&
      error?.name !== 'NotFound' &&
      error?.name !== 'NoSuchKey'
    ) {
      console.error('Project access state read failed:', error);
    }
    return hiddenProjectAccess();
  }
}

export async function writeRembrandtProjectAccess(enabled, updatedAt = new Date().toISOString()) {
  const access = normalizeProjectAccess({ schemaVersion: 1, enabled, updatedAt });
  await getR2Client().send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: REMBRANDT_PROJECT_ACCESS_KEY,
    Body: JSON.stringify(access),
    ContentType: 'application/json; charset=utf-8',
    CacheControl: ACCESS_CACHE_CONTROL,
  }));
  return access;
}

export const redactHiddenRembrandtProject = (snapshot, access) => ({
  ...snapshot,
  rembrandtProject:
    access?.enabled === true && snapshot?.rembrandtProject?.isEnabled === true
      ? snapshot.rembrandtProject
      : { isEnabled: false },
});
