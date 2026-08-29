import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import dotenv from "dotenv";
import { publishPublicContentSnapshot } from "../api/_lib/publicContent.js";
import { writeRembrandtProjectAccess } from "../api/_lib/rembrandtProjectAccess.js";

dotenv.config({ path: ".env.local" });

const required = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "R2_ENDPOINT",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing ${key}`);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  },
);
const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const parseSetting = (row, fallback = null) => {
  if (!row?.value) return fallback;
  if (typeof row.value !== "string") return row.value;
  try {
    return JSON.parse(row.value);
  } catch {
    return row.value;
  }
};

const uploadLegacyDataImage = async (dataUrl, label) => {
  const match =
    /^data:(image\/(?:jpeg|png|webp|avif));base64,([A-Za-z0-9+/=\s]+)$/.exec(
      dataUrl,
    );
  if (!match) throw new Error(`Unsupported legacy data image in ${label}`);
  const extension = match[1] === "image/jpeg" ? "jpg" : match[1].split("/")[1];
  const body = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  if (!body.length || body.length > 20 * 1024 * 1024)
    throw new Error(`Invalid legacy image size in ${label}`);
  const key = `site/${Date.now()}_${randomUUID()}_${label}.${extension}`;
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: match[1],
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return `${process.env.R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
};

const { data: settingsRows, error: settingsReadError } = await supabase
  .from("admin_settings")
  .select("key, value, updated_at")
  .or(
    "key.like.item_ext_%,key.eq.hero_image,key.eq.mobile_hero_image,key.eq.herkomst_page_data,key.eq.faq_items,key.eq.rembrandt_project_data",
  );
if (settingsReadError) throw settingsReadError;

const settings = new Map((settingsRows || []).map((row) => [row.key, row]));
const forceProjectHidden = process.argv.includes('--project-hidden');
if (forceProjectHidden) {
  const project = parseSetting(settings.get('rembrandt_project_data'));
  if (project && typeof project === 'object') {
    const value = JSON.stringify({ ...project, isEnabled: false });
    const { error } = await supabase.from('admin_settings').upsert({
      key: 'rembrandt_project_data',
      value,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    settings.set('rembrandt_project_data', { key: 'rembrandt_project_data', value });
  }
}
const provenance = parseSetting(settings.get("herkomst_page_data"));
let migratedImages = 0;
if (provenance?.hero?.bgImage?.startsWith("data:image/")) {
  provenance.hero.bgImage = await uploadLegacyDataImage(
    provenance.hero.bgImage,
    "provenance-hero",
  );
  migratedImages += 1;
}
if (provenance?.story?.image?.startsWith("data:image/")) {
  provenance.story.image = await uploadLegacyDataImage(
    provenance.story.image,
    "provenance-story",
  );
  migratedImages += 1;
}
if (migratedImages) {
  const value = JSON.stringify(provenance);
  const { error } = await supabase.from("admin_settings").upsert({
    key: "herkomst_page_data",
    value,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  settings.set("herkomst_page_data", { key: "herkomst_page_data", value });
}

const publication = await publishPublicContentSnapshot(supabase);
await writeRembrandtProjectAccess(publication.snapshot.rembrandtProject?.isEnabled === true);

console.log(
  JSON.stringify({
    ok: true,
    items: publication.snapshot.catalog.length,
    bytes: publication.bytes,
    migratedImages,
    publishedAt: publication.snapshot.publishedAt,
  }),
);
