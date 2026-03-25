import axios from 'axios';
import { API_URL } from '../config/api';
import { NEWS } from '../data/newsData';

export const CUSTOM_NEWS_STORAGE_KEY = 'glitch_gang_custom_news';
export const DEFAULT_NEWS_COMPANY = 'GLITCH GANG';
export const DEFAULT_NEWS_EDITORIAL = 'Mesa Editorial GLITCH GANG';
export const MAX_NEWS_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_NEWS_GALLERY_ITEMS = 5;
export const ALLOWED_NEWS_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const STATIC_NEWS_ID_ALIASES = new Map([
  ['static-1', '1'],
  ['static-2', '2'],
  ['static-3', '4'],
  ['static-4', '11'],
  ['static-5', '9'],
]);

const normalizeInlineText = (value = '') => String(value).replace(/\s+/g, ' ').trim();
const normalizeNewsId = (value = '') => String(value || '').trim();
const resolveNewsLookupId = (value = '') => STATIC_NEWS_ID_ALIASES.get(normalizeNewsId(value)) || normalizeNewsId(value);
const isMongoObjectId = (value = '') => /^[a-f0-9]{24}$/i.test(normalizeNewsId(value));

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('news_file_read_failed'));
    reader.readAsDataURL(file);
  });

const loadImageElement = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('news_image_load_failed'));
    image.src = src;
  });

const splitSentences = (value = '') =>
  normalizeInlineText(value)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

