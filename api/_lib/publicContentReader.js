import { GetObjectCommand } from "@aws-sdk/client-s3";
import {
  getR2Client,
  PUBLIC_CONTENT_POINTER_KEY,
  streamToString,
} from "./r2.js";

const MAX_SNAPSHOT_BYTES = 10 * 1024 * 1024;
const SNAPSHOT_KEY_PATTERN = /^site-data\/public-content-[a-zA-Z0-9-]+\.json$/;

export const isValidPublicContentKey = (key) =>
  typeof key === "string" &&
  SNAPSHOT_KEY_PATTERN.test(key) &&
  !key.includes("..");

export async function readPublicContentSnapshot() {
  const r2 = getR2Client();
  const pointerObject = await r2.send(
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: PUBLIC_CONTENT_POINTER_KEY,
    }),
  );
  const pointer = JSON.parse(await streamToString(pointerObject.Body));
  if (pointer?.schemaVersion !== 2 || !isValidPublicContentKey(pointer.key)) {
    throw new Error("Invalid R2 public content pointer");
  }

  const snapshotObject = await r2.send(
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: pointer.key,
    }),
  );
  if (Number(snapshotObject.ContentLength || 0) > MAX_SNAPSHOT_BYTES) {
    throw new Error("R2 public content snapshot is too large");
  }
  const serialized = await streamToString(snapshotObject.Body);
  if (Buffer.byteLength(serialized) > MAX_SNAPSHOT_BYTES) {
    throw new Error("R2 public content snapshot is too large");
  }
  const snapshot = JSON.parse(serialized);
  if (snapshot?.schemaVersion !== 2 || !Array.isArray(snapshot.catalog)) {
    throw new Error("Invalid R2 public content snapshot");
  }
  return { pointer, snapshot, serialized };
}
