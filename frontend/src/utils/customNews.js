import { NEWS } from '../data/newsData';

export const CUSTOM_NEWS_STORAGE_KEY = 'glitch_gang_custom_news';
export const DEFAULT_NEWS_COMPANY = 'GLITCH GANG';
export const DEFAULT_NEWS_EDITORIAL = 'Mesa Editorial GLITCH GANG';
export const MAX_NEWS_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_NEWS_GALLERY_ITEMS = 5;
export const ALLOWED_NEWS_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const normalizeInlineText = (value = '') => String(value).replace(/\s+/g, ' ').trim();

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

export const getNewsFeed = () => {
  if (typeof window === 'undefined') return NEWS;

  try {
    const stored = JSON.parse(localStorage.getItem(CUSTOM_NEWS_STORAGE_KEY) || '[]');
    const customNews = Array.isArray(stored) ? stored : [];
    return [...customNews, ...NEWS];
  } catch {
    return NEWS;
  }
};

export const saveCustomNews = (article) => {
  if (typeof window === 'undefined') return [];

  const current = getNewsFeed().filter((item) => item.isCustom);
  const next = [article, ...current.filter((item) => item.id !== article.id)];

  localStorage.setItem(CUSTOM_NEWS_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('custom-news-updated', { detail: next }));

  return next;
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
