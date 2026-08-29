import { HeadObjectCommand } from "@aws-sdk/client-s3";
import {
  getServerSupabase,
  requireActiveAdmin,
  sendJson,
} from "./adminAuth.js";
import { getR2Client, getR2ConfigurationError } from "./r2.js";
import {
  containsForbiddenImageSource,
  publishPublicContentSnapshot,
} from "./publicContent.js";
import {
  readRembrandtProjectAccess,
  writeRembrandtProjectAccess,
} from "./rembrandtProjectAccess.js";
import { DEFAULT_REMBRANDT_PROJECT } from "../../src/data/defaultRembrandtProject.js";

const SETTING_KEY = "rembrandt_project_data";
const MAX_PAYLOAD_BYTES = 900 * 1024;
const MAX_TEXT_LENGTH = 50_000;
const MAX_UPDATES = 160;
const MAX_IMAGES = 80;
const MAX_PHASES = 24;
const PROJECT_STATUSES = new Set([
  "discovery",
  "technical-research",
  "expert-review",
  "paused",
  "completed",
]);
const EVIDENCE_TYPES = new Set([
  "documented",
  "observation",
  "hypothesis",
  "external-review",
  "next-step",
]);
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UPDATE_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/;

const isStrictDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

const isIsoDateTime = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T/.test(value)) return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
};

class RequestError extends Error {
  constructor(message, status = 422) {
    super(message);
    this.status = status;
  }
}

const parseSetting = (value) => {
  if (!value) return DEFAULT_REMBRANDT_PROJECT;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return DEFAULT_REMBRANDT_PROJECT;
  }
};

export const validateRembrandtProjectShape = (value, depth = 0) => {
  if (depth > 9) throw new RequestError("Payload nesting is too deep");
  if (typeof value === "string") {
    if (value.length > MAX_TEXT_LENGTH)
      throw new RequestError("A text field is too long");
    return;
  }
  if (value === null || typeof value === "boolean" || typeof value === "number")
    return;
  if (Array.isArray(value)) {
    if (value.length > 200)
      throw new RequestError("An array contains too many entries");
    value.forEach((entry) => validateRembrandtProjectShape(entry, depth + 1));
    return;
  }
  if (
    !value ||
    typeof value !== "object" ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new RequestError("Payload contains an unsupported value");
  }
  const entries = Object.entries(value);
  if (entries.length > 120)
    throw new RequestError("An object contains too many fields");
  entries.forEach(([, entry]) =>
    validateRembrandtProjectShape(entry, depth + 1),
  );
};

const managedR2Image = (value) => {
  if (!value) return null;
  if (typeof value !== "string" || value.length > 2048)
    throw new RequestError("Invalid image URL");
  const url = new URL(value);
  const configuredHost = new URL(process.env.R2_PUBLIC_URL).hostname;
  if (
    url.protocol !== "https:" ||
    ![configuredHost, "media.atelierrembrandt.com"].includes(url.hostname)
  ) {
    throw new RequestError(
      "Elke projectafbeelding moet via de online mediabibliotheek zijn geüpload.",
    );
  }
  const objectKey = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!objectKey.startsWith("rembrandt-project/") || objectKey.includes("..")) {
    throw new RequestError("Invalid Rembrandt Project image path");
  }
  return objectKey;
};

const projectImageUrls = (project) => {
  const urls = [project?.settings?.heroImage, project?.settings?.socialImage];
  for (const update of project?.updates || []) {
    urls.push(update?.coverImage);
    for (const image of update?.gallery || []) urls.push(image?.url);
  }
  return [...new Set(urls.filter(Boolean))];
};

