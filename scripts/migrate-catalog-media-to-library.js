import dotenv from "dotenv";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import sharp from "sharp";
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import {
  buildPublicContentSnapshot,
  publishPublicContentSnapshot,
} from "../api/_lib/publicContent.js";
import {
  finalizeMediaAssetUsageStage,
  rollbackMediaAssetUsageStage,
  stageMediaAssetUsages,
} from "../api/_lib/mediaAssetUsage.js";

dotenv.config({ path: process.env.CATALOG_MEDIA_ENV_FILE || ".env.local" });

const MAX_BYTES = 20 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const PUBLIC_CACHE = "public, max-age=31536000, immutable";
const PRIVATE_CACHE = "private, no-store";
const apply =
  process.argv.includes("--apply") || process.argv.includes("--cutover");
const cutover = process.argv.includes("--cutover");
const siteSettingsOnly = process.argv.includes("--site-settings");

const required = [
  "R2_ENDPOINT",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_SUBMISSIONS_BUCKET_NAME",
  "R2_PUBLIC_URL",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];
for (const key of required) {
  if (!process.env[key]) throw new Error(`${key} ontbreekt.`);
}

const publicBucket = process.env.R2_BUCKET_NAME;
const privateBucket = process.env.R2_SUBMISSIONS_BUCKET_NAME;
const publicUrl = process.env.R2_PUBLIC_URL.replace(/\/$/, "");
const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const isCatalogUrl = (value) => {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    const configured = new URL(publicUrl);
    return (
      url.protocol === "https:" &&
      url.hostname === configured.hostname &&
      url.pathname.startsWith("/catalog/")
    );
  } catch {
    return false;
  }
};

const catalogKeyFor = (url) =>
  decodeURIComponent(new URL(url).pathname.replace(/^\//, ""));
const filenameFor = (url) =>
  path.basename(catalogKeyFor(url)) || "catalogusbeeld";
const streamToBuffer = async (body) =>
  Buffer.from(await body.transformToByteArray());
const pause = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));
const isTransient = (error) =>
  /gateway timeout|timeout|temporar|connection|network|fetch failed/i.test(
    String(error?.message || error),
  );
const withRetry = async (operation, label, attempts = 4) => {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts || !isTransient(error)) throw error;
      console.warn(
        `${label}: tijdelijke fout, poging ${attempt + 1}/${attempts}.`,
      );
      await pause(350 * attempt);
    }
  }
  throw lastError;
};
const mapWithConcurrency = async (entries, concurrency, operation) => {
  const results = new Array(entries.length);
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < entries.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await operation(entries[index], index);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(concurrency, entries.length) }, worker),
  );
  return results;
};
const deepReplace = (value, mapping) => {
  if (typeof value === "string") {
    // A media asset owns a responsive variants array; it deliberately has no
    // ambiguous top-level `url` field. Use the largest verified public variant
    // as the backwards-compatible collection URL.
    return mapping.get(value)?.variants?.at(-1)?.url || value;
  }
  if (Array.isArray(value))
    return value.map((entry) => deepReplace(entry, mapping));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        deepReplace(child, mapping),
      ]),
    );
  }
  return value;
};

// Treat every exact legacy R2 URL as an image reference, regardless of the
// surrounding JSON key. The collection schema has evolved over time and a
// key-name allowlist could silently miss an older editorial field.
const collectCatalogUrls = (value) => {
  if (typeof value === "string") return isCatalogUrl(value) ? [value] : [];
  if (Array.isArray(value))
    return value.flatMap((entry) => collectCatalogUrls(entry));
  if (!value || typeof value !== "object") return [];
  return Object.values(value).flatMap((child) => collectCatalogUrls(child));
};
const findCatalogLocations = (value, location = "catalog") => {
  if (typeof value === "string") return isCatalogUrl(value) ? [location] : [];
  if (Array.isArray(value))
    return value.flatMap((entry, index) =>
      findCatalogLocations(entry, `${location}[${index}]`),
    );
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) =>
    findCatalogLocations(child, `${location}.${key}`),
  );
};

const deleteKeys = async (bucket, keys) => {
  if (!keys.length) return;
  const response = await r2.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
    }),
  );
  if (response.Errors?.length)
    throw new Error("R2 kon een opgeruimd migratieobject niet verwijderen.");
};

