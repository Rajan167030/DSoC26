import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Application from '@/models/Application';
import User from '@/models/User';
import mongoose from 'mongoose';
import { requireAdminSession } from '@/lib/adminSession';

export const dynamic = 'force-dynamic';

const PROGRAM_START = new Date(Date.UTC(2026, 0, 1, 0, 0, 0, 0));

const DEFAULTS = {
  maxAdmins: 100,
  // Defaults tuned for fast API responses.
  // Override via query params if needed.
  maxReposPerAdmin: 4,
  // NOTE: These are page sizes (GitHub GraphQL pagination), not total caps.
  maxPrsPerRepo: 100,
  maxIssuesPerRepo: 100,
  prTimelineItems: 30,
  issueTimelineItems: 30,
  concurrency: 6,
  cacheTtlMs: 5 * 60 * 1000,
};

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
              new mongoose.Schema(
                {
                  emailLower: { type: String, required: true, index: true },
                  githubUsernameLower: { type: String, default: null, index: true },
                  payload: { type: mongoose.Schema.Types.Mixed, required: true },
                },
                { _id: false }
              ),
            ],
            default: [],
          },
        },
        { collection: 'pa-leaderboard', timestamps: true }
      )
    )
  );
}

function getPaLeaderboardMetaModel(conn) {
  return (
    conn.models.PaLeaderboardMeta ||
    conn.model(
      'PaLeaderboardMeta',
      new mongoose.Schema(
        {
          _id: { type: String, required: true },
          activeSnapshotId: { type: String, default: '' },
          lastAutoRefreshAt: { type: Date, default: null },
          autoRefreshLockedUntil: { type: Date, default: null },
        },
        { collection: 'pa-leaderboard-meta', timestamps: true }
      )
    )
  );
}

let cached = global.__projectAdminLeaderboardCache;
if (!cached) {
  cached = global.__projectAdminLeaderboardCache = { at: 0, key: '', payload: null };
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

  // Match both full URLs and owner/repo fragments.
  const urlRegex = /github\.com\/(?<owner>[A-Za-z0-9_.-]+)\/(?<repo>[A-Za-z0-9_.-]+)(?:\.git)?/gi;
  for (const match of value.matchAll(urlRegex)) {
    const owner = match?.groups?.owner;
    const repo = normalizeRepo(match?.groups?.repo);
    if (owner && repo) repos.add(`${owner}/${repo}`);
  }

  // Also allow plain owner/repo in text.
  const fragRegex = /\b(?<owner>[A-Za-z0-9_.-]+)\/(?<repo>[A-Za-z0-9_.-]+)\b/g;
  for (const match of value.matchAll(fragRegex)) {
    const owner = match?.groups?.owner;
    const repo = normalizeRepo(match?.groups?.repo);
    if (!owner || !repo) continue;

    const ownerLower = String(owner).toLowerCase();
    const repoLower = String(repo).toLowerCase();

    // Prevent common false-positives from URLs like "https://github.com/owner/repo".
    // The URL regex above already captures the correct owner/repo.
    if (ownerLower === 'github.com' || ownerLower === 'www.github.com') continue;
    if (ownerLower.includes('.')) continue;

    // Prevent false-positives from GitHub URL path segments, e.g.
    // owner/repo/blob/main/path -> we don't want repo/blob or main/path.
    if (reservedPathSegments.has(ownerLower) || reservedPathSegments.has(repoLower)) continue;

    repos.add(`${owner}/${repo}`);
  }

  return Array.from(repos);
}

