import {
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { getR2Client, PUBLIC_CONTENT_POINTER_KEY } from "./r2.js";
import { publishedRembrandtProject } from "../../src/utils/rembrandtProject.js";
import { cloneDefaultRembrandtProject } from "../../src/data/defaultRembrandtProject.js";
import { readRembrandtProjectAccess } from "./rembrandtProjectAccess.js";

const parseSetting = (row, fallback = null) => {
  if (!row?.value) return fallback;
  if (typeof row.value !== "string") return row.value;
  try {
    return JSON.parse(row.value);
  } catch {
    return row.value;
  }
};

export const containsForbiddenImageSource = (value) => {
  const serialized = JSON.stringify(value);
  return (
    serialized.includes("data:image/") ||
    serialized.includes(".supabase.co/storage/")
  );
};

export const buildPublicContentSnapshot = async (supabase) => {
  const [
    { data: items, error: itemsError },
    { data: settings, error: settingsError },
  ] = await Promise.all([
    supabase.from("items").select("*").order("created_at", { ascending: true }),
    supabase
      .from("admin_settings")
      .select("key, value, updated_at")
      .or(
        "key.like.item_ext_%,key.eq.hero_image,key.eq.mobile_hero_image,key.eq.herkomst_page_data,key.eq.faq_items,key.eq.rembrandt_project_data",
      ),
  ]);
  if (itemsError) throw itemsError;
  if (settingsError) throw settingsError;

  const byKey = new Map((settings || []).map((row) => [row.key, row]));
  const storedRembrandtProject = parseSetting(
    byKey.get("rembrandt_project_data"),
  );
  const rembrandtProject = publishedRembrandtProject(
    storedRembrandtProject || {
      ...cloneDefaultRembrandtProject(),
      isEnabled: false,
    },
  );
  const publicRembrandtProject = rembrandtProject.isEnabled === true
    ? rembrandtProject
    : { isEnabled: false };
  const catalog = (items || []).map((item) => {
    const extension = parseSetting(byKey.get(`item_ext_${item.id}`));
    return extension && typeof extension === "object"
      ? { ...item, ...extension }
      : item;
  });
  const snapshot = {
    schemaVersion: 2,
    publishedAt: new Date().toISOString(),
    catalog,
    heroImage: parseSetting(byKey.get("hero_image")),
    mobileHeroImage: parseSetting(byKey.get("mobile_hero_image")),
    provenanceData: parseSetting(byKey.get("herkomst_page_data")),
    faqItems: parseSetting(byKey.get("faq_items")),
    rembrandtProject: publicRembrandtProject,
  };
  if (containsForbiddenImageSource(snapshot)) {
    throw new Error("Public content contains a forbidden image source");
  }
  return snapshot;
};

const prunePublicContentVersions = async (r2, currentKey, keepHistory) => {
  let continuationToken;
  const versions = [];
  do {
    const page = await r2.send(new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
      Prefix: "site-data/public-content-",
      ContinuationToken: continuationToken,
    }));
    versions.push(...(page.Contents || []));
    continuationToken = page.NextContinuationToken;
  } while (continuationToken);

  const previous = versions
    .filter((entry) => entry.Key && entry.Key !== currentKey)
    .sort((a, b) => new Date(b.LastModified || 0) - new Date(a.LastModified || 0));
  const stale = keepHistory ? previous.slice(4) : previous;
  for (let index = 0; index < stale.length; index += 1000) {
    await r2.send(new DeleteObjectsCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Delete: {
        Objects: stale.slice(index, index + 1000).map(({ Key }) => ({ Key })),
        Quiet: true,
      },
    }));
  }
};

export const publishPublicContentSnapshot = async (
  supabase,
  { includeRembrandtProject } = {},
) => {
  const r2 = getR2Client();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let currentEtag = null;
    try {
      const current = await r2.send(
        new HeadObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: PUBLIC_CONTENT_POINTER_KEY,
        }),
      );
      currentEtag = current.ETag;
    } catch (error) {
      if (
        error?.$metadata?.httpStatusCode !== 404 &&
        error?.name !== "NotFound"
      )
        throw error;
    }

    const builtSnapshot = await buildPublicContentSnapshot(supabase);
    const includeProject = typeof includeRembrandtProject === "boolean"
      ? includeRembrandtProject
      : (await readRembrandtProjectAccess()).enabled === true;
    const snapshot = includeProject
      ? builtSnapshot
      : { ...builtSnapshot, rembrandtProject: { isEnabled: false } };
    const serialized = JSON.stringify(snapshot);
    const versionKey = `site-data/public-content-${Date.now()}-${randomUUID()}.json`;
    const pointer = JSON.stringify({
      schemaVersion: 2,
      key: versionKey,
      publishedAt: snapshot.publishedAt,
    });

    // Write the immutable payload first. The pointer uses compare-and-swap so
    // concurrent administrator saves cannot overwrite a newer publication.
    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: versionKey,
        Body: serialized,
        ContentType: "application/json; charset=utf-8",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    try {
      await r2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: PUBLIC_CONTENT_POINTER_KEY,
          Body: pointer,
          ContentType: "application/json; charset=utf-8",
          CacheControl: "no-cache",
          ...(currentEtag ? { IfMatch: currentEtag } : { IfNoneMatch: "*" }),
        }),
      );
      await prunePublicContentVersions(r2, versionKey, includeProject).catch((error) => {
        console.warn("Old public content versions could not be pruned:", error.message);
      });
      return { snapshot, bytes: Buffer.byteLength(serialized), versionKey };
    } catch (error) {
      if (
        ![409, 412].includes(error?.$metadata?.httpStatusCode) ||
        attempt === 2
      )
        throw error;
    }
  }
  throw new Error("Public content pointer could not be updated safely");
};
