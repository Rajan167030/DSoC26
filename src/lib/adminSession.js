import { cookies } from 'next/headers';
import crypto from 'crypto';

const COOKIE_NAME = 'admin_session';

function base64urlEncode(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64urlDecode(str) {
  const s = String(str || '').replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
  return Buffer.from(s + pad, 'base64');
}

function timingSafeEqual(a, b) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

function getSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.JWT_SECRET ||
    'dev-admin-session-secret'
  );
}

export function createAdminSessionToken({ ttlMs = 12 * 60 * 60 * 1000 } = {}) {
  const exp = Date.now() + ttlMs;
  const payload = { v: 1, exp };
  const payloadB64 = base64urlEncode(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', getSecret()).update(payloadB64).digest();
  const sigB64 = base64urlEncode(sig);
  return `${payloadB64}.${sigB64}`;
}

export function verifyAdminSessionToken(token) {
  try {
    const [payloadB64, sigB64] = String(token || '').split('.');
    if (!payloadB64 || !sigB64) return { ok: false, reason: 'missing' };

    const expectedSig = crypto.createHmac('sha256', getSecret()).update(payloadB64).digest();
    const gotSig = base64urlDecode(sigB64);
    if (!timingSafeEqual(expectedSig, gotSig)) return { ok: false, reason: 'bad-signature' };

    const payloadJson = base64urlDecode(payloadB64).toString('utf-8');
    const payload = JSON.parse(payloadJson);
    const exp = Number(payload?.exp);
    if (!Number.isFinite(exp) || exp <= Date.now()) return { ok: false, reason: 'expired' };

    return { ok: true, payload };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}

export async function requireAdminSession() {
  const store = await cookies();
  const token = store?.get?.(COOKIE_NAME)?.value;
  const verified = verifyAdminSessionToken(token);
  if (!verified.ok) {
    return { ok: false, status: 401, message: 'Not authenticated' };
  }
  return { ok: true };
}

export const adminSessionCookie = {
  name: COOKIE_NAME,
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  },
};
