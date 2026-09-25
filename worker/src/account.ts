// My Page actions: stop or restore the next renewal. Nothing here talks to ZEUS -- renewals are
// scheduled by hand in ZEUS's dashboard, so cancelling just marks the user (canceled_at) and the
// monthly "who's due" list skips them; the operator also deletes any reservation already made.

import { toSessionUser, type UserRow } from './auth';
import { jsonResponse } from './http';

function hasPaidAccess(user: UserRow, now: Date = new Date()): boolean {
  return (
    user.subscription_status === 'active' &&
    !!user.subscription_expires_at &&
    new Date(user.subscription_expires_at).getTime() > now.getTime()
  );
}

async function loadUser(env: Env, userId: number): Promise<UserRow | null> {
  return env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<UserRow>();
}

async function setCanceled(
  env: Env,
  corsHeaders: Record<string, string>,
  userId: number,
  canceled: boolean
): Promise<Response> {
  const user = await loadUser(env, userId);
  if (!user) return jsonResponse({ error: 'unauthorized' }, 401, corsHeaders);
  // Only someone with a paid, unexpired subscription has a renewal to stop or restore.
  if (!hasPaidAccess(user)) return jsonResponse({ error: 'not_subscribed' }, 409, corsHeaders);

  if (canceled !== !!user.canceled_at) {
    await env.DB.prepare('UPDATE users SET canceled_at = ? WHERE id = ?')
      .bind(canceled ? new Date().toISOString() : null, userId)
      .run();
  }

  const updated = await loadUser(env, userId);
  if (!updated) return jsonResponse({ error: 'unauthorized' }, 401, corsHeaders);
  const { id: _id, ...sessionUser } = toSessionUser(updated);
  return jsonResponse({ user: sessionUser }, 200, corsHeaders);
}

export const handleCancelSubscription = (env: Env, corsHeaders: Record<string, string>, userId: number) =>
  setCanceled(env, corsHeaders, userId, true);

export const handleResumeSubscription = (env: Env, corsHeaders: Record<string, string>, userId: number) =>
  setCanceled(env, corsHeaders, userId, false);
