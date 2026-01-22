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

async function requireAdminUser() {
  return requireAdminSession();
}

export async function GET(request) {
  try {
    const auth = await requireAdminUser();
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status, headers: RESPONSE_HEADERS }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedLimit = parseInt(searchParams.get('limit') || '50', 10);
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 500) : 50;

    const uri = process.env.MONGODB_URI_LEADERBOARD || process.env.MONGODB_URI;
    const conn = await connectLeaderboardDB(uri);
    const BonusPoint = getBonusModel(conn);

    const entries = await BonusPoint.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json(
      { success: true, entries },
      { status: 200, headers: RESPONSE_HEADERS }
    );
  } catch (error) {
    console.error('Bonus admin list error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to fetch bonus entries' },
      { status: 500, headers: RESPONSE_HEADERS }
    );
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireAdminUser();
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status, headers: RESPONSE_HEADERS }
      );
    }

    const body = await request.json().catch(() => ({}));
    const mode = String(body?.mode || '').trim();
    const toTask = String(body?.toTask || '').trim();

    if (!toTask) {
      return NextResponse.json(
        { success: false, message: 'toTask is required' },
        { status: 400, headers: RESPONSE_HEADERS }
      );
    }
    if (toTask.length > 120) {
      return NextResponse.json(
        { success: false, message: 'toTask is too long' },
        { status: 400, headers: RESPONSE_HEADERS }
      );
    }

    const uri = process.env.MONGODB_URI_LEADERBOARD || process.env.MONGODB_URI;
    const conn = await connectLeaderboardDB(uri);
    const BonusPoint = getBonusModel(conn);

    if (mode === 'batch') {
      const batchCreatedAt = String(body?.batchCreatedAt || '').trim();
      const fromTask = String(body?.fromTask || '').trim();
      const createdAt = batchCreatedAt ? new Date(batchCreatedAt) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) {
        return NextResponse.json(
          { success: false, message: 'batchCreatedAt must be a valid ISO date string' },
          { status: 400, headers: RESPONSE_HEADERS }
        );
      }

      const filter = { createdAt };
      if (fromTask) filter.task = fromTask;

      const result = await BonusPoint.updateMany(filter, { $set: { task: toTask } });
      return NextResponse.json(
        {
          success: true,
          mode,
          matched: result?.matchedCount ?? result?.n ?? 0,
          modified: result?.modifiedCount ?? result?.nModified ?? 0,
        },
        { status: 200, headers: RESPONSE_HEADERS }
      );
    }

    if (mode === 'ids') {
      const ids = Array.isArray(body?.ids) ? body.ids : [];
      const cleaned = ids
        .map((id) => String(id || '').trim())
        .filter(Boolean)
        .slice(0, 200);

      if (!cleaned.length) {
        return NextResponse.json(
          { success: false, message: 'ids must be a non-empty array' },
          { status: 400, headers: RESPONSE_HEADERS }
        );
      }

      const objectIds = cleaned
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      if (!objectIds.length) {
        return NextResponse.json(
          { success: false, message: 'No valid ids provided' },
          { status: 400, headers: RESPONSE_HEADERS }
        );
      }

      const result = await BonusPoint.updateMany(
        { _id: { $in: objectIds } },
        { $set: { task: toTask } }
      );

      return NextResponse.json(
        {
          success: true,
          mode,
          matched: result?.matchedCount ?? result?.n ?? 0,
          modified: result?.modifiedCount ?? result?.nModified ?? 0,
        },
        { status: 200, headers: RESPONSE_HEADERS }
      );
    }

    return NextResponse.json(
      { success: false, message: "mode must be 'batch' or 'ids'" },
      { status: 400, headers: RESPONSE_HEADERS }
    );
  } catch (error) {
    console.error('Bonus admin patch error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to update bonus entries' },
      { status: 500, headers: RESPONSE_HEADERS }
    );
  }
}