export const createNewsSummary = (value = '', maxLength = 185) => {
  const sentences = splitSentences(value);

  if (sentences.length) {
    let summary = '';

    for (const sentence of sentences) {
      const next = summary ? `${summary} ${sentence}` : sentence;
      if (next.length > maxLength && summary) break;
      summary = next;
      if (summary.length >= maxLength * 0.72) break;
    }

    if (summary) return summary;
  }

  const plain = normalizeInlineText(value);
  if (!plain) return '';
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength - 1).trimEnd()}…`;
};

export const createNewsDetails = (value = '') => {
  const blocks = String(value)
    .split(/\n{2,}/)
    .map((block) => normalizeInlineText(block))
    .filter(Boolean);

  if (blocks.length >= 2) return blocks.slice(0, 8);

  const sentences = splitSentences(value);
  const details = [];
  let currentBlock = '';

  sentences.forEach((sentence) => {
    const next = currentBlock ? `${currentBlock} ${sentence}` : sentence;

    if (next.length > 210 && currentBlock) {
      details.push(currentBlock);
      currentBlock = sentence;
      return;
    }

    currentBlock = next;
  });

  if (currentBlock) details.push(currentBlock);

  if (!details.length) {
    const fallback = normalizeInlineText(value);
    if (fallback) details.push(fallback);
  }

  return details.slice(0, 8);
};

export const parseNewsTags = (value = '') =>
  String(value)
    .split(',')
    .map((tag) => normalizeInlineText(tag))
    .filter(Boolean)
    .slice(0, 8);

export const parseGalleryInput = (value = '', primaryImage = '') => {
  const items = Array.isArray(value)
    ? value.map((item) => normalizeInlineText(item)).filter(Boolean)
    : String(value)
        .split(/\r?\n/)
        .map((url) => normalizeInlineText(url))
        .filter(Boolean);

  const gallery = primaryImage ? [primaryImage, ...items.filter((item) => item !== primaryImage)] : items;
  return gallery.slice(0, 6);
};

export const readNewsImageFile = async (
  file,
  { maxWidth = 1600, maxHeight = 900, quality = 0.82 } = {}
) => {
  const source = await readFileAsDataUrl(file);
  const image = await loadImageElement(source);
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) return source;

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL('image/webp', quality);
};

export const getNewsImageValidationMessage = (file) => {
  if (!file) return 'Selecciona una imagen.';
  if (!ALLOWED_NEWS_IMAGE_TYPES.has(file.type)) return 'Usa imagenes JPG, PNG o WEBP.';
  if (file.size > MAX_NEWS_IMAGE_BYTES) return 'Cada imagen debe pesar menos de 8MB.';
  return '';
};

const getNewsTimestamp = (item = {}) => {
  const rawValue = item.createdAt || item.date || '';
  if (!rawValue) return 0;

  const normalizedValue = /^\d{4}-\d{2}-\d{2}$/.test(String(rawValue))
    ? `${rawValue}T00:00:00`
    : rawValue;

  const timestamp = Date.parse(normalizedValue);
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const mergeNewsRecords = (primaryItem = {}, fallbackItem = {}) => {
  const primary = normalizeNewsItem(primaryItem);
  const fallback = normalizeNewsItem(fallbackItem);

  return normalizeNewsItem({
    ...fallback,
    ...primary,
    id: normalizeNewsId(primary.id) || normalizeNewsId(fallback.id),
    title: primary.title || fallback.title,
    excerpt: primary.excerpt || fallback.excerpt,
    category: primary.category || fallback.category,
    game: primary.game || fallback.game,
    author: primary.author || fallback.author,
    company: primary.company || fallback.company,
    date: primary.date || fallback.date,
    image: primary.image || fallback.image,
    views: Number(primary.views) > 0 ? primary.views : fallback.views,
    comments: Number(primary.comments) > 0 ? primary.comments : fallback.comments,
    tags: Array.isArray(primary.tags) && primary.tags.length ? primary.tags : fallback.tags,
    details: Array.isArray(primary.details) && primary.details.length ? primary.details : fallback.details,
    gallery: Array.isArray(primary.gallery) && primary.gallery.length ? primary.gallery : fallback.gallery,
  });
};

const normalizeNewsItem = (item = {}) => {
  const normalizedImage = normalizeInlineText(item.image);
  const normalizedExcerpt = normalizeInlineText(
    item.excerpt
    || (Array.isArray(item.details) ? item.details[0] : '')
    || ''
  );
  const normalizedDetails = Array.isArray(item.details)
    ? item.details.map((detail) => normalizeInlineText(detail)).filter(Boolean)
    : [];
  const normalizedDate = normalizeInlineText(item.date)
    || (item.createdAt ? String(item.createdAt).slice(0, 10) : '');
  const normalizedGallery = parseGalleryInput(
    Array.isArray(item.gallery) ? item.gallery : [],
    normalizedImage
  );
  const explicitViews = Number(item.views);
  const explicitComments = Number(item.comments);
  const hasDate = Boolean(normalizedDate);
  const hasViews = Number.isFinite(explicitViews) && explicitViews > 0;

  return {
    ...item,
    id: resolveNewsLookupId(item._id || item.id),
    title: normalizeInlineText(item.title),
    excerpt: normalizedExcerpt,
    category: normalizeInlineText(item.category) || 'Institucional',
    game: normalizeInlineText(item.game) || 'Multigame',
    author: normalizeInlineText(item.author),
    company: normalizeInlineText(item.company),
    date: normalizedDate,
    image: normalizedImage,
    views: hasViews ? Math.trunc(explicitViews) : 0,
    comments: Number.isFinite(explicitComments) && explicitComments > 0 ? Math.trunc(explicitComments) : 0,
    tags: Array.isArray(item.tags)
      ? item.tags.map((tag) => normalizeInlineText(tag)).filter(Boolean)
      : [],
    details: normalizedDetails.length
      ? normalizedDetails
      : createNewsDetails(normalizedExcerpt),
    gallery: normalizedGallery.length
      ? normalizedGallery
      : [normalizedImage].filter(Boolean),
    isNew: Boolean(item.isNew) || !hasDate || !hasViews,
  };
};

const sortNewsItems = (items = []) => (
  [...items].sort((a, b) => getNewsTimestamp(b) - getNewsTimestamp(a))
);

const mergeNewsItems = (...groups) => {
  const records = new Map();
  const aliases = new Map();

  groups
    .flat()
    .forEach((item) => {
      const normalizedItem = normalizeNewsItem(item);
      const normalizedId = normalizeNewsId(normalizedItem.id);
      const normalizedTitle = normalizeInlineText(normalizedItem.title).toLowerCase();
      const existingKey = [normalizedId, normalizedTitle]
        .filter(Boolean)
        .map((alias) => aliases.get(alias))
        .find(Boolean);
      const canonicalKey = existingKey || normalizedId || normalizedTitle;

      if (!normalizedItem.title) return;

      if (existingKey) {
        const mergedItem = mergeNewsRecords(records.get(existingKey), normalizedItem);
        records.set(existingKey, mergedItem);

        const mergedId = normalizeNewsId(mergedItem.id);
        const mergedTitle = normalizeInlineText(mergedItem.title).toLowerCase();
        [mergedId, mergedTitle].filter(Boolean).forEach((alias) => aliases.set(alias, existingKey));
        return;
      }

      records.set(canonicalKey, normalizedItem);
      [normalizedId, normalizedTitle].filter(Boolean).forEach((alias) => aliases.set(alias, canonicalKey));
    });

  return sortNewsItems([...records.values()]);
};

const matchesNewsFilters = (item = {}, { category, game, search } = {}) => {
  if (category && category !== 'Todos' && item.category !== category) return false;
  if (game && game !== 'Todos' && item.game !== game) return false;

  const normalizedSearch = normalizeInlineText(search).toLowerCase();
  if (!normalizedSearch) return true;

  const haystack = [
    item.title,
    item.excerpt,
    item.author,
    item.company,
    item.category,
    item.game,
  ]
    .map((value) => normalizeInlineText(value).toLowerCase())
    .join(' ');

  return haystack.includes(normalizedSearch);
};

// ── Fallback síncrono (solo datos estáticos) ──────────────────
export const getNewsFeed = () => mergeNewsItems(NEWS);

// ── API: obtener noticias (DB + estáticas) ────────────────────
export const fetchNewsFeed = async ({ category, game, search } = {}) => {
  const staticItems = getNewsFeed().filter((item) => matchesNewsFilters(item, { category, game, search }));

  try {
    const params = new URLSearchParams();
    if (category && category !== 'Todos') params.set('category', category);
    if (game && game !== 'Todos') params.set('game', game);
    if (search) params.set('search', search);
    params.set('limit', '100');

    const { data } = await axios.get(`${API_URL}/api/news?${params}`);
    const apiItems = Array.isArray(data?.items) ? data.items : [];
    return mergeNewsItems(apiItems, staticItems);
  } catch {
    // Si el backend no está disponible, devolver estáticas
    return staticItems;
  }
};

// ── API: guardar noticia en el servidor ───────────────────────
export const saveCustomNews = async (article) => {
  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const { data } = await axios.post(`${API_URL}/api/news`, article, { headers });

  // Notificar a la UI que hay nueva noticia
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('custom-news-updated'));
  }

  return data;
};

// ── API: obtener noticia por ID ───────────────────────────────
export const fetchNewsById = async (id) => {
  const lookupId = resolveNewsLookupId(id);

  if (!isMongoObjectId(lookupId)) {
    return getNewsFeed().find((newsItem) => normalizeNewsId(newsItem.id) === lookupId) || null;
  }

  try {
    if (isMongoObjectId(lookupId)) {
      const { data } = await axios.get(`${API_URL}/api/news/${lookupId}`);
      return normalizeNewsItem(data);
    }
  } catch {
    // Fallback: buscar en estáticas
    return getNewsFeed().find((newsItem) => normalizeNewsId(newsItem.id) === lookupId) || null;
  }
};

export const buildCustomNewsArticle = ({
  title,
  author,
  company,
  category,
  game,
  image,
  imageName,
  gallery,
  galleryNames,
  body,
  date,
  tags,
  featured,
}) => {
  const normalizedBody = String(body || '').trim();
  const normalizedImage = normalizeInlineText(image);
  const details = createNewsDetails(normalizedBody);
  const summary = createNewsSummary(normalizedBody);
  const parsedTags = parseNewsTags(tags);
  const galleryImages = parseGalleryInput(gallery, normalizedImage);

  return {
    id: Date.now(),
    createdAt: new Date().toISOString(),
    title: normalizeInlineText(title),
    excerpt: summary,
    category: normalizeInlineText(category) || 'Institucional',
    game: normalizeInlineText(game) || 'Multigame',
    author: normalizeInlineText(author) || DEFAULT_NEWS_EDITORIAL,
    company: normalizeInlineText(company) || DEFAULT_NEWS_COMPANY,
    date: normalizeInlineText(date) || new Date().toISOString().slice(0, 10),
    views: 0,
    comments: 0,
    image: normalizedImage,
    imageName: normalizeInlineText(imageName),
    featured: Boolean(featured),
    isCustom: true,
    isNew: true,
    tags: parsedTags,
    details,
    gallery: galleryImages.length ? galleryImages : [normalizedImage].filter(Boolean),
    galleryNames: Array.isArray(galleryNames) ? galleryNames.map((name) => normalizeInlineText(name)).filter(Boolean) : [],
  };
};
