import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  Landmark,
  LayoutGrid,
  Palette,
  RotateCcw,
  Rows3,
  Search,
  X
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import {
  COLLECTION_GROUPS,
  ITEM_TYPES,
  getCategorySlug,
  getCollectionGroupForItem,
  getLocalizedCollectionGroup,
  getLocalizedItemType
} from '../data/catalogTaxonomy';
import {
  getItemField,
  getLocalizedCategory,
  getLocalizedCentury,
  getLocalizedPrice,
  getLocalizedStatus
} from '../utils/translationService';

const DEFAULT_FILTER_VALUE = 'Alle';
const DEFAULT_VIEW_MODE = 'grid';
const VALID_VIEW_MODES = ['grid', 'editorial'];
const STATUS_ORDER = ['Beschikbaar', 'Gereserveerd', 'Verkocht'];

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function extractYearNumber(value) {
  const match = String(value || '').match(/\d{4}/);
  return match ? Number(match[0]) : 0;
}

function getTypeValue(item) {
  return item?.itemType || 'book';
}

function getTypeIcon(type) {
  if (type === 'painting') return Palette;
  if (type === 'book') return BookOpen;
  return Landmark;
}

function getUniqueValues(items, selector) {
  const seen = new Set();
  const values = [];

  items.forEach((item) => {
    const value = selector(item);
    if (!value || seen.has(value)) return;
    seen.add(value);
    values.push(value);
  });

  return values;
}

function buildSearchDocument(item) {
  return normalizeText(
    [
      item.ref,
      item.title,
      item.title_en,
      item.title_fr,
      item.subtitle,
      item.subtitle_en,
      item.subtitle_fr,
      item.description,
      item.description_en,
      item.description_fr,
      item.author,
      item.publisher,
      item.city,
      item.year,
      item.category,
      item.century,
      item.status,
      item.provenance,
      item.provenance_en,
      item.provenance_fr,
      item.binding,
      item.binding_en,
      item.binding_fr
    ]
      .filter(Boolean)
      .join(' ')
  );
}

function matchesFilters(item, filters, ignoredKey = null) {
  const normalizedQuery = normalizeText(filters.query);

  if (ignoredKey !== 'query' && normalizedQuery && !item.searchDocument.includes(normalizedQuery)) {
    return false;
  }

  if (ignoredKey !== 'type' && filters.type !== DEFAULT_FILTER_VALUE && item.typeValue !== filters.type) {
    return false;
  }

  if (ignoredKey !== 'group' && filters.group !== DEFAULT_FILTER_VALUE && item.collectionGroupValue !== filters.group) {
    return false;
  }

  if (ignoredKey !== 'status' && filters.status !== DEFAULT_FILTER_VALUE && item.status !== filters.status) {
    return false;
  }

  if (ignoredKey !== 'century' && filters.century !== DEFAULT_FILTER_VALUE && item.century !== filters.century) {
    return false;
  }

  if (ignoredKey !== 'category' && filters.category !== DEFAULT_FILTER_VALUE && item.categorySlug !== filters.category) {
    return false;
  }

  return true;
}

function countBy(items, selector) {
  return items.reduce((accumulator, item) => {
    const value = selector(item);
    accumulator[value] = (accumulator[value] || 0) + 1;
    return accumulator;
  }, {});
}

function getPrimaryMeta(item) {
  return [item.author, item.year].filter(Boolean).join(' • ');
}

function getSecondaryMeta(item) {
  if (getTypeValue(item) === 'painting') {
    return item.publisher || item.city || '';
  }

  return [item.publisher, item.city].filter(Boolean).join(' • ');
}

function getInitialParam(name, fallback = '') {
  if (typeof window === 'undefined') return fallback;
  return new URLSearchParams(window.location.search).get(name) || fallback;
}

function getInitialViewMode() {
  const viewMode = getInitialParam('view', DEFAULT_VIEW_MODE);
  return VALID_VIEW_MODES.includes(viewMode) ? viewMode : DEFAULT_VIEW_MODE;
}

function getStatusTone(status) {
  switch (status) {
    case 'Beschikbaar':
      return {
        text: 'text-emerald-700',
        dot: 'bg-emerald-600'
      };
    case 'Gereserveerd':
      return {
        text: 'text-amber-700',
        dot: 'bg-amber-600'
      };
    case 'Verkocht':
      return {
        text: 'text-stone-500',
        dot: 'bg-stone-400'
      };
    default:
      return {
        text: 'text-[#777777]',
        dot: 'bg-[#B8860B]'
      };
  }
}

