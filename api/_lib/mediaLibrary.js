import { createHash, randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from "sharp";
import {
  getR2Client,
  getR2SubmissionsBucketName,
  getR2SubmissionsConfigurationError,
} from "./r2.js";
import { createUploadReceipt, verifyUploadReceipt } from "./uploadReceipt.js";
import {
  replaceMediaAssetUsages,
  stageMediaAssetUsages,
} from "./mediaAssetUsage.js";

const TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_BYTES = 20 * 1024 * 1024;
const PRIVATE_CACHE = "private, no-store";
const PUBLIC_CACHE = "public, max-age=31536000, immutable";
const LANGUAGES = ["nl", "en", "fr"];
const CATEGORIES = new Set([
  "artwork",
  "research",
  "document",
  "portrait",
  "interior",
  "context",
  "unconfirmed",
]);

// Publication revisions are immutable historical snapshots, not live page
// dependencies. They remain visible in the audit trail, but must not turn a
// test upload into undeletable R2 data forever.
export const isHistoricalMediaUsage = (usage) =>
  usage?.consumer_type === "provenance" &&
  typeof usage.consumer_id === "string" &&
  usage.consumer_id.startsWith("revision:");

const readMediaUsages = async (supabase, assetId) => {
  const { data, error } = await supabase
    .from("media_asset_usages")
    .select("consumer_type,consumer_id,placement")
    .eq("asset_id", assetId);
  if (error) throw error;
  const historical = (data || []).filter(isHistoricalMediaUsage);
  return {
    historical,
    blocking: (data || []).filter((usage) => !isHistoricalMediaUsage(usage)),
  };
};

const deleteR2Objects = async (r2, bucket, keys) => {
  if (!keys.length) return;
  const result = await r2.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
    }),
  );
  if (result.Errors?.length)
    throw new Error(
      "Een of meer publieke R2-varianten konden niet worden verwijderd.",
    );
};

const deleteR2Prefix = async (r2, bucket, prefix) => {
  let continuationToken;
  do {
    const page = await r2.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );
    await deleteR2Objects(
      r2,
      bucket,
      (page.Contents || []).map((entry) => entry.Key).filter(Boolean),
    );
    continuationToken = page.IsTruncated
      ? page.NextContinuationToken
      : undefined;
  } while (continuationToken);
};

const privateBucket = () => {
  const error = getR2SubmissionsConfigurationError();
  if (error) throw new Error(error);
  return getR2SubmissionsBucketName();
};

const assertImage = (contentType, size) => {
  if (
    !TYPES.has(contentType) ||
    !Number.isSafeInteger(size) ||
    size <= 0 ||
    size > MAX_BYTES
  ) {
    throw new Error("Gebruik een JPG, PNG, WebP of AVIF van maximaal 20 MB.");
  }
};

const localized = (value) =>
  Object.fromEntries(
    LANGUAGES.map((language) => [
      language,
      typeof value?.[language] === "string"
        ? value[language].slice(0, 10000)
        : "",
    ]),
  );
const metadataFor = (value = {}) => ({
  title: localized(value.title),
  caption: localized(value.caption),
  alt: localized(value.alt),
  credit: localized(value.credit),
  objectLabel: localized(value.objectLabel),
  rights: typeof value.rights === "string" ? value.rights.slice(0, 500) : "",
  source: typeof value.source === "string" ? value.source.slice(0, 1000) : "",
  category: CATEGORIES.has(value.category) ? value.category : "unconfirmed",
  approved: value.approved === true,
  tags: Array.isArray(value.tags)
    ? [
        ...new Set(
          value.tags
            .filter((tag) => typeof tag === "string")
            .map((tag) => tag.trim().slice(0, 80))
            .filter(Boolean),
        ),
      ].slice(0, 30)
    : [],
});

const pause = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));
const transientReadFailure = (error) =>
  /gateway timeout|timeout|temporar|connection|fetch failed|network/i.test(
    String(error?.message || error || ""),
  );

const parseSetting = (row) => {
  if (!row?.value) return null;
  if (typeof row.value !== "string") return row.value;
  try {
    return JSON.parse(row.value);
  } catch {
    return null;
  }
};

