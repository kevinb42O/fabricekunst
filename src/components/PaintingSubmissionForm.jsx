import React, { useId, useMemo, useState } from "react";
import {
  CheckCircle2,
  FileCheck2,
  Loader2,
  LockKeyhole,
  Paperclip,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { localizedProjectValue } from "../utils/rembrandtProject";
import { localizePath } from "../utils/locales";
import { savePaintingSubmissionAsync } from "../utils/storage";

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024;
const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const COPY = {
  nl: {
    contact: "Uw contactgegevens",
    painting: "Over het schilderij",
    documents: "Foto’s en documenten",
    name: "Naam",
    email: "E-mailadres",
    phone: "Telefoonnummer",
    country: "Land",
    title: "Titel of korte omschrijving",
    estimatedDate: "Vermoedelijke periode of datering",
    dimensions: "Exacte afmetingen",
    support: "Drager",
    supportPlaceholder: "Bijv. paneel, doek, koper of papier",
    provenance: "Bekende provenance",
    provenanceHint: "Beschrijf eerdere eigenaars, veilingen, etiketten of familiegeschiedenis.",
    signature: "Signatuur, datering, etiketten of opschriften",
    notes: "Aanvullende informatie",
    files: "Selecteer bestanden",
    filesHint: "JPG, PNG, WebP of PDF · maximaal 10 bestanden · 15 MB per bestand · 50 MB totaal",
    consent: "Ik bevestig dat ik deze gegevens en bestanden mag delen voor een vertrouwelijke eerste beoordeling. Ik begrijp dat een inzending geen authenticiteitsverklaring inhoudt.",
    submit: "Schilderij vertrouwelijk indienen",
    sending: "Beveiligd verzenden",
    uploading: (current, total) => `Bijlage ${current} van ${total} wordt beveiligd geüpload…`,
    submitting: "De inzending wordt vastgelegd…",
    successTitle: "Uw dossier is ontvangen",
    successText: "We beoordelen de beschikbare informatie vertrouwelijk en nemen contact op wanneer er voldoende aanwijzingen zijn voor een volgende stap.",
    reference: "Referentie",
    another: "Nog een schilderij indienen",
    required: "Vul alle verplichte velden in en bevestig de toestemming.",
    fileError: "Gebruik uitsluitend JPG, PNG, WebP of PDF binnen de vermelde limieten.",
    removeFile: "verwijderen",
    privacy: "Lees het privacybeleid",
  },
  en: {
    contact: "Your contact details",
    painting: "About the painting",
    documents: "Photographs and documents",
    name: "Name",
    email: "Email address",
    phone: "Telephone number",
    country: "Country",
    title: "Title or short description",
    estimatedDate: "Estimated period or date",
    dimensions: "Exact dimensions",
    support: "Support",
    supportPlaceholder: "For example panel, canvas, copper or paper",
    provenance: "Known provenance",
    provenanceHint: "Describe previous owners, auctions, labels or family history.",
    signature: "Signature, date, labels or inscriptions",
    notes: "Additional information",
    files: "Select files",
    filesHint: "JPG, PNG, WebP or PDF · up to 10 files · 15 MB per file · 50 MB total",
    consent: "I confirm that I may share these details and files for a confidential initial assessment. I understand that a submission does not constitute a statement of authenticity.",
    submit: "Submit painting confidentially",
    sending: "Sending securely",
    uploading: (current, total) => `Uploading attachment ${current} of ${total} securely…`,
    submitting: "Recording your submission…",
    successTitle: "Your case has been received",
    successText: "We will review the available information confidentially and contact you if there are sufficient indications for a next step.",
    reference: "Reference",
    another: "Submit another painting",
    required: "Complete all required fields and confirm your consent.",
    fileError: "Please use only JPG, PNG, WebP or PDF files within the stated limits.",
    removeFile: "remove",
    privacy: "Read the privacy notice",
  },
  fr: {
    contact: "Vos coordonnées",
    painting: "À propos du tableau",
    documents: "Photographies et documents",
    name: "Nom",
    email: "Adresse e-mail",
    phone: "Numéro de téléphone",
    country: "Pays",
    title: "Titre ou courte description",
    estimatedDate: "Période ou date présumée",
    dimensions: "Dimensions exactes",
    support: "Support",
    supportPlaceholder: "Par exemple panneau, toile, cuivre ou papier",
    provenance: "Provenance connue",
    provenanceHint: "Décrivez les anciens propriétaires, ventes, étiquettes ou l’histoire familiale.",
    signature: "Signature, date, étiquettes ou inscriptions",
    notes: "Informations complémentaires",
    files: "Sélectionner des fichiers",
    filesHint: "JPG, PNG, WebP ou PDF · 10 fichiers maximum · 15 Mo par fichier · 50 Mo au total",
    consent: "Je confirme être autorisé à partager ces données et fichiers pour une première évaluation confidentielle. Je comprends qu’une soumission ne constitue pas une déclaration d’authenticité.",
    submit: "Soumettre le tableau confidentiellement",
    sending: "Envoi sécurisé",
    uploading: (current, total) => `Téléversement sécurisé de la pièce ${current} sur ${total}…`,
    submitting: "Enregistrement de votre soumission…",
    successTitle: "Votre dossier a été reçu",
    successText: "Nous examinerons les informations disponibles en toute confidentialité et vous contacterons si les indices justifient une étape suivante.",
    reference: "Référence",
    another: "Soumettre un autre tableau",
    required: "Complétez tous les champs obligatoires et confirmez votre consentement.",
    fileError: "Utilisez uniquement des fichiers JPG, PNG, WebP ou PDF respectant les limites indiquées.",
    removeFile: "supprimer",
    privacy: "Lire la politique de confidentialité",
  },
};

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  country: "",
  paintingTitle: "",
  estimatedDate: "",
  dimensions: "",
  support: "",
  provenance: "",
  signature: "",
  notes: "",
  consent: false,
};

