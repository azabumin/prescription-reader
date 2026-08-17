import AsyncStorage from '@react-native-async-storage/async-storage';

import { WORKER_URL } from '../constants/config';

const TOKEN_KEY = 'prescription-reader:authToken';
const USER_KEY = 'prescription-reader:authUser';

export type AuthUser = {
  email: string;
  trialEndsAt: string;
  subscriptionStatus: 'trial' | 'active' | 'expired' | 'canceled';
  subscriptionExpiresAt: string | null;
};

export type AuthErrorCode =
  | 'network'
  | 'invalid_email'
  | 'password_too_short'
  | 'email_taken'
  | 'invalid_credentials'
  | 'invalid_or_expired_token'
  | 'unauthorized'
  | 'server';

export class AuthError extends Error {
  constructor(public code: AuthErrorCode, public status?: number) {
    super(code);
    this.name = 'AuthError';
  }
}

async function parseErrorCode(response: Response): Promise<AuthErrorCode> {
  try {
    const body = (await response.json()) as { error?: string };
    const known: AuthErrorCode[] = [
      'invalid_email',
      'password_too_short',
      'email_taken',
      'invalid_credentials',
      'invalid_or_expired_token',
      'unauthorized',
    ];
    if (body.error && (known as string[]).includes(body.error)) return body.error as AuthErrorCode;
  } catch {
    // fall through
  }
  return 'server';
}

async function postJson(path: string, body: unknown, token?: string): Promise<Response> {
  try {
    return await fetch(`${WORKER_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthError('network');
  }
}

export async function signup(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const response = await postJson('/signup', { email, password });
  if (!response.ok) throw new AuthError(await parseErrorCode(response), response.status);
  return response.json();
}

export async function login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const response = await postJson('/login', { email, password });
  if (!response.ok) throw new AuthError(await parseErrorCode(response), response.status);
  return response.json();
}

export async function logout(token: string): Promise<void> {
  await postJson('/logout', {}, token);
}

export async function fetchMe(token: string): Promise<AuthUser> {
  let response: Response;
  try {
    response = await fetch(`${WORKER_URL}/me`, { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    throw new AuthError('network');
  }
  if (!response.ok) throw new AuthError(await parseErrorCode(response), response.status);
  const data = (await response.json()) as { user: AuthUser };
  return data.user;
}

export async function requestPasswordReset(email: string): Promise<void> {
  const response = await postJson('/request-password-reset', { email });
  if (!response.ok) throw new AuthError(await parseErrorCode(response), response.status);
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const response = await postJson('/reset-password', { token, newPassword });
  if (!response.ok) throw new AuthError(await parseErrorCode(response), response.status);
}

export async function loadStoredAuth(): Promise<{ token: string; user: AuthUser } | null> {
  try {
    const [token, userRaw] = await Promise.all([AsyncStorage.getItem(TOKEN_KEY), AsyncStorage.getItem(USER_KEY)]);
    if (!token || !userRaw) return null;
    return { token, user: JSON.parse(userRaw) as AuthUser };
  } catch {
    return null;
  }
}

export async function saveStoredAuth(token: string, user: AuthUser): Promise<void> {
  await Promise.all([AsyncStorage.setItem(TOKEN_KEY, token), AsyncStorage.setItem(USER_KEY, JSON.stringify(user))]);
}

export async function clearStoredAuth(): Promise<void> {
  await Promise.all([AsyncStorage.removeItem(TOKEN_KEY), AsyncStorage.removeItem(USER_KEY)]);
}

export function isTrialOrSubscriptionActive(user: AuthUser, now: Date = new Date()): boolean {
  if (new Date(user.trialEndsAt).getTime() > now.getTime()) return true;
  if (user.subscriptionStatus === 'active') {
    if (!user.subscriptionExpiresAt) return true;
    return new Date(user.subscriptionExpiresAt).getTime() > now.getTime();
  }
  return false;
}

export function trialDaysRemaining(user: AuthUser, now: Date = new Date()): number {
  const msRemaining = new Date(user.trialEndsAt).getTime() - now.getTime();
  return Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
}

// t is STRINGS[lang] from lib/i18n -- kept as Record<string,string> here to avoid a
// circular import between lib/auth.ts and lib/i18n.ts.
export function authErrorMessage(t: Record<string, string>, error: AuthError): string {
  switch (error.code) {
    case 'invalid_email':
      return t.errorInvalidEmail;
    case 'password_too_short':
      return t.errorPasswordTooShort;
    case 'email_taken':
      return t.errorEmailTaken;
    case 'invalid_credentials':
      return t.errorInvalidCredentials;
    case 'invalid_or_expired_token':
      return t.errorInvalidOrExpiredToken;
    case 'network':
      return t.errorNetwork;
    default:
      return t.errorServer;
  }
}