function getStatusOrderIndex(status) {
  const index = STATUS_ORDER.indexOf(status);
  return index === -1 ? STATUS_ORDER.length : index;
}

export default function CatalogPage({ items, onNavigateHome, onOpenItemDetail, onRequestInquiry }) {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState(() => getInitialParam('q', ''));
  const [selectedGroup, setSelectedGroup] = useState(() => getInitialParam('group', DEFAULT_FILTER_VALUE));
  const [selectedType, setSelectedType] = useState(() => {
    const initialType = getInitialParam('type', DEFAULT_FILTER_VALUE);
    return initialType === 'sword' ? DEFAULT_FILTER_VALUE : initialType;
  });
  const [selectedStatus, setSelectedStatus] = useState(() => getInitialParam('status', DEFAULT_FILTER_VALUE));
  const [selectedCentury, setSelectedCentury] = useState(() => getInitialParam('century', DEFAULT_FILTER_VALUE));
  const [selectedCategory, setSelectedCategory] = useState(() => {
    const category = getInitialParam('category', DEFAULT_FILTER_VALUE);
    return category === DEFAULT_FILTER_VALUE ? category : getCategorySlug(category);
  });
  const [sortBy, setSortBy] = useState(() => getInitialParam('sort', 'standaard'));
  const [viewMode, setViewMode] = useState(getInitialViewMode);

  const normalizedItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        typeValue: getTypeValue(item),
        collectionGroupValue: getCollectionGroupForItem(item),
        categorySlug: getCategorySlug(item.category),
        sortYear: extractYearNumber(item.year),
        searchDocument: buildSearchDocument(item)
      })),
    [items]
  );

  const typeOptions = useMemo(() => {
    const discoveredTypes = getUniqueValues(normalizedItems, (item) => item.typeValue)
      .filter((type) => type !== 'sword');
    const configuredTypes = ITEM_TYPES.map((type) => type.slug).filter((type) => discoveredTypes.includes(type));
    const customTypes = discoveredTypes.filter((type) => !configuredTypes.includes(type));
    return [DEFAULT_FILTER_VALUE, ...configuredTypes, ...customTypes];
  }, [normalizedItems]);

  const groupOptions = useMemo(() => {
    const discoveredGroups = getUniqueValues(normalizedItems, (item) => item.collectionGroupValue);
    const configuredGroups = COLLECTION_GROUPS.map((group) => group.slug).filter((group) => discoveredGroups.includes(group));
    const customGroups = discoveredGroups.filter((group) => !configuredGroups.includes(group));
    return [DEFAULT_FILTER_VALUE, ...configuredGroups, ...customGroups];
  }, [normalizedItems]);

  const statusOptions = useMemo(() => {
    const discoveredStatuses = getUniqueValues(normalizedItems, (item) => item.status);
    const orderedStatuses = STATUS_ORDER.filter((status) => discoveredStatuses.includes(status));
    return [DEFAULT_FILTER_VALUE, ...orderedStatuses];
  }, [normalizedItems]);

  const centuryOptions = useMemo(
    () => [
      DEFAULT_FILTER_VALUE,
      ...getUniqueValues(normalizedItems, (item) => item.century).sort((left, right) => extractYearNumber(left) - extractYearNumber(right))
    ],
    [normalizedItems]
  );

  const categoryOptions = useMemo(
    () => [DEFAULT_FILTER_VALUE, ...getUniqueValues(normalizedItems, (item) => item.categorySlug)],
    [normalizedItems]
  );

  useEffect(() => {
    if (selectedGroup !== DEFAULT_FILTER_VALUE && !groupOptions.includes(selectedGroup)) {
      setSelectedGroup(DEFAULT_FILTER_VALUE);
    }
  }, [selectedGroup, groupOptions]);

  useEffect(() => {
    if (selectedType !== DEFAULT_FILTER_VALUE && !typeOptions.includes(selectedType)) {
      setSelectedType(DEFAULT_FILTER_VALUE);
    }
  }, [selectedType, typeOptions]);

  useEffect(() => {
    if (selectedStatus !== DEFAULT_FILTER_VALUE && !statusOptions.includes(selectedStatus)) {
      setSelectedStatus(DEFAULT_FILTER_VALUE);
    }
  }, [selectedStatus, statusOptions]);

  useEffect(() => {
    if (selectedCentury !== DEFAULT_FILTER_VALUE && !centuryOptions.includes(selectedCentury)) {
      setSelectedCentury(DEFAULT_FILTER_VALUE);
    }
  }, [selectedCentury, centuryOptions]);

  useEffect(() => {
    if (selectedCategory !== DEFAULT_FILTER_VALUE && !categoryOptions.includes(selectedCategory)) {
      setSelectedCategory(DEFAULT_FILTER_VALUE);
    }
  }, [selectedCategory, categoryOptions]);

  useEffect(() => {
    if (!VALID_VIEW_MODES.includes(viewMode)) {
      setViewMode(DEFAULT_VIEW_MODE);
    }
  }, [viewMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams();
    const trimmedSearch = searchQuery.trim();

    if (trimmedSearch) params.set('q', trimmedSearch);
    if (selectedGroup !== DEFAULT_FILTER_VALUE) params.set('group', selectedGroup);
    if (selectedType !== DEFAULT_FILTER_VALUE) params.set('type', selectedType);
    if (selectedStatus !== DEFAULT_FILTER_VALUE) params.set('status', selectedStatus);
    if (selectedCentury !== DEFAULT_FILTER_VALUE) params.set('century', selectedCentury);
    if (selectedCategory !== DEFAULT_FILTER_VALUE) params.set('category', selectedCategory);
    if (sortBy !== 'standaard') params.set('sort', sortBy);
    if (viewMode !== DEFAULT_VIEW_MODE) params.set('view', viewMode);

    const queryString = params.toString();
    const nextUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
    window.history.replaceState(window.history.state, '', nextUrl);
  }, [searchQuery, selectedGroup, selectedType, selectedStatus, selectedCentury, selectedCategory, sortBy, viewMode]);

  const filters = useMemo(
    () => ({
      query: searchQuery,
      group: selectedGroup,
      type: selectedType,
      status: selectedStatus,
      century: selectedCentury,
      category: selectedCategory
    }),
    [searchQuery, selectedGroup, selectedType, selectedStatus, selectedCentury, selectedCategory]
  );

  const filteredItems = useMemo(() => {
    const result = normalizedItems.filter((item) => matchesFilters(item, filters));

    return [...result].sort((left, right) => {
      if (sortBy === 'jaar-asc') {
        return left.sortYear - right.sortYear || getItemField(left, 'title', language).localeCompare(getItemField(right, 'title', language));
      }

      if (sortBy === 'jaar-desc') {
        return right.sortYear - left.sortYear || getItemField(left, 'title', language).localeCompare(getItemField(right, 'title', language));
      }

      if (sortBy === 'auteur-asc') {
        return (left.author || '').localeCompare(right.author || '', language, { sensitivity: 'base' });
      }

      if (sortBy === 'titel-asc') {
        return getItemField(left, 'title', language).localeCompare(getItemField(right, 'title', language), language, { sensitivity: 'base' });
      }

      const parsePrice = (priceStr) => {
        if (!priceStr || typeof priceStr !== 'string') return null;
        const digits = priceStr.replace(/[^0-9]/g, '');
        return digits ? Number(digits) : null;
      };

      if (sortBy === 'prijs-asc') {
        const leftPrice = parsePrice(left.price);
        const rightPrice = parsePrice(right.price);
        if (leftPrice === null && rightPrice === null) return 0;
        if (leftPrice === null) return 1;
        if (rightPrice === null) return -1;
        return leftPrice - rightPrice;
      }

      if (sortBy === 'prijs-desc') {
        const leftPrice = parsePrice(left.price);
        const rightPrice = parsePrice(right.price);
        if (leftPrice === null && rightPrice === null) return 0;
        if (leftPrice === null) return 1;
        if (rightPrice === null) return -1;
        return rightPrice - leftPrice;
      }

      const featuredDelta = Number(Boolean(right.featured)) - Number(Boolean(left.featured));
      if (featuredDelta !== 0) return featuredDelta;

      const statusDelta = getStatusOrderIndex(left.status) - getStatusOrderIndex(right.status);
      if (statusDelta !== 0) return statusDelta;

      return right.sortYear - left.sortYear;
    });
  }, [filters, language, normalizedItems, sortBy]);

  const typePool = useMemo(() => normalizedItems.filter((item) => matchesFilters(item, filters, 'type')), [normalizedItems, filters]);
  const groupPool = useMemo(() => normalizedItems.filter((item) => matchesFilters(item, filters, 'group')), [normalizedItems, filters]);
  const statusPool = useMemo(() => normalizedItems.filter((item) => matchesFilters(item, filters, 'status')), [normalizedItems, filters]);
  const centuryPool = useMemo(() => normalizedItems.filter((item) => matchesFilters(item, filters, 'century')), [normalizedItems, filters]);
  const categoryPool = useMemo(() => normalizedItems.filter((item) => matchesFilters(item, filters, 'category')), [normalizedItems, filters]);

  const typeCounts = useMemo(() => countBy(typePool, (item) => item.typeValue), [typePool]);
  const groupCounts = useMemo(() => countBy(groupPool, (item) => item.collectionGroupValue), [groupPool]);
  const statusCounts = useMemo(() => countBy(statusPool, (item) => item.status), [statusPool]);
  const centuryCounts = useMemo(() => countBy(centuryPool, (item) => item.century), [centuryPool]);
  const categoryCounts = useMemo(() => countBy(categoryPool, (item) => item.categorySlug), [categoryPool]);

  const activeFilters = useMemo(() => {
    const chips = [];

    if (searchQuery.trim()) {
      chips.push({ key: 'query', label: `"${searchQuery.trim()}"`, clear: () => setSearchQuery('') });
    }

    if (selectedGroup !== DEFAULT_FILTER_VALUE) {
      chips.push({
        key: 'group',
        label: getLocalizedCollectionGroup(selectedGroup, language),
        clear: () => setSelectedGroup(DEFAULT_FILTER_VALUE)
      });
    }

    if (selectedType !== DEFAULT_FILTER_VALUE) {
      chips.push({
        key: 'type',
        label: getLocalizedItemType(selectedType, language),
        clear: () => setSelectedType(DEFAULT_FILTER_VALUE)
      });
    }

    if (selectedStatus !== DEFAULT_FILTER_VALUE) {
      chips.push({
        key: 'status',
        label: getLocalizedStatus(selectedStatus, language),
        clear: () => setSelectedStatus(DEFAULT_FILTER_VALUE)
      });
    }

    if (selectedCentury !== DEFAULT_FILTER_VALUE) {
      chips.push({
        key: 'century',
        label: getLocalizedCentury(selectedCentury, language),
        clear: () => setSelectedCentury(DEFAULT_FILTER_VALUE)
      });
    }

    if (selectedCategory !== DEFAULT_FILTER_VALUE) {
      chips.push({
        key: 'category',
        label: getLocalizedCategory(selectedCategory, language),
        clear: () => setSelectedCategory(DEFAULT_FILTER_VALUE)
      });
    }

    return chips;
  }, [language, searchQuery, selectedCategory, selectedCentury, selectedGroup, selectedStatus, selectedType]);

  const hasActiveFilters = activeFilters.length > 0 || sortBy !== 'standaard';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedGroup(DEFAULT_FILTER_VALUE);
    setSelectedType(DEFAULT_FILTER_VALUE);
    setSelectedStatus(DEFAULT_FILTER_VALUE);
    setSelectedCentury(DEFAULT_FILTER_VALUE);
    setSelectedCategory(DEFAULT_FILTER_VALUE);
    setSortBy('standaard');
  };

  const renderTypeLabel = (value) => {
    if (value !== DEFAULT_FILTER_VALUE) return getLocalizedItemType(value, language);
    return t('catalog.all');
  };

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <section className="page-shell-wide pt-28 pb-10 sm:pt-32 sm:pb-12 lg:pt-36 lg:pb-14">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[280px,minmax(0,1fr)] xl:grid-cols-[300px,minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-28 lg:self-start lg:pr-8 lg:border-r lg:border-[#E8DFCF]/40">
            <div className="flex items-center justify-between border-b border-[#E8DFCF]/60 pb-3.5">
              <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#8E7035]">
                {t('catalog.refineTitle')}
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center space-x-1.5 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[#8E7035] transition-colors hover:text-[#111111]"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t('catalog.resetFilters')}</span>
                </button>
              )}
            </div>

            <div className="pt-5">
              <label htmlFor="catalog-search" className="block text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[#777777]">
                {t('nav.search')}
              </label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-[#8E7035]" />
                <input
                  id="catalog-search"
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={t('catalog.searchPlaceholder')}
                  className="w-full rounded-md bg-[#F4EFE6]/70 border border-[#E8DFCF]/80 py-2.5 pl-9 pr-8 text-sm text-[#111111] placeholder-[#8C8174] transition-all focus:bg-white focus:border-[#B8860B]/60 focus:outline-none focus:ring-1 focus:ring-[#B8860B]/30"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#555555] transition-colors hover:text-[#111111]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-6 pt-6">
              <div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[#8E7035] mb-2">
                  {t('catalog.collectionGroupFilter')}
                </div>
                <div className="space-y-0.5">
                  {groupOptions.map((option) => {
                    const isAllOption = option === DEFAULT_FILTER_VALUE;
                    const count = isAllOption ? groupPool.length : (groupCounts[option] || 0);
                    const isActive = selectedGroup === option;
                    const isDisabled = !isActive && count === 0;

                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => {
                          setSelectedGroup(option);
                          setSelectedType(DEFAULT_FILTER_VALUE);
                          setSelectedCategory(DEFAULT_FILTER_VALUE);
                        }}
                        className={`flex w-full items-center justify-between py-2 px-2.5 rounded text-left transition-all ${
                          isActive
                            ? 'bg-[#F1ECE3] text-[#111111] font-semibold'
                            : 'text-[#555555] hover:bg-[#F6F2EB]/70 hover:text-[#111111]'
                        } ${isDisabled ? 'cursor-not-allowed opacity-35' : ''}`}
                      >
                        <span className="text-sm">
                          {isAllOption ? t('catalog.all') : getLocalizedCollectionGroup(option, language)}
                        </span>
                        <span className={`text-xs font-mono ${isActive ? 'text-[#8E7035]' : 'text-[#8C8174]'}`}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedGroup !== 'japanese-art' && (
              <div className="border-t border-[#E8DFCF]/50 pt-5">
                <div className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[#8E7035] mb-2">
                  {t('catalog.typeFilter')}
                </div>
                <div className="space-y-0.5">
                  {typeOptions.map((option) => {
                    const isAllOption = option === DEFAULT_FILTER_VALUE;
                    const count = isAllOption ? typePool.length : (typeCounts[option] || 0);
                    const isActive = selectedType === option;
                    const isDisabled = !isActive && count === 0;
                    const Icon = getTypeIcon(option);

                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => {
                          setSelectedType(option);
                          setSelectedCategory(DEFAULT_FILTER_VALUE);
                        }}
                        className={`flex w-full items-center justify-between py-2 px-2.5 rounded text-left transition-all ${
                          isActive
                            ? 'bg-[#F1ECE3] text-[#111111] font-semibold'
                            : 'text-[#555555] hover:bg-[#F6F2EB]/70 hover:text-[#111111]'
                        } ${isDisabled ? 'cursor-not-allowed opacity-35' : ''}`}
                      >
                        <span className="inline-flex items-center space-x-2">
                          {!isAllOption && <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#B8860B]' : 'text-[#9C8B66]'}`} />}
                          <span className="text-sm">{renderTypeLabel(option)}</span>
                        </span>
                        <span className={`text-xs font-mono ${isActive ? 'text-[#8E7035]' : 'text-[#8C8174]'}`}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              )}

              <div className="border-t border-[#E8DFCF]/50 pt-5">
                <div className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[#8E7035] mb-2">
                  {t('catalog.statusFilter')}
                </div>
                <div className="space-y-0.5">
                  {statusOptions.map((option) => {
                    const isAllOption = option === DEFAULT_FILTER_VALUE;
                    const count = isAllOption ? statusPool.length : (statusCounts[option] || 0);
                    const isActive = selectedStatus === option;
                    const isDisabled = !isActive && count === 0;

                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setSelectedStatus(option)}
                        className={`flex w-full items-center justify-between py-2 px-2.5 rounded text-left transition-all ${
                          isActive
                            ? 'bg-[#F1ECE3] text-[#111111] font-semibold'
                            : 'text-[#555555] hover:bg-[#F6F2EB]/70 hover:text-[#111111]'
                        } ${isDisabled ? 'cursor-not-allowed opacity-35' : ''}`}
                      >
                        <span className="text-sm">
                          {isAllOption ? t('catalog.all') : getLocalizedStatus(option, language)}
                        </span>
                        <span className={`text-xs font-mono ${isActive ? 'text-[#8E7035]' : 'text-[#8C8174]'}`}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-[#E8DFCF]/50 pt-5">
                <div className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[#8E7035] mb-2">
                  {t('catalog.centuryFilter')}
                </div>
                <div className="space-y-0.5">
                  {centuryOptions.map((option) => {
                    const isAllOption = option === DEFAULT_FILTER_VALUE;
                    const count = isAllOption ? centuryPool.length : (centuryCounts[option] || 0);
                    const isActive = selectedCentury === option;
                    const isDisabled = !isActive && count === 0;

                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setSelectedCentury(option)}
                        className={`flex w-full items-center justify-between py-2 px-2.5 rounded text-left transition-all ${
                          isActive
                            ? 'bg-[#F1ECE3] text-[#111111] font-semibold'
                            : 'text-[#555555] hover:bg-[#F6F2EB]/70 hover:text-[#111111]'
                        } ${isDisabled ? 'cursor-not-allowed opacity-35' : ''}`}
                      >
                        <span className="text-sm">
                          {isAllOption ? t('catalog.all') : getLocalizedCentury(option, language)}
                        </span>
                        <span className={`text-xs font-mono ${isActive ? 'text-[#8E7035]' : 'text-[#8C8174]'}`}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-[#E8DFCF]/50 pt-5">
                <div className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[#8E7035] mb-2">
                  {t('catalog.categoryFilter')}
                </div>
                <div className="space-y-0.5">
                  {categoryOptions.map((option) => {
                    const isAllOption = option === DEFAULT_FILTER_VALUE;
                    const count = isAllOption ? categoryPool.length : (categoryCounts[option] || 0);
                    const isActive = selectedCategory === option;
                    const isDisabled = !isActive && count === 0;

                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setSelectedCategory(option)}
                        className={`flex w-full items-center justify-between py-2 px-2.5 rounded text-left transition-all ${
                          isActive
                            ? 'bg-[#F1ECE3] text-[#111111] font-semibold'
                            : 'text-[#555555] hover:bg-[#F6F2EB]/70 hover:text-[#111111]'
                        } ${isDisabled ? 'cursor-not-allowed opacity-35' : ''}`}
                      >
                        <span className="pr-3 text-sm">
                          {isAllOption ? t('catalog.all') : getLocalizedCategory(option, language)}
                        </span>
                        <span className={`text-xs font-mono ${isActive ? 'text-[#8E7035]' : 'text-[#8C8174]'}`}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          <div className="min-w-0 space-y-8">
            <div className="border-b border-[#D8CEB8]/70 pb-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <h1 className="text-2xl font-serif font-bold text-[#111111] sm:text-3xl">
                    {t('catalog.resultsLabel')}
                  </h1>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  <div className="min-w-[220px]">
                    <div className="relative border-b border-[#D8CEB8]">
                      <select
                        value={sortBy}
                        onChange={(event) => setSortBy(event.target.value)}
                        className="w-full appearance-none bg-transparent py-3 pr-8 text-sm font-semibold text-[#111111] transition-all focus:outline-none"
                      >
                        <option value="standaard">{t('catalog.sortStandard')}</option>
                        <option value="jaar-asc">{t('catalog.sortYearAsc')}</option>
                        <option value="jaar-desc">{t('catalog.sortYearDesc')}</option>
                        <option value="auteur-asc">{t('catalog.sortAuthorAsc')}</option>
                        <option value="titel-asc">{t('catalog.sortTitleAsc')}</option>
                        <option value="prijs-asc">{t('catalog.sortPriceAsc')}</option>
                        <option value="prijs-desc">{t('catalog.sortPriceDesc')}</option>
                      </select>
                      <ChevronDown className="absolute right-0 top-1/2 w-4 h-4 -translate-y-1/2 text-[#B8860B] pointer-events-none" />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-2 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`inline-flex items-center space-x-2 border-b pb-1 text-xs font-mono font-bold uppercase tracking-[0.14em] transition-colors ${
                        viewMode === 'grid'
                          ? 'border-[#111111] text-[#111111]'
                          : 'border-transparent text-[#8C8174] hover:text-[#111111]'
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                      <span>{t('catalog.gridView')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('editorial')}
                      className={`inline-flex items-center space-x-2 border-b pb-1 text-xs font-mono font-bold uppercase tracking-[0.14em] transition-colors ${
                        viewMode === 'editorial'
                          ? 'border-[#111111] text-[#111111]'
                          : 'border-transparent text-[#8C8174] hover:text-[#111111]'
                      }`}
                    >
                      <Rows3 className="w-4 h-4" />
                      <span>{t('catalog.editorialView')}</span>
                    </button>
                  </div>
                </div>
              </div>

              {activeFilters.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                  {activeFilters.map((filterChip) => (
                    <button
                      key={filterChip.key}
                      type="button"
                      onClick={filterChip.clear}
                      className="inline-flex items-center space-x-2 border-b border-[#111111] pb-0.5 text-xs font-mono font-semibold uppercase tracking-[0.12em] text-[#111111] transition-colors hover:border-[#B8860B] hover:text-[#B8860B]"
                    >
                      <span>{filterChip.label}</span>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {filteredItems.length === 0 ? (
              <div className="py-20 text-center">
                <h2 className="text-2xl font-serif font-bold text-[#111111]">
                  {t('catalog.noItems')}
                </h2>
                <p className="mx-auto mt-3 max-w-lg text-sm font-serif leading-relaxed text-[#666666]">
                  {t('catalog.noItemsDesc')}
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-6 inline-flex items-center border-b border-[#111111] pb-1 text-xs font-mono font-bold uppercase tracking-[0.16em] text-[#111111] transition-colors hover:border-[#B8860B] hover:text-[#B8860B]"
                >
                  {t('catalog.noItemsReset')}
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 xl:grid-cols-3 min-[2200px]:grid-cols-4 min-[3200px]:grid-cols-5 items-stretch">
                {filteredItems.map((item, index) => {
                  const primaryMeta = getPrimaryMeta(item);
                  const statusTone = getStatusTone(item.status);

                  return (
                    <motion.article
                      key={item.id}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: Math.min(index * 0.035, 0.24) }}
                      className="group flex flex-col h-full cursor-pointer"
                      onClick={() => onOpenItemDetail(item)}
                    >
                      {/* Image Frame */}
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F1ECE3]">
                        <img
                          src={item.images?.[0]?.url || '/images/scarron-spines-white-bg.jpg'}
                          alt={getItemField(item, 'title', language)}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#111111]/25 to-transparent pointer-events-none" />
                        
                        {/* Status Badge (if reserved or sold) */}
                        {item.status !== 'Beschikbaar' && (
                          <div className="absolute top-3 right-3 z-10">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-mono font-semibold uppercase tracking-[0.16em] bg-[#111111]/85 text-[#FBFBFA] backdrop-blur-sm shadow-sm">
                              <span className={`h-1.5 w-1.5 rounded-full ${statusTone.dot}`} />
                              <span>{getLocalizedStatus(item.status, language)}</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content Card Body */}
                      <div className="mt-4 flex flex-col flex-1 border-t border-[#E8DFCF]/70 pt-3.5 space-y-2">
                        {/* Top Micro-Header */}
                        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.18em] text-[#8E7035]">
                          <span>
                            {item.collectionGroupValue === 'japanese-art'
                              ? getLocalizedCollectionGroup('japanese-art', language)
                              : getLocalizedItemType(item.typeValue, language)}
                            <span className="mx-1.5 text-[#B8860B]/40">·</span>
                            {getLocalizedCentury(item.century, language)}
                          </span>
                          <span className="text-[#888888] font-light">{item.ref}</span>
                        </div>

                        {/* Title (Clamped to 2 lines max with fixed height baseline) */}
                        <h2 className="text-lg font-serif font-bold leading-snug text-[#111111] transition-colors duration-300 group-hover:text-[#8E7035] line-clamp-2 min-h-[2.75rem]">
                          {getItemField(item, 'title', language)}
                        </h2>

                        {/* Attribution / Primary Meta (Clamped to 1 line max with fixed height baseline) */}
                        <p className="text-xs font-serif italic text-[#666666] line-clamp-1 min-h-[1.1rem]">
                          {primaryMeta || '\u00A0'}
                        </p>

                        {/* Bottom Row - Pinned to bottom of card */}
                        <div className="mt-auto pt-3.5 flex items-center justify-between border-t border-[#E8DFCF]/40">
                          <div>
                            <span className="text-sm font-serif font-bold text-[#111111]">
                              {getLocalizedPrice(item.price, language) || t('topstukken.priceOnRequest')}
                            </span>
                          </div>

                          <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-[#111111] transition-colors group-hover:text-[#8E7035]">
                            <span>{t('topstukken.viewDetails')}</span>
                            <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-1" />
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-12">
                {filteredItems.map((item, index) => {
                  const primaryMeta = getPrimaryMeta(item);
                  const secondaryMeta = getSecondaryMeta(item);
                  const statusTone = getStatusTone(item.status);
                  const mediaOnRight = index % 2 === 1;

                  return (
                    <motion.article
                      key={item.id}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: Math.min(index * 0.035, 0.24) }}
                      className={index === 0 ? "pt-2" : "border-t border-[#D8CEB8]/70 pt-12"}
                    >
                      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12 lg:items-start">
                        <div className={`lg:col-span-5 ${mediaOnRight ? 'lg:order-2' : ''}`}>
                          <button
                            type="button"
                            onClick={() => onOpenItemDetail(item)}
                            className="block w-full overflow-hidden bg-[#F1ECE3] text-left group"
                          >
                            <div className="aspect-[4/3] overflow-hidden relative">
                              <img
                                src={item.images?.[0]?.url || '/images/scarron-spines-white-bg.jpg'}
                                alt={getItemField(item, 'title', language)}
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                              />
                            </div>
                          </button>
                        </div>

                        <div className={`lg:col-span-7 ${mediaOnRight ? 'lg:order-1' : ''}`}>
                          <div className="flex flex-wrap items-center gap-x-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[#8E7035]">
                            <span>{item.ref}</span>
                            <span className="text-[#B8860B]/40">·</span>
                            <span>{getLocalizedCentury(item.century, language)}</span>
                            <span className="text-[#B8860B]/40">·</span>
                            <span>{getLocalizedCategory(item.category, language)}</span>
                          </div>

                          <h2 
                            onClick={() => onOpenItemDetail(item)}
                            className="mt-3 text-2xl font-serif font-bold leading-[1.18] text-[#111111] transition-colors duration-300 hover:text-[#8E7035] cursor-pointer lg:text-3xl"
                          >
                            {getItemField(item, 'title', language)}
                          </h2>

                          {primaryMeta && (
                            <p className="mt-2 text-sm font-serif italic text-[#555555]">
                              {primaryMeta}
                            </p>
                          )}

                          {secondaryMeta && (
                            <p className="mt-1.5 text-xs font-mono uppercase tracking-[0.14em] text-[#777777]">
                              {secondaryMeta}
                            </p>
                          )}

                          <p className="mt-4 max-w-2xl line-clamp-3 text-sm font-serif leading-relaxed text-[#444444] lg:text-base">
                            {getItemField(item, 'description', language)}
                          </p>

                          <div className="mt-6 flex flex-col gap-4 border-t border-[#E8DFCF]/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                              <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.16em] ${statusTone.text}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${statusTone.dot}`} />
                                <span>{getLocalizedStatus(item.status, language)}</span>
                              </span>
                              <span className="text-[#E8DFCF]">|</span>
                              <span className="text-lg font-serif font-bold text-[#111111] lg:text-xl">
                                {getLocalizedPrice(item.price, language) || t('topstukken.priceOnRequest')}
                              </span>
                            </div>

                            <div className="flex items-center gap-x-6">
                              <button
                                type="button"
                                onClick={() => onOpenItemDetail(item)}
                                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-[0.14em] text-[#111111] transition-colors hover:text-[#B8860B]"
                              >
                                <span>{t('topstukken.viewDetails')}</span>
                                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                              </button>
                              {item.status !== 'Verkocht' && (
                                <button
                                  type="button"
                                  onClick={() => onRequestInquiry(item)}
                                  className="border-b border-[#111111] pb-0.5 text-xs font-mono font-bold uppercase tracking-[0.14em] text-[#111111] transition-colors hover:border-[#B8860B] hover:text-[#B8860B]"
                                >
                                  {t('catalog.inquire')}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
