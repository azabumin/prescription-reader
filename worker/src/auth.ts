// PBKDF2 password hashing + opaque session tokens for the email+password auth system.
// No external crypto library -- everything here runs on the Workers-native Web Crypto API.

const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const SESSION_TOKEN_BYTES = 32;
const RESET_TOKEN_BYTES = 32;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const TRIAL_DAYS = 7;

function bytesToBase64(bytes: ArrayBuffer): string {
  const arr = new Uint8Array(bytes);
  let binary = '';
  for (let i = 0; i < arr.byteLength; i++) binary += String.fromCharCode(arr[i]);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function randomHexToken(byteLength: number): string {
  const arr = crypto.getRandomValues(new Uint8Array(byteLength));
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function pbkdf2(password: string, salt: Uint8Array, pepper: string): Promise<ArrayBuffer> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password + pepper),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256,
  );
}

export async function hashPassword(password: string, pepper: string): Promise<{ hash: string; salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const derived = await pbkdf2(password, salt, pepper);
  return { hash: bytesToBase64(derived), salt: bytesToBase64(salt.buffer as ArrayBuffer) };
}

export async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string,
  pepper: string,
): Promise<boolean> {
  const salt = base64ToBytes(storedSalt);
  const derived = await pbkdf2(password, salt, pepper);
  return constantTimeEqual(new Uint8Array(derived), base64ToBytes(storedHash));
}

export function generateSessionToken(): string {
  return randomHexToken(SESSION_TOKEN_BYTES);
}

export function sessionExpiry(now: Date = new Date()): string {
  return new Date(now.getTime() + SESSION_TTL_MS).toISOString();
}

export function generateResetToken(): string {
  return randomHexToken(RESET_TOKEN_BYTES);
}

export function resetTokenExpiry(now: Date = new Date()): string {
  return new Date(now.getTime() + RESET_TOKEN_TTL_MS).toISOString();
}

export function trialEndsAt(now: Date = new Date()): string {
  return new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

export function isValidEmail(email: string): boolean {
  // Deliberately loose -- just enough to reject obvious garbage. The real check is
  // whether mail sent to it actually arrives, which no regex can verify.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export type UserRow = {
  id: number;
  email: string;
  password_hash: string;
  password_salt: string;
  created_at: string;
  trial_ends_at: string;
  subscription_status: 'trial' | 'active' | 'expired' | 'canceled';
  subscription_expires_at: string | null;
};

export type SessionUser = {
  id: number;
  email: string;
  trialEndsAt: string;
  subscriptionStatus: UserRow['subscription_status'];
  subscriptionExpiresAt: string | null;
};

function toSessionUser(user: UserRow): SessionUser {
  return {
    id: user.id,
    email: user.email,
    trialEndsAt: user.trial_ends_at,
    subscriptionStatus: user.subscription_status,
    subscriptionExpiresAt: user.subscription_expires_at,
  };
}

export function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization') ?? '';
  const match = /^Bearer\s+(.+)$/.exec(authHeader);
  return match ? match[1] : null;
}

export async function createSession(db: D1Database, userId: number): Promise<string> {
  const token = generateSessionToken();
  const now = new Date();
  await db
    .prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .bind(token, userId, now.toISOString(), sessionExpiry(now))
    .run();
  return token;
}

// Looks up the Bearer token from an Authorization header and resolves it to a user,
// or null if the header is missing, malformed, or the session doesn't exist/has expired.
export async function resolveSessionUser(request: Request, db: D1Database): Promise<SessionUser | null> {
  const token = extractBearerToken(request);
  if (!token) return null;

  const session = await db
    .prepare('SELECT user_id, expires_at FROM sessions WHERE token = ?')
    .bind(token)
    .first<{ user_id: number; expires_at: string }>();
  if (!session) return null;
  if (new Date(session.expires_at).getTime() < Date.now()) return null;

  const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(session.user_id).first<UserRow>();
  if (!user) return null;
  return toSessionUser(user);
}

// A user may analyze a prescription if their trial hasn't ended yet, or if they have an
// active subscription that (if it carries an expiry) hasn't lapsed. ZEUS isn't wired up yet,
// so no user actually reaches 'active' in practice today -- this just makes the check ready.
export function canAnalyze(user: SessionUser, now: Date = new Date()): boolean {
  if (new Date(user.trialEndsAt).getTime() > now.getTime()) return true;
  if (user.subscriptionStatus === 'active') {
    if (!user.subscriptionExpiresAt) return true;
    return new Date(user.subscriptionExpiresAt).getTime() > now.getTime();
  }
  return false;
}