function InputField({ label, required = false, hint, children }) {
  return (
    <label className="lost-submission__field">
      <span>
        {label}
        {required && <b aria-hidden="true">*</b>}
        {required && <span className="sr-only"> (required)</span>}
      </span>
      {hint && <small>{hint}</small>}
      {children}
    </label>
  );
}

export default function PaintingSubmissionForm({ language = "en", settings = {} }) {
  const labels = COPY[language] || COPY.en;
  const inputId = useId();
  const [form, setForm] = useState(INITIAL_FORM);
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const checklist = localizedProjectValue(settings.submissionChecklist, language, []);
  const totalBytes = useMemo(
    () => files.reduce((sum, file) => sum + file.size, 0),
    [files],
  );

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const addFiles = (event) => {
    const additions = Array.from(event.target.files || []);
    const next = [...files, ...additions].slice(0, 10);
    const valid =
      additions.every((file) => ACCEPTED_TYPES.has(file.type) && file.size <= MAX_FILE_BYTES) &&
      next.reduce((sum, file) => sum + file.size, 0) <= MAX_TOTAL_BYTES;
    if (!valid || files.length + additions.length > 10) {
      setError(labels.fileError);
      event.target.value = "";
      return;
    }
    setError("");
    setFiles(next);
    event.target.value = "";
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
    if (!form.name.trim() || !emailIsValid || !form.paintingTitle.trim() || !form.dimensions.trim() || !form.support.trim() || files.length < 1 || !form.consent) {
      setError(labels.required);
      return;
    }
    setStatus("sending");
    try {
      const result = await savePaintingSubmissionAsync(
        { ...form, preferredLanguage: language },
        files,
        setProgress,
      );
      setReference(result.id);
      setStatus("success");
    } catch (submissionError) {
      setError(submissionError.message || labels.required);
      setStatus("idle");
    }
  };

  if (status === "success") {
    return (
      <div className="lost-submission__success" role="status" aria-live="polite">
        <CheckCircle2 aria-hidden="true" />
        <h3>{labels.successTitle}</h3>
        <p>{labels.successText}</p>
        <small>{labels.reference}: {reference}</small>
        <button
          type="button"
          onClick={() => {
            setForm(INITIAL_FORM);
            setFiles([]);
            setReference("");
            setProgress(null);
            setStatus("idle");
          }}
        >
          {labels.another}
        </button>
      </div>
    );
  }

  return (
    <form className="lost-submission" onSubmit={submit} noValidate>
      <div className="lost-submission__trust">
        <LockKeyhole aria-hidden="true" />
        <div>
          <strong>{localizedProjectValue(settings.confidentialityTitle, language)}</strong>
          <p>{localizedProjectValue(settings.confidentialityText, language)}</p>
        </div>
      </div>

      <fieldset>
        <legend><span>01</span>{labels.contact}</legend>
        <div className="lost-submission__grid">
          <InputField label={labels.name} required>
            <input value={form.name} onChange={(event) => update("name", event.target.value)} autoComplete="name" required />
          </InputField>
          <InputField label={labels.email} required>
            <input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} autoComplete="email" required />
          </InputField>
          <InputField label={labels.phone}>
            <input type="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} autoComplete="tel" />
          </InputField>
          <InputField label={labels.country}>
            <input value={form.country} onChange={(event) => update("country", event.target.value)} autoComplete="country-name" />
          </InputField>
        </div>
      </fieldset>

      <fieldset>
        <legend><span>02</span>{labels.painting}</legend>
        <div className="lost-submission__grid">
          <InputField label={labels.title} required>
            <input value={form.paintingTitle} onChange={(event) => update("paintingTitle", event.target.value)} required />
          </InputField>
          <InputField label={labels.estimatedDate}>
            <input value={form.estimatedDate} onChange={(event) => update("estimatedDate", event.target.value)} />
          </InputField>
          <InputField label={labels.dimensions} required>
            <input value={form.dimensions} onChange={(event) => update("dimensions", event.target.value)} placeholder="H × W × D" required />
          </InputField>
          <InputField label={labels.support} required>
            <input value={form.support} onChange={(event) => update("support", event.target.value)} placeholder={labels.supportPlaceholder} required />
          </InputField>
          <InputField label={labels.provenance} hint={labels.provenanceHint}>
            <textarea rows="5" value={form.provenance} onChange={(event) => update("provenance", event.target.value)} />
          </InputField>
          <InputField label={labels.signature}>
            <textarea rows="5" value={form.signature} onChange={(event) => update("signature", event.target.value)} />
          </InputField>
          <InputField label={labels.notes}>
            <textarea rows="5" value={form.notes} onChange={(event) => update("notes", event.target.value)} />
          </InputField>
        </div>
      </fieldset>

      <fieldset>
        <legend><span>03</span>{labels.documents}</legend>
        {Array.isArray(checklist) && checklist.length > 0 && (
          <ul className="lost-submission__checklist">
            {checklist.filter(Boolean).map((item) => (
              <li key={item}><FileCheck2 aria-hidden="true" />{item}</li>
            ))}
          </ul>
        )}
        <label className="lost-submission__drop" htmlFor={inputId}>
          <Upload aria-hidden="true" />
          <strong>{labels.files}<b aria-hidden="true">*</b></strong>
          <small>{labels.filesHint}</small>
          <input id={inputId} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple required onChange={addFiles} />
        </label>
        {files.length > 0 && (
          <div className="lost-submission__files" aria-live="polite">
            {files.map((file, index) => (
              <div key={`${file.name}-${file.size}-${index}`}>
                <Paperclip aria-hidden="true" />
                <span>{file.name}<small>{(file.size / 1024 / 1024).toFixed(1)} MB</small></span>
                <button type="button" onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} aria-label={`${file.name} — ${labels.removeFile}`}>
                  <X aria-hidden="true" />
                </button>
              </div>
            ))}
            <small>{(totalBytes / 1024 / 1024).toFixed(1)} MB</small>
          </div>
        )}
      </fieldset>

      <p className="lost-submission__notice"><ShieldCheck aria-hidden="true" />{localizedProjectValue(settings.submissionNotice, language)}</p>
      <label className="lost-submission__consent">
        <input type="checkbox" checked={form.consent} onChange={(event) => update("consent", event.target.checked)} required />
        <span>{labels.consent}</span>
      </label>
      <a className="lost-submission__privacy" href={localizePath("/privacy", language)}>{labels.privacy}</a>
      {error && <p className="lost-submission__error" role="alert">{error}</p>}
      {status === "sending" && (
        <p className="lost-submission__progress" role="status" aria-live="polite">
          <Loader2 aria-hidden="true" />
          {progress?.phase === "uploading"
            ? labels.uploading(progress.current, progress.total)
            : labels.submitting}
        </p>
      )}
      <button className="lost-submission__submit" type="submit" disabled={status === "sending"}>
        {status === "sending" ? <><Loader2 aria-hidden="true" />{labels.sending}</> : <><LockKeyhole aria-hidden="true" />{labels.submit}</>}
      </button>
    </form>
  );
}