function toUtcDayKey(isoOrDate) {
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function msBetween(a, b) {
  return new Date(b).getTime() - new Date(a).getTime();
}

function normalizeGithubUsername(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  // Common cases: '@user', 'user', 'github.com/user', 'https://github.com/user', 'https://github.com/user/'
  let s = raw.replace(/^@+/, '');

  if (/github\.com/i.test(s)) {
    // Try URL parsing first.
    try {
      const url = new URL(s.startsWith('http') ? s : `https://${s}`);
      const part = url.pathname.split('/').filter(Boolean)[0] || '';
      s = part;
    } catch {
      // Fallback: strip everything up to github.com/
      s = s.replace(/^.*github\.com\//i, '');
      s = s.split('/').filter(Boolean)[0] || s;
    }
  }

  // Final cleanup
  s = s.replace(/\s+/g, '');
  s = s.replace(/\/$/, '');
  return s;
}

function hoursBetween(a, b) {
  return msBetween(a, b) / 3600000;
}

function daysBetween(a, b) {
  return msBetween(a, b) / 86400000;
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

async function mapWithConcurrency(items, limit, worker) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return [];

  const safeLimit = Math.max(1, Math.min(limit || 1, list.length));
  const results = new Array(list.length);
  let nextIndex = 0;

  const runners = Array.from({ length: safeLimit }, async () => {
    while (true) {
      const idx = nextIndex++;
      if (idx >= list.length) break;
      results[idx] = await worker(list[idx], idx);
    }
  });

  await Promise.all(runners);
  return results;
}

function computeWeeklyActivityBonus(activityDaysSet, now) {
  const hasDay = (key) => activityDaysSet.has(key);

  // Weekly bonus is cumulative: +10 for each completed block of 7 consecutive active days
  // across the whole season (not just within a rolling window).
  const dayNums = Array.from(activityDaysSet)
    .map((k) => toUtcDayNumberFromKey(k))
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

  // Inactivity: no activity for last 7 days.
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
    // Kept for backward compatibility with older UI fields.
    last7Complete,
    prev7Complete,
  };
}

function isBotLikeActor(login, actorType) {
  if (actorType && String(actorType).toLowerCase() === 'bot') return true;
  const s = String(login || '').toLowerCase();
  if (!s) return false;

  // GitHub bot naming conventions and common automated actors.
  if (s.endsWith('[bot]')) return true;
  if (s === 'github-actions' || s === 'github-actions[bot]') return true;
  if (s.includes('bot_action')) return true;
  if (s.includes('dependabot')) return true;
  if (s.includes('renovate')) return true;
  if (s.includes('copilot')) return true;
  if (s.includes('githubbot') || s === 'githubbot') return true;

  // Generic fallback (kept last to avoid false positives on human handles).
  if (s === 'bot' || s.endsWith('-bot')) return true;

  return false;
}

function toUtcDayNumberFromKey(key) {
  if (!key) return null;
  const parts = String(key).split('-');
  if (parts.length !== 3) return null;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

function computeStreaksFromDayKeys(dayKeysSet) {
  const dayNumbers = new Set();
  for (const key of dayKeysSet || []) {
    const day = toUtcDayNumberFromKey(key);
    if (day === null) continue;
    dayNumbers.add(day);
  }

  const sorted = Array.from(dayNumbers).sort((a, b) => a - b);
  if (sorted.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      run += 1;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  // Current streak = consecutive run ending on the last activity day.
  let current = 1;
  for (let i = sorted.length - 1; i > 0; i--) {
    if (sorted[i] === sorted[i - 1] + 1) current += 1;
    else break;
  }

  return { current, longest };
}

function isConfiguredBySentinel(signal) {
  // Runtime-only heuristic (no actor check):
  // If we see any merged PR with label "DSoC26", we treat sentinel as configured.
  // This matches the spec assumption that DSoC26 labels are applied by dsoc-sentinel.
  return signal?.seenDsoc26LabelOnMergedPr === true;
}

function snapshotToPayload(snapshot, { includeHistories = false } = {}) {
  if (!snapshot) return null;
  const generatedAt = snapshot?.generatedAt instanceof Date ? snapshot.generatedAt.toISOString() : snapshot?.generatedAt;
  const programStart = snapshot?.programStart instanceof Date ? snapshot.programStart.toISOString() : snapshot?.programStart;
  return {
    snapshotId: snapshot?._id ? String(snapshot._id) : null,
    generatedAt,
    programStart,
    admins: Array.isArray(snapshot?.admins) ? snapshot.admins : [],
    ...(includeHistories ? { histories: Array.isArray(snapshot?.histories) ? snapshot.histories : [] } : {}),
  };
}

async function buildLiveLeaderboardPayload(request, { forceBypassCache = false, includeHistory = false } = {}) {
  const { searchParams } = new URL(request.url);
  const now = new Date();

  const effectiveCacheTtlMs = process.env.NODE_ENV === 'production' ? DEFAULTS.cacheTtlMs : 0;
  const bypassCache =
    forceBypassCache || searchParams.get('nocache') === '1' || effectiveCacheTtlMs === 0;

  const maxAdmins = clampInt(searchParams.get('maxAdmins'), 1, 100, DEFAULTS.maxAdmins);
  const maxReposPerAdmin = clampInt(searchParams.get('maxReposPerAdmin'), 1, 5, DEFAULTS.maxReposPerAdmin);
  const maxPrsPerRepo = clampInt(searchParams.get('maxPrsPerRepo'), 1, 300, DEFAULTS.maxPrsPerRepo);
  const maxIssuesPerRepo = clampInt(searchParams.get('maxIssuesPerRepo'), 1, 300, DEFAULTS.maxIssuesPerRepo);
  const prTimelineItems = clampInt(searchParams.get('prTimelineItems'), 5, 100, DEFAULTS.prTimelineItems);
  const issueTimelineItems = clampInt(searchParams.get('issueTimelineItems'), 5, 100, DEFAULTS.issueTimelineItems);
  const concurrency = clampInt(searchParams.get('concurrency'), 1, 10, DEFAULTS.concurrency);

  const cacheKey = JSON.stringify({
    maxAdmins,
    maxReposPerAdmin,
    maxPrsPerRepo,
    maxIssuesPerRepo,
    prTimelineItems,
    issueTimelineItems,
    concurrency,
  });
  if (!bypassCache && cached.payload && cached.key === cacheKey && now.getTime() - cached.at < effectiveCacheTtlMs) {
    return { ...cached.payload, cached: true };
  }

  await connectDB();

  const admins = await Application.find({ role: 'project-admin', status: 'approved' })
    .select('name email githubUsername projectUrl projectName linkedinUrl linkedin')
    .limit(maxAdmins)
    .lean();

  const adminEmails = admins.map((a) => String(a?.email || '').toLowerCase()).filter(Boolean);
  const usersByEmail = new Map();
  if (adminEmails.length) {
    const users = await User.find({ email: { $in: adminEmails } }).select('email linkedinUrl username').lean();
    for (const u of users) {
      const key = String(u?.email || '').toLowerCase();
      if (!key) continue;
      const li = String(u?.linkedinUrl || '').trim();
      const uname = String(u?.username || '').trim();
      usersByEmail.set(key, { linkedinUrl: li || null, username: uname || null });
    }
  }

  // NOTE: GitHub GraphQL is paginated. To effectively "check all" PRs/issues since Jan 1, 2026,
  // we page through results in descending CREATED_AT order until we hit PROGRAM_START.
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
              number
              url
              state
              createdAt
              mergedAt
              author { login }
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

  const processAdmin = async (admin) => {
    const adminGh = normalizeGithubUsername(admin.githubUsername);
    const repos = parseGithubRepos(admin.projectUrl || '');
    const selectedRepos = repos.slice(0, maxReposPerAdmin);
    const emailKey = String(admin?.email || '').toLowerCase();
    const userRec = usersByEmail.get(emailKey) || null;
    const linkedin = String(userRec?.linkedinUrl || admin.linkedinUrl || admin.linkedin || '').trim();
    const username = String(userRec?.username || '').trim();

    const row = {
      name: admin.name || 'Project Admin',
      email: admin.email,
      username: username || null,
      githubUsername: adminGh || null,
      linkedin: linkedin || null,
      projectName: admin.projectName || null,
      score: 0,
      streak: { current: 0, longest: 0 },
      breakdown: {
        configured: { ok: true, reposChecked: 0, reposMissingSentinel: 0 },
        prFirstResponse: { plus: 0, minus: 0, buckets: { le24h: 0, h24to48: 0, gt48: 0, noResponse4d: 0 } },
        issueClosedAfterMerge: { plus: 0, minus: 0, closedIn48h: 0, notClosedIn48h: 0 },
        prInaction: { minus: 0, penalized: 0 },
        issueInaction: { minus: 0, penalized: 0 },
        ecwocMerges: { plus: 0, mergedCount: 0 },
        weekly: { plus: 0, minus: 0, last7Complete: false, prev7Complete: false, inactive7: false },
      },
      errors: [],
      repos: selectedRepos,
    };

    const historyPayload = includeHistory
      ? {
          generatedAt: null,
          programStart: PROGRAM_START.toISOString(),
          admin: {
            name: row.name,
            email: row.email,
            githubUsername: adminGh || null,
            projectName: row.projectName || null,
            repos: selectedRepos,
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
        }
      : null;

    // If we can’t associate a GH username, we still show them with an error.
    if (!adminGh) {
      row.errors.push('Missing githubUsername for this project admin.');
      if (historyPayload) {
        historyPayload.configured.ok = false;
        historyPayload.errors.push('Missing githubUsername for this project admin.');
      }
      return includeHistory ? { row, historyPayload } : row;
    }

    // No repos => show with error.
    if (!selectedRepos.length) {
      row.errors.push('No GitHub repos found in projectUrl.');
      if (historyPayload) {
        historyPayload.configured.ok = false;
        historyPayload.errors.push('No GitHub repos found in projectUrl.');
      }
      return includeHistory ? { row, historyPayload } : row;
    }

    let activityDays = new Set();

    // Bot configuration check is per-repo. If any repo is missing sentinel -> score=0 and stop.
    let sentinelMissing = false;

    for (const full of selectedRepos) {
      const [owner, name] = full.split('/');
      row.breakdown.configured.reposChecked += 1;

      try {
        // Sentinel configured heuristic: seen at least one merged PR labeled DSoC26.
        const sentinelSignal = { seenDsoc26LabelOnMergedPr: false };

        // Page through PRs (DESC by createdAt) until PROGRAM_START.
        let prAfter = null;
        let prCutoffReached = false;
        while (!prCutoffReached) {
          const data = await ghGraphql(prQuery, {
            owner,
            name,
            first: maxPrsPerRepo,
            after: prAfter,
            prTimelineFirst: prTimelineItems,
          });

          const repo = data?.repository;
          if (!repo) {
            row.errors.push(`Repo not found or access denied: ${full}`);
            sentinelMissing = true;
            row.breakdown.configured.reposMissingSentinel += 1;
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

            const createdAt = pr.createdAt;
            const mergedAt = pr.mergedAt;
            const state = pr.state;

            const labels = (pr.labels?.nodes || []).map((l) => l?.name).filter(Boolean);
            const hasDsoc26 = labels.some((n) => String(n).toLowerCase() === 'dsoc26');

            if (mergedAt && hasDsoc26) {
              sentinelSignal.seenDsoc26LabelOnMergedPr = true;
            }

            const timeline = pr.timelineItems?.nodes || [];
            for (const ev of timeline) {
              const t = ev?.createdAt;
              if (!t) continue;
              if (new Date(t) < PROGRAM_START) continue;
              const actor = ev?.author?.login || ev?.actor?.login || null;
              if (actor && actor.toLowerCase() === adminGh.toLowerCase()) {
                const key = toUtcDayKey(t);
                if (key) activityDays.add(key);
              }
            }

            // PR first-response should reward any non-author response (mentor/collaborator/admin),
            // not just the project admin.
            const prAuthor = String(pr?.author?.login || '').toLowerCase();
            const firstRespAt =
              timeline
                .map((ev) => {
                  const t = ev?.createdAt;
                  if (!t) return null;
                  if (new Date(t) < PROGRAM_START) return null;

                  // Only count meaningful actions as a "response".
                  const type = ev?.__typename;
                  if (type !== 'IssueComment' && type !== 'PullRequestReview' && type !== 'MergedEvent') return null;

                  const actor = ev?.author?.login || ev?.actor?.login || null;
                  const actorType = ev?.author?.__typename || ev?.actor?.__typename || null;
                  if (!actor) return null;

                  // Ignore bots (github-actions, dependabot, copilot, etc.).
                  if (isBotLikeActor(actor, actorType)) return null;

                  // Ignore PR author's own actions.
                  if (prAuthor && String(actor).toLowerCase() === prAuthor) return null;
                  return { t };
                })
                .filter(Boolean)
                .sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime())[0]?.t || null;

            let prFirstDelta = 0;
            let prFirstLabel = null;
            if (hasEcwoc26) {
              if (firstRespAt) {
                const hrs = hoursBetween(createdAt, firstRespAt);
                if (hrs <= 24) {
                  prFirstDelta = 6;
                  prFirstLabel = '≤24h (+6)';
                  row.breakdown.prFirstResponse.plus += 6;
                  row.breakdown.prFirstResponse.buckets.le24h += 1;
                } else if (hrs <= 48) {
                  prFirstDelta = 4;
                  prFirstLabel = '24–48h (+4)';
                  row.breakdown.prFirstResponse.plus += 4;
                  row.breakdown.prFirstResponse.buckets.h24to48 += 1;
                } else {
                  prFirstDelta = 1;
                  prFirstLabel = '>48h (+1)';
                  row.breakdown.prFirstResponse.plus += 1;
                  row.breakdown.prFirstResponse.buckets.gt48 += 1;
                }
              } else {
                // Penalty applies only when a PR is still open and has had no meaningful response.
                // Do not penalize merged/closed PRs.
                const prState = String(state).toUpperCase();
                const ageDays = daysBetween(createdAt, now);
                if (prState === 'OPEN' && ageDays >= 4) {
                  prFirstDelta = -10;
                  prFirstLabel = 'No response ≥4d (-10)';
                  row.breakdown.prFirstResponse.minus -= 10;
                  row.breakdown.prFirstResponse.buckets.noResponse4d += 1;
                }
              }
            }

            if (historyPayload && prFirstDelta !== 0) {
              if (prFirstDelta > 0) historyPayload.totals.prFirstPlus += prFirstDelta;
              else historyPayload.totals.prFirstMinus += prFirstDelta;
            }

            let mergeDelta = 0;
            if (mergedAt && hasEcwoc26) {
              mergeDelta = 3;
              row.breakdown.ecwocMerges.plus += 3;
              row.breakdown.ecwocMerges.mergedCount += 1;
              if (historyPayload) historyPayload.totals.mergesPlus += 3;
            }

            const issueClosure = [];
            if (hasDsoc26 && mergedAt && pr.closingIssuesReferences?.nodes?.length) {
              for (const issue of pr.closingIssuesReferences.nodes) {
                const closedAt = issue?.closedAt;
                let delta = 0;
                let label = null;

                if (closedAt) {
                  const hrs = hoursBetween(mergedAt, closedAt);
                  if (hrs <= 48 && hrs >= -48) {
                    delta = 2;
                    label = 'Closed ≤48h (+2)';
                    row.breakdown.issueClosedAfterMerge.plus += 2;
                    row.breakdown.issueClosedAfterMerge.closedIn48h += 1;
                    if (historyPayload) historyPayload.totals.issueClosePlus += 2;
                  } else {
                    delta = -5;
                    label = 'Not closed ≤48h (-5)';
                    row.breakdown.issueClosedAfterMerge.minus -= 5;
                    row.breakdown.issueClosedAfterMerge.notClosedIn48h += 1;
                    if (historyPayload) historyPayload.totals.issueCloseMinus += delta;
                  }
                } else {
                  const hrs = hoursBetween(mergedAt, now);
                  if (hrs > 48) {
                    delta = -5;
                    label = 'Still open >48h (-5)';
                    row.breakdown.issueClosedAfterMerge.minus -= 5;
                    row.breakdown.issueClosedAfterMerge.notClosedIn48h += 1;
                    if (historyPayload) historyPayload.totals.issueCloseMinus += delta;
                  }
                }

                if (delta !== 0) {
                  issueClosure.push({ url: issue?.url || null, closedAt: closedAt || null, delta, label });
                }
              }
            }

            let prInactionDelta = 0;
            if (hasDsoc26 && String(state).toUpperCase() === 'OPEN') {
              const ageDays = daysBetween(createdAt, now);
              if (ageDays > 5) {
                const hasAdminAction = !!firstRespAt;
                if (!hasAdminAction) {
                  prInactionDelta = -10;
                  row.breakdown.prInaction.minus -= 10;
                  row.breakdown.prInaction.penalized += 1;
                  if (historyPayload) historyPayload.totals.prInactionMinus += prInactionDelta;
                }
              }
            }

            if (historyPayload && hasDsoc26) {
              const totalDelta =
                (prFirstDelta || 0) +
                (mergeDelta || 0) +
                (prInactionDelta || 0) +
                issueClosure.reduce((s, x) => s + (x?.delta || 0), 0);

              historyPayload.items.prs.push({
                repo: full,
                url: pr.url,
                state: pr.state,
                createdAt: pr.createdAt,
                mergedAt: pr.mergedAt,
                hasDsoc26,
                firstRespAt,
                prFirstDelta,
                prFirstLabel,
                mergeDelta,
                prInactionDelta,
                issueClosure,
                totalDelta,
              });
            }
          }

          if (sentinelMissing) break;
          if (prCutoffReached || !pageInfo?.hasNextPage) break;
          prAfter = pageInfo.endCursor;
        }

        if (sentinelMissing) continue;

        // Sentinel check: if not detected, score=0 and skip expensive issue scan.
        if (!isConfiguredBySentinel(sentinelSignal)) {
          sentinelMissing = true;
          row.breakdown.configured.ok = false;
          row.breakdown.configured.reposMissingSentinel += 1;
          if (historyPayload) {
            historyPayload.configured.ok = false;
            historyPayload.errors.push('ecwoc-sentinel not detected; score forced to 0.');
          }
          continue;
        }

        // Page through OPEN issues (DESC by createdAt) until PROGRAM_START.
        let issueAfter = null;
        let issueCutoffReached = false;
        while (!issueCutoffReached) {
          const data = await ghGraphql(issueQuery, {
            owner,
            name,
            first: maxIssuesPerRepo,
            after: issueAfter,
            issueTimelineFirst: issueTimelineItems,
          });

          const repo = data?.repository;
          if (!repo) {
            row.errors.push(`Repo not found or access denied: ${full}`);
            sentinelMissing = true;
            row.breakdown.configured.ok = false;
            row.breakdown.configured.reposMissingSentinel += 1;
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

            const createdAt = issue.createdAt;
            const author = issue?.author?.login || '';

            const timeline = issue.timelineItems?.nodes || [];
            for (const ev of timeline) {
              const t = ev?.createdAt;
              if (!t) continue;
              if (new Date(t) < PROGRAM_START) continue;
              const actor = ev?.author?.login || ev?.actor?.login || null;
              if (actor && actor.toLowerCase() === adminGh.toLowerCase()) {
                const key = toUtcDayKey(t);
                if (key) activityDays.add(key);
              }
            }

            if (author && author.toLowerCase() !== adminGh.toLowerCase()) {
              const adminActionAt =
                timeline
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

              if (!adminActionAt) {
                const hrs = hoursBetween(createdAt, now);
                if (hrs > 36) {
                  row.breakdown.issueInaction.minus -= 5;
                  row.breakdown.issueInaction.penalized += 1;
                  if (historyPayload) {
                    historyPayload.totals.issueInactionMinus += -5;
                    historyPayload.items.issues.push({
                      repo: full,
                      url: issue.url,
                      createdAt: issue.createdAt,
                      author,
                      adminActionAt: adminActionAt || null,
                      delta: -5,
                      label: 'No admin action >36h (-5)',
                    });
                  }
                }
              }
            }
          }

          if (sentinelMissing) break;
          if (issueCutoffReached || !pageInfo?.hasNextPage) break;
          issueAfter = pageInfo.endCursor;
        }
      } catch (err) {
        row.errors.push(`${full}: ${err?.message || 'Failed to compute repo metrics'}`);
        sentinelMissing = true;
        row.breakdown.configured.ok = false;
        row.breakdown.configured.reposMissingSentinel += 1;
        if (historyPayload) {
          historyPayload.configured.ok = false;
          historyPayload.errors.push(`${full}: ${err?.message || 'Failed to compute repo metrics'}`);
        }
      }

      if (sentinelMissing) break;
    }

    if (sentinelMissing) {
      row.score = 0;
      row.streak = computeStreaksFromDayKeys(activityDays);
      row.errors.push('ecwoc-sentinel not detected; score forced to 0.');
      if (historyPayload) {
        historyPayload.configured.ok = false;
        historyPayload.errors.push('ecwoc-sentinel not detected; score forced to 0.');
        historyPayload.totals.baseScore = 0;
        historyPayload.totals.score = 0;
      }
      return includeHistory ? { row, historyPayload } : row;
    }

    row.streak = computeStreaksFromDayKeys(activityDays);

    const weekly = computeWeeklyActivityBonus(activityDays, now);
    row.breakdown.weekly.plus += weekly.bonus;
    row.breakdown.weekly.minus += weekly.penalty;
    row.breakdown.weekly.last7Complete = weekly.last7Complete;
    row.breakdown.weekly.prev7Complete = weekly.prev7Complete;
    row.breakdown.weekly.inactive7 = weekly.inactive7;

    // Total score = sum of all breakdown parts.
    const total =
      row.breakdown.prFirstResponse.plus +
      row.breakdown.prFirstResponse.minus +
      row.breakdown.issueClosedAfterMerge.plus +
      row.breakdown.issueClosedAfterMerge.minus +
      row.breakdown.prInaction.minus +
      row.breakdown.issueInaction.minus +
      row.breakdown.ecwocMerges.plus +
      row.breakdown.weekly.plus +
      row.breakdown.weekly.minus;

    row.score = total;
    if (historyPayload) {
      historyPayload.totals.mergesPlus = row.breakdown.ecwocMerges.plus;
      historyPayload.totals.prFirstPlus = row.breakdown.prFirstResponse.plus;
      historyPayload.totals.prFirstMinus = row.breakdown.prFirstResponse.minus;
      historyPayload.totals.prInactionMinus = row.breakdown.prInaction.minus;
      historyPayload.totals.issueClosePlus = row.breakdown.issueClosedAfterMerge.plus;
      historyPayload.totals.issueCloseMinus = row.breakdown.issueClosedAfterMerge.minus;
      historyPayload.totals.issueInactionMinus = row.breakdown.issueInaction.minus;
      historyPayload.totals.weeklyPlus = row.breakdown.weekly.plus;
      historyPayload.totals.weeklyMinus = row.breakdown.weekly.minus;
      historyPayload.totals.baseScore = row.score;
      historyPayload.totals.score = row.score;
    }

    return includeHistory ? { row, historyPayload } : row;
  };

  const results = await mapWithConcurrency(admins, concurrency, processAdmin);

  const rows = includeHistory ? results.map((r) => r?.row).filter(Boolean) : results;

  const generatedAtIso = new Date().toISOString();

  if (includeHistory) {
    for (const r of results) {
      if (r?.historyPayload) r.historyPayload.generatedAt = generatedAtIso;
    }
  }

  // Apply bonus points (manual/admin-awarded) from leaderboard DB.
  try {
    const ghKeys = Array.from(
      new Set(
        rows
          .map((r) => String(r?.github || r?.githubUsername || '').trim().toLowerCase())
          .filter(Boolean)
      )
    );

    if (ghKeys.length) {
      const uri = process.env.MONGODB_URI_LEADERBOARD || process.env.MONGODB_URI;
      const lbConn = await connectLeaderboardDB(uri);
      const BonusPoint = getBonusModel(lbConn);

      const bonusAgg = await BonusPoint.aggregate([
        {
          $project: {
            ghLower: {
              $ifNull: ['$githubUsernameLower', { $toLower: '$githubUsername' }],
            },
            points: { $ifNull: ['$points', 0] },
          },
        },
        { $match: { ghLower: { $in: ghKeys } } },
        { $group: { _id: '$ghLower', total: { $sum: '$points' } } },
      ]);

      const bonusByGh = new Map();
      for (const row of bonusAgg) {
        const key = String(row?._id || '').trim().toLowerCase();
        if (!key) continue;
        bonusByGh.set(key, row?.total || 0);
      }

      for (const entry of includeHistory ? results : rows) {
        const row = includeHistory ? entry?.row : entry;
        if (!row) continue;

        const key = String(row?.github || row?.githubUsername || '').trim().toLowerCase();
        const bonus = bonusByGh.get(key) || 0;
        row.bonusPoints = bonus;
        row.baseScore = row.score || 0;
        row.score = (row.score || 0) + bonus;
        row.breakdown = row.breakdown || {};
        row.breakdown.bonus = { points: bonus };

        if (includeHistory && entry?.historyPayload) {
          entry.historyPayload.totals.bonusPoints = bonus;
          entry.historyPayload.totals.baseScore = row.baseScore;
          entry.historyPayload.totals.score = row.score;
        }
      }
    }
  } catch (err) {
    // Non-fatal: project-admin leaderboard should still work even if bonus DB is unreachable.
    console.error('Project admin bonus integration error:', err);
  }

  const configured = rows.filter((row) => row?.breakdown?.configured?.ok !== false);
  const notConfigured = rows.filter((row) => row?.breakdown?.configured?.ok === false);
  configured.sort((a, b) => (b.score || 0) - (a.score || 0));
  notConfigured.sort((a, b) => (b.score || 0) - (a.score || 0));
  const sorted = [...configured, ...notConfigured];

  const histories = includeHistory
    ? results
        .map((r) => {
          const emailLower = String(r?.row?.email || '').trim().toLowerCase();
          const githubUsernameLower = String(r?.row?.githubUsername || '').trim().toLowerCase();
          const payload = r?.historyPayload || null;
          if (!payload) return null;
          return { emailLower, githubUsernameLower, payload };
        })
        .filter(Boolean)
    : undefined;

  const payload = {
    generatedAt: generatedAtIso,
    programStart: PROGRAM_START.toISOString(),
    admins: sorted,
    ...(includeHistory ? { histories } : {}),
  };

  if (effectiveCacheTtlMs > 0 && !includeHistory) {
    cached.at = now.getTime();
    cached.key = cacheKey;
    cached.payload = payload;
  }

  return payload;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const wantsList = searchParams.get('list') === '1';
    const snapshotId = searchParams.get('snapshotId');
    const wantsLive = searchParams.get('live') === '1' || (process.env.NODE_ENV !== 'production' && searchParams.get('nocache') === '1');
    const includeHistories = searchParams.get('withHistory') === '1';

    const uri = process.env.MONGODB_URI_LEADERBOARD || process.env.MONGODB_URI;
    const lbConn = await connectLeaderboardDB(uri);
    const Snapshot = getPaLeaderboardSnapshotModel(lbConn);
    const Meta = getPaLeaderboardMetaModel(lbConn);

    const AUTO_REFRESH_MS = 6 * 60 * 60 * 1000;
    const AUTO_REFRESH_LOCK_MS = 10 * 60 * 1000;

    if (wantsList) {
      const auth = await requireAdminSession();
      if (!auth.ok) {
        return NextResponse.json({ error: auth.message || 'Not authenticated' }, { status: auth.status || 401, headers: RESPONSE_HEADERS });
      }

      const meta = await Meta.findById('active').lean();
      const activeSnapshotId = String(meta?.activeSnapshotId || '').trim();

      const items = await Snapshot.find({})
        .select('_id generatedAt createdAt')
        .sort({ generatedAt: -1, createdAt: -1 })
        .limit(50)
        .lean();

      return NextResponse.json(
        {
          activeSnapshotId: activeSnapshotId || null,
          snapshots: items.map((s) => ({
            id: String(s._id),
            generatedAt: s?.generatedAt instanceof Date ? s.generatedAt.toISOString() : s?.generatedAt,
            createdAt: s?.createdAt instanceof Date ? s.createdAt.toISOString() : s?.createdAt,
          })),
        },
        { headers: RESPONSE_HEADERS }
      );
    }

    if (snapshotId) {
      const auth = await requireAdminSession();
      if (!auth.ok) {
        return NextResponse.json({ error: auth.message || 'Not authenticated' }, { status: auth.status || 401, headers: RESPONSE_HEADERS });
      }

      const snap = await Snapshot.findById(snapshotId).lean();
      if (!snap) {
        return NextResponse.json({ error: 'Snapshot not found' }, { status: 404, headers: RESPONSE_HEADERS });
      }
      return NextResponse.json(snapshotToPayload(snap, { includeHistories }), { headers: RESPONSE_HEADERS });
    }

    if (wantsLive) {
      const payload = await buildLiveLeaderboardPayload(request, { forceBypassCache: true, includeHistory: includeHistories });
      return NextResponse.json({ ...payload, snapshotId: null, liveComputed: true }, { headers: RESPONSE_HEADERS });
    }

    // Default: serve the active snapshot if set, otherwise the latest snapshot.
    // Auto-refresh: if the current snapshot is older than 6 hours, compute & persist a new snapshot.
    await Meta.updateOne({ _id: 'active' }, { $setOnInsert: { activeSnapshotId: '' } }, { upsert: true });

    const meta = await Meta.findById('active').lean();
    const activeSnapshotId = String(meta?.activeSnapshotId || '').trim();

    const loadCurrentSnapshot = async () => {
      if (activeSnapshotId) {
        const active = await Snapshot.findById(activeSnapshotId).lean();
        if (active) return active;
      }
      return await Snapshot.findOne({}).sort({ generatedAt: -1, createdAt: -1 }).lean();
    };

    const current = await loadCurrentSnapshot();
    const currentGeneratedAt = current?.generatedAt ? new Date(current.generatedAt).getTime() : 0;
    const stale = !currentGeneratedAt || Date.now() - currentGeneratedAt > AUTO_REFRESH_MS;

    if (stale) {
      const now = new Date();
      const lockUntil = new Date(now.getTime() + AUTO_REFRESH_LOCK_MS);

      const lock = await Meta.updateOne(
        {
          _id: 'active',
          $or: [
            { autoRefreshLockedUntil: { $exists: false } },
            { autoRefreshLockedUntil: null },
            { autoRefreshLockedUntil: { $lt: now } },
          ],
        },
        { $set: { autoRefreshLockedUntil: lockUntil } }
      );

      if (lock?.modifiedCount === 1) {
        try {
          const livePayload = await buildLiveLeaderboardPayload(request, { forceBypassCache: true, includeHistory: true });

          const doc = await Snapshot.create({
            generatedAt: new Date(livePayload.generatedAt),
            programStart: new Date(livePayload.programStart),
            admins: livePayload.admins,
            histories: Array.isArray(livePayload.histories) ? livePayload.histories : [],
          });

          await Meta.updateOne(
            { _id: 'active' },
            {
              $set: {
                activeSnapshotId: String(doc._id),
                lastAutoRefreshAt: new Date(),
                autoRefreshLockedUntil: null,
              },
            },
            { upsert: true }
          );

          const fresh = await Snapshot.findById(doc._id).lean();
          if (fresh) {
            return NextResponse.json(snapshotToPayload(fresh, { includeHistories }), { headers: RESPONSE_HEADERS });
          }
        } catch (err) {
          await Meta.updateOne({ _id: 'active' }, { $set: { autoRefreshLockedUntil: null } }, { upsert: true });
          // If refresh fails, fall back to serving the last known snapshot.
          if (current) {
            return NextResponse.json(snapshotToPayload(current, { includeHistories }), { headers: RESPONSE_HEADERS });
          }
          throw err;
        }
      }
    }

    if (current) {
      return NextResponse.json(snapshotToPayload(current, { includeHistories }), { headers: RESPONSE_HEADERS });
    }

    // Fallback (first-run): compute live if nothing has been published yet.
    const payload = await buildLiveLeaderboardPayload(request, { forceBypassCache: true });
    return NextResponse.json({ ...payload, snapshotId: null, liveComputed: true }, { headers: RESPONSE_HEADERS });
  } catch (error) {
    console.error('Project admin leaderboard error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to build project admin leaderboard' },
      { status: 500, headers: RESPONSE_HEADERS }
    );
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message || 'Not authenticated' }, { status: auth.status || 401, headers: RESPONSE_HEADERS });
    }

    const body = await request.json().catch(() => ({}));
    const snapshotId = String(body?.snapshotId || '').trim();
    if (!snapshotId) {
      return NextResponse.json({ error: 'Missing snapshotId' }, { status: 400, headers: RESPONSE_HEADERS });
    }

    const uri = process.env.MONGODB_URI_LEADERBOARD || process.env.MONGODB_URI;
    const lbConn = await connectLeaderboardDB(uri);
    const Snapshot = getPaLeaderboardSnapshotModel(lbConn);
    const Meta = getPaLeaderboardMetaModel(lbConn);

    const exists = await Snapshot.findById(snapshotId).select('_id').lean();
    if (!exists) {
      return NextResponse.json({ error: 'Snapshot not found' }, { status: 404, headers: RESPONSE_HEADERS });
    }

    await Meta.updateOne(
      { _id: 'active' },
      { $set: { activeSnapshotId: snapshotId } },
      { upsert: true }
    );

    return NextResponse.json({ success: true, activeSnapshotId: snapshotId }, { headers: RESPONSE_HEADERS });
  } catch (error) {
    console.error('Project admin leaderboard activate error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to activate snapshot' },
      { status: 500, headers: RESPONSE_HEADERS }
    );
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message || 'Not authenticated' }, { status: auth.status || 401, headers: RESPONSE_HEADERS });
    }

    const payload = await buildLiveLeaderboardPayload(request, { forceBypassCache: true, includeHistory: true });

    const uri = process.env.MONGODB_URI_LEADERBOARD || process.env.MONGODB_URI;
    const lbConn = await connectLeaderboardDB(uri);
    const Snapshot = getPaLeaderboardSnapshotModel(lbConn);

    const doc = await Snapshot.create({
      generatedAt: new Date(payload.generatedAt),
      programStart: new Date(payload.programStart),
      admins: payload.admins,
      histories: Array.isArray(payload.histories) ? payload.histories : [],
    });

    return NextResponse.json(
      {
        success: true,
        snapshotId: String(doc._id),
        generatedAt: payload.generatedAt,
      },
      { headers: RESPONSE_HEADERS }
    );
  } catch (error) {
    console.error('Project admin leaderboard publish error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to publish project admin leaderboard' },
      { status: 500, headers: RESPONSE_HEADERS }
    );
  }
}
