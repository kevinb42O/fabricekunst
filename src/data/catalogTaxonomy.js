const label = (nl, en, fr) => ({ nl, en, fr });

export const COLLECTION_GROUPS = [
  { slug: 'books', labels: label('Boeken', 'Books', 'Livres') },
  { slug: 'art', labels: label('Kunst', 'Art', 'Art') },
  {
    slug: 'historical-objects',
    labels: label('Historische objecten', 'Historical Objects', 'Objets historiques')
  }
];

export const ITEM_TYPES = [
  {
    slug: 'book',
    collectionGroup: 'books',
    labels: label('Antiquarisch boek', 'Antiquarian Book', 'Livre ancien'),
    shortLabels: label('Boek', 'Book', 'Livre'),
    defaultCategory: 'literature-philosophy',
    fieldLabels: {
      title: 'Titel van het boek',
      author: 'Auteur / Schrijver',
      publisher: 'Drukker / Uitgever',
      city: 'Plaats van uitgave',
      binding: 'Bandstijl',
      dimensions: 'Formaat & Afmetingen',
      collationSpecs: 'Collatie & Specificaties',
      conditionReport: 'Uitgebreid conditierapport',
      section: 'Bandstijl, Conditie & Formaat'
    }
  },
  {
    slug: 'painting',
    collectionGroup: 'art',
    labels: label('Schilderij & kunst', 'Painting & Art', 'Peinture & Art'),
    shortLabels: label('Kunst', 'Art', 'Art'),
    defaultCategory: 'old-masters',
    fieldLabels: {
      title: 'Titel van het schilderij / kunstwerk',
      author: 'Kunstenaar / Meester',
      publisher: 'Galerie / Atelier / Werkplaats',
      city: 'Plaats van ontstaan',
      binding: 'Lijst & Inlijsting',
      dimensions: 'Afmetingen (werk & lijst)',
      collationSpecs: 'Signatuur & Medium',
      conditionReport: 'Restauratie & Conditierapport',
      section: 'Techniek & Inlijsting'
    }
  },
  {
    slug: 'sword',
    collectionGroup: 'historical-objects',
    labels: label('Japanse kunst', 'Japanese Art', 'Art japonais'),
    shortLabels: label('Japanse kunst', 'Japanese Art', 'Art japonais'),
    defaultCategory: 'japanese-swords',
    fieldLabels: {
      title: 'Naam / Omschrijving van het kunstobject',
      author: 'Kunstenaar / Maker / School',
      publisher: 'Periode / Traditie',
      city: 'Plaats van oorsprong / vervaardiging',
      binding: 'Materialen & Uitvoering',
      dimensions: 'Afmetingen',
      collationSpecs: 'Signatuur & Technische Specificaties',
      conditionReport: 'Uitgebreid conditierapport',
      section: 'Materialen, Uitvoering & Conditie'
    }
  },
  {
    slug: 'historical-object',
    collectionGroup: 'historical-objects',
    labels: label('Historisch object', 'Historical Object', 'Objet historique'),
    shortLabels: label('Object', 'Object', 'Objet'),
    defaultCategory: 'other-historical-objects',
    fieldLabels: {
      title: 'Naam / Omschrijving van het object',
      author: 'Maker / Atelier',
      publisher: 'Traditie / Werkplaats',
      city: 'Plaats van vervaardiging',
      binding: 'Materiaal & Uitvoering',
      dimensions: 'Afmetingen',
      collationSpecs: 'Kenmerken & Specificaties',
      conditionReport: 'Uitgebreid conditierapport',
      section: 'Materiaal, Uitvoering & Conditie'
    }
  }
];

