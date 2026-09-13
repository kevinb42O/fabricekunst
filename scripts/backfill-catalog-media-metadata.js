import dotenv from "dotenv";
import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: process.env.CATALOG_MEDIA_ENV_FILE || ".env.local" });

const apply = process.argv.includes("--apply");
const required = [
  "R2_ENDPOINT",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_SUBMISSIONS_BUCKET_NAME",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];
for (const key of required) {
  if (!process.env[key]) throw new Error(`${key} ontbreekt.`);
}

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

const languages = ["nl", "en", "fr"];
const categories = new Set([
  "artwork",
  "research",
  "document",
  "portrait",
  "interior",
  "context",
  "unconfirmed",
]);
const clean = (value, limit = 10000) =>
  typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, limit)
    : "";
const localized = (value = {}) =>
  Object.fromEntries(
    languages.map((language) => [language, clean(value[language])]),
  );
const firstSentence = (value) => {
  const text = clean(value, 420);
  if (!text) return "";
  const match = text.match(/^(.+?[.!?])(?:\s|$)/);
  return (match?.[1] || text).slice(0, 360);
};
const isBlank = (value) => !clean(value);
const nonEmpty = (value) => clean(value) || "";

const descriptorFor = (hint, position) => {
  const text = clean(hint).toLowerCase();
  if (/frontispiece|frontispice|portrait/.test(text))
    return {
      nl: "Portret of frontispice",
      en: "Portrait or frontispiece",
      fr: "Portrait ou frontispice",
    };
  if (/title.?page|titelpagina|page.?de.?titre/.test(text))
    return { nl: "Titelpagina", en: "Title page", fr: "Page de titre" };
  if (/engraving|gravure|gegraveerd|etching/.test(text))
    return { nl: "Gravure", en: "Engraving", fr: "Gravure" };
  if (/spine|boekrug|rug/.test(text))
    return {
      nl: "Detail van de boekrug",
      en: "Binding spine detail",
      fr: "Détail du dos de reliure",
    };
  if (/cover|omslag|binding|band/.test(text))
    return {
      nl: "Band of omslag",
      en: "Binding or cover",
      fr: "Reliure ou couverture",
    };
  if (/endpaper|schutblad|marbled|gemarmerd|ex.?libris/.test(text))
    return {
      nl: "Schutblad of ex-libris",
      en: "Endpaper or bookplate",
      fr: "Garde ou ex-libris",
    };
  if (/signature|signatuur|inscription|inscriptie/.test(text))
    return {
      nl: "Signatuur of inscriptie",
      en: "Signature or inscription",
      fr: "Signature ou inscription",
    };
  if (/detail|macro|close.?up/.test(text))
    return { nl: "Detailopname", en: "Detail view", fr: "Vue de détail" };
  if (position === 1)
    return {
      nl: "Overzichtsafbeelding",
      en: "Overview image",
      fr: "Vue d’ensemble",
    };
  return {
    nl: "Documentatiefoto",
    en: "Documentation image",
    fr: "Photographie documentaire",
  };
};

const typeLabel = (itemType, language) => {
  const value = clean(itemType).toLowerCase();
  if (value === "book")
    return { nl: "Boek", en: "Book", fr: "Livre" }[language];
  if (["painting", "artwork", "drawing", "print"].includes(value))
    return { nl: "Kunstwerk", en: "Artwork", fr: "Œuvre d’art" }[language];
  return {
    nl: "Collectiestuk",
    en: "Collection object",
    fr: "Objet de collection",
  }[language];
};
const categoryFor = (itemType) => {
  const value = clean(itemType).toLowerCase();
  if (value === "book") return "document";
  if (["painting", "artwork", "drawing", "print"].includes(value))
    return "artwork";
  return "unconfirmed";
};
const itemTitle = (item, language) =>
  nonEmpty(item[`title_${language}`]) ||
  nonEmpty(item.title) ||
  "Naamloos collectiestuk";
const contextFor = (item) =>
  [clean(item.author), clean(item.year)].filter(Boolean).join(", ");
const asLocalized = (current, generated) =>
  Object.fromEntries(
    languages.map((language) => [
      language,
      isBlank(current?.[language])
        ? generated[language]
        : clean(current[language]),
    ]),
  );

const metadataFor = ({ asset, item, image, position }) => {
  const current =
    asset.metadata && typeof asset.metadata === "object" ? asset.metadata : {};
  const descriptor = descriptorFor(image?.caption || asset.filename, position);
  const context = contextFor(item);
  const generatedTitle = Object.fromEntries(
    languages.map((language) => [
      language,
      `${itemTitle(item, language)} — ${descriptor[language]}${position > 1 ? ` ${position}` : ""}`,
    ]),
  );
  const generatedAlt = Object.fromEntries(
    languages.map((language) => [
      language,
      `${descriptor[language]} van ${itemTitle(item, language)}${context ? `, ${context}` : ""}.`,
    ]),
  );
  const generatedCaption = Object.fromEntries(
    languages.map((language) => [
      language,
      (() => {
        const summary = firstSentence(
          item[`description_${language}`] || item.description,
        );
        const prefix = `${descriptor[language]} bij ${itemTitle(item, language)}${context ? `, ${context}` : ""}.`;
        return summary ? `${prefix} ${summary}`.slice(0, 10000) : prefix;
      })(),
    ]),
  );
  const generatedLabel = Object.fromEntries(
    languages.map((language) => [
      language,
      [
        typeLabel(item.item_type, language),
        clean(item.author),
        clean(item.year),
      ]
        .filter(Boolean)
        .join(" · "),
    ]),
  );
  const tags = [
    ...(Array.isArray(current.tags) ? current.tags : []),
    item.title,
    item.title_en,
    item.title_fr,
    item.author,
    item.year,
    item.city,
    item.publisher,
    item.item_type,
    item.collection_group,
    "collectie",
    descriptor.nl,
    descriptor.en,
    descriptor.fr,
  ]
    .map((tag) => clean(tag, 80))
    .filter(Boolean);
  return {
    ...current,
    title: asLocalized(current.title, generatedTitle),
    alt: asLocalized(current.alt, generatedAlt),
    caption: asLocalized(current.caption, generatedCaption),
    objectLabel: asLocalized(current.objectLabel, generatedLabel),
    credit: localized(current.credit),
    rights: clean(current.rights, 500),
    source: clean(current.source, 1000),
    category: categories.has(current.category)
      ? current.category
      : categoryFor(item.item_type),
    approved: current.approved === true,
    tags: [...new Set(tags)].slice(0, 30),
  };
};