const renderVariants = async (buffer, id) => {
  const oriented = await sharp(buffer, { limitInputPixels: 60_000_000 })
    .rotate()
    .toBuffer();
  const source = await sharp(oriented).metadata();
  if (!source.width || !source.height)
    throw new Error("Afbeeldingsafmetingen ontbreken.");
  const widths = [
    ...new Set(
      [360, 720, 1200, 1600].map((width) => Math.min(width, source.width)),
    ),
  ].sort((a, b) => a - b);
  const version = randomUUID();
  const variants = [];
  const keys = [];
  for (const width of widths) {
    const { data, info } = await sharp(oriented)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 90 })
      .toBuffer({ resolveWithObject: true });
    const key = `media/variants/${id}/${version}-${info.width}.webp`;
    await r2.send(
      new PutObjectCommand({
        Bucket: publicBucket,
        Key: key,
        Body: data,
        ContentType: "image/webp",
        CacheControl: PUBLIC_CACHE,
      }),
    );
    keys.push(key);
    variants.push({
      url: `${publicUrl}/${key}`,
      width: info.width,
      height: info.height,
    });
  }
  return { variants, width: source.width, height: source.height, keys };
};

const catalogUsages = (item, extension, mapping) => {
  // This mirrors buildPublicContentSnapshot: the extension is the effective
  // public item when it contains a newer version of a field such as images.
  const effectiveItem =
    extension && typeof extension === "object"
      ? { ...item, ...extension }
      : item;
  const usages = [];
  const knownSources = new Set();
  (Array.isArray(effectiveItem.images) ? effectiveItem.images : []).forEach(
    (image, index) => {
      const asset = mapping.get(image?.url);
      if (asset) {
        usages.push({ assetId: asset.id, placement: `gallery:${index + 1}` });
        knownSources.add(image.url);
      }
    },
  );
  (Array.isArray(effectiveItem.comparable_sales)
    ? effectiveItem.comparable_sales
    : []
  ).forEach((sale, index) => {
    const asset = mapping.get(sale?.imageUrl);
    if (asset) {
      usages.push({
        assetId: asset.id,
        placement: `comparison:${index + 1}`,
      });
      knownSources.add(sale.imageUrl);
    }
  });
  // Keep deletion protection correct for a legacy image stored in another
  // content field, while avoiding a duplicate application for gallery images.
  [...new Set(collectCatalogUrls(effectiveItem))]
    .filter((source) => !knownSources.has(source))
    .forEach((source, index) => {
      const asset = mapping.get(source);
      if (asset)
        usages.push({
          assetId: asset.id,
          placement: `url-reference:${index + 1}`,
        });
    });
  return usages;
};