export const CATEGORIES = [
  { slug: 'literature-philosophy', group: 'books', labels: label('Literatuur & Filosofie', 'Literature & Philosophy', 'Littérature & Philosophie') },
  { slug: 'literature-satire', group: 'books', labels: label('Literatuur & Satire', 'Literature & Satire', 'Littérature & Satire') },
  { slug: 'science-illustrations', group: 'books', labels: label('Wetenschap & Illustraties', 'Science & Illustrations', 'Science & Illustrations') },
  { slug: 'cartography-travel', group: 'books', labels: label('Kartografie & Reizen', 'Cartography & Travel', 'Cartographie & Voyages') },
  { slug: 'bibles-religion', group: 'books', labels: label('Bijbels & Religie', 'Bibles & Religion', 'Bibles & Religion') },
  { slug: 'classical-antiquity', group: 'books', labels: label('Klassieke Oudheid', 'Classical Antiquity', 'Antiquité classique') },
  { slug: 'old-masters', group: 'art', labels: label('Oude Meesters', 'Old Masters', 'Maîtres anciens') },
  { slug: '19th-century-painting', group: 'art', labels: label('19e-Eeuwse Schilderkunst', '19th-Century Painting', 'Peinture du XIXe siècle') },
  { slug: 'portraits-miniatures', group: 'art', labels: label('Portretten & Miniaturen', 'Portraits & Miniatures', 'Portraits & Miniatures') },
  { slug: 'still-lifes-landscapes', group: 'art', labels: label('Stillevens & Landschappen', 'Still Lifes & Landscapes', 'Natures mortes & Paysages') },
  { slug: 'religious-art-icons', group: 'art', labels: label('Religieuze Kunst & Iconen', 'Religious Art & Icons', 'Art religieux & Icônes') },
  { slug: 'prints-drawings', group: 'art', labels: label('Grafiek & Tekeningen', 'Prints & Drawings', 'Estampes & Dessins') },
  { slug: 'japanese-swords', group: 'historical-objects', labels: label('Japanse kunst', 'Japanese Art', 'Art japonais') },
  { slug: 'other-historical-objects', group: 'historical-objects', labels: label('Overige historische objecten', 'Other Historical Objects', 'Autres objets historiques') }
];

const DETAIL_LABELS = {
  book: {
    descriptionSection: label('Beschrijving & Bibliografie', 'Description & Bibliography', 'Description & Bibliographie'),
    maker: label('Auteur', 'Author', 'Auteur'),
    publisher: label('Drukker / Uitgever', 'Printer / Publisher', 'Imprimeur / Éditeur'),
    city: label('Plaats van uitgave', 'Place of Publication', 'Lieu de publication'),
    physicalSection: label('Band & Conditierapport', 'Binding & Condition Report', 'Reliure & Rapport d’état'),
    binding: label('Boekband & Materialen', 'Binding & Materials', 'Reliure & Matériaux'),
    conditionReport: label('Papier- & Bandanalyse', 'Paper & Binding Analysis', 'Analyse du papier & de la reliure'),
    specifications: label('Collatie & Formaat', 'Collation & Format', 'Collation & Format')
  },
  painting: {
    descriptionSection: label('Beschrijving', 'Description', 'Description'),
    maker: label('Kunstenaar', 'Artist', 'Artiste'),
    publisher: label('Techniek / Medium', 'Technique / Medium', 'Technique / Médium'),
    city: label('Plaats van ontstaan', 'Place of Origin', 'Lieu de création'),
    physicalSection: label('Conditie & Restauratie', 'Condition & Restoration', 'État & Restauration'),
    binding: label('Lijst & Inlijsting', 'Frame & Framing', 'Cadre & Encadrement'),
    conditionReport: label('Doek- & Restauratierapport', 'Canvas & Restoration Report', 'Rapport de toile & restauration'),
    specifications: label('Signatuur & Medium', 'Signature & Medium', 'Signature & Médium')
  },
  sword: {
    descriptionSection: label('Beschrijving', 'Description', 'Description'),
    maker: label('Kunstenaar / Maker / School', 'Artist / Maker / School', 'Artiste / Créateur / École'),
    publisher: label('Periode / Traditie', 'Period / Tradition', 'Période / Tradition'),
    city: label('Plaats van oorsprong / vervaardiging', 'Place of Origin / Manufacture', 'Lieu d’origine / de fabrication'),
    physicalSection: label('Materialen, Uitvoering & Conditie', 'Materials, Construction & Condition', 'Matériaux, Fabrication & État'),
    binding: label('Materialen & Uitvoering', 'Materials & Construction', 'Matériaux & Fabrication'),
    conditionReport: label('Uitgebreid conditierapport', 'Detailed Condition Report', 'Rapport d’état détaillé'),
    specifications: label('Signatuur & Technische Specificaties', 'Signature & Technical Specifications', 'Signature & Spécifications techniques')
  },
  'historical-object': {
    descriptionSection: label('Beschrijving', 'Description', 'Description'),
    maker: label('Maker / Atelier', 'Maker / Workshop', 'Créateur / Atelier'),
    publisher: label('Traditie / Werkplaats', 'Tradition / Workshop', 'Tradition / Atelier'),
    city: label('Plaats van vervaardiging', 'Place of Manufacture', 'Lieu de fabrication'),
    physicalSection: label('Materiaal, Uitvoering & Conditie', 'Material, Construction & Condition', 'Matériau, Fabrication & État'),
    binding: label('Materiaal & Uitvoering', 'Material & Construction', 'Matériau & Fabrication'),
    conditionReport: label('Uitgebreid conditierapport', 'Detailed Condition Report', 'Rapport d’état détaillé'),
    specifications: label('Kenmerken & Specificaties', 'Features & Specifications', 'Caractéristiques & Spécifications')
  }
};

