// Shared client-side security validation.
// NOTE: these checks improve UX only — the backend MUST enforce the same rules.

// Keep these in sync with config/security.php on the API.
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_BYTES = 72;
const COMMON_PASSWORDS = new Set([
  'password1!',
  'password12!',
  'welcome1!',
  'qwerty1!',
  'admin123!',
  'p@ssw0rd',
  'abcd1234!',
  'test1234!',
  'letmein1!',
  'summer2024!',
  'january1!',
  'spring2024!',
]);

export function validatePassword(password: string): string | null {
  const characterCount = [...password].length;
  if (characterCount < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (characterCount > MAX_PASSWORD_LENGTH) {
    return `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.`;
  }
  if (new TextEncoder().encode(password).length > MAX_PASSWORD_BYTES) {
    return `Password must be ${MAX_PASSWORD_BYTES} UTF-8 bytes or fewer.`;
  }
  if (password !== password.trim()) {
    return 'Password cannot start or end with a space.';
  }
  if (!/[A-Z]/.test(password)
    || !/[a-z]/.test(password)
    || !/[0-9]/.test(password)
    || !/[^A-Za-z0-9\s]/.test(password)) {
    return 'Use uppercase and lowercase letters, a number, and a symbol.';
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return 'Password is too common. Choose a stronger one.';
  }
  return null;
}

/**
 * Decode a JWT payload only to check its expiry. This is NOT verification —
 * the API always verifies the signature — it just lets the UI drop an expired
 * token instead of keeping a dead session in localStorage.
 */
export function isJwtExpired(token: string | null | undefined): boolean {
  if (!token) return true;
  const parts = token.split('.');
  if (parts.length !== 3) return true;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

// Raster image types only. SVG is intentionally excluded because it can carry
// active content and is a stored-XSS risk when served directly.
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
];

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Only JPEG, PNG, WEBP, GIF or HEIC images are allowed.';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Image must be 10 MB or smaller.';
  }
  return null;
}