const assertReadyRecord = async (record) => {
  if (
    !record?.id ||
    record.status !== "ready" ||
    !Array.isArray(record.variants) ||
    !record.variants.length
  ) {
    throw new Error("Een centraal mediarecord is niet publiceerbaar.");
  }
  await r2.send(
    new HeadObjectCommand({ Bucket: privateBucket, Key: record.original_key }),
  );
  for (const variant of record.variants) {
    const key = new URL(variant.url).pathname.replace(/^\//, "");
    const result = await r2.send(
      new HeadObjectCommand({ Bucket: publicBucket, Key: key }),
    );
    if (!result.ContentLength || result.ContentType !== "image/webp")
      throw new Error("Een centrale publieke variant is ongeldig.");
  }
};

const readInventory = async () => {
  if (siteSettingsOnly) {
    const { data: settings, error } = await supabase
      .from("admin_settings")
      .select("key,value,updated_at")
      .in("key", ["hero_image", "mobile_hero_image"]);
    if (error) throw error;
    const parsedSettings = (settings || []).map((setting) => ({
      ...setting,
      // These legacy settings are plain URLs, not JSON documents.
      parsed: setting.value,
    }));
    return {
      items: [],
      settings: parsedSettings,
      sources: [
        ...new Set(
          parsedSettings.flatMap((setting) =>
            collectCatalogUrls(setting.parsed),
          ),
        ),
      ].sort(),
    };
  }
  const [
    { data: items, error: itemsError },
    { data: settings, error: settingsError },
  ] = await Promise.all([
    supabase
      .from("items")
      .select("id,images,comparable_sales,updated_at")
      .order("created_at", { ascending: true }),
    supabase
      .from("admin_settings")
      .select("key,value,updated_at")
      .like("key", "item_ext_%"),
  ]);
  if (itemsError) throw itemsError;
  if (settingsError) throw settingsError;
  const parsedSettings = (settings || []).map((setting) => {
    try {
      return {
        ...setting,
        parsed:
          typeof setting.value === "string"
            ? JSON.parse(setting.value)
            : setting.value,
      };
    } catch {
      throw new Error(`De back-up ${setting.key} bevat geen geldige JSON.`);
    }
  });
  const sources = new Set([
    ...(items || []).flatMap((item) => collectCatalogUrls(item)),
    ...parsedSettings.flatMap((setting) => collectCatalogUrls(setting.parsed)),
  ]);
  return {
    items: items || [],
    settings: parsedSettings,
    sources: [...sources].sort(),
  };
};

const preflight = async (sources) => {
  return mapWithConcurrency(sources, 12, async (url) => {
    const head = await r2.send(
      new HeadObjectCommand({ Bucket: publicBucket, Key: catalogKeyFor(url) }),
    );
    if (
      !TYPES.has(head.ContentType) ||
      !head.ContentLength ||
      head.ContentLength > MAX_BYTES
    ) {
      throw new Error(
        `${url} voldoet niet aan de centrale afbeeldingsvoorwaarden.`,
      );
    }
    return {
      url,
      key: catalogKeyFor(url),
      contentType: head.ContentType,
      bytes: head.ContentLength,
    };
  });
};

const importOne = async (source, existingBySource, existingByHash) => {
  const existing = existingBySource.get(source);
  if (existing) return existing;
  const key = catalogKeyFor(source);
  const object = await r2.send(
    new GetObjectCommand({ Bucket: publicBucket, Key: key }),
  );
  const buffer = await streamToBuffer(object.Body);
  if (
    !TYPES.has(object.ContentType) ||
    !buffer.length ||
    buffer.length > MAX_BYTES
  )
    throw new Error(`${source} heeft een ongeldig brontype of formaat.`);
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const duplicate = existingByHash.get(sha256);
  if (duplicate) return duplicate;
  const id = randomUUID();
  const originalKey = `media/originals/${id}`;
  const createdVariantKeys = [];
  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: privateBucket,
        Key: originalKey,
        Body: buffer,
        ContentType: object.ContentType,
        CacheControl: PRIVATE_CACHE,
      }),
    );
    const rendered = await renderVariants(buffer, id);
    createdVariantKeys.push(...rendered.keys);
    const { data, error } = await supabase
      .from("media_assets")
      .insert({
        id,
        original_key: originalKey,
        filename: filenameFor(source),
        sha256,
        content_type: object.ContentType,
        size_bytes: buffer.length,
        width: rendered.width,
        height: rendered.height,
        variants: rendered.variants,
        status: "ready",
        metadata: {},
        legacy_source: source,
      })
      .select("id,original_key,status,variants,sha256,legacy_source")
      .single();
    if (error) throw error;
    await assertReadyRecord(data);
    existingBySource.set(source, data);
    existingByHash.set(sha256, data);
    return data;
  } catch (error) {
    // A gateway can time out after Supabase accepted the insert. Recover that
    // exact durable record instead of deleting its already-valid R2 objects.
    const { data: recovered } = await supabase
      .from("media_assets")
      .select("id,original_key,status,variants,sha256,legacy_source")
      .eq("legacy_source", source)
      .maybeSingle();
    if (
      recovered?.status === "ready" &&
      Array.isArray(recovered.variants) &&
      recovered.variants.length
    ) {
      await assertReadyRecord(recovered);
      existingBySource.set(source, recovered);
      if (recovered.sha256) existingByHash.set(recovered.sha256, recovered);
      return recovered;
    }
    await deleteKeys(publicBucket, createdVariantKeys).catch(() => {});
    await deleteKeys(privateBucket, [originalKey]).catch(() => {});
    throw error;
  }
};

const writePrivateJson = async (key, value) => {
  await r2.send(
    new PutObjectCommand({
      Bucket: privateBucket,
      Key: key,
      Body: JSON.stringify(value),
      ContentType: "application/json; charset=utf-8",
      CacheControl: PRIVATE_CACHE,
    }),
  );
};

