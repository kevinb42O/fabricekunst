import { getItemField, getLocalizedCentury } from './translationService.js';

export const CERTIFICATE_TEXTS = {
    nl: {
      documentTitle: "CERTIFICAAT VAN ECHTHEID",
      subTitle: "Gewaarborgde Echtheidsverklaring & Historisch Herkomstdocument",
      issuedFor: "Gecertificeerd voor",
      certNo: "Certificaat Nr.",
      date: "Datum van uitgifte",
      itemTitle: "Titel / Omschrijving",
      authorPublisher: "Maker / Auteur / Atelier",
      period: "Datering / Eeuw",
      bindingMedium: "Materiaal / Uitvoering",
      dimensions: "Formaat & Afmetingen",
      provenance: "Geverifieerde Herkomst (Provenance)",
      guaranteeHeader: "ECHTHEIDSGARANTIE",
      guaranteeText: "Ondergetekende, namens Atelier Rembrandt, verklaart dat het hierboven beschreven antiquarische object grondig is onderzocht en in al zijn onderdelen 100% authentiek is bevonden. De vermelde herkomst, binding, drukgegevens en fysieke kenmerken komen overeen met de historische catalogisering.",
      expertTitle: "Expert Boeken, Kunst & Historische Objecten",
      galleryLocation: "ATELIER REMBRANDT",
      verifyNotice: "Geregistreerd in het archief van Atelier Rembrandt onder de bovenstaande unieke referentie."
    },
    fr: {
      documentTitle: "CERTIFICAT D'AUTHENTICITÉ",
      subTitle: "Attestation d'Authenticité & Provenance Historique Certifiée",
      issuedFor: "Délivré à l'attention de",
      certNo: "N° de Certificat",
      date: "Date d'émission",
      itemTitle: "Titre / Description",
      authorPublisher: "Créateur / Auteur / Atelier",
      period: "Datation / Époque",
      bindingMedium: "Matériau / Fabrication",
      dimensions: "Collation & Dimensions",
      provenance: "Provenance Historique Vérifiée",
      guaranteeHeader: "GARANTIE D'AUTHENTICITÉ",
      guaranteeText: "Le soussigné, pour le compte d'Atelier Rembrandt, certifie que l'œuvre antiquaire décrite ci-dessus a fait l'objet d'un examen approfondi et est garantie 100% authentique. Les spécifications de reliure, d'impression et de provenance sont rigoureusement conformes à nos recherches bibliographiques.",
      expertTitle: "Expert en Livres Rares, Art & Objets Historiques",
      galleryLocation: "ATELIER REMBRANDT",
      verifyNotice: "Ce certificat est immatriculé dans les archives de l'Atelier Rembrandt sous la référence unique ci-dessus."
    },
    en: {
      documentTitle: "CERTIFICATE OF AUTHENTICITY",
      subTitle: "Official Statement of Authenticity & Historical Provenance",
      issuedFor: "Issued to",
      certNo: "Certificate No.",
      date: "Date of Issue",
      itemTitle: "Title / Description",
      authorPublisher: "Maker / Author / Workshop",
      period: "Date / Period",
      bindingMedium: "Material / Construction",
      dimensions: "Collation & Dimensions",
      provenance: "Verified Provenance",
      guaranteeHeader: "GUARANTEE OF AUTHENTICITY",
      guaranteeText: "The undersigned, on behalf of Atelier Rembrandt, hereby guarantees that the antiquarian item described above has been thoroughly examined and verified as 100% genuine and authentic in all respects, matching the cataloged provenance and binding details.",
      expertTitle: "Expert in Rare Books, Fine Art & Antiquities",
      galleryLocation: "ATELIER REMBRANDT",
      verifyNotice: "Officially registered in the archives of Atelier Rembrandt under the unique reference code above."
    }
  };

export const CERTIFICATE_LANGUAGES = ['nl', 'fr', 'en'];
export const CERTIFICATE_FIELDS = [
  'certNumber', 'issuedTo', 'certDate', 'customTitle', 'customSubtitle',
  'customAuthor', 'customPublisher', 'customYear', 'customBinding',
  'customDimensions', 'customProvenance', 'customNotes', 'customGuaranteeText',
];
export const CERTIFICATE_OPTIONS = ['showImage', 'showSeal', 'showSignature'];
export const certificateDraftKey = (itemId, language) => `certificate_draft_${itemId}_${language}`;

export function normalizeCertificateDraft(value) {
  return {
    ...Object.fromEntries(CERTIFICATE_FIELDS.map(field => [field, typeof value?.[field] === 'string' ? value[field] : ''])),
    ...Object.fromEntries(CERTIFICATE_OPTIONS.map(field => [field, value?.[field] !== false])),
  };
}

export function createCertificateDraft(item, language, date = new Date()) {
  const copy = CERTIFICATE_TEXTS[language] || CERTIFICATE_TEXTS.nl;
  const field = name => getItemField(item, name, language);
  const ref = item?.ref ? item.ref.replace('FB-', '') : `${date.getFullYear()}-1042`;
  return normalizeCertificateDraft({
    certNumber: `COA-FB-${ref}`,
    issuedTo: { nl: 'Particuliere Collectie', fr: 'Collection privée', en: 'Private Collection' }[language] || 'Particuliere Collectie',
    certDate: date.toLocaleDateString({ nl: 'nl-BE', fr: 'fr-BE', en: 'en-GB' }[language] || 'nl-BE', { year: 'numeric', month: 'long', day: 'numeric' }),
    customTitle: field('title'),
    customSubtitle: field('subtitle'),
    customAuthor: field('author'),
    customPublisher: field('publisher'),
    customYear: String(item?.year || getLocalizedCentury(item?.century, language) || ''),
    customBinding: field('binding'),
    customDimensions: field('dimensions'),
    customProvenance: field('provenance'),
    customGuaranteeText: copy.guaranteeText,
  });
}