const validateProject = async (project) => {
  validateRembrandtProjectShape(project);
  if (
    !project?.settings ||
    !Array.isArray(project?.phases) ||
    !Array.isArray(project?.updates)
  ) {
    throw new RequestError("Required project sections are missing");
  }
  if (project.schemaVersion !== 1) throw new RequestError("De projectversie is ongeldig.");
  if (typeof project.isEnabled !== "boolean") throw new RequestError("De zichtbaarheid van het project is ongeldig.");
  if (project.phases.length < 1 || project.phases.length > MAX_PHASES)
    throw new RequestError("Het project heeft een ongeldig aantal fases.");
  if (project.updates.length > MAX_UPDATES)
    throw new RequestError("The project contains too many updates");
  if (!PROJECT_STATUSES.has(project.settings.projectStatus))
    throw new RequestError("De algemene projectstatus is ongeldig.");
  const phaseIds = new Set();
  const phaseOrders = new Set();
  for (const phase of project.phases) {
    if (!phase?.id || !ID_PATTERN.test(phase.id) || phaseIds.has(phase.id))
      throw new RequestError("Elke fase heeft een unieke, geldige sleutel nodig.");
    if (
      !Number.isInteger(Number(phase.sortOrder)) ||
      phaseOrders.has(Number(phase.sortOrder))
    )
      throw new RequestError("Elke fase heeft een unieke volgorde nodig.");
    if (!String(phase.label?.nl || "").trim())
      throw new RequestError("Elke fase heeft een Nederlandse naam nodig.");
    phaseIds.add(phase.id);
    phaseOrders.add(Number(phase.sortOrder));
  }
  const currentPhase = project.phases.find(
    (phase) => phase.id === project.settings.currentPhaseId,
  );
  if (!currentPhase || currentPhase.visible === false)
    throw new RequestError("De huidige fase moet bestaan en zichtbaar zijn.");
  const ids = new Set();
  const slugs = new Set();
  const sequences = new Set();
  for (const update of project.updates) {
    if (!UPDATE_ID_PATTERN.test(update?.id || "") || ids.has(update.id))
      throw new RequestError("Every update needs a unique id");
    if (
      !update?.slug ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(update.slug) ||
      slugs.has(update.slug)
    )
      throw new RequestError("Every update needs a unique URL slug");
    if (!["draft", "published", "archived"].includes(update.status))
      throw new RequestError("Invalid update status");
    if (!EVIDENCE_TYPES.has(update.evidenceType))
      throw new RequestError("Een update bevat een ongeldig bewijstype.");
    if (!phaseIds.has(update.phaseId))
      throw new RequestError("Every update must belong to an existing phase");
    if (update.status === "published" && !String(update.title?.nl || "").trim())
      throw new RequestError("Every published update needs a Dutch title");
    if (!isStrictDate(update.eventDate))
      throw new RequestError("Elke update heeft een geldige onderzoeksdatum nodig.");
    const sequence = Number(update.sequence);
    if (!Number.isInteger(sequence) || sequence < 1 || sequences.has(sequence))
      throw new RequestError("Elke update heeft een unieke positieve volgorde nodig.");
    if (update.status === "published") {
      const publishTime = new Date(update.publishedAt || 0).getTime();
      if (!isIsoDateTime(update.publishedAt))
        throw new RequestError(
          "Elke gepubliceerde update heeft een geldig publicatiemoment nodig.",
        );
      if (publishTime > Date.now() + 60_000)
        throw new RequestError(
          "Toekomstige publicatie is nog niet ondersteund. Kies een huidig moment of bewaar de update als concept.",
        );
    }
    ids.add(update.id);
    slugs.add(update.slug);
    sequences.add(sequence);
    const galleryIds = new Set();
    for (const image of update.gallery || []) {
      if (!UPDATE_ID_PATTERN.test(image?.id || "") || galleryIds.has(image.id))
        throw new RequestError("Elk galerijbeeld heeft een unieke, geldige sleutel nodig.");
      galleryIds.add(image.id);
    }
  }
  const imageUrls = projectImageUrls(project);
  if (imageUrls.length > MAX_IMAGES)
    throw new RequestError("The project contains too many images");
  if (containsForbiddenImageSource(project))
    throw new RequestError("The project contains a forbidden image source");
  const serialized = JSON.stringify(project);
  if (Buffer.byteLength(serialized) > MAX_PAYLOAD_BYTES)
    throw new RequestError("The project payload is too large");

  if (imageUrls.length) {
    if (getR2ConfigurationError()) throw new RequestError("De online mediabibliotheek is tijdelijk niet beschikbaar.");
    const r2 = getR2Client();
    const verifyImage = async (url) => {
      const objectKey = managedR2Image(url);
      const object = await r2.send(
        new HeadObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: objectKey,
        }),
      );
      if (
        !object.ContentType?.startsWith("image/") ||
        !object.ContentLength ||
        object.ContentLength > 20 * 1024 * 1024
      ) {
        throw new RequestError("Een gekoppelde afbeelding is niet beschikbaar of ongeldig.");
      }
    };
    for (let index = 0; index < imageUrls.length; index += 6) {
      await Promise.all(imageUrls.slice(index, index + 6).map(verifyImage));
    }
  }
  return serialized;
};

async function readProject(supabase) {
  const { data, error } = await supabase
    .from("admin_settings")
    .select("value, updated_at")
    .eq("key", SETTING_KEY)
    .maybeSingle();
  if (error) throw error;
  return { project: parseSetting(data?.value), row: data || null };
}

async function listRevisions(supabase) {
  const { data, error } = await supabase
    .from("rembrandt_project_revisions")
    .select("id, created_at, created_by")
    .order("created_at", { ascending: false })
    .limit(12);
  if (error) return [];
  return data || [];
}

async function storeRevision(supabase, content, userId) {
  const { error } = await supabase.from("rembrandt_project_revisions").insert({
    content,
    created_by: userId,
  });
  if (error) {
    if (error.code !== "42P01")
      console.warn("Project revision could not be stored:", error.message);
    return;
  }

  // Revision rows contain text and R2 URLs only, never image binaries. Keeping
  // the latest 30 prevents this safety net from growing without bounds.
  const { data: stale, error: listError } = await supabase
    .from("rembrandt_project_revisions")
    .select("id")
    .order("created_at", { ascending: false })
    .range(30, 199);
  if (listError || !stale?.length) return;
  const { error: deleteError } = await supabase
    .from("rembrandt_project_revisions")
    .delete()
    .in(
      "id",
      stale.map((revision) => revision.id),
    );
  if (deleteError)
    console.warn(
      "Old project revisions could not be pruned:",
      deleteError.message,
    );
}