const updateWithVersion = async (
  table,
  keyColumn,
  keyValue,
  version,
  values,
  label,
) => {
  const { data, error } = await supabase
    .from(table)
    .update(values)
    .eq(keyColumn, keyValue)
    .eq("updated_at", version)
    .select(keyColumn)
    .maybeSingle();
  if (error) throw error;
  if (!data)
    throw new Error(
      `${label} werd tijdens de migratie door een andere wijziging aangepast. Er is niets publiek omgeschakeld.`,
    );
};

async function main() {
  const inventory = await readInventory();
  const preflightReport = await preflight(inventory.sources);
  const totalBytes = preflightReport.reduce(
    (sum, entry) => sum + Number(entry.bytes),
    0,
  );
  console.log(
    JSON.stringify(
      {
        phase: "preflight",
        items: inventory.items.length,
        images: inventory.sources.length,
        totalBytes,
      },
      null,
      2,
    ),
  );
  if (!apply) {
    console.log(
      "Dry run geslaagd. Geen database- of R2-data gewijzigd. Gebruik --apply voor de niet-publieke import, of --cutover voor de gecontroleerde omschakeling.",
    );
    return;
  }

  const { data: existing, error: existingError } = await supabase
    .from("media_assets")
    .select("id,original_key,status,variants,sha256,legacy_source");
  if (existingError) throw existingError;
  const existingBySource = new Map(
    (existing || [])
      .filter((asset) => asset.legacy_source)
      .map((asset) => [asset.legacy_source, asset]),
  );
  const existingByHash = new Map(
    (existing || [])
      .filter((asset) => asset.sha256)
      .map((asset) => [asset.sha256, asset]),
  );
  const mapping = new Map();
  for (const [index, source] of inventory.sources.entries()) {
    const asset = await withRetry(
      () => importOne(source, existingBySource, existingByHash),
      `Import ${index + 1}/${inventory.sources.length}`,
    );
    mapping.set(source, asset);
    if ((index + 1) % 10 === 0 || index + 1 === inventory.sources.length) {
      console.log(
        `Import gecontroleerd: ${index + 1}/${inventory.sources.length}`,
      );
    }
  }
  const uniqueRecords = [
    ...new Map(
      [...mapping.values()].map((asset) => [asset.id, asset]),
    ).values(),
  ];
  await mapWithConcurrency(uniqueRecords, 12, assertReadyRecord);
  console.log(
    JSON.stringify(
      {
        phase: "import",
        importedOrVerified: mapping.size,
        ready: [...mapping.values()].filter((asset) => asset.status === "ready")
          .length,
      },
      null,
      2,
    ),
  );
  if (!cutover) {
    console.log(
      "Centrale import en R2-validatie geslaagd. De bestaande collectie-URLs zijn nog volledig onaangeroerd.",
    );
    return;
  }

  const runId = `catalog-media-${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID()}`;
  const backupKey = `migration-backups/${runId}.json`;
  const backup = {
    runId,
    createdAt: new Date().toISOString(),
    items: inventory.items,
    settings: inventory.settings.map(({ parsed, ...setting }) => setting),
    mapping: [...mapping.entries()].map(([source, asset]) => ({
      source,
      assetId: asset.id,
      url: asset.variants.at(-1).url,
      sha256: asset.sha256,
    })),
  };
  await writePrivateJson(backupKey, backup);

  const extensionsByItemId = new Map(
    inventory.settings
      .filter((setting) => setting.key.startsWith("item_ext_"))
      .map((setting) => [
        setting.key.replace(/^item_ext_/, ""),
        setting.parsed,
      ]),
  );
  const usageStages = [];
  for (const item of inventory.items) {
    usageStages.push(
      await stageMediaAssetUsages(supabase, {
        consumerType: "catalog",
        consumerId: item.id,
        usages: catalogUsages(item, extensionsByItemId.get(item.id), mapping),
      }),
    );
  }
  if (siteSettingsOnly) {
    for (const setting of inventory.settings) {
      const asset = mapping.get(setting.parsed);
      const consumerId =
        setting.key === "hero_image"
          ? "hero-desktop"
          : setting.key === "mobile_hero_image"
            ? "hero-mobile"
            : null;
      if (!consumerId || !asset) continue;
      usageStages.push(
        await stageMediaAssetUsages(supabase, {
          consumerType: "site",
          consumerId,
          usages: [{ assetId: asset.id, placement: "url-reference" }],
        }),
      );
    }
  }

  const changedItems = [];
  const changedSettings = [];
  const migrationTime = new Date().toISOString();
  try {
    for (const item of inventory.items) {
      const images = deepReplace(item.images, mapping);
      const comparableSales = deepReplace(item.comparable_sales, mapping);
      if (
        JSON.stringify(images) === JSON.stringify(item.images) &&
        JSON.stringify(comparableSales) ===
          JSON.stringify(item.comparable_sales)
      )
        continue;
      await updateWithVersion(
        "items",
        "id",
        item.id,
        item.updated_at,
        {
          images,
          comparable_sales: comparableSales,
          updated_at: migrationTime,
        },
        `Collectie-item ${item.id}`,
      );
      changedItems.push(item);
    }
    for (const setting of inventory.settings) {
      const updated = deepReplace(setting.parsed, mapping);
      if (JSON.stringify(updated) === JSON.stringify(setting.parsed)) continue;
      await updateWithVersion(
        "admin_settings",
        "key",
        setting.key,
        setting.updated_at,
        {
          value:
            typeof updated === "string" ? updated : JSON.stringify(updated),
          updated_at: migrationTime,
        },
        `Instelling ${setting.key}`,
      );
      changedSettings.push(setting);
    }
    // Read the authoritative source back before moving the public pointer.
    // A stale read or an unrecognised JSON location must abort while the old,
    // still-valid public snapshot remains in service.
    const candidate = await buildPublicContentSnapshot(supabase);
    const candidateScope = siteSettingsOnly ? candidate : candidate.catalog;
    const candidateLegacyLocations = findCatalogLocations(candidateScope);
    if (candidateLegacyLocations.length)
      throw new Error(
        `De gecontroleerde bron bevat nog oude catalogus-URLs (${candidateLegacyLocations.slice(0, 5).join(", ")}); de publieke snapshot is niet aangepast.`,
      );
    const publication = await publishPublicContentSnapshot(supabase);
    if (
      JSON.stringify(
        siteSettingsOnly ? publication.snapshot : publication.snapshot.catalog,
      ).includes("/catalog/")
    )
      throw new Error(
        "De nieuwe publieke snapshot bevat nog oude catalogus-URLs.",
      );
    await Promise.all(
      usageStages.map((stage) => finalizeMediaAssetUsageStage(supabase, stage)),
    );
    console.log(
      JSON.stringify(
        {
          phase: "cutover",
          runId,
          backupKey,
          changedItems: changedItems.length,
          changedSettings: changedSettings.length,
          publicVersionKey: publication.versionKey,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    for (const item of changedItems.reverse()) {
      await supabase
        .from("items")
        .update({
          images: item.images,
          comparable_sales: item.comparable_sales,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id)
        .eq("updated_at", migrationTime);
    }
    for (const setting of changedSettings.reverse()) {
      await supabase
        .from("admin_settings")
        .update({ value: setting.value, updated_at: new Date().toISOString() })
        .eq("key", setting.key)
        .eq("updated_at", migrationTime);
    }
    // The staged rows only protect deletion; remove rows introduced by this
    // failed run so the media library exactly reflects the restored catalogue.
    await Promise.all(
      usageStages.map((stage) => rollbackMediaAssetUsageStage(supabase, stage)),
    );
    // If publishing happened just before a later validation failed, atomically
    // point the public site back at a snapshot built from the restored data.
    await publishPublicContentSnapshot(supabase).catch((restoreError) => {
      console.error(
        "Publieke rollback kon niet automatisch worden vastgelegd:",
        restoreError.message,
      );
    });
    await writePrivateJson(
      "migration-backups/catalog-media-last-failure.json",
      {
        runId,
        failedAt: new Date().toISOString(),
        error: {
          name: error?.name || "Error",
          message: error?.message || String(error),
          stack: error?.stack || null,
        },
      },
    ).catch(() => {});
    throw error;
  }
}

main().catch((error) => {
  console.error("Catalogus-beeldmigratie afgebroken:", error.message);
  process.exit(1);
});
