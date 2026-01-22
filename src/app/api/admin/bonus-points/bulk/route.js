import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requireAdminSession } from '@/lib/adminSession';

export const dynamic = 'force-dynamic';

const RESPONSE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
};

let cachedLeaderboardConn = global.leaderboardConn;
if (!cachedLeaderboardConn) {
  cachedLeaderboardConn = global.leaderboardConn = { conn: null, promise: null, uri: null };
}

async function connectLeaderboardDB(uri) {
  if (!uri) throw new Error('Missing MongoDB URI for leaderboard');

  if (cachedLeaderboardConn.conn && cachedLeaderboardConn.uri === uri) {
    return cachedLeaderboardConn.conn;
  }

  if (!cachedLeaderboardConn.promise || cachedLeaderboardConn.uri !== uri) {
    cachedLeaderboardConn.uri = uri;
    cachedLeaderboardConn.promise = mongoose
      .createConnection(uri, { bufferCommands: false })
      .asPromise()
      .then((conn) => conn);
  }

  cachedLeaderboardConn.conn = await cachedLeaderboardConn.promise;
  return cachedLeaderboardConn.conn;
}

function getBonusModel(conn) {
  return (
    conn.models.BonusPoint ||
    conn.model(
      'BonusPoint',
      new mongoose.Schema(
        {
          githubUsernameLower: { type: String, required: true, index: true },
          githubUsername: { type: String, required: true },
          points: { type: Number, required: true },
          task: { type: String, required: true },
          reason: { type: String, default: '' },
          createdByEmail: { type: String, default: null },
          createdByGithub: { type: String, default: null },
        },
        { collection: 'bonus_points', timestamps: true }
      )
    )
  );
}

async function requireAdmin() {
  return requireAdminSession();
}

function parseGithubUsernames(raw) {
  const text = String(raw || '');
  const parts = text.split(/[\s,]+/g).map((p) => p.trim()).filter(Boolean);
  const usernameRegex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

  const seen = new Set();
  const out = [];
  for (const p of parts) {
    const value = p.replace(/^@/, '').trim();
    if (!value) continue;
    if (!usernameRegex.test(value)) continue;
    const lower = value.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    out.push({ githubUsername: value, githubUsernameLower: lower });
  }
  return out;
}

export async function POST(request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status, headers: RESPONSE_HEADERS }
      );
    }

    const body = await request.json().catch(() => ({}));
    const raw = body?.raw;
    const task = String(body?.task || '').trim();
    const reason = String(body?.reason || '').trim();
    const pointsRaw = body?.points;
    const points = Number(pointsRaw);

    if (!task) {
      return NextResponse.json(
        { success: false, message: 'Task is required' },
        { status: 400, headers: RESPONSE_HEADERS }
      );
    }

    if (!Number.isFinite(points) || points === 0) {
      return NextResponse.json(
        { success: false, message: 'Points must be a non-zero number' },
        { status: 400, headers: RESPONSE_HEADERS }
      );
    }

    const usernames = parseGithubUsernames(raw);
    if (!usernames.length) {
      return NextResponse.json(
        { success: false, message: 'No valid GitHub usernames found' },
        { status: 400, headers: RESPONSE_HEADERS }
      );
    }

    const uri = process.env.MONGODB_URI_LEADERBOARD || process.env.MONGODB_URI;
    const conn = await connectLeaderboardDB(uri);
    const BonusPoint = getBonusModel(conn);

    const now = new Date();
    const docs = usernames.map((u) => ({
      githubUsernameLower: u.githubUsernameLower,
      githubUsername: u.githubUsername,
      points,
      task,
      reason,
      createdByEmail: null,
      createdByGithub: null,
      createdAt: now,
      updatedAt: now,
    }));

    const created = await BonusPoint.insertMany(docs, { ordered: false });

    return NextResponse.json(
      {
        success: true,
        created: created.length,
        requested: usernames.length,
        task,
        points,
        batchCreatedAt: now.toISOString(),
      },
      { status: 201, headers: RESPONSE_HEADERS }
    );
  } catch (error) {
    console.error('Bonus bulk add error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to add bonus points' },
      { status: 500, headers: RESPONSE_HEADERS }
    );
  }
}
