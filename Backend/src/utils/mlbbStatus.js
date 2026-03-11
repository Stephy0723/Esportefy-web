const KNOWN_MLBB_STATUSES = new Set([
  'unlinked',
  'pending',
  'verified',
  'verified_auto',
  'verified_manual',
  'rejected'
]);

export const MLBB_VERIFIED_STATUSES = new Set([
  'verified',
  'verified_auto',
  'verified_manual'
]);

export const MLBB_ACTIVE_STATUSES = new Set([
  'pending',
  ...MLBB_VERIFIED_STATUSES
]);

export const normalizeMlbbVerificationStatus = (status, verifiedFlag = false) => {
  const normalized = String(status || '').trim().toLowerCase();
  if (KNOWN_MLBB_STATUSES.has(normalized)) return normalized;
  return verifiedFlag ? 'verified' : 'unlinked';
};

export const isMlbbVerifiedStatus = (status, verifiedFlag = false) =>
  MLBB_VERIFIED_STATUSES.has(normalizeMlbbVerificationStatus(status, verifiedFlag));

export const isMlbbActiveStatus = (status, verifiedFlag = false) =>
  MLBB_ACTIVE_STATUSES.has(normalizeMlbbVerificationStatus(status, verifiedFlag));