export default async function handler(req, res) {
  if (!["GET", "POST"].includes(req.method))
    return sendJson(res, 405, { error: "Method Not Allowed" });
  const supabase = getServerSupabase();
  const authorization = await requireActiveAdmin(req, supabase);
  if (!authorization.ok)
    return sendJson(res, authorization.status, { error: authorization.error });

  try {
    if (req.method === "GET") {
      const revisionId = Array.isArray(req.query?.revisionId)
        ? req.query.revisionId[0]
        : req.query?.revisionId;
      if (revisionId) {
        if (!/^\d{1,19}$/.test(revisionId))
          throw new RequestError("Ongeldige revisiesleutel.", 400);
        const { data, error } = await supabase
          .from("rembrandt_project_revisions")
          .select("id, content, created_at")
          .eq("id", revisionId)
          .maybeSingle();
        if (error) throw error;
        if (!data)
          throw new RequestError("Deze revisie bestaat niet meer.", 404);
        return sendJson(res, 200, { ok: true, revision: data });
      }
      const [{ project, row }, revisions, access] = await Promise.all([
        readProject(supabase),
        listRevisions(supabase),
        readRembrandtProjectAccess(),
      ]);
      return sendJson(res, 200, {
        ok: true,
        project: { ...project, isEnabled: access.enabled === true && project.isEnabled === true },
        version: row?.updated_at || null,
        revisions,
      });
    }

    const project = req.body?.project;
    await validateProject(project);
    const { row: previous } = await readProject(supabase);
    const expectedVersion = req.body?.expectedVersion ?? null;
    const currentVersion = previous?.updated_at || null;
    if (expectedVersion !== currentVersion) {
      throw new RequestError(
        "Deze pagina werd intussen in een andere sessie gewijzigd. Herlaad eerst om de nieuwste versie te bekijken.",
        409,
      );
    }
    const updatedAt = new Date().toISOString();
    const nextProject = { ...project, updatedAt };
    let previousContentForRevision = null;

    if (previous) {
      const { data: savedRow, error: saveError } = await supabase
        .from("admin_settings")
        .update({ value: JSON.stringify(nextProject), updated_at: updatedAt })
        .eq("key", SETTING_KEY)
        .eq("updated_at", currentVersion)
        .select("key")
        .maybeSingle();
      if (saveError) throw saveError;
      if (!savedRow)
        throw new RequestError(
          "Deze pagina werd intussen in een andere sessie gewijzigd. Herlaad eerst om de nieuwste versie te bekijken.",
          409,
        );
      if (previous.value)
        previousContentForRevision = parseSetting(previous.value);
    } else {
      const { error: saveError } = await supabase
        .from("admin_settings")
        .insert({
          key: SETTING_KEY,
          value: JSON.stringify(nextProject),
          updated_at: updatedAt,
        });
      if (saveError?.code === "23505")
        throw new RequestError(
          "Deze pagina werd intussen in een andere sessie aangemaakt. Herlaad eerst.",
          409,
        );
      if (saveError) throw saveError;
    }

    try {
      if (nextProject.isEnabled !== true) {
        await writeRembrandtProjectAccess(false, updatedAt);
      }
      const publication = await publishPublicContentSnapshot(supabase);
      if (nextProject.isEnabled === true) {
        await writeRembrandtProjectAccess(true, updatedAt);
      }
      if (previousContentForRevision) {
        await storeRevision(
          supabase,
          previousContentForRevision,
          authorization.user.id,
        );
      }
      return sendJson(res, 200, {
        ok: true,
        project: nextProject,
        publishedAt: publication.snapshot.publishedAt,
        bytes: publication.bytes,
      });
    } catch (publishError) {
      if (previous) {
        await supabase
          .from("admin_settings")
          .update({ value: previous.value, updated_at: previous.updated_at })
          .eq("key", SETTING_KEY)
          .eq("updated_at", updatedAt);
      } else {
        await supabase
          .from("admin_settings")
          .delete()
          .eq("key", SETTING_KEY)
          .eq("updated_at", updatedAt);
      }
      await publishPublicContentSnapshot(supabase).catch(() => {});
      const previousProject = previous?.value ? parseSetting(previous.value) : null;
      await writeRembrandtProjectAccess(previousProject?.isEnabled === true).catch(() => {});
      throw publishError;
    }
  } catch (error) {
    console.error("Rembrandt Project request failed:", error);
    return sendJson(
      res,
      error instanceof RequestError ? error.status : 500,
      {
      error:
        error instanceof RequestError
          ? error.message
          : req.method === "POST"
            ? "Het project is niet gepubliceerd. Controleer de inhoud en afbeeldingen en probeer opnieuw."
            : "Het project kon niet worden geladen.",
      },
    );
  }
}