/** Keep the image API independent of the public snapshot, while still giving
 * editors a truthful collection name wherever a catalog image is used. */
export const buildCatalogContexts = (usages, items, settings) => {
  const itemById = new Map((items || []).map((item) => [String(item.id), item]));
  const extensionByItemId = new Map(
    (settings || [])
      .filter((setting) => typeof setting.key === "string" && setting.key.startsWith("item_ext_"))
      .map((setting) => [setting.key.slice("item_ext_".length), parseSetting(setting)])
      .filter(([, extension]) => extension && typeof extension === "object"),
  );
  const contextsByAsset = new Map();
  for (const usage of usages || []) {
    if (usage.consumer_type !== "catalog" || !usage.consumer_id) continue;
    const itemId = String(usage.consumer_id);
    const item = itemById.get(itemId) || {};
    const extension = extensionByItemId.get(itemId) || {};
    const context = {
      item_id: itemId,
      title: extension.title || item.title || "Onbenoemd collectiewerk",
      title_en: extension.title_en || item.title_en || "",
      title_fr: extension.title_fr || item.title_fr || "",
      author: extension.author || item.author || "",
      year: extension.year || item.year || "",
      item_type: extension.itemType || extension.item_type || item.item_type || item.itemType || "",
      collection_group: extension.collectionGroup || extension.collection_group || item.collection_group || item.collectionGroup || "",
      placements: [],
    };
    const entries = contextsByAsset.get(usage.asset_id) || new Map();
    const existing = entries.get(itemId) || context;
    if (usage.placement && !existing.placements.includes(usage.placement))
      existing.placements.push(usage.placement);
    entries.set(itemId, existing);
    contextsByAsset.set(usage.asset_id, entries);
  }
  return new Map(
    [...contextsByAsset].map(([assetId, contexts]) => [
      assetId,
      [...contexts.values()].sort((left, right) => left.title.localeCompare(right.title, "nl")),
    ]),
  );
};

/**
 * Read the media library without a PostgREST relation expansion.  The latter
 * became intermittently slow once the usage index started retaining precise
 * Provenance revision history.  Two small indexed reads are both more stable
 * and keep the client contract unchanged.
 */
export async function listMediaAssetsWithUsages(
  supabase,
  { includeArchived = false } = {},
) {
  let assets;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let query = supabase
      .from("media_assets")
      .select(
        "id,filename,width,height,variants,crop,status,metadata,created_at,updated_at",
      )
      .order("created_at");
    if (!includeArchived) query = query.neq("status", "archived");
    const result = await query;
    if (!result.error) {
      assets = result.data || [];
      break;
    }
    if (attempt === 1 || !transientReadFailure(result.error))
      throw result.error;
    await pause(300);
  }
  if (!assets?.length) return assets || [];

  let usages;
  const assetIds = assets.map((asset) => asset.id);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = await supabase
      .from("media_asset_usages")
      .select("asset_id,consumer_type,consumer_id,placement,updated_at")
      .in("asset_id", assetIds)
      .order("updated_at", { ascending: false });
    if (!result.error) {
      usages = result.data || [];
      break;
    }
    if (attempt === 1 || !transientReadFailure(result.error))
      throw result.error;
    await pause(300);
  }
  const usagesByAsset = new Map();
  for (const usage of usages || []) {
    const entries = usagesByAsset.get(usage.asset_id) || [];
    const { asset_id, ...entry } = usage;
    entries.push(entry);
    usagesByAsset.set(usage.asset_id, entries);
  }
  const catalogItemIds = [
    ...new Set(
      (usages || [])
        .filter((usage) => usage.consumer_type === "catalog" && usage.consumer_id)
        .map((usage) => String(usage.consumer_id)),
    ),
  ];
  let catalogContextsByAsset = new Map();
  if (catalogItemIds.length) {
    try {
      // Catalog metadata may live partly in the base item and partly in its
      // extension record. Both reads stay tiny (there are only referenced
      // works) and never prevent the library itself from opening.
      const [{ data: items, error: itemsError }, { data: settings, error: settingsError }] =
        await Promise.all([
          supabase.from("items").select("*").in("id", catalogItemIds),
          supabase.from("admin_settings").select("key,value").like("key", "item_ext_%"),
        ]);
      if (itemsError) throw itemsError;
      if (settingsError) throw settingsError;
      catalogContextsByAsset = buildCatalogContexts(usages, items, settings);
    } catch (error) {
      // A temporarily slow context lookup must not recreate the historical
      // Gateway Timeout failure for the entire image library.
      console.warn("Could not enrich media library catalog contexts:", error.message);
    }
  }
  return assets.map((asset) => ({
    ...asset,
    media_asset_usages: usagesByAsset.get(asset.id) || [],
    catalog_contexts: catalogContextsByAsset.get(asset.id) || [],
  }));
}

