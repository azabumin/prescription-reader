import {
  createSession,
  extractBearerToken,
  generateResetToken,
  hashPassword,
  isValidEmail,
  resetTokenExpiry,
  resolveSessionUser,
  trialEndsAt,
  verifyPassword,
  type UserRow,
} from './auth';
import { sendPasswordResetEmail } from './email';
import { jsonResponse } from './http';

const MIN_PASSWORD_LENGTH = 8;

function normalizeEmail(email: unknown): string | null {
  if (typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

export async function handleSignup(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400, corsHeaders);
  }

  const email = normalizeEmail(body.email);
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !isValidEmail(email)) {
    return jsonResponse({ error: 'invalid_email' }, 400, corsHeaders);
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return jsonResponse({ error: 'password_too_short' }, 400, corsHeaders);
  }

  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first<{ id: number }>();
  if (existing) {
    return jsonResponse({ error: 'email_taken' }, 409, corsHeaders);
  }

  const { hash, salt } = await hashPassword(password, env.PASSWORD_PEPPER);
  const now = new Date();
  const inserted = await env.DB.prepare(
    `INSERT INTO users (email, password_hash, password_salt, created_at, trial_ends_at, subscription_status)
     VALUES (?, ?, ?, ?, ?, 'trial')
     RETURNING id, email, created_at, trial_ends_at, subscription_status, subscription_expires_at`,
  )
    .bind(email, hash, salt, now.toISOString(), trialEndsAt(now))
    .first<UserRow>();

  if (!inserted) {
    return jsonResponse({ error: 'signup_failed' }, 500, corsHeaders);
  }

  const token = await createSession(env.DB, inserted.id);
  return jsonResponse(
    {
      token,
      user: {
        email: inserted.email,
        trialEndsAt: inserted.trial_ends_at,
        subscriptionStatus: inserted.subscription_status,
        subscriptionExpiresAt: inserted.subscription_expires_at,
      },
    },
    201,
    corsHeaders,
  );
}

export async function handleLogin(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400, corsHeaders);
  }

  const email = normalizeEmail(body.email);
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || password.length === 0) {
    return jsonResponse({ error: 'invalid_credentials' }, 401, corsHeaders);
  }

  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<UserRow>();
  const passwordOk = user ? await verifyPassword(password, user.password_hash, user.password_salt, env.PASSWORD_PEPPER) : false;
  if (!user || !passwordOk) {
    // Same generic error whether the email doesn't exist or the password is wrong --
    // distinguishing the two would let an attacker enumerate registered emails.
    return jsonResponse({ error: 'invalid_credentials' }, 401, corsHeaders);
  }

  const token = await createSession(env.DB, user.id);
  return jsonResponse(
    {
      token,
      user: {
        email: user.email,
        trialEndsAt: user.trial_ends_at,
        subscriptionStatus: user.subscription_status,
        subscriptionExpiresAt: user.subscription_expires_at,
      },
    },
    200,
    corsHeaders,
  );
}

export async function handleLogout(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  const token = extractBearerToken(request);
  if (token) {
    await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
  }
  return jsonResponse({ ok: true }, 200, corsHeaders);
}

export async function handleMe(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  const user = await resolveSessionUser(request, env.DB);
  if (!user) {
    return jsonResponse({ error: 'unauthorized' }, 401, corsHeaders);
  }
  return jsonResponse({ user }, 200, corsHeaders);
}

export async function handleRequestPasswordReset(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  let body: { email?: unknown; lang?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400, corsHeaders);
  }

  const email = normalizeEmail(body.email);
  // Always respond 200 regardless of whether the email is registered -- returning a
  // different response for "not found" would let an attacker enumerate accounts.
  if (!email) {
    return jsonResponse({ ok: true }, 200, corsHeaders);
  }

  const user = await env.DB.prepare('SELECT id, email FROM users WHERE email = ?')
    .bind(email)
    .first<{ id: number; email: string }>();

  if (user) {
    const token = generateResetToken();
    const now = new Date();
    await env.DB.prepare(
      'INSERT INTO password_resets (token, user_id, created_at, expires_at, used) VALUES (?, ?, ?, ?, 0)',
    )
      .bind(token, user.id, now.toISOString(), resetTokenExpiry(now))
      .run();

    const origin = request.headers.get('Origin') ?? '';
    const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
    const base = allowedOrigins.includes(origin) ? origin : 'https://rxhelper.jp';
    const resetUrl = `${base}/reset-password?token=${token}`;

    try {
      await sendPasswordResetEmail(user.email, resetUrl, body.lang, env.RESEND_API_KEY);
    } catch (err) {
      // Don't fail the request just because the email provider had a hiccup -- the
      // token itself is already stored and valid, so a retry (or manual link) still works.
      console.error('password_reset_email_failed', err);
    }
  }

  return jsonResponse({ ok: true }, 200, corsHeaders);
}

export async function handleResetPassword(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  let body: { token?: unknown; newPassword?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400, corsHeaders);
  }

  const token = typeof body.token === 'string' ? body.token : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
  if (!token) {
    return jsonResponse({ error: 'invalid_or_expired_token' }, 400, corsHeaders);
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return jsonResponse({ error: 'password_too_short' }, 400, corsHeaders);
  }

  const reset = await env.DB.prepare('SELECT * FROM password_resets WHERE token = ?')
    .bind(token)
    .first<{ token: string; user_id: number; expires_at: string; used: number }>();

  if (!reset || reset.used || new Date(reset.expires_at).getTime() < Date.now()) {
    return jsonResponse({ error: 'invalid_or_expired_token' }, 400, corsHeaders);
  }

  const { hash, salt } = await hashPassword(newPassword, env.PASSWORD_PEPPER);
  await env.DB.batch([
    env.DB.prepare('UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?').bind(
      hash,
      salt,
      reset.user_id,
    ),
    env.DB.prepare('UPDATE password_resets SET used = 1 WHERE token = ?').bind(token),
    // Force re-login everywhere after a password reset -- an old session token shouldn't
    // outlive a password change, e.g. if the reset was triggered because of a leaked device.
    env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(reset.user_id),
  ]);

  return jsonResponse({ ok: true }, 200, corsHeaders);
}
