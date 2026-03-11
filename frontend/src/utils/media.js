import { API_URL, MEDIA_URL } from '../config/api';

const normalizePath = (value = '') => String(value || '').trim().replace(/\\/g, '/');
const sanitizeSeed = (value = '', fallback = 'Player') => {
  const normalized = String(value || '').trim();
  return encodeURIComponent(normalized || fallback);
};

export const resolveMediaUrl = (src) => {
  const raw = normalizePath(src);
  if (!raw) return '';
  if (/^(data:|blob:)/i.test(raw)) return raw;

  const mediaBaseRaw = String(MEDIA_URL || API_URL || '').trim().replace(/\/+$/, '');
  const mediaBase = mediaBaseRaw ? new URL(mediaBaseRaw, window.location.origin) : null;
  const isUploadPath = (pathname = '') => String(pathname || '').startsWith('/uploads/');

  if (/^https?:\/\//i.test(raw)) {
    try {
      const mediaUrl = new URL(raw);
      const shouldRewriteUpload =
        mediaBase &&
        isUploadPath(mediaUrl.pathname) &&
        (
          mediaUrl.host !== mediaBase.host ||
          mediaUrl.protocol !== mediaBase.protocol ||
          mediaUrl.hostname === 'localhost' ||
          mediaUrl.hostname === '127.0.0.1'
        );

      if (shouldRewriteUpload) {
        return `${mediaBase.protocol}//${mediaBase.host}${mediaUrl.pathname}${mediaUrl.search}${mediaUrl.hash}`;
      }
      return mediaUrl.toString();
    } catch (_) {
      return raw;
    }
  }

  const normalized = raw.startsWith('/') ? raw : `/${raw}`;
  if (!mediaBase) return normalized;

  if (isUploadPath(normalized)) {
    return `${mediaBase.protocol}//${mediaBase.host}${normalized}`;
  }

  return `${mediaBase.protocol}//${mediaBase.host}${normalized}`;
};

export const getAvatarFallback = (seed = 'Player') =>
  `https://ui-avatars.com/api/?name=${sanitizeSeed(seed)}&background=1a1a2e&color=8EDB15&size=256&bold=true`;

export const getBotAvatarFallback = (seed = 'Player') =>
  `https://api.dicebear.com/7.x/bottts/svg?seed=${sanitizeSeed(seed)}`;

export const getTeamFallback = (seed = 'Team') =>
  `https://ui-avatars.com/api/?name=${sanitizeSeed(seed, 'Team')}&background=10131a&color=10b7ff&size=256&bold=true`;

export const applyImageFallback = (event, fallbackSrc) => {
  const target = event?.currentTarget;
  if (!target || !fallbackSrc) return;
  if (target.dataset.fallbackApplied === fallbackSrc) return;
  target.dataset.fallbackApplied = fallbackSrc;
  target.src = fallbackSrc;
};