export async function syncMediaUrlUsages(
  supabase,
  { consumerType, consumerId, urls = [], stageOnly = false },
) {
  if (
    !["provenance", "rembrandt-project", "catalog", "site"].includes(
      consumerType,
    ) ||
    typeof consumerId !== "string" ||
    !consumerId
  )
    throw new Error("Ongeldige mediagebruiker.");
  const matches = await Promise.all(
    [
      ...new Set(
        urls.filter(
          (url) => typeof url === "string" && url.includes("/media/variants/"),
        ),
      ),
    ].map(async (url) => {
      const { data, error } = await supabase
        .from("media_assets")
        .select("id")
        .contains("variants", JSON.stringify([{ url }]))
        .limit(1);
      if (error) throw error;
      return data?.[0]?.id || null;
    }),
  );
  const input = {
    consumerType,
    consumerId,
    usages: matches
      .filter(Boolean)
      .map((assetId) => ({ assetId, placement: "url-reference" })),
  };
  if (stageOnly) {
    await stageMediaAssetUsages(supabase, input);
    return;
  }
  await replaceMediaAssetUsages(supabase, input);
}

const cropRect = (crop, width, height) => {
  if (!crop) return { left: 0, top: 0, width, height };
  if (
    !["x", "y", "width", "height"].every((key) => Number.isFinite(crop[key])) ||
    crop.x < 0 ||
    crop.y < 0 ||
    crop.width <= 0 ||
    crop.height <= 0 ||
    crop.x + crop.width > 1.00001 ||
    crop.y + crop.height > 1.00001
  )
    throw new Error("De uitsnede valt buiten de afbeelding.");
  const left = Math.floor(crop.x * width);
  const top = Math.floor(crop.y * height);
  return {
    left,
    top,
    width: Math.min(width - left, Math.max(1, Math.floor(crop.width * width))),
    height: Math.min(
      height - top,
      Math.max(1, Math.floor(crop.height * height)),
    ),
  };
};

export async function renderMediaAssetVariants(record, crop) {
  const r2 = getR2Client();
  const object = await r2.send(
    new GetObjectCommand({ Bucket: privateBucket(), Key: record.original_key }),
  );
  const source = Buffer.from(await object.Body.transformToByteArray());
  if (source.length > MAX_BYTES) throw new Error("Het origineel is te groot.");
  const oriented = await sharp(source, { limitInputPixels: 60_000_000 })
    .rotate()
    .toBuffer();
  const dimensions = await sharp(oriented).metadata();
  const rect = cropRect(crop, dimensions.width, dimensions.height);
  const widths = [
    ...new Set(
      [360, 720, 1200, 1600].map((width) => Math.min(width, rect.width)),
    ),
  ].sort((a, b) => a - b);
  const version = randomUUID();
  const variants = [];
  for (const width of widths) {
    const { data, info } = await sharp(oriented)
      .extract(rect)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 90 })
      .toBuffer({ resolveWithObject: true });
    const key = `media/variants/${record.id}/${version}-${info.width}.webp`;
    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: data,
        ContentType: "image/webp",
        CacheControl: PUBLIC_CACHE,
      }),
    );
    variants.push({
      url: `${process.env.R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`,
      width: info.width,
      height: info.height,
    });
  }
  return {
    variants,
    width: dimensions.width,
    height: dimensions.height,
    crop: crop || null,
  };
}