const normalizeLanguage = (language) => ['nl', 'en', 'fr'].includes(language) ? language : 'nl';
const normalizeValue = (value) => String(value || '').trim().toLowerCase();

const categoryAliases = new Map();
CATEGORIES.forEach((category) => {
  categoryAliases.set(normalizeValue(category.slug), category.slug);
  Object.values(category.labels).forEach((categoryLabel) => {
    categoryAliases.set(normalizeValue(categoryLabel), category.slug);
  });
});

export function getLocalizedLabel(entry, language = 'nl') {
  if (!entry) return '';
  const normalizedLanguage = normalizeLanguage(language);
  return entry.labels?.[normalizedLanguage] || entry.labels?.nl || entry.slug || '';
}

export function getCollectionGroupDefinition(slug) {
  return COLLECTION_GROUPS.find((group) => group.slug === slug);
}

export function getItemTypeDefinition(type = 'book') {
  return ITEM_TYPES.find((itemType) => itemType.slug === type)
    || ITEM_TYPES.find((itemType) => itemType.slug === 'historical-object');
}

export function getCategorySlug(value) {
  return categoryAliases.get(normalizeValue(value)) || String(value || '').trim();
}

export function getCategoryDefinition(value) {
  const slug = getCategorySlug(value);
  return CATEGORIES.find((category) => category.slug === slug);
}

export function isLikelyJapaneseSword(item) {
  const itemType = item?.itemType || item?.item_type;
  if (itemType === 'book') return false;

  const searchText = [item?.title, item?.subtitle, item?.category, item?.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return /\b(katana|nihonto|nihontō|wakizashi|tanto|tantō)\b/i.test(searchText);
}

export function normalizeCatalogItemTaxonomy(item) {
  if (isLikelyJapaneseSword(item)) {
    return {
      ...item,
      itemType: 'sword',
      collectionGroup: 'historical-objects',
      category: 'japanese-swords'
    };
  }

  const normalizedItem = {
    ...item,
    category: getCategorySlug(item?.category)
  };

  return {
    ...normalizedItem,
    collectionGroup: getCollectionGroupForItem(normalizedItem)
  };
}

export function getCollectionGroupForItem(item) {
  const explicitGroup = item?.collectionGroup || item?.collection_group;
  if (getCollectionGroupDefinition(explicitGroup)) return explicitGroup;

  const rawItemType = item?.itemType || item?.item_type;
  const configuredItemType = ITEM_TYPES.find((itemType) => itemType.slug === rawItemType);
  if (configuredItemType) return configuredItemType.collectionGroup;

  const categoryGroup = getCategoryDefinition(item?.category)?.group;
  if (categoryGroup) return categoryGroup;

  return 'books';
}

export function getCategoriesForGroup(group) {
  return CATEGORIES.filter((category) => category.group === group);
}

export function getLocalizedCollectionGroup(group, language = 'nl') {
  return getLocalizedLabel(getCollectionGroupDefinition(group), language) || group;
}

export function getLocalizedItemType(type, language = 'nl', short = false) {
  const definition = getItemTypeDefinition(type);
  const labels = short ? definition?.shortLabels : definition?.labels;
  return labels?.[normalizeLanguage(language)] || labels?.nl || type;
}

export function getLocalizedItemDetailLabels(type, language = 'nl') {
  const normalizedLanguage = normalizeLanguage(language);
  const labels = DETAIL_LABELS[type] || DETAIL_LABELS['historical-object'];

  return Object.fromEntries(
    Object.entries(labels).map(([key, translations]) => [key, translations[normalizedLanguage] || translations.nl])
  );
}

export function getLocalizedCategoryLabel(value, language = 'nl') {
  const definition = getCategoryDefinition(value);
  return definition ? getLocalizedLabel(definition, language) : String(value || '');
}