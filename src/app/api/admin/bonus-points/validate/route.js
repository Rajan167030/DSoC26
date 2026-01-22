import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireAdminSession } from '@/lib/adminSession';

export const dynamic = 'force-dynamic';

const RESPONSE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
};

async function requireAdminUser() {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth;
  return { ok: true };
}

function normalizeGithub(value) {
  const v = String(value || '').trim().replace(/^@/, '');
  return v ? v.toLowerCase() : '';
}

export async function POST(request) {
  try {
    const auth = await requireAdminUser();
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status, headers: RESPONSE_HEADERS }
      );
    }

    const body = await request.json().catch(() => ({}));
    const list = Array.isArray(body?.githubUsernames) ? body.githubUsernames : [];

    const lowers = Array.from(
      new Set(list.map((x) => normalizeGithub(x)).filter(Boolean))
    );

    if (!lowers.length) {
      return NextResponse.json(
        { success: false, message: 'githubUsernames is required' },
        { status: 400, headers: RESPONSE_HEADERS }
      );
    }

    if (lowers.length > 5000) {
      return NextResponse.json(
        { success: false, message: 'Too many usernames (max 5000)' },
        { status: 400, headers: RESPONSE_HEADERS }
      );
    }

    // Case-insensitive match using aggregation.
    const found = await User.aggregate([
      {
        $project: {
          _id: 1,
          githubUsername: 1,
          githubLower: { $toLower: { $ifNull: ['$githubUsername', ''] } },
          role: 1,
          name: 1,
          username: 1,
        },
      },
      { $match: { githubLower: { $in: lowers } } },
    ]);

    const byLower = new Map();
    for (const u of found) {
      const key = String(u?.githubLower || '').trim().toLowerCase();
      if (!key) continue;
      byLower.set(key, {
        githubUsername: u?.githubUsername || key,
        githubUsernameLower: key,
        exists: true,
        role: u?.role || null,
        name: u?.name || null,
        username: u?.username || null,
      });
    }

    const items = lowers.map((lower) =>
      byLower.get(lower) || {
        githubUsername: lower,
        githubUsernameLower: lower,
        exists: false,
        role: null,
        name: null,
        username: null,
      }
    );

    return NextResponse.json(
      { success: true, items },
      { status: 200, headers: RESPONSE_HEADERS }
    );
  } catch (error) {
    console.error('Bonus validate error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to validate usernames' },
      { status: 500, headers: RESPONSE_HEADERS }
    );
  }
}
