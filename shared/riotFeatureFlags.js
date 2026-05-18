const normalizeBoolean = (value, fallback = false) => {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return fallback;
  if (['1', 'true', 'yes', 'on'].includes(raw)) return true;
  if (['0', 'false', 'no', 'off'].includes(raw)) return false;
  return fallback;
};

const frontendEnv = (() => {
  try {
    return import.meta?.env || {};
  } catch {
    return {};
  }
})();

const backendEnv = (() => {
  try {
    return process?.env || {};
  } catch {
    return {};
  }
})();

const rawPendingApproval =
  frontendEnv.VITE_RIOT_PENDING_APPROVAL
  ?? backendEnv.RIOT_PENDING_APPROVAL
  ?? '';

export const RIOT_PENDING_APPROVAL = normalizeBoolean(rawPendingApproval, false);
export const RIOT_INTEGRATION_ENABLED = !RIOT_PENDING_APPROVAL;
export const RIOT_PENDING_APPROVAL_MESSAGE =
  'La integración Riot está temporalmente desactivada mientras esperamos la aprobación de Riot.';
