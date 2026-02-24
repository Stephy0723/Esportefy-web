export const CSRF_COOKIE_NAME = import.meta.env.VITE_CSRF_COOKIE_NAME || 'csrf_token';
export const CSRF_HEADER_NAME = 'X-CSRF-Token';

export const getCookieValue = (name) => {
  const encodedName = encodeURIComponent(name);
  const parts = document.cookie ? document.cookie.split(';') : [];

  for (const part of parts) {
    const cookie = part.trim();
    if (cookie.startsWith(`${encodedName}=`)) {
      return decodeURIComponent(cookie.slice(encodedName.length + 1));
    }
  }
  return '';
};

export const getCsrfToken = () => getCookieValue(CSRF_COOKIE_NAME);

export const withCsrfHeaders = (headers = {}) => {
  const token = getCsrfToken();
  if (!token) return headers;
  return { ...headers, [CSRF_HEADER_NAME]: token };
};
