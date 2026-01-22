import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Application from '@/models/Application';
import mongoose from 'mongoose';
import { requireAdminSession } from '@/lib/adminSession';

export const dynamic = 'force-dynamic';

const RESPONSE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
};

const PROGRAM_START = new Date(Date.UTC(2026, 0, 1, 0, 0, 0, 0));

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

function getPaLeaderboardSnapshotModel(conn) {
  return (
    conn.models.PaLeaderboardSnapshot ||
    conn.model(
      'PaLeaderboardSnapshot',
      new mongoose.Schema(
        {
          generatedAt: { type: Date, required: true, index: true },
          programStart: { type: Date, required: true },
          admins: { type: [mongoose.Schema.Types.Mixed], default: [] },
          histories: {
            type: [
              {
                emailLower: { type: String, index: true },
                githubUsernameLower: { type: String, index: true },
                payload: { type: mongoose.Schema.Types.Mixed, default: null },
              },
            ],
            default: [],
          },
        },
        { collection: 'pa-leaderboard', timestamps: true }
      )
    )
  );
}

function clampInt(value, min, max, fallback) {
  const n = parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

function parseGithubRepos(text) {
  const value = String(text || '');
  const repos = new Set();

  const normalizeRepo = (repo) => String(repo || '').replace(/\.git$/i, '');

  const reservedPathSegments = new Set([
    'blob',
    'tree',
    'main',
    'master',
    'pull',
    'pulls',
    'issues',
    'issue',
    'commit',
    'commits',
    'releases',
    'actions',
    'compare',
    'tags',
    'branches',
    'wiki',
    'settings',
    'security',
  ]);

  const urlRegex = /github\.com\/(?<owner>[A-Za-z0-9_.-]+)\/(?<repo>[A-Za-z0-9_.-]+)(?:\.git)?/gi;
  for (const match of value.matchAll(urlRegex)) {
    const owner = match?.groups?.owner;
    const repo = normalizeRepo(match?.groups?.repo);
    if (owner && repo) repos.add(`${owner}/${repo}`);
  }

  const fragRegex = /\b(?<owner>[A-Za-z0-9_.-]+)\/(?<repo>[A-Za-z0-9_.-]+)\b/g;
  for (const match of value.matchAll(fragRegex)) {
    const owner = match?.groups?.owner;
    const repo = normalizeRepo(match?.groups?.repo);
    if (!owner || !repo) continue;

    const ownerLower = String(owner).toLowerCase();
    const repoLower = String(repo).toLowerCase();

    if (ownerLower === 'github.com' || ownerLower === 'www.github.com') continue;
    if (ownerLower.includes('.')) continue;
    if (reservedPathSegments.has(ownerLower) || reservedPathSegments.has(repoLower)) continue;

    repos.add(`${owner}/${repo}`);
  }

  return Array.from(repos);
}

function normalizeGithubUsername(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  let s = raw.replace(/^@+/, '');

  if (/github\.com/i.test(s)) {
    try {
      const url = new URL(s.startsWith('http') ? s : `https://${s}`);
      const part = url.pathname.split('/').filter(Boolean)[0] || '';
      s = part;
    } catch {
      s = s.replace(/^.*github\.com\//i, '');
      s = s.split('/').filter(Boolean)[0] || s;
    }
  }

  s = s.replace(/\s+/g, '');
  s = s.replace(/\/$/, '');
  return s;
}

function msBetween(a, b) {
  return new Date(b).getTime() - new Date(a).getTime();
}

function hoursBetween(a, b) {
  return msBetween(a, b) / 3600000;
}

function daysBetween(a, b) {
  return msBetween(a, b) / 86400000;
}

function toUtcDayKey(isoOrDate) {
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function computeWeeklyActivityBonus(activityDaysSet, now) {
  const hasDay = (key) => activityDaysSet.has(key);

  const toDayNum = (key) => {
    if (!key) return null;
    const parts = String(key).split('-');
    if (parts.length !== 3) return null;
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
    const ms = Date.UTC(y, m - 1, d);
    return Math.floor(ms / 86400000);
  };

  // Weekly bonus is cumulative: +10 for each completed block of 7 consecutive active days
  // across the whole season (not just within a rolling window).
  const dayNums = Array.from(activityDaysSet)
    .map((k) => toDayNum(k))
    .filter((n) => typeof n === 'number' && Number.isFinite(n))
    .sort((a, b) => a - b);

  let bonus = 0;
  let streakLen = 0;
  let prev = null;
  for (const n of dayNums) {
    if (prev === null || n !== prev + 1) {
      bonus += Math.floor(streakLen / 7) * 10;
      streakLen = 1;
    } else {
      streakLen += 1;
    }
    prev = n;
  }
  bonus += Math.floor(streakLen / 7) * 10;

  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const makeKeyForOffset = (offsetDays) => {
    const d = new Date(todayUtc);
    d.setUTCDate(d.getUTCDate() - offsetDays);
    return toUtcDayKey(d);
  };

  const bucketComplete = (startOffset) => {
    for (let i = 0; i < 7; i++) {
      const key = makeKeyForOffset(startOffset + i);
      if (!key || !hasDay(key)) return false;
    }
    return true;
  };

  // Back-compat flags: whether the most recent 7-day buckets are complete.
  // These do not drive the cumulative bonus calculation above.
  const last7Complete = bucketComplete(0);
  const prev7Complete = bucketComplete(7);

  let inactive7 = true;
  for (let i = 0; i < 7; i++) {
    const key = makeKeyForOffset(i);
    if (key && hasDay(key)) {
      inactive7 = false;
      break;
    }
  }

  const penalty = inactive7 ? -10 : 0;

  return {
    bonus,
    penalty,
    inactive7,
    last7Complete,
    prev7Complete,
  };
}

function isBotLikeActor(login, actorType) {
  if (actorType && String(actorType).toLowerCase() === 'bot') return true;
  const s = String(login || '').toLowerCase();
  if (!s) return false;
  if (s.endsWith('[bot]')) return true;
  if (s === 'github-actions' || s === 'github-actions[bot]') return true;
  if (s.includes('bot_action')) return true;
  if (s.includes('dependabot')) return true;
  if (s.includes('renovate')) return true;
  if (s.includes('copilot')) return true;
  if (s.includes('githubbot') || s === 'githubbot') return true;
  if (s === 'bot' || s.endsWith('-bot')) return true;
  return false;
}

async function ghGraphql(query, variables) {
  const token = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT;
  if (!token) {
    throw new Error('Missing GITHUB_TOKEN / GITHUB_PAT for GitHub GraphQL requests');
  }

  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });

  const json = await res.json();
  if (!res.ok || json.errors) {
    const msg = json?.errors?.[0]?.message || `GitHub GraphQL failed (${res.status})`;
    throw new Error(msg);
  }

  return json.data;
}

function isConfiguredBySentinel(signal) {
  return signal?.seenDsoc26LabelOnMergedPr === true;
}

const prQuery = `
  query RepoPrPage(
    $owner: String!
    $name: String!
    $first: Int!
    $after: String
    $prTimelineFirst: Int!
  ) {
    repository(owner: $owner, name: $name) {
      nameWithOwner
      pullRequests(first: $first, after: $after, orderBy: { field: CREATED_AT, direction: DESC }) {
        pageInfo { hasNextPage endCursor }
        nodes {
          url
          state
          createdAt
          mergedAt
          author { login __typename }
          labels(first: 20) { nodes { name } }
          closingIssuesReferences(first: 10) { nodes { closedAt url } }
          timelineItems(first: $prTimelineFirst, itemTypes: [ISSUE_COMMENT, PULL_REQUEST_REVIEW, MERGED_EVENT, LABELED_EVENT]) {
            nodes {
              __typename
              ... on IssueComment { author { login __typename } createdAt }
              ... on PullRequestReview { author { login __typename } createdAt }
              ... on MergedEvent { actor { login __typename } createdAt }
              ... on LabeledEvent { actor { login __typename } createdAt label { name } }
            }
          }
        }
      }
    }
  }
`;

const issueQuery = `
  query RepoIssuePage(
    $owner: String!
    $name: String!
    $first: Int!
    $after: String
    $issueTimelineFirst: Int!
  ) {
    repository(owner: $owner, name: $name) {
      nameWithOwner
      issues(first: $first, after: $after, orderBy: { field: CREATED_AT, direction: DESC }, states: OPEN) {
        pageInfo { hasNextPage endCursor }
        nodes {
          url
          createdAt
          author { login }
          timelineItems(first: $issueTimelineFirst, itemTypes: [ISSUE_COMMENT, LABELED_EVENT, ASSIGNED_EVENT, CLOSED_EVENT]) {
            nodes {
              __typename
              ... on IssueComment { author { login } createdAt }
              ... on LabeledEvent { actor { login } createdAt label { name } }
              ... on AssignedEvent { actor { login } createdAt }
              ... on ClosedEvent { actor { login } createdAt }
            }
          }
        }
      }
    }
  }
`;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();

    const email = String(searchParams.get('email') || '').trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400, headers: RESPONSE_HEADERS });
    }

    const snapshotId = String(searchParams.get('snapshotId') || '').trim();

    // If we have a published snapshot with embedded histories, serve that for speed and consistency.
    try {
      const lbUri = process.env.MONGODB_URI_LEADERBOARD || process.env.MONGODB_URI;
      if (lbUri) {
        const lbConn = await connectLeaderboardDB(lbUri);
        const Snapshot = getPaLeaderboardSnapshotModel(lbConn);

        let snap = null;
        if (snapshotId) {
          // Allow pinning to the latest snapshot publicly; older snapshots require admin.
          const latestMeta = await Snapshot.findOne({}).select('_id').sort({ generatedAt: -1, createdAt: -1 }).lean();
          const latestId = latestMeta?._id ? String(latestMeta._id) : '';
          if (latestId && snapshotId !== latestId) {
            const auth = await requireAdminSession();
            if (!auth.ok) {
              return NextResponse.json(
                { error: auth.message || 'Not authenticated' },
                { status: auth.status || 401, headers: RESPONSE_HEADERS }
              );
            }
          }

          snap = await Snapshot.findById(snapshotId).lean();
        } else {
          snap = await Snapshot.findOne({}).sort({ generatedAt: -1, createdAt: -1 }).lean();
        }

        const entry = Array.isArray(snap?.histories)
          ? snap.histories.find((h) => String(h?.emailLower || '').trim().toLowerCase() === email)
          : null;

        if (entry?.payload && typeof entry.payload === 'object') {
          return NextResponse.json(entry.payload, { headers: RESPONSE_HEADERS });
        }
      }
    } catch (e) {
      // If snapshot lookup fails, fall back to live compute.
    }

    const maxReposPerAdmin = clampInt(searchParams.get('maxReposPerAdmin'), 1, 50, 10);
    const prPageSize = clampInt(searchParams.get('prPageSize'), 10, 100, 100);
    const issuePageSize = clampInt(searchParams.get('issuePageSize'), 10, 100, 100);
    const prTimelineItems = clampInt(searchParams.get('prTimelineItems'), 5, 100, 30);
    const issueTimelineItems = clampInt(searchParams.get('issueTimelineItems'), 5, 100, 30);

    await connectDB();

    const admin = await Application.findOne({ role: 'project-admin', status: 'approved', email })
      .select('name email githubUsername projectUrl projectName')
      .lean();

    if (!admin) {
      return NextResponse.json({ error: 'Project admin not found' }, { status: 404, headers: RESPONSE_HEADERS });
    }

    const adminGh = normalizeGithubUsername(admin.githubUsername);
    const repos = parseGithubRepos(admin.projectUrl || '').slice(0, maxReposPerAdmin);

    let bonusPoints = 0;
    try {
      const lbUri = process.env.MONGODB_URI_LEADERBOARD || process.env.MONGODB_URI;
      if (lbUri && adminGh) {
        const lbConn = await connectLeaderboardDB(lbUri);
        const BonusPoint = getBonusModel(lbConn);
        const ghLower = String(adminGh).toLowerCase();
        const [row] = await BonusPoint.aggregate([
          { $match: { githubUsernameLower: ghLower } },
          { $group: { _id: null, total: { $sum: '$points' } } },
        ]);
        bonusPoints = typeof row?.total === 'number' ? row.total : 0;
      }
    } catch (e) {
      // Non-fatal: history should still render without bonus.
      bonusPoints = 0;
    }

    const payload = {
      generatedAt: new Date().toISOString(),
      programStart: PROGRAM_START.toISOString(),
      admin: {
        name: admin.name || 'Project Admin',
        email: admin.email,
        githubUsername: adminGh || null,
        projectName: admin.projectName || null,
        repos,
      },
      configured: { ok: true },
      totals: {
        score: 0,
        baseScore: 0,
        bonusPoints: 0,
        mergesPlus: 0,
        prFirstPlus: 0,
        prFirstMinus: 0,
        prInactionMinus: 0,
        issueClosePlus: 0,
        issueCloseMinus: 0,
        issueInactionMinus: 0,
        weeklyPlus: 0,
        weeklyMinus: 0,
      },
      items: {
        prs: [],
        issues: [],
      },
      errors: [],
    };

    if (!adminGh) {
      payload.configured.ok = false;
      payload.errors.push('Missing githubUsername for this project admin.');
      return NextResponse.json(payload, { headers: RESPONSE_HEADERS });
    }

    payload.totals.bonusPoints = bonusPoints;

    if (!repos.length) {
      payload.configured.ok = false;
      payload.errors.push('No GitHub repos found in projectUrl.');
      return NextResponse.json(payload, { headers: RESPONSE_HEADERS });
    }

    // Sentinel configured heuristic across repos.
    const sentinelSignal = { seenDsoc26LabelOnMergedPr: false };

    const activityDays = new Set();

    for (const full of repos) {
      const [owner, name] = full.split('/');

      // PR scan
      let prAfter = null;
      let prCutoffReached = false;
      while (!prCutoffReached) {
        const data = await ghGraphql(prQuery, {
          owner,
          name,
          first: prPageSize,
          after: prAfter,
          prTimelineFirst: prTimelineItems,
        });

        const repo = data?.repository;
        if (!repo) {
          payload.configured.ok = false;
          payload.errors.push(`Repo not found or access denied: ${full}`);
          break;
        }

        const conn = repo.pullRequests;
        const nodes = conn?.nodes || [];
        const pageInfo = conn?.pageInfo;

        for (const pr of nodes) {
          if (!pr?.createdAt) continue;
          if (new Date(pr.createdAt) < PROGRAM_START) {
            prCutoffReached = true;
            break;
          }

          const labels = (pr.labels?.nodes || []).map((l) => l?.name).filter(Boolean);
          const hasDsoc26 = labels.some((n) => String(n).toLowerCase() === 'dsoc26');

          if (pr.mergedAt && hasEcwoc26) {
            sentinelSignal.seenEcwoc26LabelOnMergedPr = true;
          }

          const timeline = pr.timelineItems?.nodes || [];

          for (const ev of timeline) {
            const t = ev?.createdAt;
            if (!t) continue;
            if (new Date(t) < PROGRAM_START) continue;
            const actor = ev?.author?.login || ev?.actor?.login || null;
            if (actor && String(actor).toLowerCase() === adminGh.toLowerCase()) {
              const key = toUtcDayKey(t);
              if (key) activityDays.add(key);
            }
          }

          const prAuthor = String(pr?.author?.login || '').toLowerCase();
          const firstRespAt = timeline
            .map((ev) => {
              const t = ev?.createdAt;
              if (!t) return null;
              if (new Date(t) < PROGRAM_START) return null;

              const type = ev?.__typename;
              if (type !== 'IssueComment' && type !== 'PullRequestReview' && type !== 'MergedEvent') return null;

              const actor = ev?.author?.login || ev?.actor?.login || null;
              const actorType = ev?.author?.__typename || ev?.actor?.__typename || null;
              if (!actor) return null;
              if (isBotLikeActor(actor, actorType)) return null;
              if (prAuthor && String(actor).toLowerCase() === prAuthor) return null;
              return { t };
            })
            .filter(Boolean)
            .sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime())[0]?.t || null;

          let prFirstDelta = 0;
          let prFirstLabel = null;
          if (hasEcwoc26) {
            if (firstRespAt) {
              const hrs = hoursBetween(pr.createdAt, firstRespAt);
              if (hrs <= 24) {
                prFirstDelta = 6;
                prFirstLabel = '≤24h (+6)';
              } else if (hrs <= 48) {
                prFirstDelta = 4;
                prFirstLabel = '24–48h (+4)';
              } else {
                prFirstDelta = 1;
                prFirstLabel = '>48h (+1)';
              }
              payload.totals.prFirstPlus += prFirstDelta;
            } else {
              // Penalty applies only when a PR is still open and has had no meaningful response.
              // Do not penalize merged/closed PRs.
              const prState = String(pr.state).toUpperCase();
              const ageDays = daysBetween(pr.createdAt, now);
              if (prState === 'OPEN' && ageDays >= 4) {
                prFirstDelta = -10;
                prFirstLabel = 'No response ≥4d (-10)';
                payload.totals.prFirstMinus += prFirstDelta;
              }
            }
          }

          let mergeDelta = 0;
          if (pr.mergedAt && hasEcwoc26) {
            mergeDelta = 3;
            payload.totals.mergesPlus += 3;
          }

          let prInactionDelta = 0;
          if (hasEcwoc26 && String(pr.state).toUpperCase() === 'OPEN') {
            const ageDays = daysBetween(pr.createdAt, now);
            if (ageDays > 5 && !firstRespAt) {
              prInactionDelta = -10;
              payload.totals.prInactionMinus += prInactionDelta;
            }
          }

          const issueClosure = [];
          if (hasEcwoc26 && pr.mergedAt && pr.closingIssuesReferences?.nodes?.length) {
            for (const issue of pr.closingIssuesReferences.nodes) {
              const closedAt = issue?.closedAt;
              let delta = 0;
              let label = null;
              if (closedAt) {
                const hrs = hoursBetween(pr.mergedAt, closedAt);
                if (hrs <= 48 && hrs >= -48) {
                  delta = 2;
                  label = 'Closed ≤48h (+2)';
                  payload.totals.issueClosePlus += 2;
                } else {
                  delta = -5;
                  label = 'Not closed ≤48h (-5)';
                  payload.totals.issueCloseMinus += delta;
                }
              } else {
                const hrs = hoursBetween(pr.mergedAt, now);
                if (hrs > 48) {
                  delta = -5;
                  label = 'Still open >48h (-5)';
                  payload.totals.issueCloseMinus += delta;
                }
              }

              if (delta !== 0) {
                issueClosure.push({ url: issue?.url || null, closedAt: closedAt || null, delta, label });
              }
            }
          }

          const totalDelta = prFirstDelta + mergeDelta + prInactionDelta + issueClosure.reduce((s, x) => s + (x.delta || 0), 0);

          payload.items.prs.push({
            repo: full,
            url: pr.url,
            state: pr.state,
            createdAt: pr.createdAt,
            mergedAt: pr.mergedAt,
            hasEcwoc26,
            firstRespAt,
            prFirstDelta,
            prFirstLabel,
            mergeDelta,
            prInactionDelta,
            issueClosure,
            totalDelta,
          });
        }

        if (!pageInfo?.hasNextPage || prCutoffReached) break;
        prAfter = pageInfo.endCursor;
      }

      if (!payload.configured.ok) break;

      // Issues scan (only needed for issue inaction)
      let issueAfter = null;
      let issueCutoffReached = false;
      while (!issueCutoffReached) {
        const data = await ghGraphql(issueQuery, {
          owner,
          name,
          first: issuePageSize,
          after: issueAfter,
          issueTimelineFirst: issueTimelineItems,
        });

        const repo = data?.repository;
        if (!repo) {
          payload.configured.ok = false;
          payload.errors.push(`Repo not found or access denied: ${full}`);
          break;
        }

        const conn = repo.issues;
        const nodes = conn?.nodes || [];
        const pageInfo = conn?.pageInfo;

        for (const issue of nodes) {
          if (!issue?.createdAt) continue;
          if (new Date(issue.createdAt) < PROGRAM_START) {
            issueCutoffReached = true;
            break;
          }

          const author = issue?.author?.login || '';
          const timeline = issue.timelineItems?.nodes || [];

          for (const ev of timeline) {
            const t = ev?.createdAt;
            if (!t) continue;
            if (new Date(t) < PROGRAM_START) continue;
            const actor = ev?.author?.login || ev?.actor?.login || null;
            if (actor && String(actor).toLowerCase() === adminGh.toLowerCase()) {
              const key = toUtcDayKey(t);
              if (key) activityDays.add(key);
            }
          }

          const adminActionAt = timeline
            .map((ev) => {
              const actor = ev?.author?.login || ev?.actor?.login || null;
              const t = ev?.createdAt;
              if (!t) return null;
              if (new Date(t) < PROGRAM_START) return null;
              return actor && t ? { actor, t } : null;
            })
            .filter(Boolean)
            .filter((e) => String(e.actor).toLowerCase() === adminGh.toLowerCase())
            .sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime())[0]?.t;

          let delta = 0;
          let label = null;
          if (author && author.toLowerCase() !== adminGh.toLowerCase()) {
            if (!adminActionAt) {
              const hrs = hoursBetween(issue.createdAt, now);
              if (hrs > 36) {
                delta = -5;
                label = 'No admin action >36h (-5)';
                payload.totals.issueInactionMinus += delta;
              }
            }
          }

          if (delta !== 0) {
            payload.items.issues.push({
              repo: full,
              url: issue.url,
              createdAt: issue.createdAt,
              author,
              adminActionAt: adminActionAt || null,
              delta,
              label,
            });
          }
        }

        if (!pageInfo?.hasNextPage || issueCutoffReached) break;
        issueAfter = pageInfo.endCursor;
      }

      if (!payload.configured.ok) break;
    }

    if (!isConfiguredBySentinel(sentinelSignal)) {
      payload.configured.ok = false;
      payload.errors.push('ecwoc-sentinel not detected; score forced to 0.');
    }

    if (payload.configured.ok) {
      const weekly = computeWeeklyActivityBonus(activityDays, now);
      payload.totals.weeklyPlus += weekly.bonus;
      payload.totals.weeklyMinus += weekly.penalty;
    }

    const baseScore = payload.configured.ok
      ? payload.totals.mergesPlus +
        payload.totals.prFirstPlus +
        payload.totals.prFirstMinus +
        payload.totals.prInactionMinus +
        payload.totals.issueClosePlus +
        payload.totals.issueCloseMinus +
        payload.totals.issueInactionMinus +
        payload.totals.weeklyPlus +
        payload.totals.weeklyMinus
      : 0;

    payload.totals.baseScore = baseScore;
    payload.totals.score = baseScore + bonusPoints;

    // Backward-compatible aliases for UI.
    payload.totals.weekly = { plus: payload.totals.weeklyPlus, minus: payload.totals.weeklyMinus };

    return NextResponse.json(payload, { headers: RESPONSE_HEADERS });
  } catch (error) {
    console.error('Project admin history error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to build project admin history' },
      { status: 500, headers: RESPONSE_HEADERS }
    );
  }
}
