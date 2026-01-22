import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminSessionCookie, createAdminSessionToken, requireAdminSession } from '@/lib/adminSession';

export const dynamic = 'force-dynamic';

const RESPONSE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
};

function getAdminPassword() {
  // Backward-compatible fallback to match existing client hardcode.
  return process.env.ADMIN_PASSWORD || 'ECWoC2025Admin';
}

export async function GET() {
  const auth = await requireAdminSession();
  return NextResponse.json(
    { authenticated: auth.ok },
    { status: auth.ok ? 200 : 401, headers: RESPONSE_HEADERS }
  );
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const password = String(body?.password || '');

    if (!password) {
      return NextResponse.json(
        { success: false, message: 'Password is required' },
        { status: 400, headers: RESPONSE_HEADERS }
      );
    }

    if (password !== getAdminPassword()) {
      return NextResponse.json(
        { success: false, message: 'Incorrect password' },
        { status: 401, headers: RESPONSE_HEADERS }
      );
    }

    const token = createAdminSessionToken({ ttlMs: 12 * 60 * 60 * 1000 });
    const res = NextResponse.json(
      { success: true },
      { status: 200, headers: RESPONSE_HEADERS }
    );

    res.cookies.set(adminSessionCookie.name, token, {
      ...adminSessionCookie.options,
      maxAge: 12 * 60 * 60,
    });

    return res;
  } catch (error) {
    console.error('Admin session login error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to login' },
      { status: 500, headers: RESPONSE_HEADERS }
    );
  }
}

export async function DELETE() {
  const store = await cookies();
  store.set(adminSessionCookie.name, '', {
    ...adminSessionCookie.options,
    maxAge: 0,
  });

  return NextResponse.json(
    { success: true },
    { status: 200, headers: RESPONSE_HEADERS }
  );
}