const readData = async () => {
  const [
    { data: items, error: itemsError },
    { data: settings, error: settingsError },
    { data: assets, error: assetsError },
  ] = await Promise.all([
    supabase.from("items").select("*"),
    supabase
      .from("admin_settings")
      .select("key,value")
      .like("key", "item_ext_%"),
    supabase
      .from("media_assets")
      .select("id,filename,status,metadata,variants,updated_at"),
  ]);
  if (itemsError || settingsError || assetsError)
    throw itemsError || settingsError || assetsError;
  const extensions = new Map(
    (settings || []).map((setting) => {
      try {
        return [
          setting.key.replace(/^item_ext_/, ""),
          typeof setting.value === "string"
            ? JSON.parse(setting.value)
            : setting.value,
        ];
      } catch {
        throw new Error(
          `${setting.key} is geen geldige collectie-uitbreiding.`,
        );
      }
    }),
  );
  const assetsByUrl = new Map(
    (assets || []).flatMap((asset) =>
      (asset.variants || []).map((variant) => [variant.url, asset]),
    ),
  );
  const candidates = [];
  for (const storedItem of items || []) {
    const item = { ...storedItem, ...(extensions.get(storedItem.id) || {}) };
    for (const [index, image] of (item.images || []).entries()) {
      const asset = assetsByUrl.get(image?.url);
      if (!asset || asset.status !== "ready") continue;
      candidates.push({ asset, item, image, position: index + 1 });
    }
  }
  const unique = new Map();
  for (const candidate of candidates) {
    const previous = unique.get(candidate.asset.id);
    if (previous && previous.item.id !== candidate.item.id)
      throw new Error(
        `Beeld ${candidate.asset.id} hoort bij meer dan één collectiestuk.`,
      );
    // The same source photograph can intentionally appear twice in one
    // gallery. It still receives one unambiguous shared asset record.
    if (!previous || candidate.position < previous.position)
      unique.set(candidate.asset.id, candidate);
  }
  return [...unique.values()];
};

const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const hasCompleteEditorialCopy = (metadata = {}) =>
  languages.every(
    (language) =>
      !isBlank(metadata?.title?.[language]) &&
      !isBlank(metadata?.alt?.[language]) &&
      !isBlank(metadata?.caption?.[language]),
  );
const writeBackup = async (backup) => {
  const key = `metadata-backups/catalog-media-${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID()}.json`;
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_SUBMISSIONS_BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(backup),
      ContentType: "application/json; charset=utf-8",
      CacheControl: "private, no-store",
    }),
  );
  return key;
};

async function main() {
  const candidates = await readData();
  const updates = candidates
    .map((candidate) => ({
      ...candidate,
      nextMetadata: metadataFor(candidate),
    }))
    .filter(
      ({ asset, nextMetadata }) =>
        !hasCompleteEditorialCopy(asset.metadata) &&
        !same(asset.metadata || {}, nextMetadata),
    );
  console.log(
    JSON.stringify(
      {
        catalogAssets: candidates.length,
        updates: updates.length,
        sample: updates.slice(0, 3).map(({ asset, item, nextMetadata }) => ({
          id: asset.id,
          item: item.title,
          title: nextMetadata.title.nl,
          alt: nextMetadata.alt.nl,
          caption: nextMetadata.caption.nl,
          tags: nextMetadata.tags,
        })),
      },
      null,
      2,
    ),
  );
  if (!apply) {
    console.log(
      "Dry run geslaagd. Gebruik --apply om de metadata te schrijven.",
    );
    return;
  }
  const backupKey = await writeBackup({
    createdAt: new Date().toISOString(),
    purpose: "catalog-media-metadata-backfill",
    assets: updates.map(({ asset }) => ({
      id: asset.id,
      metadata: asset.metadata || {},
      updated_at: asset.updated_at,
    })),
  });
  const migrationTime = new Date().toISOString();
  const changed = [];
  try {
    for (const update of updates) {
      const { data, error } = await supabase
        .from("media_assets")
        .update({ metadata: update.nextMetadata, updated_at: migrationTime })
        .eq("id", update.asset.id)
        .eq("updated_at", update.asset.updated_at)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data)
        throw new Error(
          `Beeld ${update.asset.id} werd tijdens de backfill gewijzigd; niets is overschreven.`,
        );
      changed.push(update);
    }
  } catch (error) {
    for (const update of changed.reverse()) {
      await supabase
        .from("media_assets")
        .update({
          metadata: update.asset.metadata || {},
          updated_at: new Date().toISOString(),
        })
        .eq("id", update.asset.id)
        .eq("updated_at", migrationTime);
    }
    throw error;
  }
  console.log(JSON.stringify({ applied: changed.length, backupKey }, null, 2));
}

main().catch((error) => {
  console.error("Metadata-backfill afgebroken:", error.message);
  process.exit(1);
});
