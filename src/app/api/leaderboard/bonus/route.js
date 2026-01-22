import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

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

function normalizeGithub(value) {
  const v = String(value || '').trim().replace(/^@/, '');
  return v ? v.toLowerCase() : '';
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const github = normalizeGithub(searchParams.get('github') || '');

    if (!github) {
      return NextResponse.json(
        { success: false, message: 'github is required' },
        { status: 400, headers: RESPONSE_HEADERS }
      );
    }

    const requestedLimit = parseInt(searchParams.get('limit') || '200', 10);
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 2000) : 200;

    const uri = process.env.MONGODB_URI_LEADERBOARD || process.env.MONGODB_URI;
    const conn = await connectLeaderboardDB(uri);
    const BonusPoint = getBonusModel(conn);

    const [agg] = await BonusPoint.aggregate([
      { $match: { githubUsernameLower: github } },
      { $group: { _id: '$githubUsernameLower', total: { $sum: '$points' }, count: { $sum: 1 } } },
    ]);

    const entries = await BonusPoint.find({ githubUsernameLower: github })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json(
      {
        success: true,
        github,
        total: agg?.total || 0,
        count: agg?.count || 0,
        entries,
      },
      { status: 200, headers: RESPONSE_HEADERS }
    );
  } catch (error) {
    console.error('Bonus fetch error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to fetch bonus points' },
      { status: 500, headers: RESPONSE_HEADERS }
    );
  }
}
