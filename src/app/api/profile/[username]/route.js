import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import mongoose from 'mongoose';
// Ensure Application schema is registered for population
import '@/models/Application';

let cachedLeaderboardProfileConn = global.leaderboardProfileConn;
if (!cachedLeaderboardProfileConn) {
  cachedLeaderboardProfileConn = global.leaderboardProfileConn = { conn: null, promise: null, uri: null };
}

async function connectLeaderboardDB(uri) {
  if (!uri) throw new Error('Missing MongoDB URI for leaderboard');

  if (cachedLeaderboardProfileConn.conn && cachedLeaderboardProfileConn.uri === uri) {
    return cachedLeaderboardProfileConn.conn;
  }

  if (!cachedLeaderboardProfileConn.promise || cachedLeaderboardProfileConn.uri !== uri) {
    cachedLeaderboardProfileConn.uri = uri;
    cachedLeaderboardProfileConn.promise = mongoose
      .createConnection(uri, { bufferCommands: false })
      .asPromise()
      .then((conn) => conn);
  }

  cachedLeaderboardProfileConn.conn = await cachedLeaderboardProfileConn.promise;
  return cachedLeaderboardProfileConn.conn;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizePointsFromLevel(level) {
  if (!level) return null;
  const l = String(level).toUpperCase();
  if (l === 'L1' || l === 'LEVEL1' || l === 'LEVEL 1') return 3;
  if (l === 'L2' || l === 'LEVEL2' || l === 'LEVEL 2') return 7;
  if (l === 'L3' || l === 'LEVEL3' || l === 'LEVEL 3') return 10;
  return null;
}

const PROGRAM_START = new Date(Date.UTC(2026, 0, 1, 0, 0, 0, 0));

function parseRepoFromUrl(url) {
  if (!url) return { owner: null, repo: null };
  try {
    const normalized = url.replace(/\.git$/, '');
    const match = normalized.match(/github\.com\/(?<owner>[^\/]+)\/(?<repo>[^#?/]+)/i);
    if (match?.groups?.owner && match?.groups?.repo) {
      return { owner: match.groups.owner, repo: match.groups.repo }; // keep raw to preserve casing for display
    }
  } catch (err) {
    console.warn('parseRepoFromUrl failed', err);
  }
  return { owner: null, repo: null };
}

function buildGitHubHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'ECWoC',
  };
  const token = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function toUtcDayNumber(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 86400000);
}

function computeStreaksFromDates(dates) {
  const dayNumbers = new Set();
  for (const dt of dates) {
    const day = toUtcDayNumber(dt);
    if (day === null) continue;
    if (dt >= PROGRAM_START) dayNumbers.add(day);
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

  // Current streak = consecutive run ending on the last contribution day.
  let current = 1;
  for (let i = sorted.length - 1; i > 0; i--) {
    if (sorted[i] === sorted[i - 1] + 1) current += 1;
    else break;
  }

  return { current, longest };
}

export async function GET(request, context) {
  try {
    await connectDB();
    // In Next.js 16 dynamic API routes, context.params is a Promise
    const { username } = await context.params;
    console.log('Fetching profile for username:', username);

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const user = await User.findOne({
      $or: [
        { username },
        { email: `${username}@gmail.com` }
      ]
    })
      .select('-password -__v')
      .populate({ path: 'applicationId', select: 'status role submittedAt' })
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Increment profile views
    await User.findByIdAndUpdate(user._id, { $inc: { profileViews: 1 } });

    // For contributors, enrich with leaderboard DB stats so profile matches leaderboard.
    if (user?.role === 'contributor' && user?.githubUsername) {
      const leaderboardUri = process.env.MONGODB_URI_LEADERBOARD;
      if (leaderboardUri) {
        const conn = await connectLeaderboardDB(leaderboardUri);

        const Contributor =
          conn.models.Contributor ||
          conn.model(
            'Contributor',
            new mongoose.Schema(
              {
                githubUsername: String,
                totalPoints: Number,
                totalPRs: Number,
                updatedAt: Date,
                lastContributionAt: Date,
              },
              { collection: 'contributors' }
            )
          );

        const PR =
          conn.models.PR ||
          conn.model(
            'PR',
            new mongoose.Schema(
              {
                contributor: String,
                prUrl: String,
                prTitle: String,
                level: String,
                mergedAt: Date,
                updatedAt: Date,
                points: Number,
                score: Number,
                repoOwner: String,
                repoName: String,
                prNumber: Number,
              },
              { collection: 'prs' }
            )
          );

        const BonusPoint =
          conn.models.BonusPoint ||
          conn.model(
            'BonusPoint',
            new mongoose.Schema(
              {
                githubUsernameLower: String,
                points: Number,
                task: String,
                reason: String,
                createdAt: Date,
              },
              { collection: 'bonus_points' }
            )
          );

        const gh = String(user.githubUsername);
        const ghLower = gh.toLowerCase();
        const ghRegex = new RegExp(`^${escapeRegex(gh)}$`, 'i');

        const contributorDoc = await Contributor.findOne({ githubUsername: ghRegex }).lean();

        const [bonusForUserAgg, bonusTotalsAgg, allContributors] = await Promise.all([
          BonusPoint.aggregate([
            { $match: { githubUsernameLower: ghLower } },
            { $group: { _id: null, total: { $sum: '$points' } } },
          ]),
          BonusPoint.aggregate([{ $group: { _id: '$githubUsernameLower', total: { $sum: '$points' } } }]),
          Contributor.find({}).select('githubUsername totalPoints totalPRs').lean(),
        ]);

        const bonusPoints =
          Array.isArray(bonusForUserAgg) && typeof bonusForUserAgg?.[0]?.total === 'number' ? bonusForUserAgg[0].total : 0;

        const bonusMap = new Map(
          (Array.isArray(bonusTotalsAgg) ? bonusTotalsAgg : [])
            .filter((row) => row && typeof row._id === 'string')
            .map((row) => [String(row._id).toLowerCase(), typeof row.total === 'number' ? row.total : 0])
        );

        // Fetch all PRs for the contributor (capped for safety)
        const prDocs = await PR.find({ contributor: ghRegex })
          .select('prUrl prTitle level mergedAt updatedAt points score repoOwner repoName prNumber')
          .sort({ mergedAt: -1, updatedAt: -1 })
          .limit(500)
          .lean();

        const projectKeys = new Set();
        const contributions = prDocs
          .map((pr) => {
            const activityDate = pr.mergedAt || pr.updatedAt || null;
            return { pr, activityDate };
          })
          .filter(({ activityDate }) => activityDate && new Date(activityDate) >= PROGRAM_START)
          .map(({ pr }) => {
            const owner = pr.repoOwner || (typeof pr.prUrl === 'string' ? pr.prUrl.split('github.com/')[1]?.split('/')[0] : null);
            const repo = pr.repoName || (typeof pr.prUrl === 'string' ? pr.prUrl.split('github.com/')[1]?.split('/')[1] : null);
            if (owner && repo) projectKeys.add(`${owner}/${repo}`);

            const levelPoints = normalizePointsFromLevel(pr.level);
            const normalizedPoints =
              typeof levelPoints === 'number'
                ? levelPoints
                : typeof pr.points === 'number'
                  ? pr.points
                  : typeof pr.score === 'number'
                    ? pr.score
                    : 0;

            return {
              prUrl: pr.prUrl,
              title: pr.prTitle,
              level: pr.level,
              points: normalizedPoints,
              createdAt: pr.updatedAt || pr.mergedAt || null,
              mergedAt: pr.mergedAt || null,
              repository: owner && repo ? `${owner}/${repo}` : null,
              prNumber: pr.prNumber,
            };
          });

        // Activities for charts + activity feed (all returned PRs)
        const activities = contributions
          .filter((c) => c.createdAt)
          .map((c) => ({
            description: c.title ? `Merged PR: ${c.title}` : 'Merged PR',
            date: c.mergedAt || c.createdAt,
            points: c.points || 0,
          }));

        const streak = computeStreaksFromDates(activities.map((a) => a.date));

        const mergedCount = contributorDoc?.totalPRs ?? contributions.filter((c) => !!c.mergedAt).length;
        const basePoints = contributorDoc?.totalPoints ?? contributions.reduce((sum, c) => sum + (c.points || 0), 0);
        const totalPoints = (typeof basePoints === 'number' ? basePoints : 0) + (typeof bonusPoints === 'number' ? bonusPoints : 0);

        // Compute leaderboard rank/targets using bonus-inclusive totals.
        let leaderboard = null;
        if (Array.isArray(allContributors) && allContributors.length > 0) {
          const rows = allContributors
            .filter((c) => c && typeof c.githubUsername === 'string')
            .map((c) => {
              const username = String(c.githubUsername);
              const usernameLower = username.toLowerCase();
              const base = typeof c.totalPoints === 'number' ? c.totalPoints : 0;
              const bonus = bonusMap.get(usernameLower) || 0;
              return {
                githubUsername: username,
                githubUsernameLower: usernameLower,
                totalPRs: typeof c.totalPRs === 'number' ? c.totalPRs : 0,
                basePoints: base,
                bonusPoints: bonus,
                totalPoints: base + bonus,
              };
            });

          rows.sort((a, b) => {
            if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
            if (b.totalPRs !== a.totalPRs) return b.totalPRs - a.totalPRs;
            return a.githubUsernameLower.localeCompare(b.githubUsernameLower);
          });

          const idx = rows.findIndex((r) => r.githubUsernameLower === ghLower);
          if (idx !== -1) {
            const rank = idx + 1;
            const nextRank = rank > 1 ? rank - 1 : null;
            const rank1Row = rows[0] || null;
            const nextAboveRow = rank > 1 ? rows[idx - 1] : null;

            const rank1Points = typeof rank1Row?.totalPoints === 'number' ? rank1Row.totalPoints : null;
            const nextPoints = typeof nextAboveRow?.totalPoints === 'number' ? nextAboveRow.totalPoints : rank1Points;

            leaderboard = {
              rank,
              totalContributors: rows.length,
              nextRank,
              rank1Points,
              nextPoints,
              pointsBehindRank1: typeof rank1Points === 'number' ? Math.max(0, rank1Points - totalPoints) : null,
              pointsToBeatRank1:
                typeof rank1Points === 'number' && rank > 1 ? Math.max(1, rank1Points - totalPoints + 1) : 0,
              pointsToBeatNext:
                typeof nextPoints === 'number' && rank > 1 ? Math.max(0, nextPoints - totalPoints + 1) : 0,
            };
          }
        }

        user.stats = {
          ...(user.stats || {}),
          totalPoints,
          basePoints: typeof basePoints === 'number' ? basePoints : 0,
          bonusPoints: typeof bonusPoints === 'number' ? bonusPoints : 0,
          pullRequests: {
            ...(user.stats?.pullRequests || {}),
            merged: mergedCount,
            total: contributions.length,
          },
          issues: {
            ...(user.stats?.issues || {}),
            // As per current program rules: issues resolved mirrors merged PRs.
            resolved: mergedCount,
            open: 0,
          },
          projectsContributed: projectKeys.size,
          streak,
          leaderboard,
        };

        user.contributions = contributions;
        user.activities = activities;
      }
    } else if (user?.role === 'project-admin') {
      const leaderboardUri = process.env.MONGODB_URI_LEADERBOARD;
      let projectsList = [];
      let totalContributors = 0;
      let totalMerged = 0;
      let totalOpenIssues = 0;
      let mergedPrsList = [];

      // Pull project details from application
      let projectApplication = null;
      if (user.applicationId) {
        projectApplication = await mongoose.model('Application').findById(user.applicationId).lean();
      }
      if (!projectApplication) {
        projectApplication = await mongoose
          .model('Application')
          .findOne({ email: user.email, role: 'project-admin' })
          .sort({ createdAt: -1 })
          .lean();
      }

      if (projectApplication && leaderboardUri) {
        const conn = await connectLeaderboardDB(leaderboardUri);

        const PR =
          conn.models.PR ||
          conn.model(
            'PR',
            new mongoose.Schema(
              {
                contributor: String,
                prUrl: String,
                prTitle: String,
                level: String,
                mergedAt: Date,
                updatedAt: Date,
                points: Number,
                score: Number,
                repoOwner: String,
                repoName: String,
                prNumber: Number,
                labels: [String],
              },
              { collection: 'prs' }
            )
          );

        const projectEntries = [projectApplication].filter(Boolean);
        for (const proj of projectEntries) {
          const { owner, repo } = parseRepoFromUrl(proj.projectUrl || '');
          const repoRegexOwner = owner ? new RegExp(`^${escapeRegex(owner)}$`, 'i') : null;
          const repoRegexName = repo ? new RegExp(`^${escapeRegex(repo)}$`, 'i') : null;

          const query = { mergedAt: { $gte: PROGRAM_START } };
          if (repoRegexOwner && repoRegexName) {
            query.$or = [
              { repoOwner: repoRegexOwner, repoName: repoRegexName },
              { prUrl: new RegExp(`github\.com/${escapeRegex(owner)}/${escapeRegex(repo)}`, 'i') },
            ];
          }

          const prDocs = await PR.find(query)
            .select('contributor prUrl prTitle level mergedAt updatedAt points score repoOwner repoName prNumber labels')
            .sort({ mergedAt: -1, updatedAt: -1 })
            .lean();

          // Keep DSoC26-labeled PRs when labels are present; otherwise keep the PR
          const ecwocFilter = (pr) => {
            if (!Array.isArray(pr.labels) || pr.labels.length === 0) return true;
            return pr.labels.some((l) => /dsoc26/i.test(l));
          };

          const filteredPrs = prDocs.filter(ecwocFilter);

          const contributorCounts = new Map();
          const projectPrs = filteredPrs.map((pr) => {
            const contributor = pr.contributor || 'unknown';
            contributorCounts.set(contributor, (contributorCounts.get(contributor) || 0) + 1);

            const levelPoints = normalizePointsFromLevel(pr.level);
            const normalizedPoints =
              typeof levelPoints === 'number'
                ? levelPoints
                : typeof pr.points === 'number'
                  ? pr.points
                  : typeof pr.score === 'number'
                    ? pr.score
                    : 0;

            return {
              contributor,
              prUrl: pr.prUrl,
              title: pr.prTitle,
              level: pr.level,
              points: normalizedPoints,
              mergedAt: pr.mergedAt || pr.updatedAt || null,
              prNumber: pr.prNumber,
              repository: owner && repo ? `${owner}/${repo}` : pr.repoName || '',
            };
          });

          // Top contributor by merged PRs
          const topContributorEntry = Array.from(contributorCounts.entries())
            .sort((a, b) => {
              if (b[1] !== a[1]) return b[1] - a[1];
              return a[0].localeCompare(b[0]);
            })[0];

          const contributorsList = Array.from(contributorCounts.entries())
            .sort((a, b) => {
              if (b[1] !== a[1]) return b[1] - a[1];
              return a[0].localeCompare(b[0]);
            })
            .map(([gh, count]) => ({ githubUsername: gh, mergedPRs: count }));

          // Open issues via GitHub API (unauthenticated, best-effort)
          let openIssues = 0;
          let languages = [];
          if (owner && repo) {
            try {
              const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: buildGitHubHeaders() });
              if (ghRes.ok) {
                const ghData = await ghRes.json();
                if (typeof ghData.open_issues_count === 'number') openIssues = ghData.open_issues_count;
              }
            } catch (err) {
              console.warn('GitHub repo fetch failed', err);
            }

            try {
              const langRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers: buildGitHubHeaders() });
              if (langRes.ok) {
                const langData = await langRes.json();
                if (langData && typeof langData === 'object') {
                  languages = Object.entries(langData)
                    .filter(([, bytes]) => typeof bytes === 'number')
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 4)
                    .map(([name]) => name);
                }
              }
            } catch (err) {
              console.warn('GitHub languages fetch failed', err);
            }
          }

          projectsList.push({
            name: proj.projectName || 'Project',
            description: proj.projectDescription || '',
            repoUrl: proj.projectUrl || '',
            repoOwner: owner,
            repoName: repo,
            techStackUsed: Array.isArray(proj.techStackUsed) ? proj.techStackUsed : [],
            languages,
            contributorsCount: contributorsList.length,
            contributors: contributorsList,
            mergedPRs: projectPrs,
            mergedCount: projectPrs.length,
            openIssues,
            topContributor: topContributorEntry
              ? { githubUsername: topContributorEntry[0], mergedPRs: topContributorEntry[1] }
              : null,
          });

          totalContributors += contributorsList.length;
          totalMerged += projectPrs.length;
          totalOpenIssues += openIssues;
          mergedPrsList = mergedPrsList.concat(projectPrs);
        }
      }

      user.projectStats = {
        ...(user.projectStats || {}),
        projectsManaged: projectsList.length || user.projectStats?.projectsManaged || 0,
        totalContributors: totalContributors || user.projectStats?.totalContributors || 0,
        prsMerged: totalMerged || user.projectStats?.prsMerged || 0,
        // For project-admin: keep issues resolved aligned with merged PRs.
        issuesResolved: totalMerged,
        issuesOpen: totalOpenIssues,
        projectsList,
        mergedPrsList,
      };
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    const message = error?.message || 'Failed to fetch user profile';
    // Differentiate param unwrap issue
    if (message.includes('params')) {
      return NextResponse.json({ error: 'Internal route params unwrap failed' }, { status: 500 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
