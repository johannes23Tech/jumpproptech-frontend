// Product feature flags.
//
// The public marketplace and subscription paywall are frozen. They are not
// part of the approved internal product and must stay off unless the owner
// explicitly authorizes a scope change.

const flagValue = (value: unknown): boolean => {
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'true' || normalized === '1';
};

export const MARKETPLACE_ENABLED = flagValue(import.meta.env.VITE_ENABLE_MARKETPLACE);