export async function mediaLibraryAction(supabase, user, action, body) {
  const r2 = getR2Client();
  if (action === "media-init") {
    assertImage(body.contentType, body.size);
    const id = randomUUID();
    const originalKey = `media/originals/${id}`;
    const { error } = await supabase.from("media_assets").insert({
      id,
      original_key: originalKey,
      filename: String(body.filename || "Afbeelding").slice(0, 180),
      content_type: body.contentType,
      size_bytes: body.size,
      created_by: user.id,
      updated_by: user.id,
    });
    if (error) throw error;
    const presignedUrl = await getSignedUrl(
      r2,
      new PutObjectCommand({
        Bucket: privateBucket(),
        Key: originalKey,
        ContentType: body.contentType,
        CacheControl: PRIVATE_CACHE,
      }),
      { expiresIn: 300 },
    );
    return {
      id,
      objectKey: originalKey,
      presignedUrl,
      cacheControl: PRIVATE_CACHE,
      uploadReceipt: createUploadReceipt(
        {
          objectKey: originalKey,
          contentType: body.contentType,
          size: body.size,
          userId: user.id,
        },
        process.env.R2_SECRET_ACCESS_KEY,
      ),
    };
  }
  if (action === "media-sync-urls") {
    await syncMediaUrlUsages(supabase, {
      consumerType: body.consumerType,
      consumerId: body.consumerId,
      urls: body.urls,
      stageOnly: body.stage === true,
    });
    return { synced: true };
  }
  const { data: record, error } = await supabase
    .from("media_assets")
    .select("*")
    .eq("id", body.id)
    .single();
  if (error || !record) throw new Error("Afbeelding niet gevonden.");
  if (action === "media-original")
    return {
      url: await getSignedUrl(
        r2,
        new GetObjectCommand({
          Bucket: privateBucket(),
          Key: record.original_key,
        }),
        { expiresIn: 300 },
      ),
    };
  if (action === "media-complete") {
    if (
      !verifyUploadReceipt(
        body.uploadReceipt,
        {
          objectKey: record.original_key,
          contentType: record.content_type,
          size: record.size_bytes,
          userId: user.id,
        },
        process.env.R2_SECRET_ACCESS_KEY,
      )
    )
      throw new Error("De uploadbevestiging is verlopen of ongeldig.");
    const head = await r2.send(
      new HeadObjectCommand({
        Bucket: privateBucket(),
        Key: record.original_key,
      }),
    );
    if (
      head.ContentLength !== record.size_bytes ||
      head.ContentType !== record.content_type ||
      head.CacheControl !== PRIVATE_CACHE
    )
      throw new Error("De upload is niet volledig ontvangen.");
    const object = await r2.send(
      new GetObjectCommand({
        Bucket: privateBucket(),
        Key: record.original_key,
      }),
    );
    const source = Buffer.from(await object.Body.transformToByteArray());
    const sha256 = createHash("sha256").update(source).digest("hex");
    const { data: duplicate, error: duplicateError } = await supabase
      .from("media_assets")
      .select("*")
      .eq("sha256", sha256)
      .maybeSingle();
    if (duplicateError) throw duplicateError;
    if (duplicate && duplicate.id !== record.id) {
      const cleanup = await r2.send(
        new DeleteObjectCommand({
          Bucket: privateBucket(),
          Key: record.original_key,
        }),
      );
      if (!cleanup)
        throw new Error(
          "Het dubbele privé-origineel kon niet worden opgeruimd.",
        );
      const { error: duplicateDeleteError } = await supabase
        .from("media_assets")
        .delete()
        .eq("id", record.id);
      if (duplicateDeleteError) throw duplicateDeleteError;
      return { media: duplicate, duplicate: true };
    }
    const dimensions = await sharp(source, {
      limitInputPixels: 60_000_000,
    }).metadata();
    const { data, error: updateError } = await supabase
      .from("media_assets")
      .update({
        sha256,
        width: dimensions.autoOrient?.width || dimensions.width,
        height: dimensions.autoOrient?.height || dimensions.height,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq("id", record.id)
      .select()
      .single();
    if (updateError) throw updateError;
    return { media: data };
  }
  if (action === "media-render") {
    if (body.confirmPublic !== true)
      throw new Error("Bevestig eerst de publieke uitsnede.");
    const rendered = await renderMediaAssetVariants(record, body.crop);
    const { data, error: updateError } = await supabase
      .from("media_assets")
      .update({
        ...rendered,
        status: "ready",
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq("id", record.id)
      .select()
      .single();
    if (updateError) throw updateError;
    return { media: data };
  }
  if (action === "media-metadata") {
    const { data, error: updateError } = await supabase
      .from("media_assets")
      .update({
        metadata: metadataFor(body.metadata),
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq("id", record.id)
      .select()
      .single();
    if (updateError) throw updateError;
    return { media: data };
  }
  if (action === "media-archive") {
    const { blocking } = await readMediaUsages(supabase, record.id);
    if (blocking.length)
      throw new Error(
        `Dit beeld is nog op ${blocking.length} actieve plaats${blocking.length === 1 ? "" : "en"} in gebruik en kan niet worden gearchiveerd.`,
      );
    const { data, error: updateError } = await supabase
      .from("media_assets")
      .update({
        status: "archived",
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq("id", record.id)
      .select()
      .single();
    if (updateError) throw updateError;
    return { media: data };
  }
  if (action === "media-restore") {
    const object = await r2.send(
      new HeadObjectCommand({
        Bucket: privateBucket(),
        Key: record.original_key,
      }),
    );
    if (!object.ContentLength || !object.ContentType?.startsWith("image/"))
      throw new Error(
        "Het privé-origineel is niet meer volledig beschikbaar. Verwijder het archiefrecord definitief.",
      );
    const restoredStatus =
      Array.isArray(record.variants) && record.variants.length
        ? "ready"
        : "uploaded";
    const { data, error: restoreError } = await supabase
      .from("media_assets")
      .update({
        status: restoredStatus,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq("id", record.id)
      .select()
      .single();
    if (restoreError) throw restoreError;
    return { media: data };
  }
  if (action === "media-delete") {
    if (body.confirmation !== "VERWIJDER")
      throw new Error("Bevestig de definitieve verwijdering met VERWIJDER.");
    const { blocking, historical } = await readMediaUsages(supabase, record.id);
    if (blocking.length)
      throw new Error(
        `Dit beeld is nog op ${blocking.length} actieve plaats${blocking.length === 1 ? "" : "en"} in gebruik en kan niet definitief worden verwijderd.`,
      );
    if (historical.length) {
      const { error: historicalCleanupError } = await supabase
        .from("media_asset_usages")
        .delete()
        .eq("asset_id", record.id)
        .eq("consumer_type", "provenance")
        .like("consumer_id", "revision:%");
      if (historicalCleanupError) throw historicalCleanupError;
    }
    const validOriginal = [
      `media/originals/${record.id}`,
      `provenance/originals/${record.id}`,
    ].includes(record.original_key);
    if (!validOriginal)
      throw new Error(
        "Dit beeld heeft een onveilige originele R2-sleutel en kan niet worden verwijderd.",
      );
    const originalStatus = record.status;
    const { error: archiveError } = await supabase
      .from("media_assets")
      .update({
        status: "archived",
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq("id", record.id);
    if (archiveError) throw archiveError;
    try {
      await Promise.all([
        deleteR2Prefix(
          r2,
          process.env.R2_BUCKET_NAME,
          `media/variants/${record.id}/`,
        ),
        deleteR2Prefix(
          r2,
          process.env.R2_BUCKET_NAME,
          `provenance/media/${record.id}/`,
        ),
      ]);
      await r2.send(
        new DeleteObjectCommand({
          Bucket: privateBucket(),
          Key: record.original_key,
        }),
      );
      const { error: deleteError } = await supabase
        .from("media_assets")
        .delete()
        .eq("id", record.id);
      if (deleteError) throw deleteError;
      return {
        deleted: true,
        id: record.id,
        removedHistoricalUsages: historical.length,
      };
    } catch (deleteError) {
      // The record stays archived: it cannot be selected again while an
      // administrator investigates a partial R2 deletion.
      if (originalStatus === "uploaded" || originalStatus === "ready") {
        console.error(
          "Media deletion left archived record:",
          record.id,
          deleteError.message,
        );
      }
      throw deleteError;
    }
  }
  throw new Error("Onbekende beeldbewerking.");
}
