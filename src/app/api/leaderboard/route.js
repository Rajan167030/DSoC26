import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

let cachedLeaderboardConn = global.leaderboardConn;
if (!cachedLeaderboardConn) {
  cachedLeaderboardConn = global.leaderboardConn = { conn: null, promise: null, uri: null };
}

let cachedMainConn = global.mainConn;
if (!cachedMainConn) {
  cachedMainConn = global.mainConn = { conn: null, promise: null, uri: null };
}

async function connectLeaderboardDB(uri) {
  if (!uri) {
    throw new Error('Missing MongoDB URI for leaderboard');
  }

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

async function connectMainDB(uri) {
  if (!uri) {
    throw new Error('Missing MongoDB URI for main DB');
  }

  if (cachedMainConn.conn && cachedMainConn.uri === uri) {
    return cachedMainConn.conn;
  }

  if (!cachedMainConn.promise || cachedMainConn.uri !== uri) {
    cachedMainConn.uri = uri;
    cachedMainConn.promise = mongoose
      .createConnection(uri, { bufferCommands: false })
      .asPromise()
      .then((conn) => conn);
  }

  cachedMainConn.conn = await cachedMainConn.promise;
  return cachedMainConn.conn;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const githubRaw = (searchParams.get('github') || '').trim();
    const github = githubRaw.length ? githubRaw.slice(0, 100) : '';

    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const requestedLimit = parseInt(searchParams.get('limit') || '30', 10);
    // Enforce 30 contributors per page.
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 30) : 30;
    const skip = (page - 1) * limit;
    const MAX_PR_LIMIT = 5000;
    const prLimitParam = searchParams.get('prLimit');
    const requestedPrLimit = prLimitParam == null ? NaN : parseInt(prLimitParam, 10);
    const defaultPrLimit = github ? MAX_PR_LIMIT : 30;
    let prLimit = Number.isFinite(requestedPrLimit) ? requestedPrLimit : defaultPrLimit;
    if (prLimit <= 0) prLimit = MAX_PR_LIMIT;
    prLimit = Math.min(Math.max(prLimit, 1), MAX_PR_LIMIT);

    const qRaw = (searchParams.get('q') || '').trim();
    const q = qRaw.length ? qRaw.slice(0, 100) : '';

    // Append "inactive" contributors (registered users with role=contributor
    // but no entry in the leaderboard contributors collection) as 0-point entries.
    // Disable by calling /api/leaderboard?...&includeInactive=0
    const includeInactive = (searchParams.get('includeInactive') || '1') !== '0';

    const sortSpec = { totalPoints: -1, totalPRs: -1, githubUsername: 1, _id: 1 };
    const sortCollation = { locale: 'en', strength: 2 };

    // Program start used across the app UI.
    const PROGRAM_START = new Date('2026-01-01T00:00:00.000Z');

    // Leaderboard uri
    const uri = process.env.MONGODB_URI_LEADERBOARD || process.env.MONGODB_URI;
    const conn = await connectLeaderboardDB(uri);

    const mainUri = process.env.MONGODB_URI;
    const mainConn = mainUri ? await connectMainDB(mainUri) : null;

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

    const BonusPoint =
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
      );

    const MainUser =
      mainConn?.models?.User ||
      (mainConn
        ? mainConn.model(
            'User',
            new mongoose.Schema(
              {
                githubUsername: String,
                linkedinUrl: String,
                name: String,
                username: String,
                role: String,
                isActive: Boolean,
              },
              { collection: 'users' }
            )
          )
        : null);

    // Optional filters across ALL pages.
    // - github: exact contributor lookup (case-insensitive)
    // - q: text search or numeric rank lookup
    let contributorFilter = {};
    const qIsRank = /^\d{1,6}$/.test(q);
    const qRank = qIsRank ? Math.max(parseInt(q, 10), 1) : null;

    if (github) {
      contributorFilter = { githubUsername: new RegExp(`^${escapeRegex(github)}$`, 'i') };
    } else if (q && !qIsRank) {
      const qRegex = new RegExp(escapeRegex(q), 'i');
      const matchedGithubUsernames = new Set();

      if (MainUser) {
        const mainMatches = await MainUser.find({
            role: 'contributor',
            isActive: { $ne: false },
            $or: [{ githubUsername: qRegex }, { username: qRegex }, { name: qRegex }],
          })
            .select('githubUsername')
            .limit(500)
            .lean();

        for (const m of mainMatches) {
          if (m?.githubUsername) matchedGithubUsernames.add(m.githubUsername);
        }
      }

      const or = [{ githubUsername: qRegex }];
      if (matchedGithubUsernames.size) {
        or.push({ githubUsername: { $in: Array.from(matchedGithubUsernames) } });
      }
      contributorFilter = { $or: or };
    }

    // Leaderboard inclusion vs bonus eligibility:
    // - Inclusion: show ALL contributors in leaderboard DB except known non-contributor roles
    //   (project-admin/mentor/admin) from main DB.
    // - Bonus: still only applied for registered contributors in main DB.
    const excludedGithubLowerSet = new Set();
    const bonusEligibleGithubLowerSet = new Set();

    if (MainUser) {
      const excludedGithubs = await MainUser.distinct('githubUsername', {
        role: { $in: ['project-admin', 'mentor', 'admin'] },
        githubUsername: { $exists: true, $ne: '' },
      });

      for (const gh of excludedGithubs || []) {
        const key = String(gh || '').trim().toLowerCase();
        if (key) excludedGithubLowerSet.add(key);
      }

      const eligibleGithubs = await MainUser.distinct('githubUsername', {
        role: 'contributor',
        isActive: { $ne: false },
        githubUsername: { $exists: true, $ne: '' },
      });

      for (const gh of eligibleGithubs || []) {
        const key = String(gh || '').trim().toLowerCase();
        if (key) bonusEligibleGithubLowerSet.add(key);
      }
    }

    const excludedGithubLower = Array.from(excludedGithubLowerSet);
    const bonusEligibleGithubLower = Array.from(bonusEligibleGithubLowerSet);

    const countActiveContributors = async (filter) => {
      const pipeline = [];
      if (filter && Object.keys(filter).length) pipeline.push({ $match: filter });
      pipeline.push({ $addFields: { _ghLower: { $toLower: { $ifNull: ['$githubUsername', ''] } } } });
      if (excludedGithubLower.length) {
        pipeline.push({ $match: { _ghLower: { $nin: excludedGithubLower } } });
      }
      pipeline.push({ $count: 'c' });
      const [row] = await Contributor.aggregate(pipeline).collation(sortCollation);
      return row?.c || 0;
    };

    const summaryPipeline = [{ $addFields: { _ghLower: { $toLower: { $ifNull: ['$githubUsername', ''] } } } }];
    if (excludedGithubLower.length) {
      summaryPipeline.push({ $match: { _ghLower: { $nin: excludedGithubLower } } });
    }
    summaryPipeline.push({
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        totalPoints: { $sum: { $ifNull: ['$totalPoints', 0] } },
        totalPRsMerged: { $sum: { $ifNull: ['$totalPRs', 0] } },
      },
    });
    const [summaryAgg] = await Contributor.aggregate(summaryPipeline).collation(sortCollation);

    // Fetch contributors sorted by (base + bonus) points.
    // Bonus points are stored separately, so we compute them via aggregation for correct ordering.
    const contributorSortSpec = { totalPointsWithBonus: -1, totalPRs: -1, githubUsername: 1, _id: 1 };
    const fetchContributors = async (filter, pageSkip, pageLimit) => {
      const bonusMatchExpr = bonusEligibleGithubLower.length
        ? { $and: [{ $eq: ['$ghLower', '$$gh'] }, { $in: ['$ghLower', bonusEligibleGithubLower] }] }
        : { $eq: ['$ghLower', '$$gh'] };

      const pipeline = [];
      if (filter && Object.keys(filter).length) pipeline.push({ $match: filter });

      pipeline.push(
        { $addFields: { _ghLower: { $toLower: { $ifNull: ['$githubUsername', ''] } } } },
        ...(excludedGithubLower.length ? [{ $match: { _ghLower: { $nin: excludedGithubLower } } }] : []),
        {
          $lookup: {
            from: 'bonus_points',
            let: { gh: '$_ghLower' },
            pipeline: [
              {
                $project: {
                  ghLower: {
                    $ifNull: ['$githubUsernameLower', { $toLower: '$githubUsername' }],
                  },
                  points: { $ifNull: ['$points', 0] },
                },
              },
              { $match: { $expr: bonusMatchExpr } },
              { $group: { _id: null, total: { $sum: '$points' } } },
            ],
            as: '__bonusAgg',
          },
        },
        {
          $addFields: {
            bonusPoints: { $ifNull: [{ $arrayElemAt: ['$__bonusAgg.total', 0] }, 0] },
            totalPointsWithBonus: {
              $add: [{ $ifNull: ['$totalPoints', 0] }, { $ifNull: [{ $arrayElemAt: ['$__bonusAgg.total', 0] }, 0] }],
            },
          },
        }
      );

      pipeline.push({ $sort: contributorSortSpec });
      if (pageSkip) pipeline.push({ $skip: pageSkip });
      if (pageLimit) pipeline.push({ $limit: pageLimit });
      pipeline.push({
        $project: {
          githubUsername: 1,
          totalPoints: 1,
          totalPRs: 1,
          updatedAt: 1,
          lastContributionAt: 1,
          bonusPoints: 1,
          totalPointsWithBonus: 1,
        },
      });

      return Contributor.aggregate(pipeline).collation(sortCollation);
    };

    let bonusSummaryAgg = { totalBonusPoints: 0, bonusEntries: 0 };
    if (bonusEligibleGithubLower.length) {
      const [row] = await BonusPoint.aggregate([
        {
          $project: {
            ghLower: {
              $ifNull: ['$githubUsernameLower', { $toLower: '$githubUsername' }],
            },
            points: { $ifNull: ['$points', 0] },
          },
        },
        { $match: { ghLower: { $in: bonusEligibleGithubLower } } },
        {
          $group: {
            _id: null,
            totalBonusPoints: { $sum: '$points' },
            bonusEntries: { $sum: 1 },
          },
        },
      ]);
      bonusSummaryAgg = row || bonusSummaryAgg;
    }

    const totalContributors = summaryAgg?.totalUsers || 0;

    let inactiveAll = [];
    if (includeInactive && MainUser) {
      const activeGithubUsernames = await Contributor.distinct('githubUsername', {});
      const activeSet = new Set(
        (activeGithubUsernames || [])
          .map((u) => String(u || '').trim().toLowerCase())
          .filter(Boolean)
      );

      const candidates = await MainUser.find({
        role: 'contributor',
        isActive: { $ne: false },
        githubUsername: { $exists: true, $ne: '' },
      })
        .select('githubUsername linkedinUrl name username')
        .lean();

      inactiveAll = (candidates || [])
        .map((u) => {
          const gh = String(u?.githubUsername || '').trim();
          return {
            ...u,
            githubUsername: gh,
            _ghKey: gh.toLowerCase(),
          };
        })
        .filter((u) => u.githubUsername && !activeSet.has(u._ghKey));

      inactiveAll.sort((a, b) => {
        const an = String(a?.name || '').toLowerCase();
        const bn = String(b?.name || '').toLowerCase();
        if (an !== bn) return an.localeCompare(bn);
        return String(a?.githubUsername || '').toLowerCase().localeCompare(String(b?.githubUsername || '').toLowerCase());
      });
    }

    const inactiveCount = inactiveAll.length;
    const totalUsers = totalContributors + (includeInactive ? inactiveCount : 0);

    // When includeInactive is on, the main leaderboard uses a combined list ordering
    // (active contributors + inactive users, with bonus-only points for inactive).
    // For search, we compute ranks from the same combined ordering so ranks match.
    const computeCombinedRankByGithubLower = async () => {
      const allContributors = await fetchContributors({}, 0, 0);

      const inactiveAllBonusKeys = (inactiveAll || [])
        .map((u) => String(u?.githubUsername || '').trim().toLowerCase())
        .filter(Boolean)
        .filter((ghLower) => bonusEligibleGithubLowerSet.has(ghLower));

      const inactiveBonusByGithubLower = new Map();
      if (inactiveAllBonusKeys.length) {
        const bonusAgg = await BonusPoint.aggregate([
          {
            $project: {
              ghLower: {
                $ifNull: ['$githubUsernameLower', { $toLower: '$githubUsername' }],
              },
              points: { $ifNull: ['$points', 0] },
            },
          },
          { $match: { ghLower: { $in: inactiveAllBonusKeys } } },
          { $group: { _id: '$ghLower', total: { $sum: '$points' } } },
        ]);
        for (const row of bonusAgg) {
          const key = String(row?._id || '').trim().toLowerCase();
          if (!key) continue;
          inactiveBonusByGithubLower.set(key, row?.total || 0);
        }
      }

      const combinedAll = [];
      for (const c of allContributors || []) {
        const gh = String(c?.githubUsername || '').trim();
        if (!gh) continue;
        const ghKey = gh.toLowerCase();
        const totalPoints = Number(c?.totalPointsWithBonus ?? (c?.totalPoints || 0)) || 0;
        const prs = Number(c?.totalPRs || 0) || 0;
        combinedAll.push({
          kind: 'active',
          ghKey,
          totalPoints,
          prs,
          id: String(c?._id || ''),
        });
      }

      for (const u of inactiveAll || []) {
        const gh = String(u?.githubUsername || '').trim();
        if (!gh) continue;
        const ghKey = gh.toLowerCase();
        const bonus = Number(inactiveBonusByGithubLower.get(ghKey) || 0) || 0;
        combinedAll.push({
          kind: 'inactive',
          ghKey,
          totalPoints: bonus,
          prs: 0,
          id: `inactive-${ghKey}`,
        });
      }

      combinedAll.sort((a, b) => {
        if ((b.totalPoints || 0) !== (a.totalPoints || 0)) return (b.totalPoints || 0) - (a.totalPoints || 0);
        if ((b.prs || 0) !== (a.prs || 0)) return (b.prs || 0) - (a.prs || 0);
        const agh = String(a.ghKey || '');
        const bgh = String(b.ghKey || '');
        if (agh !== bgh) return agh.localeCompare(bgh);
        return String(a.id || '').localeCompare(String(b.id || ''));
      });

      const rankBy = new Map();
      for (let i = 0; i < combinedAll.length; i++) {
        const row = combinedAll[i];
        if (!row?.ghKey) continue;
        // One rank per github username.
        if (!rankBy.has(row.ghKey)) rankBy.set(row.ghKey, i + 1);
      }
      return rankBy;
    };

    let combinedRankByGithubLower = null;
    const shouldUseCombinedRanksForSearch = includeInactive && !!q && !qIsRank;
    if (shouldUseCombinedRanksForSearch) {
      combinedRankByGithubLower = await computeCombinedRankByGithubLower();
    }

    let totalMatched = totalUsers;
    if (github) {
      const activeMatches = await countActiveContributors(contributorFilter);
      if (activeMatches > 0) {
        totalMatched = activeMatches;
      } else if (includeInactive) {
        const ghKey = String(github || '').trim().toLowerCase();
        totalMatched = inactiveAll.some((u) => u?._ghKey === ghKey) ? 1 : 0;
      } else {
        totalMatched = 0;
      }
    } else if (q) {
      if (qIsRank) {
        totalMatched = qRank && qRank <= totalUsers ? 1 : 0;
      } else if (MainUser && includeInactive) {
        const qRegex = new RegExp(escapeRegex(q), 'i');
        totalMatched = await MainUser.countDocuments({
          role: 'contributor',
          isActive: { $ne: false },
          $or: [{ githubUsername: qRegex }, { username: qRegex }, { name: qRegex }],
        });
      } else {
        totalMatched = await countActiveContributors(contributorFilter);
      }
    }
    const totalPages = totalMatched ? Math.ceil(totalMatched / limit) : 1;

    // Fetch contributors sorted by points (paged)
    // NOTE: Use a deterministic sort for stable pagination when many users tie on points.
    let contributors = [];
    let inactiveUsers = [];
    let inactiveUsersWithRank = [];
    const activeRankInfoByGithubLower = new Map();

    const includeInactiveInListing = includeInactive && !github && !q;

    const buildCombinedAll = async () => {
      const allContributors = await fetchContributors({}, 0, 0);

      // Precompute inactive bonuses for correct combined sorting.
      const inactiveAllBonusKeys = (inactiveAll || [])
        .map((u) => String(u?.githubUsername || '').trim().toLowerCase())
        .filter(Boolean)
        .filter((ghLower) => bonusEligibleGithubLowerSet.has(ghLower));

      const inactiveBonusByGithubLower = new Map();
      if (inactiveAllBonusKeys.length) {
        const bonusAgg = await BonusPoint.aggregate([
          {
            $project: {
              ghLower: {
                $ifNull: ['$githubUsernameLower', { $toLower: '$githubUsername' }],
              },
              points: { $ifNull: ['$points', 0] },
            },
          },
          { $match: { ghLower: { $in: inactiveAllBonusKeys } } },
          { $group: { _id: '$ghLower', total: { $sum: '$points' } } },
        ]);
        for (const row of bonusAgg) {
          const key = String(row?._id || '').trim().toLowerCase();
          if (!key) continue;
          inactiveBonusByGithubLower.set(key, row?.total || 0);
        }
      }

      const combinedAll = [];
      for (const c of allContributors || []) {
        const gh = String(c?.githubUsername || '').trim();
        if (!gh) continue;
        const ghKey = gh.toLowerCase();
        const totalPoints = Number(c?.totalPointsWithBonus ?? (c?.totalPoints || 0)) || 0;
        const prs = Number(c?.totalPRs || 0) || 0;
        combinedAll.push({
          kind: 'active',
          gh,
          ghKey,
          totalPoints,
          prs,
          id: String(c?._id || ''),
          contributorDoc: c,
        });
      }

      for (const u of inactiveAll || []) {
        const gh = String(u?.githubUsername || '').trim();
        if (!gh) continue;
        const ghKey = gh.toLowerCase();
        const bonus = Number(inactiveBonusByGithubLower.get(ghKey) || 0) || 0;
        combinedAll.push({
          kind: 'inactive',
          gh,
          ghKey,
          totalPoints: bonus,
          prs: 0,
          id: `inactive-${ghKey}`,
          userDoc: u,
        });
      }

      combinedAll.sort((a, b) => {
        if ((b.totalPoints || 0) !== (a.totalPoints || 0)) return (b.totalPoints || 0) - (a.totalPoints || 0);
        if ((b.prs || 0) !== (a.prs || 0)) return (b.prs || 0) - (a.prs || 0);
        const agh = String(a.ghKey || '');
        const bgh = String(b.ghKey || '');
        if (agh !== bgh) return agh.localeCompare(bgh);
        return String(a.id || '').localeCompare(String(b.id || ''));
      });

      for (let i = 0; i < combinedAll.length; i++) {
        combinedAll[i].rank = i + 1;
      }

      return combinedAll;
    };

    // Combined list mode (contributors + inactive): default listing.
    // IMPORTANT: Sort by displayed points (base + eligible bonus), so bonus-only users
    // don't end up "away from sorting".
    if (includeInactiveInListing) {
      const combinedAll = await buildCombinedAll();

      const pageSlice = combinedAll.slice(skip, skip + limit);
      const activeSlice = pageSlice.filter((x) => x.kind === 'active');
      const inactiveSlice = pageSlice.filter((x) => x.kind === 'inactive');

      contributors = activeSlice.map((x) => x.contributorDoc);
      for (const x of activeSlice) {
        activeRankInfoByGithubLower.set(x.ghKey, { rank: x.rank, totalPoints: x.totalPoints });
      }
      inactiveUsersWithRank = inactiveSlice.map((x) => ({ user: x.userDoc, rank: x.rank }));
      inactiveUsers = [];
    } else if (github) {
      contributors = await fetchContributors(contributorFilter, 0, 1);

      if (includeInactive && contributors.length === 0) {
        const ghKey = String(github || '').trim().toLowerCase();
        const idx = inactiveAll.findIndex((u) => u?._ghKey === ghKey);
        if (idx >= 0) {
          inactiveUsersWithRank = [{ user: inactiveAll[idx], rank: totalContributors + idx + 1 }];
        }
      }
    } else if (qIsRank) {
      // Rank lookup across combined list.
      const rank = qRank || 1;
      if (includeInactive && rank <= totalUsers) {
        const combinedAll = await buildCombinedAll();
        const picked = combinedAll[rank - 1];
        if (picked?.kind === 'active' && picked?.contributorDoc) {
          contributors = [picked.contributorDoc];
          if (picked.ghKey) activeRankInfoByGithubLower.set(picked.ghKey, { rank: picked.rank, totalPoints: picked.totalPoints });
        } else if (picked?.kind === 'inactive' && picked?.userDoc) {
          inactiveUsersWithRank = [{ user: picked.userDoc, rank: picked.rank }];
        }
      } else if (rank <= totalContributors) {
        const targetSkip = rank - 1;
        contributors = await fetchContributors({}, targetSkip, 1);
      }
    } else {
      contributors = await fetchContributors(contributorFilter, skip, limit);

      // Text search: include inactive matches from main DB.
      if (includeInactive && q && !qIsRank && MainUser) {
        const qRegex = new RegExp(escapeRegex(q), 'i');
        const matches = await MainUser.find({
          role: 'contributor',
          isActive: { $ne: false },
          $or: [{ githubUsername: qRegex }, { username: qRegex }, { name: qRegex }],
        })
          .select('githubUsername linkedinUrl name username')
          .limit(5000)
          .lean();

        const activeKeys = new Set((contributors || []).map((c) => String(c?.githubUsername || '').trim().toLowerCase()).filter(Boolean));
        const inactiveKeyToIndex = new Map(inactiveAll.map((u, idx) => [u._ghKey, idx]));

        for (const m of matches) {
          const gh = String(m?.githubUsername || '').trim();
          const ghKey = gh.toLowerCase();
          if (!ghKey) continue;
          if (activeKeys.has(ghKey)) continue;
          const idx = inactiveKeyToIndex.get(ghKey);
          if (!Number.isFinite(idx) || idx < 0) continue;
          inactiveUsersWithRank.push({ user: inactiveAll[idx], rank: totalContributors + idx + 1 });
        }

        // Ensure deterministic order (global rank)
        inactiveUsersWithRank.sort((a, b) => (a.rank || 0) - (b.rank || 0));

        // Apply pagination to the *combined* filtered set: active results already paged by Contributor query,
        // so only add inactive users when there's remaining room.
        const remaining = Math.max(limit - contributors.length, 0);
        if (remaining > 0) {
          inactiveUsersWithRank = inactiveUsersWithRank.slice(0, remaining);
        } else {
          inactiveUsersWithRank = [];
        }
      }
    }

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

    const [prAgg] = await PR.aggregate([
      {
        $group: {
          _id: null,
          latestPrUpdatedAt: { $max: '$updatedAt' },
          latestPrMergedAt: { $max: '$mergedAt' },
        },
      },
    ]);

    // True merged PR count from PR documents (more reliable than `contributors.totalPRs`,
    // which can be stale/missing for some contributors).
    // Also compute a filtered count for only `scored=true` and level in L1/L2/L3.
    const [prMergedAggAll] = await PR.aggregate([
      {
        $match: {
          mergedAt: { $type: 'date', $gte: PROGRAM_START },
        },
      },
      { $addFields: { _contributorLower: { $toLower: { $ifNull: ['$contributor', ''] } } } },
      ...(excludedGithubLower.length
        ? [{ $match: { _contributorLower: { $nin: excludedGithubLower } } }]
        : []),
      { $group: { _id: null, totalPRsMerged: { $sum: 1 } } },
    ]);

    const [prMergedAggScoredL123] = await PR.aggregate([
      {
        $match: {
          mergedAt: { $type: 'date', $gte: PROGRAM_START },
        },
      },
      {
        $addFields: {
          _contributorLower: { $toLower: { $ifNull: ['$contributor', ''] } },
          _levelUpper: { $toUpper: { $ifNull: ['$level', ''] } },
        },
      },
      ...(excludedGithubLower.length
        ? [{ $match: { _contributorLower: { $nin: excludedGithubLower } } }]
        : []),
      {
        $match: {
          _levelUpper: { $in: ['L1', 'L2', 'L3'] },
          scored: { $in: [true, 1, 'true'] },
        },
      },
      { $group: { _id: null, totalPRsMerged: { $sum: 1 } } },
    ]);

    const prLatestMs = Math.max(
      prAgg?.latestPrUpdatedAt ? new Date(prAgg.latestPrUpdatedAt).getTime() : 0,
      prAgg?.latestPrMergedAt ? new Date(prAgg.latestPrMergedAt).getTime() : 0
    );

    // Bonuses for inactive users (active contributors already have bonus included in aggregation).
    const inactiveBonusKeys = Array.from([
      ...(inactiveUsers || []).map((u) => String(u?.githubUsername || '').trim()),
      ...(inactiveUsersWithRank || []).map((item) => String(item?.user?.githubUsername || '').trim()),
    ])
      .map((gh) => String(gh || '').trim().toLowerCase())
      .filter(Boolean)
      .filter((ghLower) => bonusEligibleGithubLowerSet.has(ghLower));

    const bonusByGithubLower = new Map();
    if (inactiveBonusKeys.length) {
      const bonusAgg = await BonusPoint.aggregate([
        {
          $project: {
            ghLower: {
              $ifNull: ['$githubUsernameLower', { $toLower: '$githubUsername' }],
            },
            points: { $ifNull: ['$points', 0] },
          },
        },
        { $match: { ghLower: { $in: inactiveBonusKeys } } },
        { $group: { _id: '$ghLower', total: { $sum: '$points' } } },
      ]);
      for (const row of bonusAgg) {
        const key = String(row?._id || '').trim().toLowerCase();
        if (!key) continue;
        bonusByGithubLower.set(key, row?.total || 0);
      }
    }

    const usernames = contributors.map((c) => c.githubUsername).filter(Boolean);
    const usernamesLower = usernames
      .map((u) => String(u || '').trim().toLowerCase())
      .filter(Boolean);
    const canonicalByLower = new Map();
    for (const u of usernames) {
      const key = String(u || '').trim().toLowerCase();
      if (!key) continue;
      if (!canonicalByLower.has(key)) canonicalByLower.set(key, u);
    }

    const mainUsers = MainUser && usernames.length
      ? await MainUser.find({ githubUsername: { $in: usernames } })
          .select('githubUsername linkedinUrl name username')
          .lean()
      : [];

    const mainUserByGithub = new Map();
    for (const u of mainUsers) {
      if (u?.githubUsername) mainUserByGithub.set(u.githubUsername, u);
    }

    // NOTE: Contributor usernames can differ in casing across collections.
    // Match case-insensitively by normalizing `contributor` to lowercase.
    const prs = usernamesLower.length
      ? await (usernamesLower.length === 1
        ? PR.aggregate([
            { $addFields: { _contributorLower: { $toLower: { $ifNull: ['$contributor', ''] } } } },
            { $match: { _contributorLower: usernamesLower[0] } },
            { $sort: { mergedAt: -1, updatedAt: -1 } },
            { $limit: prLimit },
            {
              $project: {
                contributor: 1,
                prUrl: 1,
                prTitle: 1,
                level: 1,
                mergedAt: 1,
                updatedAt: 1,
                points: 1,
                score: 1,
                repoOwner: 1,
                repoName: 1,
                prNumber: 1,
              },
            },
          ])
        : PR.aggregate([
            { $addFields: { _contributorLower: { $toLower: { $ifNull: ['$contributor', ''] } } } },
            { $match: { _contributorLower: { $in: usernamesLower } } },
            { $sort: { mergedAt: -1, updatedAt: -1 } },
            {
              $project: {
                contributor: 1,
                prUrl: 1,
                prTitle: 1,
                level: 1,
                mergedAt: 1,
                updatedAt: 1,
                points: 1,
                score: 1,
                repoOwner: 1,
                repoName: 1,
                prNumber: 1,
              },
            },
          ]))
      : [];

    const prByContributor = new Map();
    const projectsByContributor = new Map();
    for (const pr of prs) {
      const keyLower = String(pr?.contributor || '').trim().toLowerCase();
      const key = canonicalByLower.get(keyLower) || pr.contributor;
      if (!key) continue;

      const owner = pr.repoOwner || (typeof pr.prUrl === 'string' ? pr.prUrl.split('github.com/')[1]?.split('/')[0] : null);
      const repo = pr.repoName || (typeof pr.prUrl === 'string' ? pr.prUrl.split('github.com/')[1]?.split('/')[1] : null);
      if (owner && repo) {
        const projectKey = `${owner}/${repo}`;
        const set = projectsByContributor.get(key) || new Set();
        set.add(projectKey);
        projectsByContributor.set(key, set);
      }

      const list = prByContributor.get(key) || [];
      if (list.length >= prLimit) continue;
      list.push({
        prUrl: pr.prUrl,
        prTitle: pr.prTitle,
        level: pr.level,
        mergedAt: pr.mergedAt,
        updatedAt: pr.updatedAt,
        points: pr.points,
        score: pr.score,
        repoOwner: pr.repoOwner,
        repoName: pr.repoName,
        prNumber: pr.prNumber,
      });
      prByContributor.set(key, list);
    }

    // Add global rank to each active contributor
    const rankedUsers = contributors.map((c, index) => {
      const ghKey = String(c?.githubUsername || '').trim().toLowerCase();
      const injected = ghKey ? activeRankInfoByGithubLower.get(ghKey) : null;
      return ({
      ...(mainUserByGithub.get(c.githubUsername) || null),
      _id: c._id,
      rank: injected?.rank ?? (qIsRank ? (qRank || 1) : (skip + index + 1)),
      name: mainUserByGithub.get(c.githubUsername)?.name || c.githubUsername || 'Contributor',
      username: mainUserByGithub.get(c.githubUsername)?.username || c.githubUsername || '',
      githubUsername: c.githubUsername || '',
      linkedin: mainUserByGithub.get(c.githubUsername)?.linkedinUrl || null,
      prHistory: prByContributor.get(c.githubUsername) || [],
      stats: {
        totalPoints: injected?.totalPoints ?? (c.totalPointsWithBonus ?? (c.totalPoints || 0)),
        basePoints: c.totalPoints || 0,
        bonusPoints: c.bonusPoints || 0,
        pullRequests: { merged: c.totalPRs || 0 },
        projectsContributed: projectsByContributor.get(c.githubUsername)?.size || 0,
      },
    });
    });

    const inactiveRankedUsers = [];
    if (includeInactiveInListing && Array.isArray(inactiveUsers) && inactiveUsers.length > 0) {
      const inactiveStartRank = totalContributors + Math.max(skip - totalContributors, 0) + 1;
      for (let i = 0; i < inactiveUsers.length; i++) {
        const u = inactiveUsers[i];
        const gh = String(u?.githubUsername || '').trim();
        if (!gh) continue;
        inactiveRankedUsers.push({
          _id: `inactive-${gh}`,
          __inactive: true,
          rank: inactiveStartRank + i,
          name: u?.name || gh || 'Contributor',
          username: u?.username || gh || '',
          githubUsername: gh,
          linkedin: u?.linkedinUrl || null,
          prHistory: [],
          stats: {
            totalPoints: bonusByGithubLower.get(String(gh || '').trim().toLowerCase()) || 0,
            basePoints: 0,
            bonusPoints: bonusByGithubLower.get(String(gh || '').trim().toLowerCase()) || 0,
            pullRequests: { merged: 0 },
            projectsContributed: 0,
          },
        });
      }
    }

    if (Array.isArray(inactiveUsersWithRank) && inactiveUsersWithRank.length > 0) {
      for (const item of inactiveUsersWithRank) {
        const u = item?.user;
        const gh = String(u?.githubUsername || '').trim();
        if (!gh) continue;
        const ghLower = gh.toLowerCase();
        inactiveRankedUsers.push({
          _id: `inactive-${gh}`,
          __inactive: true,
          rank: combinedRankByGithubLower?.get(ghLower) || item.rank,
          name: u?.name || gh || 'Contributor',
          username: u?.username || gh || '',
          githubUsername: gh,
          linkedin: u?.linkedinUrl || null,
          prHistory: [],
          stats: {
            totalPoints: bonusByGithubLower.get(String(gh || '').trim().toLowerCase()) || 0,
            basePoints: 0,
            bonusPoints: bonusByGithubLower.get(String(gh || '').trim().toLowerCase()) || 0,
            pullRequests: { merged: 0 },
            projectsContributed: 0,
          },
        });
      }
    }

    // When searching by text, compute and return the true global rank.
    // This must match the deterministic sort used for pagination.
    if (q && !qIsRank) {
      if (combinedRankByGithubLower) {
        for (const u of rankedUsers) {
          const ghLower = String(u?.githubUsername || '').trim().toLowerCase();
          const r = ghLower ? combinedRankByGithubLower.get(ghLower) : null;
          if (r) u.rank = r;
        }
      } else {
        const rankPromises = rankedUsers.map(async (u) => {
          const points = u?.stats?.totalPoints || 0;
          const prs = u?.stats?.pullRequests?.merged || 0;
          const ghLower = String(u?.githubUsername || '').trim().toLowerCase();
          const id = u?._id;

          const bonusMatchExpr = bonusEligibleGithubLower.length
            ? { $and: [{ $eq: ['$ghLower', '$$gh'] }, { $in: ['$ghLower', bonusEligibleGithubLower] }] }
            : { $eq: ['$ghLower', '$$gh'] };

          const pipeline = [
            { $addFields: { _ghLower: { $toLower: { $ifNull: ['$githubUsername', ''] } } } },
            ...(excludedGithubLower.length ? [{ $match: { _ghLower: { $nin: excludedGithubLower } } }] : []),
            {
              $lookup: {
                from: 'bonus_points',
                let: { gh: '$_ghLower' },
                pipeline: [
                  {
                    $project: {
                      ghLower: {
                        $ifNull: ['$githubUsernameLower', { $toLower: '$githubUsername' }],
                      },
                      points: { $ifNull: ['$points', 0] },
                    },
                  },
                  { $match: { $expr: bonusMatchExpr } },
                  { $group: { _id: null, total: { $sum: '$points' } } },
                ],
                as: '__bonusAgg',
              },
            },
            {
              $addFields: {
                bonusPoints: { $ifNull: [{ $arrayElemAt: ['$__bonusAgg.total', 0] }, 0] },
                totalPointsWithBonus: {
                  $add: [{ $ifNull: ['$totalPoints', 0] }, { $ifNull: [{ $arrayElemAt: ['$__bonusAgg.total', 0] }, 0] }],
                },
              },
            },
            {
              $match: {
                $or: [
                  { totalPointsWithBonus: { $gt: points } },
                  { totalPointsWithBonus: points, totalPRs: { $gt: prs } },
                  { totalPointsWithBonus: points, totalPRs: prs, _ghLower: { $lt: ghLower } },
                  { totalPointsWithBonus: points, totalPRs: prs, _ghLower: ghLower, _id: { $lt: id } },
                ],
              },
            },
            { $count: 'c' },
          ];

          const [row] = await Contributor.aggregate(pipeline).collation(sortCollation);
          u.rank = (row?.c || 0) + 1;
        });

        await Promise.all(rankPromises);
      }
      rankedUsers.sort((a, b) => (a.rank || 0) - (b.rank || 0));
    }

    const users = [...rankedUsers, ...inactiveRankedUsers].sort((a, b) => (a.rank || 0) - (b.rank || 0));

    const summary = {
      totalUsers,
      totalPoints: (summaryAgg?.totalPoints || 0) + (bonusSummaryAgg?.totalBonusPoints || 0),
      totalBonusPoints: bonusSummaryAgg?.totalBonusPoints || 0,
      totalPRsMergedAll: prMergedAggAll?.totalPRsMerged || summaryAgg?.totalPRsMerged || 0,
      totalPRsMergedScoredL123: prMergedAggScoredL123?.totalPRsMerged || 0,
      // Keep backwards-compatible field name for the UI card.
      totalPRsMerged: prMergedAggScoredL123?.totalPRsMerged || 0,
    };

    const pagination = {
      page: github || qIsRank ? 1 : page,
      limit,
      total: totalMatched,
      totalPages,
      hasPrev: github || qIsRank ? false : page > 1,
      hasNext: github || qIsRank ? false : page < totalPages,
    };

    return NextResponse.json({ 
      users,
      summary,
      pagination,
      // "Last Updated" is based only on PR activity.
      updatedAt: prLatestMs ? new Date(prLatestMs).toISOString() : null,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
