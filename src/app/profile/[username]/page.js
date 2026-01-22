'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import useAuth from '@/hooks/useAuth';
import Link from 'next/link';

// Rank calculation function
const calculateRank = (points) => {
  if (points >= 2054) return { name: 'Rank #1', next: 'Ultimate Target', current: points, target: 2054, percentage: 100 };
  if (points >= 1148) return { name: 'Rank #7', next: 'Rank #1', current: points, target: 2054, percentage: (points / 2054) * 100 };
  if (points >= 500) return { name: 'Rank #15', next: 'Rank #7', current: points, target: 1148, percentage: (points / 1148) * 100 };
  if (points >= 200) return { name: 'Rank #30', next: 'Rank #15', current: points, target: 500, percentage: (points / 500) * 100 };
  return { name: 'Rank #50+', next: 'Rank #30', current: points, target: 200, percentage: (points / 200) * 100 };
};

// Generate mock contribution activity data
const generateContributionData = (activities) => {
  const data = [];
  const now = new Date();
  const start = new Date('2026-01-01T00:00:00Z');
  
  for (let i = 58; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    if (date < start) continue;
    
    // Count activities for this date
    const dayActivities = activities?.filter(activity => {
      const activityDate = new Date(activity.date);
      return activityDate.toDateString() === date.toDateString();
    }) || [];
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: dayActivities.reduce((sum, a) => sum + (a.points || 0), 0),
      prs: dayActivities.length,
    });
  }
  
  return data;
};

export default function UserProfile() {
  const params = useParams();
  const username = params?.username;
  const searchParams = useSearchParams();
  const forceLive = searchParams?.get?.('live') === '1';

  const { user: me, isLoggedIn } = useAuth();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState(null);
  const [avatarError, setAvatarError] = useState(false);
  const [activeGraphIndex, setActiveGraphIndex] = useState(null);
  const [prPage, setPrPage] = useState(1);
  const [mergedPrPage, setMergedPrPage] = useState(1);

  const [adminRank, setAdminRank] = useState(null);
  const [adminRankLoading, setAdminRankLoading] = useState(false);

  const [bonusLoading, setBonusLoading] = useState(false);
  const [bonusError, setBonusError] = useState('');
  const [bonusTotal, setBonusTotal] = useState(0);
  const [bonusEntries, setBonusEntries] = useState([]);

  const [editSocialsOpen, setEditSocialsOpen] = useState(false);
  const [editGithub, setEditGithub] = useState('');
  const [editLinkedin, setEditLinkedin] = useState('');
  const [savingSocials, setSavingSocials] = useState(false);

  const isOwnProfile =
    !!isLoggedIn &&
    !!me?.email &&
    !!user?.email &&
    String(me.email).toLowerCase() === String(user.email).toLowerCase();

  const openEditSocials = () => {
    setEditGithub(user?.githubUsername || '');
    setEditLinkedin(user?.linkedinUrl || '');
    setEditSocialsOpen(true);
  };

  const saveSocials = async () => {
    if (!user?.email) {
      setToast({ message: 'Missing email for this profile.', type: 'error' });
      return;
    }
    setSavingSocials(true);
    try {
      const res = await fetch('/api/user/update-socials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: (me?.email || user?.email || '').toLowerCase(),
          githubUsername: editGithub,
          linkedinUrl: editLinkedin,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setToast({ message: data?.message || 'Failed to update socials.', type: 'error' });
        return;
      }

      setUser((prev) =>
        prev
          ? {
              ...prev,
              githubUsername: data?.data?.githubUsername || null,
              linkedinUrl: data?.data?.linkedinUrl || null,
            }
          : prev
      );
      setToast({ message: 'Profile socials updated.', type: 'success' });
      setEditSocialsOpen(false);
    } catch (err) {
      console.error('Update socials error:', err);
      setToast({ message: 'Failed to update socials. Please try again.', type: 'error' });
    } finally {
      setSavingSocials(false);
    }
  };

  useEffect(() => {
    if (username) {
      fetchUserProfile();
      // console.log('Fetching profile for username:', username);
    }
  }, [username]);

  useEffect(() => {
    setPrPage(1);
    setMergedPrPage(1);
  }, [username]);

  useEffect(() => {
    if (!user?.email || user?.role !== 'project-admin') {
      setAdminRank(null);
      setAdminRankLoading(false);
      return;
    }

    let active = true;
    const controller = new AbortController();

    const run = async () => {
      try {
        setAdminRankLoading(true);
        const url = forceLive ? '/api/leaderboard/project-admin?live=1' : '/api/leaderboard/project-admin';
        const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        const json = await res.json();
        if (!active || controller.signal.aborted) return;
        if (!res.ok) {
          setAdminRank(null);
          return;
        }

        const list = Array.isArray(json?.admins) ? json.admins : [];
        const targetEmail = String(user.email).toLowerCase();
        const idx = list.findIndex((a) => String(a?.email || '').toLowerCase() === targetEmail);
        if (idx === -1) {
          setAdminRank(null);
          return;
        }

        const row = list[idx];
        setAdminRank({
          rank: idx + 1,
          score: typeof row?.score === 'number' ? row.score : 0,
          configured: row?.breakdown?.configured?.ok !== false,
          streak: {
            current: typeof row?.streak?.current === 'number' ? row.streak.current : 0,
            longest: typeof row?.streak?.longest === 'number' ? row.streak.longest : 0,
          },
        });
      } catch (e) {
        if (e?.name === 'AbortError') return;
        setAdminRank(null);
      } finally {
        if (!active || controller.signal.aborted) return;
        setAdminRankLoading(false);
      }
    };

    run();
    return () => {
      active = false;
      controller.abort();
    };
  }, [user?.email, user?.role, forceLive]);

  useEffect(() => {
    const gh = String(user?.githubUsername || '').trim();
    const role = String(user?.role || '').trim();
    if (!gh || (role !== 'contributor' && role !== 'project-admin')) {
      setBonusLoading(false);
      setBonusError('');
      setBonusTotal(0);
      setBonusEntries([]);
      return;
    }

    let active = true;
    const controller = new AbortController();

    const run = async () => {
      try {
        setBonusLoading(true);
        setBonusError('');
        const url = `/api/leaderboard/bonus?github=${encodeURIComponent(gh)}&limit=200`;
        const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        if (!active || controller.signal.aborted) return;
        if (!res.ok || !json?.success) {
          setBonusError(json?.message || 'Failed to load bonus points.');
          setBonusTotal(0);
          setBonusEntries([]);
          return;
        }
        setBonusTotal(typeof json?.total === 'number' ? json.total : 0);
        setBonusEntries(Array.isArray(json?.entries) ? json.entries : []);
      } catch (e) {
        if (e?.name === 'AbortError') return;
        setBonusError('Failed to load bonus points.');
        setBonusTotal(0);
        setBonusEntries([]);
      } finally {
        if (!active || controller.signal.aborted) return;
        setBonusLoading(false);
      }
    };

    run();
    return () => {
      active = false;
      controller.abort();
    };
  }, [user?.githubUsername, user?.role]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/profile/${username}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'User not found');
        return;
      }

      setUser(data.user);
      // console.log('Fetched user profile:', data.user);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadIDCard = async () => {
    setDownloading(true);
    try {
      // Fetch the ID card data
      const res = await fetch(`/api/id-cards/${username}`);
      const data = await res.json();

      if (!res.ok || !data.idCard) {
        setToast({ message: 'ID card not found. Please generate your ID card first.', type: 'warning' });
        setTimeout(() => window.open('/id-card/generate', '_blank'), 1500);
        return;
      }

      // Open the view page and let it generate a downloadable image from the rendered card
      window.open(`/id-card/view/${username}?download=1`, '_blank');
      setToast({ message: 'Preparing your ID card download...', type: 'success' });
    } catch (err) {
      console.error('Error downloading ID card:', err);
      setToast({ message: 'Failed to download ID card. Please try again.', type: 'error' });
    } finally {
      setDownloading(false);
    }
  };

  const bonusByTask = (() => {
    const map = new Map();
    for (const e of bonusEntries || []) {
      const task = String(e?.task || 'Bonus').trim() || 'Bonus';
      const prev = map.get(task) || 0;
      map.set(task, prev + (typeof e?.points === 'number' ? e.points : 0));
    }
    return Array.from(map.entries())
      .map(([task, points]) => ({ task, points }))
      .sort((a, b) => (b.points || 0) - (a.points || 0));
  })();

  const formatSigned = (n) => {
    const v = typeof n === 'number' ? n : Number(n || 0);
    if (!Number.isFinite(v) || v === 0) return '0';
    return v > 0 ? `+${v}` : String(v);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black overflow-x-hidden">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-24 md:pb-8 max-w-7xl">
          <div className="max-w-7xl mx-auto animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
              <div className="lg:col-span-4">
                <div className="relative h-full bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                  <div className="flex flex-col items-center">
                    <div className="w-32 h-32 rounded-full bg-white/10 border border-white/10" />
                    <div className="h-6 w-44 bg-white/10 rounded-md mt-5" />
                    <div className="h-4 w-56 bg-white/10 rounded-md mt-3" />
                    <div className="flex gap-3 mt-6">
                      <div className="h-9 w-28 bg-white/10 rounded-lg" />
                      <div className="h-9 w-28 bg-white/10 rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8">
                <div className="relative h-full bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-6 w-40 bg-white/10 rounded-md" />
                      <div className="h-4 w-64 bg-white/10 rounded-md mt-3" />
                    </div>
                    <div className="h-10 w-28 bg-white/10 rounded-xl" />
                  </div>
                  <div className="mt-8">
                    <div className="h-3 w-full bg-white/10 rounded-full" />
                    <div className="mt-4 flex justify-between">
                      <div className="h-4 w-28 bg-white/10 rounded-md" />
                      <div className="h-4 w-28 bg-white/10 rounded-md" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-white/10" />
                    <div className="h-3 w-16 bg-white/10 rounded-md" />
                  </div>
                  <div className="h-10 w-16 bg-white/10 rounded-md mb-3" />
                  <div className="h-4 w-40 bg-white/10 rounded-md" />
                  <div className="h-3 w-28 bg-white/10 rounded-md mt-3" />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <div className="h-5 w-44 bg-white/10 rounded-md" />
                    <div className="h-4 w-40 bg-white/10 rounded-md mt-2" />
                  </div>
                  <div className="h-7 w-36 bg-white/10 rounded-lg" />
                </div>
                <div className="h-48 w-full bg-white/10 rounded-xl" />
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <div className="h-5 w-44 bg-white/10 rounded-md" />
                    <div className="h-4 w-40 bg-white/10 rounded-md mt-2" />
                  </div>
                  <div className="h-7 w-20 bg-white/10 rounded-lg" />
                </div>
                <div className="h-48 w-full bg-white/10 rounded-xl" />
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                  <div className="h-6 w-40 bg-white/10 rounded-md" />
                  <div className="h-4 w-72 bg-white/10 rounded-md mt-3" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-9 w-28 bg-white/10 rounded-lg border border-white/10" />
                  ))}
                </div>
              </div>

              <div className="h-4 w-32 bg-white/10 rounded-md mb-5" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/10" />
                      <div className="flex-1">
                        <div className="flex justify-between gap-3">
                          <div className="h-5 w-3/5 bg-white/10 rounded-md" />
                          <div className="flex gap-2">
                            <div className="h-7 w-24 bg-white/10 rounded-full" />
                            <div className="h-7 w-14 bg-white/10 rounded-full" />
                          </div>
                        </div>
                        <div className="flex gap-3 mt-3">
                          <div className="h-3 w-28 bg-white/10 rounded-md" />
                          <div className="h-3 w-28 bg-white/10 rounded-md" />
                          <div className="h-3 w-40 bg-white/10 rounded-md" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-black px-4 overflow-x-hidden">
        <Navbar />
        <div className="pt-32 pb-8">
          <div className="flex items-center justify-center min-h-[80vh]">
            <div className="text-center">
              <div className="text-6xl mb-4">😕</div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Profile Not Found</h1>
              <p className="text-gray-600 mb-6">{error || 'This user does not exist'}</p>
              <Link
                href="/"
                className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
              >
                Back to Home
              </Link>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  const stats = user.stats || {};
  const mentorStats = user.mentorStats || {};
  const projectStats = user.projectStats || {};
  const leaderboardMeta = stats.leaderboard || null;

  const basePoints =
    typeof stats.basePoints === 'number'
      ? stats.basePoints
      : typeof stats.totalPoints === 'number'
        ? stats.totalPoints
        : 0;

  const effectiveBonusPoints =
    typeof stats.bonusPoints === 'number'
      ? stats.bonusPoints
      : typeof bonusTotal === 'number'
        ? bonusTotal
        : 0;

  const totalPoints =
    typeof stats.basePoints === 'number' && typeof stats.totalPoints === 'number'
      ? stats.totalPoints
      : basePoints + effectiveBonusPoints;

  const rankInfo = leaderboardMeta
    ? {
        name: leaderboardMeta?.rank ? `Rank #${leaderboardMeta.rank}` : 'Rank',
        next:
          leaderboardMeta?.rank && leaderboardMeta.rank > 1
            ? `Rank #${leaderboardMeta.rank - 1}`
            : 'Ultimate Target - Rank #1',
        current: totalPoints,
        target:
          leaderboardMeta?.rank && leaderboardMeta.rank > 1
            ? Math.max(((leaderboardMeta.nextPoints ?? totalPoints) + 1), totalPoints)
            : Math.max((leaderboardMeta.rank1Points || totalPoints), totalPoints),
        percentage:
          leaderboardMeta?.rank && leaderboardMeta.rank > 1
            ? Math.min((totalPoints / Math.max((leaderboardMeta.nextPoints ?? 0) + 1, 1)) * 100, 100)
            : 100,
        rank1Points: leaderboardMeta.rank1Points || null,
      }
    : calculateRank(totalPoints);

  const contributionData = generateContributionData(user.activities);

  const prDistribution = {
    level1: user.contributions?.filter(c => c.points === 3).length || 0,
    level2: user.contributions?.filter(c => c.points === 7).length || 0,
    level3: user.contributions?.filter(c => c.points === 10).length || 0,
  };

  const getLevelLabel = (contribution) => {
    const raw = (contribution?.level || '').toUpperCase();
    if (raw === 'L1' || raw === 'LEVEL1' || raw === 'LEVEL 1') return 'L1';
    if (raw === 'L2' || raw === 'LEVEL2' || raw === 'LEVEL 2') return 'L2';
    if (raw === 'L3' || raw === 'LEVEL3' || raw === 'LEVEL 3') return 'L3';
    const pts = contribution?.points;
    if (pts === 3) return 'L1';
    if (pts === 7) return 'L2';
    if (pts === 10) return 'L3';
    return '—';
  };

  const ordinal = (n) => {
    const num = Number(n);
    if (!Number.isFinite(num)) return String(n);
    const mod100 = num % 100;
    if (mod100 >= 11 && mod100 <= 13) return `${num}th`;
    switch (num % 10) {
      case 1:
        return `${num}st`;
      case 2:
        return `${num}nd`;
      case 3:
        return `${num}rd`;
      default:
        return `${num}th`;
    }
  };

  const contributionsSortedAsc = (() => {
    const list = Array.isArray(user.contributions) ? [...user.contributions] : [];
    list.sort((a, b) => {
      const aTime = new Date(a.mergedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.mergedAt || b.createdAt || 0).getTime();
      return aTime - bTime;
    });
    return list;
  })();

  const PRS_PER_PAGE = 10;
  const prTotal = contributionsSortedAsc.length;
  const prTotalPages = Math.max(1, Math.ceil(prTotal / PRS_PER_PAGE));
  const prPageSafe = Math.min(Math.max(1, prPage), prTotalPages);
  const prStartIndex = (prPageSafe - 1) * PRS_PER_PAGE;
  const prPageList = contributionsSortedAsc.slice(prStartIndex, prStartIndex + PRS_PER_PAGE);

  const projectProjectsList = Array.isArray(projectStats.projectsList) ? projectStats.projectsList : [];
  const projectProjectsCount = projectProjectsList.length;

  const projectContributorsAgg = (() => {
    const map = new Map();
    for (const proj of projectProjectsList) {
      const list = Array.isArray(proj?.contributors) ? proj.contributors : [];
      for (const c of list) {
        const gh = String(c?.githubUsername || '').trim();
        if (!gh) continue;
        const merged = typeof c?.mergedPRs === 'number' ? c.mergedPRs : 0;
        const prev = map.get(gh);
        if (prev) {
          prev.mergedPRs += merged;
          prev.projects.add(proj?.name || 'Project');
        } else {
          map.set(gh, { githubUsername: gh, mergedPRs: merged, projects: new Set([proj?.name || 'Project']) });
        }
      }
    }
    return map;
  })();

  const projectContributorsList = Array.from(projectContributorsAgg.values())
    .map((c) => ({ ...c, projectsCount: c.projects.size }))
    .sort((a, b) => {
      if (b.mergedPRs !== a.mergedPRs) return b.mergedPRs - a.mergedPRs;
      return a.githubUsername.localeCompare(b.githubUsername);
    });

  const projectTopContributor = projectContributorsList[0] || null;
  const projectUniqueContributorsCount = projectContributorsList.length;

  const mergedPrsSortedDesc = (() => {
    const list = Array.isArray(projectStats?.mergedPrsList) ? [...projectStats.mergedPrsList] : [];
    list.sort((a, b) => {
      const aTime = new Date(a?.mergedAt || 0).getTime();
      const bTime = new Date(b?.mergedAt || 0).getTime();
      return bTime - aTime;
    });
    return list;
  })();

  const MERGED_PRS_PER_PAGE = 10;
  const mergedPrTotal = mergedPrsSortedDesc.length;
  const mergedPrTotalPages = Math.max(1, Math.ceil(mergedPrTotal / MERGED_PRS_PER_PAGE));
  const mergedPrPageSafe = Math.min(Math.max(1, mergedPrPage), mergedPrTotalPages);
  const mergedPrStartIndex = (mergedPrPageSafe - 1) * MERGED_PRS_PER_PAGE;
  const mergedPrPageList = mergedPrsSortedDesc.slice(
    mergedPrStartIndex,
    mergedPrStartIndex + MERGED_PRS_PER_PAGE
  );

  const shouldShowBonusPanel = user?.role === 'contributor' || user?.role === 'project-admin';
  const githubForBonus = String(user?.githubUsername || '').trim();
  const BonusPointsPanel = !shouldShowBonusPanel ? null : (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <h3 className="text-2xl font-bold text-white">Bonus Points</h3>
          <p className="text-sm text-gray-400">Extra points you received (task-wise)</p>
        </div>

        <div className="text-right">
          <div className="text-xs uppercase tracking-[0.2em] text-gray-400">Total Bonus</div>
          <div className="text-3xl font-extrabold text-white leading-tight">{bonusLoading ? '…' : bonusTotal}</div>
        </div>
      </div>

      {!githubForBonus ? (
        <div className="text-sm text-gray-500">
          GitHub username not found for this profile.
        </div>
      ) : bonusError ? (
        <div className="text-sm text-red-300">{bonusError}</div>
      ) : bonusLoading ? (
        <div className="text-sm text-gray-400">Loading bonus points…</div>
      ) : bonusEntries.length ? (
        <div className="space-y-4">
          {!!bonusByTask.length && (
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-2">By task</div>
              <div className="flex flex-wrap gap-2">
                {bonusByTask.slice(0, 18).map((t) => (
                  <span
                    key={t.task}
                    className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-semibold text-gray-200"
                    title={`${t.task}: ${t.points}`}
                  >
                    {t.task} · {formatSigned(t.points)}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-2">Entries</div>
            <div className="space-y-2 max-h-80 overflow-auto pr-1">
              {bonusEntries.slice(0, 50).map((e, idx) => (
                <div key={`${e?._id || idx}`} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-white font-semibold truncate">{String(e?.task || 'Bonus')}</div>
                      {!!e?.reason && <div className="text-xs text-gray-400 truncate">{String(e.reason)}</div>}
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white text-xs font-semibold">
                        {formatSigned(e?.points)} pts
                      </span>
                    </div>
                  </div>
                  {e?.createdAt && (
                    <div className="mt-2 text-[11px] text-gray-500">
                      {new Date(e.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500">No bonus points yet.</div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      <Navbar />
      {editSocialsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-4 pt-24 sm:pt-32"
          role="dialog"
          aria-modal="true"
          aria-label="Update profile"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !savingSocials) setEditSocialsOpen(false);
          }}
        >
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-black/80 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex flex-col">
                <div className="text-xs uppercase tracking-[0.2em] text-gray-400">Update Profile</div>
                <div className="text-lg font-semibold text-white">Socials</div>
              </div>
              <button
                type="button"
                onClick={() => !savingSocials && setEditSocialsOpen(false)}
                className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
                aria-label="Close"
                disabled={savingSocials}
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-[0.2em] text-gray-400 mb-2">GitHub Username</label>
                  <input
                    value={editGithub}
                    onChange={(e) => setEditGithub(e.target.value)}
                    placeholder="e.g. octocat"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-white/30"
                    disabled={savingSocials}
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-[0.2em] text-gray-400 mb-2">LinkedIn URL</label>
                  <input
                    value={editLinkedin}
                    onChange={(e) => setEditLinkedin(e.target.value)}
                    placeholder="https://www.linkedin.com/in/your-handle"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-white/30"
                    disabled={savingSocials}
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditSocialsOpen(false)}
                  className="px-5 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white hover:bg-white/10 transition disabled:opacity-50"
                  disabled={savingSocials}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveSocials}
                  className="px-5 py-2 rounded-xl border border-white/10 bg-white/10 text-sm text-white hover:bg-white/15 transition disabled:opacity-50"
                  disabled={savingSocials}
                >
                  {savingSocials ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-24 md:pb-8 max-w-7xl">
      
        <div className="max-w-7xl mx-auto">
          {/* Bento Grid Layout - Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            {/* Profile Card - Spans 4 columns */}
            <div className="lg:col-span-4 group">
              <div className="relative h-full bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  {/* Avatar with animated border */}
                  <div className="relative mx-auto w-fit mb-6">
                    {!avatarError && user.githubUsername ? (
                      <img
                        src={`https://github.com/${user.githubUsername}.png?size=256`}
                        alt={user.name || user.githubUsername}
                        className="relative w-32 h-32 rounded-full object-cover shadow-xl border border-white/10"
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-5xl font-bold shadow-xl">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {user.isSelected && (
                      <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                        ✓ Selected
                      </div>
                    )}
                  </div>

                  <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-white mb-2">{user.name}</h1>
                    <a 
                      href={user.githubUsername ? `https://github.com/${user.githubUsername}` : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition flex items-center justify-center gap-2 group/link"
                    >
                      @{user.githubUsername || user.username}
                      <svg className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center mb-6">
                    <span className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold capitalize">
                      {user.role.replace('-', ' ')}
                    </span>
                    {user.isVerified && (
                      <span className="bg-white/10 border border-white/20 text-white px-4 py-1.5 rounded-full text-sm font-semibold">
                        ✓ Verified
                      </span>
                    )}
                  </div>

                  {user.bio && (
                    <p className="text-gray-300 text-sm text-center mb-6 leading-relaxed">{user.bio}</p>
                  )}

                  {/* Social Links */}
                  <div className="flex gap-3 justify-center mb-6">
                    {user.githubUsername && (
                      <a
                        href={`https://github.com/${user.githubUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl transition-all duration-300 border border-white/10 hover:border-white/30 hover:scale-105"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                        </svg>
                      </a>
                    )}
                    {user.linkedinUrl && (
                      <a
                        href={user.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl transition-all duration-300 border border-white/10 hover:border-white/30 hover:scale-105"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </a>
                    )}
                  </div>

                  {isOwnProfile && (
                    <div className="flex justify-center mb-6">
                      <button
                        type="button"
                        onClick={openEditSocials}
                        className="w-full sm:w-auto bg-white/10 hover:bg-white/15 text-white px-6 py-2.5 rounded-xl transition-all duration-300 border border-white/10 hover:border-white/30"
                      >
                        Update Profile
                      </button>
                    </div>
                  )}

                  {/* Stats Grid - Role Specific */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {user.role === 'contributor' && (
                      <>
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
                          <div className="text-3xl font-bold text-white mb-1">{totalPoints}</div>
                          <div className="text-xs text-gray-300 font-medium">Points</div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
                          <div className="text-3xl font-bold text-white mb-1">{stats.pullRequests?.merged || 0}</div>
                          <div className="text-xs text-gray-300 font-medium">PRs Merged</div>
                        </div>
                      </>
                    )}
                    
                    {user.role === 'mentor' && (
                      <>
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
                          <div className="text-3xl font-bold text-white mb-1">{mentorStats.contributorsMentored || 0}</div>
                          <div className="text-xs text-gray-300 font-medium">Mentored</div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
                          <div className="text-3xl font-bold text-white mb-1">{mentorStats.sessionsConducted || 0}</div>
                          <div className="text-xs text-gray-300 font-medium">Sessions</div>
                        </div>
                      </>
                    )}
                    
                    {user.role === 'project-admin' && (
                      <>
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
                          <div className="text-3xl font-bold text-white mb-1">{projectStats.projectsManaged || 0}</div>
                          <div className="text-xs text-gray-300 font-medium">Projects</div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
                          <div className="text-3xl font-bold text-white mb-1">{projectStats.totalContributors || 0}</div>
                          <div className="text-xs text-gray-300 font-medium">Contributors</div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Profile Views */}
                  <div className="mt-4 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
                    {/* <span className="text-lg">👁️</span> */}
                    <span className="font-semibold text-gray-300">{user.profileViews || 0}</span> profile views
                  </div>
                </div>
              </div>
            </div>

            {/* Rank Progress Card - Spans 5 columns - Only for Contributors */}
            {user.role === 'contributor' && (
              <div className="lg:col-span-5">
                <div className="h-full bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-3 rounded-xl">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Rank Progress</h3>
                      <p className="text-sm text-gray-400">Your journey to the top</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Next Rank Progress */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-bold text-gray-300">Next: {rankInfo.next}</span>
                        <span className="text-sm font-bold text-white">
                          {rankInfo.current}/{rankInfo.target} pts
                        </span>
                      </div>
                      <div className="relative w-full h-4 bg-gray-900 rounded-full overflow-hidden border border-white/10">
                        <div 
                          className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${Math.min(rankInfo.percentage, 100)}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20"></div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-400">{Math.min(rankInfo.percentage, 100).toFixed(1)}% Complete</span>
                        <span className="text-xs text-gray-400 font-semibold">{Math.max(0, (rankInfo.target || 0) - (rankInfo.current || 0))} pts to go</span>
                      </div>
                    </div>

                  {/* Ultimate Target */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm font-bold text-white">Ultimate Target - Rank #1</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Current Progress</div>
                        <div className="text-2xl font-bold text-white">
                          {Math.min((rankInfo.current / Math.max(rankInfo.rank1Points || 2054, 1)) * 100, 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Points Needed</div>
                        <div className="text-2xl font-bold text-white">
                          {leaderboardMeta?.pointsToBeatRank1
                            ? leaderboardMeta.pointsToBeatRank1
                            : Math.max(0, (rankInfo.rank1Points || 2054) - rankInfo.current + 1)}
                        </div>
                      </div>
                    </div>
                    <div className="relative w-full h-2 bg-gray-900 rounded-full overflow-hidden border border-white/10 mt-3">
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full"
                        style={{ width: `${Math.min((rankInfo.current / Math.max(rankInfo.rank1Points || 2054, 1)) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Current Rank Badge */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">🏆</span>
                        <div>
                          <div className="text-2xl font-bold text-white">{rankInfo.name}</div>
                          <div className="text-xs text-gray-300">
                            {leaderboardMeta?.totalContributors
                              ? `Out of ${leaderboardMeta.totalContributors} contributors`
                              : `Top ${Math.ceil((1 - rankInfo.percentage / 100) * 100)}% of contributors`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Streak & Activity Card - Spans 3 columns - Only for Contributors */}
            {user.role === 'contributor' && (
              <div className="lg:col-span-3">
                <div className="h-full bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-3xl">🔥</span>
                    <div>
                      <h3 className="text-xl font-bold text-white">Streak</h3>
                      <p className="text-sm text-gray-400">Keep it going!</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                      <div className="text-xs text-gray-400 mb-2">Current Streak</div>
                      <div className="flex items-baseline gap-2">
                      <div className="text-5xl font-bold text-white">
                        {stats.streak?.current || 0}
                      </div>
                      <div className="text-xl text-gray-300">days</div>
                    </div>
                    {stats.streak?.current === 0 && (
                      <div className="text-xs text-gray-500 italic mt-1">No active streak</div>
                    )}
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                    <div className="text-xs text-gray-400 mb-2">Best Streak</div>
                    <div className="flex items-baseline gap-2">
                      <div className="text-3xl font-bold text-white">{stats.streak?.longest || 0}</div>
                      <div className="text-sm text-gray-300">days</div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    <div className="mb-1">Contribution Range</div>
                    <div className="font-mono text-gray-400">
                      Start: {new Date('2026-01-01T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Project Admin Overview Card - Fills empty space */}
            {user.role === 'project-admin' && (
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-gradient-to-r from-violet-500/10 to-purple-600/10 backdrop-blur-sm rounded-2xl p-5 border border-white/15">
                  <div className="flex items-center gap-2 md:gap-3 flex-nowrap w-full">
                    {!adminRankLoading && adminRank && adminRank.configured === false && (
                      <span className="shrink-0 text-[11px] uppercase tracking-[0.18em] rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-100 px-3 py-1">
                        Not configured
                      </span>
                    )}

                    <div className="flex items-center gap-2 md:gap-3 flex-nowrap w-full min-w-0">
                      <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-2 py-2 sm:px-3 sm:py-3 min-h-16 flex flex-col justify-center">
                        <div className="truncate text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-gray-400">Rank</div>
                        <div className="whitespace-nowrap mt-0.5 text-2xl sm:text-3xl font-extrabold leading-none text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-500">
                          {adminRankLoading ? '…' : adminRank?.rank ? `#${adminRank.rank}` : '—'}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-2 py-2 sm:px-3 sm:py-3 min-h-16 flex flex-col justify-center">
                        <div className="truncate text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-gray-400">Points</div>
                        <div className="whitespace-nowrap mt-0.5 text-xl sm:text-2xl font-bold leading-none text-white">
                          {adminRankLoading ? '…' : adminRank ? (adminRank.configured === false ? 0 : (adminRank.score ?? 0)) : '—'}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-2 py-2 sm:px-3 sm:py-3 min-h-16 flex flex-col justify-center">
                        <div className="truncate text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-gray-400">Curr Streak</div>
                        <div className="whitespace-nowrap mt-0.5 text-xl sm:text-2xl font-bold leading-none text-white">
                          {adminRankLoading ? '…' : adminRank ? (adminRank.streak?.current ?? 0) : '—'}
                          {!adminRankLoading && adminRank && (
                            <span className="ml-1" aria-hidden>
                              🔥
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-2 py-2 sm:px-3 sm:py-3 min-h-16 flex flex-col justify-center">
                        <div className="truncate text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-gray-400">Best Streak</div>
                        <div className="whitespace-nowrap mt-0.5 text-xl sm:text-2xl font-bold leading-none text-white">
                          {adminRankLoading ? '…' : adminRank ? (adminRank.streak?.longest ?? 0) : '—'}
                          {!adminRankLoading && adminRank && (
                            <span className="ml-1" aria-hidden>
                              🏆
                            </span>
                          )}
                        </div>
                      </div>

                      <Link
                        href="/leaderboard/project-admin"
                        className="shrink-0 inline-flex items-center gap-2 justify-center text-center bg-white/10 hover:bg-white/15 text-white min-h-16 px-3 sm:px-4 rounded-2xl transition-all duration-300 border border-white/10 hover:border-white/30 whitespace-nowrap"
                        aria-label="Open PA Leaderboard"
                        title="PA Leaderboard"
                      >
                        <span className="text-lg" aria-hidden>
                          ↗
                        </span>
                        <span className="hidden sm:inline text-sm font-semibold">PA Leaderboard</span>
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
                    <div>
                      <h3 className="text-xl font-bold text-white">Projects</h3>
                      <p className="text-sm text-gray-400">Since Jan 1, 2026</p>
                    </div>
                    <div className="text-xs text-gray-400 sm:whitespace-nowrap">{projectProjectsCount} Projects</div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                      <div className="text-2xl font-bold text-white mb-1">{projectProjectsCount}</div>
                      <div className="text-xs text-gray-300 font-medium">Projects</div>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                      <div className="text-2xl font-bold text-white mb-1">{projectUniqueContributorsCount}</div>
                      <div className="text-xs text-gray-300 font-medium">Contributors</div>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                      <div className="text-2xl font-bold text-white mb-1">{projectStats.prsMerged || 0}</div>
                      <div className="text-xs text-gray-300 font-medium">Merged PRs</div>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                      <div className="text-2xl font-bold text-white mb-1">{projectStats.issuesOpen ?? 0}</div>
                      <div className="text-xs text-gray-300 font-medium">Open Issues</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                      <div className="text-sm font-bold text-white mb-2">Top contributors (since Jan 1, 2026)</div>
                      {projectContributorsList.length ? (
                        <div className="space-y-2">
                          {projectContributorsList.slice(0, 3).map((c, i) => (
                            <a
                              key={c.githubUsername}
                              href={`https://github.com/${c.githubUsername}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition"
                            >
                              <div
                                className="w-10 h-10 rounded-full bg-white/10 border border-white/10"
                                style={{
                                  backgroundImage: `url(https://github.com/${c.githubUsername}.png?size=80)`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                }}
                              />
                              <div className="min-w-0">
                                <div className="text-white font-semibold truncate">
                                  {i + 1}. @{c.githubUsername}
                                </div>
                                <div className="text-xs text-gray-400">{c.mergedPRs} merged PRs</div>
                              </div>
                              <div className="ml-auto text-xs text-blue-300 underline shrink-0">View</div>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">No contributor data yet.</div>
                      )}
                    </div>

                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                      <div className="text-sm font-bold text-white mb-2">Projects</div>
                      {projectProjectsList.length ? (
                        <div className="space-y-2">
                          {projectProjectsList.map((proj, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                              <div className="min-w-0">
                                <div className="text-white font-semibold truncate">{proj.name || 'Project'}</div>
                                {proj.repoUrl ? (
                                  <a
                                    href={proj.repoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-300 underline break-all"
                                  >
                                    {proj.repoUrl}
                                  </a>
                                ) : (
                                  <div className="text-xs text-gray-500">Repo not available</div>
                                )}

                                {(() => {
                                  const langs = Array.isArray(proj?.languages) ? proj.languages : [];
                                  const stack = Array.isArray(proj?.techStackUsed) ? proj.techStackUsed : [];
                                  const tags = Array.from(new Set([...langs, ...stack].map((t) => String(t).trim()).filter(Boolean)));
                                  if (!tags.length) return null;
                                  return (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {tags.slice(0, 6).map((tag) => (
                                        <span
                                          key={tag}
                                          className="px-2 py-0.5 bg-white/10 border border-white/10 text-gray-200 rounded-full text-[11px] font-semibold"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </div>
                              <div className="text-xs text-gray-300 sm:whitespace-nowrap shrink-0">{proj.mergedCount || 0} PRs</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">No project data found.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stats Grid - Role Specific */}
          {user.role === 'contributor' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div className="group relative">
                <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div className="bg-white/10 p-3 rounded-xl">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-xs font-bold text-gray-400">PRS</div>
                  </div>
                  <div className="text-4xl font-bold text-white mb-1">{stats.pullRequests?.merged || 0}</div>
                  <div className="text-sm text-gray-400">PRs Merged</div>
                  <div className="text-xs text-gray-500 mt-2">{stats.pullRequests?.total || 0} total submissions</div>
                </div>
              </div>

              <div className="group relative">
                <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-white/10 p-3 rounded-xl">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="text-xs font-bold text-gray-400">ISSUES</div>
                  </div>
                  <div className="text-4xl font-bold text-white mb-1">{stats.issues?.resolved || 0}</div>
                  <div className="text-sm text-gray-400">Issues Resolved</div>
                  <div className="text-xs text-gray-500 mt-2">Closed issues</div>
                </div>
              </div>

              <div className="group relative">
                <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-white/10 p-3 rounded-xl">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <div className="text-xs font-bold text-gray-400">PROJECTS</div>
                  </div>
                  <div className="text-4xl font-bold text-white mb-1">{stats.projectsContributed || 0}</div>
                  <div className="text-sm text-gray-400">Projects</div>
                  <div className="text-xs text-gray-500 mt-2">Contributed to</div>
                </div>
              </div>
            </div>
          )}

          {/* Mentor Stats Grid */}
          {user.role === 'mentor' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div className="group relative">
                <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-white/10 p-3 rounded-xl">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div className="text-xs font-bold text-gray-400">MENTORED</div>
                  </div>
                  <div className="text-4xl font-bold text-white mb-1">{mentorStats.contributorsMentored || 0}</div>
                  <div className="text-sm text-gray-400">Contributors</div>
                  <div className="text-xs text-gray-500 mt-2">Currently mentoring</div>
                </div>
              </div>

              <div className="group relative">
                <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-white/10 p-3 rounded-xl">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <div className="text-xs font-bold text-gray-400">SESSIONS</div>
                  </div>
                  <div className="text-4xl font-bold text-white mb-1">{mentorStats.sessionsConducted || 0}</div>
                  <div className="text-sm text-gray-400">Sessions</div>
                  <div className="text-xs text-gray-500 mt-2">Completed</div>
                </div>
              </div>

              <div className="group relative">
                <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-white/10 p-3 rounded-xl">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-xs font-bold text-gray-400">REVIEWS</div>
                  </div>
                  <div className="text-4xl font-bold text-white mb-1">{mentorStats.prsReviewed || 0}</div>
                  <div className="text-sm text-gray-400">PRs Reviewed</div>
                  <div className="text-xs text-gray-500 mt-2">Total reviews</div>
                </div>
              </div>
            </div>
          )}

          {/* Project Admin Stats Grid */}
          {user.role === 'project-admin' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="group relative">
                <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-white/10 p-3 rounded-xl">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <div className="text-xs font-bold text-gray-400">PROJECTS</div>
                  </div>
                  <div className="text-4xl font-bold text-white mb-1">{projectStats.projectsManaged || 0}</div>
                  <div className="text-sm text-gray-400">Projects Managed</div>
                  <div className="text-xs text-gray-500 mt-2">Active projects</div>
                </div>
              </div>

              <div className="group relative">
                <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-white/10 p-3 rounded-xl">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="text-xs font-bold text-gray-400">CONTRIBUTORS</div>
                  </div>
                  <div className="text-4xl font-bold text-white mb-1">{projectStats.totalContributors || 0}</div>
                  <div className="text-sm text-gray-400">Contributors</div>
                  <div className="text-xs text-gray-500 mt-2">Across all projects</div>
                </div>
              </div>

              <div className="group relative">
                <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-white/10 p-3 rounded-xl">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <div className="text-xs font-bold text-gray-400">PRS</div>
                  </div>
                  <div className="text-4xl font-bold text-white mb-1">{projectStats.prsMerged || 0}</div>
                  <div className="text-sm text-gray-400">PRs Merged</div>
                  <div className="text-xs text-gray-500 mt-2">In your projects</div>
                </div>
              </div>

              <div className="group relative">
                <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-white/10 p-3 rounded-xl">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="text-xs font-bold text-gray-400">ISSUES</div>
                  </div>
                  <div className="text-4xl font-bold text-white mb-1">{projectStats.issuesResolved || 0}</div>
                  <div className="text-sm text-gray-400">Issues Resolved</div>
                  <div className="text-xs text-gray-500 mt-2">Open issues: {projectStats.issuesOpen ?? 0}</div>
                </div>
              </div>
            </div>
          )}

          {/* Project Admin Projects & Contributors */}
          {user.role === 'project-admin' && (
            <div className="space-y-6 mb-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white">Contributors</h3>
                    <p className="text-sm text-gray-400">Across your projects since Jan 1, 2026</p>
                  </div>
                  <div className="text-xs text-gray-400 sm:whitespace-nowrap">{projectUniqueContributorsCount} Contributors</div>
                </div>

                {projectContributorsList.length ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {projectContributorsList.map((c) => (
                      <a
                        key={c.githubUsername}
                        href={`https://github.com/${c.githubUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition"
                        title={`@${c.githubUsername} · ${c.mergedPRs} merged PRs`}
                      >
                        <div
                          className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex-shrink-0"
                          style={{
                            backgroundImage: `url(https://github.com/${c.githubUsername}.png?size=80)`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-white truncate">@{c.githubUsername}</div>
                          <div className="text-[11px] text-gray-400 truncate">{c.mergedPRs} merged PRs</div>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No contributors yet.</div>
                )}
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <h3 className="text-2xl font-bold text-white">Merged PRs (since Jan 1, 2026)</h3>
                    <p className="text-sm text-gray-400"> DSoC26-labeled Merged PRs of your project</p>
                  </div>
                  <div className="text-xs text-gray-400 sm:whitespace-nowrap">{mergedPrTotal} PRs</div>
                </div>

                {mergedPrTotal ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="text-xs text-gray-400 font-semibold">
                        Showing {mergedPrStartIndex + 1}-{Math.min(mergedPrStartIndex + MERGED_PRS_PER_PAGE, mergedPrTotal)} of {mergedPrTotal}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setMergedPrPage((p) => Math.max(1, p - 1))}
                          disabled={mergedPrPageSafe <= 1}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                            mergedPrPageSafe <= 1
                              ? 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed'
                              : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20'
                          }`}
                        >
                          Prev
                        </button>
                        <div className="text-xs text-gray-400 font-semibold sm:whitespace-nowrap">
                          Page {mergedPrPageSafe} / {mergedPrTotalPages}
                        </div>
                        <button
                          type="button"
                          onClick={() => setMergedPrPage((p) => Math.min(mergedPrTotalPages, p + 1))}
                          disabled={mergedPrPageSafe >= mergedPrTotalPages}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                            mergedPrPageSafe >= mergedPrTotalPages
                              ? 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed'
                              : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20'
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    </div>

                    {mergedPrPageList.map((pr, idx) => (
                      <div key={`${pr.prUrl || pr.title || 'pr'}-${idx}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <a
                              href={`https://github.com/${pr.contributor}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-xs text-white"
                              style={{ backgroundImage: `url(https://github.com/${pr.contributor}.png?size=80)`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                            ></a>
                            <div>
                              <div className="text-white font-semibold text-sm">{pr.title || 'Pull request'}</div>
                              <div className="text-xs text-gray-400">@{pr.contributor}</div>
                              <div className="text-xs text-gray-500">{pr.repository}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-300">
                            {pr.mergedAt && <span>{new Date(pr.mergedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white text-xs">
                              {pr.points || 0} pts
                            </span>
                            {pr.level && <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white text-xs uppercase">{pr.level}</span>}
                            {pr.prUrl && (
                              <a href={pr.prUrl} target="_blank" rel="noopener noreferrer" className="text-blue-300 underline">
                                View PR
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No merged PRs found.</div>
                )}
              </div>

              {BonusPointsPanel}
            </div>
          )}

          {/* Contribution Activity & PR Distribution - Only for Contributors */}
          {user.role === 'contributor' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Contribution Activity Graph */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Contribution Activity</h3>
                  <p className="text-sm text-gray-400">Since Jan 1, 2026</p>
                </div>
                <span className="text-xs text-gray-500 font-mono bg-white/5 px-3 py-1 rounded-lg">Start: Jan 1, 2026</span>
              </div>
              
              <div className="relative h-48">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 800 180"
                  preserveAspectRatio="none"
                  onMouseMove={(e) => {
                    if (!contributionData.length) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const ratio = rect.width ? x / rect.width : 0;
                    const idx = Math.max(0, Math.min(contributionData.length - 1, Math.round(ratio * (contributionData.length - 1))));
                    setActiveGraphIndex(idx);
                  }}
                  onMouseLeave={() => setActiveGraphIndex(null)}
                  onClick={() => {
                    if (activeGraphIndex === null && contributionData.length) setActiveGraphIndex(contributionData.length - 1);
                  }}
                >
                  {/* Grid lines */}
                  {[0, 1, 2, 3, 4].map((i) => (
                    <line key={i} x1="0" y1={20 + i * 40} x2="800" y2={20 + i * 40} stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4 4" />
                  ))}
                  
                  {/* Area gradient */}
                  <defs>
                    <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>
                  
                  {/* Area fill */}
                  <path
                    d={`M 0 160 ${contributionData.map((d, i) => {
                      const x = contributionData.length === 1 ? 0 : (i / (contributionData.length - 1)) * 800;
                      const maxValue = Math.max(...contributionData.map(d => d.value), 1);
                      const y = 160 - ((d.value / maxValue) * 140);
                      return `L ${x} ${y}`;
                    }).join(' ')} L 800 160 Z`}
                    fill="url(#areaGradient)"
                  />
                  
                  {/* Line */}
                  <path
                    d={contributionData.map((d, i) => {
                      const x = contributionData.length === 1 ? 0 : (i / (contributionData.length - 1)) * 800;
                      const maxValue = Math.max(...contributionData.map(d => d.value), 1);
                      const y = 160 - ((d.value / maxValue) * 140);
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Active marker */}
                  {activeGraphIndex !== null && contributionData[activeGraphIndex] && (() => {
                    const i = activeGraphIndex;
                    const x = contributionData.length === 1 ? 0 : (i / (contributionData.length - 1)) * 800;
                    const maxValue = Math.max(...contributionData.map(d => d.value), 1);
                    const y = 160 - ((contributionData[i].value / maxValue) * 140);
                    return <circle cx={x} cy={y} r="7" fill="#a855f7" stroke="white" strokeWidth="2" />;
                  })()}
                  
                  {/* Dots on peaks */}
                  {contributionData.map((d, i) => {
                    if (i % 10 === 0) {
                      const x = contributionData.length === 1 ? 0 : (i / (contributionData.length - 1)) * 800;
                      const maxValue = Math.max(...contributionData.map(d => d.value), 1);
                      const y = 160 - ((d.value / maxValue) * 140);
                      return <circle key={i} cx={x} cy={y} r="4" fill="#a855f7" stroke="white" strokeWidth="2" />;
                    }
                    return null;
                  })}
                </svg>

                {activeGraphIndex !== null && contributionData[activeGraphIndex] && (
                  <div className="absolute top-3 left-3 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200">
                    <div className="font-semibold text-white">{contributionData[activeGraphIndex].date}</div>
                    <div className="text-gray-300">PRs: {contributionData[activeGraphIndex].prs || 0}</div>
                    <div className="text-gray-300">Points: {contributionData[activeGraphIndex].value || 0}</div>
                  </div>
                )}
              </div>
              
              {/* X-axis labels */}
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>{contributionData[0]?.date || 'Start'}</span>
                <span>{contributionData[Math.floor(contributionData.length / 2)]?.date || 'Mid'}</span>
                <span>{contributionData[contributionData.length - 1]?.date || 'Today'}</span>
              </div>
            </div>

            {/* PR Distribution Chart */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">PR Distribution</h3>
                  <p className="text-sm text-gray-400">By difficulty level</p>
                </div>
                <div className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-lg">
                  {(prDistribution.level1 + prDistribution.level2 + prDistribution.level3)} total
                </div>
              </div>

              <div className="relative h-48 flex items-stretch justify-center gap-10 px-2">
                {[
                  { label: 'L1', value: prDistribution.level1, points: '3 pts', color: 'from-blue-400 to-blue-500' },
                  { label: 'L2', value: prDistribution.level2, points: '7 pts', color: 'from-blue-500 to-purple-500' },
                  { label: 'L3', value: prDistribution.level3, points: '10 pts', color: 'from-purple-500 to-purple-600' },
                ].map((item, index) => {
                  const maxValue = Math.max(...Object.values(prDistribution), 1);
                  const rawHeight = (item.value / maxValue) * 100;
                  const height = item.value === 0 ? 4 : Math.max(rawHeight, 10);
                  
                  return (
                    <div key={index} className="w-24 self-stretch flex flex-col items-center justify-end group">
                      <div className="w-full h-full bg-white/5 border border-white/10 rounded-xl overflow-hidden flex items-end">
                        <div
                          className={`w-full bg-gradient-to-t ${item.color} rounded-t-xl relative transition-all duration-300 group-hover:brightness-110`}
                          style={{ height: `${height}%` }}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-sm font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 px-2 py-1 rounded whitespace-nowrap">
                            {item.value} PRs
                          </div>
                          <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-bold text-white">
                            {item.value}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 text-center">
                        <div className="text-sm font-bold text-white">{item.label}</div>
                        <div className="text-xs text-gray-400">{item.points}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          )}

          {/* Badges Showcase */}
          {/* <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/10 hover:border-white/20 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-3 rounded-xl">
                <span className="text-2xl">🏅</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Earned Badges</h3>
                <p className="text-sm text-gray-400">Your achievements and milestones</p>
              </div>
            </div>

            {user.badges && user.badges.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {user.badges.map((badge, index) => (
                  <div
                    key={index}
                    className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-110 hover:-translate-y-2 cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative text-center">
                      <div className="text-5xl mb-2">{badge.icon || '🏆'}</div>
                      <div className="text-xs font-bold text-white mb-1">{badge.name.replace(' Badge', '')}</div>
                      <div className="text-[10px] text-gray-400 line-clamp-2">{badge.description}</div>
                      {badge.earnedAt && (
                        <div className="text-[9px] text-gray-500 mt-1 font-mono">
                          {new Date(badge.earnedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-700/30 text-center"
                  >
                    <div className="text-4xl mb-2 opacity-30 grayscale">🔒</div>
                    <div className="text-xs font-bold text-gray-500">Locked</div>
                    <div className="text-[10px] text-gray-600 mt-1">Keep contributing!</div>
                  </div>
                ))}
              </div>
            )}
          </div> */}

          {/* Pull Requests List - Enhanced Dark Theme */}
          {user.role === 'contributor' && user.contributions && user.contributions.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/10 hover:border-white/20 transition-all duration-300">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Pull Requests</h3>
                  <p className="text-gray-400 text-sm">Track all your contributions and their status</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="px-4 py-2 bg-white/10 border border-white/20 text-gray-300 rounded-lg text-xs font-semibold hover:bg-white/20 transition">
                    Needs Attention (0)
                  </button>
                  <button className="px-3 py-2 bg-white/10 border border-white/20 text-gray-300 rounded-lg text-xs font-semibold hover:bg-white/20 transition">
                    3 pts (0)
                  </button>
                  <button className="px-3 py-2 bg-white/10 border border-white/20 text-gray-300 rounded-lg text-xs font-semibold hover:bg-white/20 transition">
                    7 pts (0)
                  </button>
                  <button className="px-3 py-2 bg-white/10 border border-white/20 text-gray-300 rounded-lg text-xs font-semibold hover:bg-white/20 transition">
                    10 pts ({user.contributions.filter(c => c.points === 10).length})
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-400 mb-4 font-semibold">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>{prTotal} PRs found</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPrPage(p => Math.max(1, p - 1))}
                      disabled={prPageSafe <= 1}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        prPageSafe <= 1
                          ? 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed'
                          : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      Prev
                    </button>
                    <div className="text-xs text-gray-400 font-semibold whitespace-nowrap">
                      Page {prPageSafe} / {prTotalPages}
                    </div>
                    <button
                      type="button"
                      onClick={() => setPrPage(p => Math.min(prTotalPages, p + 1))}
                      disabled={prPageSafe >= prTotalPages}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        prPageSafe >= prTotalPages
                          ? 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed'
                          : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {prPageList.map((contribution, index) => (
                  <a
                    key={index}
                    href={contribution.prUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                          {ordinal(prStartIndex + index + 1)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-2">
                          <h4 className="font-bold text-white group-hover:text-gray-300 transition truncate">
                            {contribution.title || 'Contribution'}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-3 py-1 bg-white/10 border border-white/20 text-white rounded-full text-xs font-bold whitespace-nowrap">
                              ✓ {contribution.points || 0} Points
                            </span>
                            <span className="px-3 py-1 bg-white/10 border border-white/20 text-white rounded-full text-xs font-bold whitespace-nowrap">
                              {getLevelLabel(contribution)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {new Date(contribution.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          {contribution.mergedAt && (
                            <span className="flex items-center gap-1 text-green-400">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Merged {new Date(contribution.mergedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                          {contribution.repository && (
                            <span className="font-semibold text-gray-400">{contribution.repository}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {user.role === 'contributor' && BonusPointsPanel}

          {/* Mentor Stats Section */}
          {user.role === 'mentor' && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/10 hover:border-white/20 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-3 rounded-xl">
                  <span className="text-2xl">👨‍🏫</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Mentorship Overview</h3>
                  <p className="text-sm text-gray-400">Your impact as a mentor</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-white/10 p-2 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div className="text-sm text-gray-400">Contributors Mentored</div>
                  </div>
                  <div className="text-4xl font-bold text-white">{mentorStats.contributorsMentored || 0}</div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-white/10 p-2 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <div className="text-sm text-gray-400">Sessions Conducted</div>
                  </div>
                  <div className="text-4xl font-bold text-white">{mentorStats.sessionsConducted || 0}</div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-white/10 p-2 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-sm text-gray-400">PRs Reviewed</div>
                  </div>
                  <div className="text-4xl font-bold text-white">{mentorStats.prsReviewed || 0}</div>
                </div>
              </div>

              {mentorStats.contributorsList && mentorStats.contributorsList.length > 0 && (
                <div>
                  <h4 className="text-lg font-bold text-white mb-4">Mentored Contributors</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {mentorStats.contributorsList.map((contributor, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {contributor.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-white">{contributor.name}</div>
                          <div className="text-xs text-gray-400">@{contributor.username}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Selection Status Banners - Enhanced */}
          {!user.isSelected && user.applicationId && (
            <div className="bg-yellow-900/20 backdrop-blur-sm border-l-4 border-yellow-500 p-6 rounded-2xl mb-6 border border-yellow-500/20">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <svg className="h-6 w-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-yellow-300 mb-2">Application Under Review</h3>
                  <p className="text-yellow-200 mb-1">
                    Your application status: <span className="font-bold capitalize bg-yellow-500/20 px-2 py-0.5 rounded">{user.applicationId.status}</span>
                  </p>
                  <p className="text-yellow-100/80 text-sm">
                    You&apos;ll be notified once your application is reviewed. Check back soon!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* {user.isSelected && user.selectionDate && (
            <div className="bg-green-900/20 backdrop-blur-sm border-l-4 border-green-500 p-6 rounded-2xl mb-6 border border-green-500/20">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center animate-pulse">
                    <svg className="h-6 w-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-green-300 mb-2">🎉 Congratulations! You&apos;re Selected!</h3>
                  <p className="text-green-200">
                    Selected on <span className="font-bold">{new Date(user.selectionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </p>
                </div>
              </div>
            </div>
          )} */}

          {/* ID Card Section - Enhanced */}
          {user.isSelected && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/10 hover:border-white/20 transition-all duration-300">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="text-3xl">🎫</span>
                Your DSoC ID Card
              </h3>
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-4 rounded-2xl">
                    <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg mb-1">Official DSoC 2026 ID Card</h4>
                    <p className="text-sm text-gray-300">View or download your digital credential</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <a
                    href={`/id-card/view/${user.username}`}
                    className="px-6 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white rounded-xl font-bold hover:bg-white/20 transition-all hover:scale-105"
                  >
                     View ID
                  </a>
                  <button
                    onClick={handleDownloadIDCard}
                    disabled={downloading}
                    className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-bold hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                  >
                    {downloading ? '⏳ Downloading...' : '⬇️ Download'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tech Stack - Enhanced */}
          {user.techStack && user.techStack.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/10 hover:border-white/20 transition-all duration-300">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="text-3xl">⚡</span>
                Tech Stack
              </h3>
              <div className="flex flex-wrap gap-3">
                {user.techStack.map((tech, index) => (
                  <span
                    key={index}
                    className="group relative px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/40 rounded-xl text-sm font-bold text-white transition-all duration-300 hover:scale-110"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity - Enhanced Dark Theme */}
          {user.activities && user.activities.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/10 hover:border-white/20 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-3 rounded-xl">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Recent Activity</h3>
                  <p className="text-sm text-gray-400">Your latest contributions and achievements</p>
                </div>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {user.activities.slice(0, 10).map((activity, index) => (
                  <div key={index} className="group flex items-start gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all duration-300">
                    <div className="flex-shrink-0 w-3 h-3 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full mt-1.5 group-hover:animate-pulse"></div>
                    <div className="flex-1">
                      <div className="text-white font-semibold mb-1">{activity.description}</div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {activity.points && (
                          <span className="px-2 py-0.5 bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-white/20 text-white rounded-full font-bold">
                            +{activity.points} pts
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State for New Users */}
          {(!user.activities || user.activities.length === 0) && 
           (!user.badges || user.badges.length === 0) && (
            user.role === 'project-admin' ? (
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-10 border border-white/10 mb-10">
                <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white">Project Admin Hub</h3>
                    <p className="text-sm text-gray-400">Since Jan 1, 2026</p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {projectProjectsCount} Projects · {projectUniqueContributorsCount} Contributors · {projectStats.prsMerged || 0} Merged PRs
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <div className="text-sm font-semibold text-white mb-2">Top contributors</div>
                      {projectContributorsList.length ? (
                        <div className="space-y-2">
                          {projectContributorsList.slice(0, 3).map((c, i) => (
                            <div key={c.githubUsername} className="flex items-center justify-between gap-3">
                              <a
                                href={`https://github.com/${c.githubUsername}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-300 hover:text-white transition truncate"
                                title={`@${c.githubUsername}`}
                              >
                                {i + 1}. @{c.githubUsername}
                              </a>
                              <div className="text-xs text-gray-400 whitespace-nowrap">
                                {c.mergedPRs} PRs
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">No data yet</div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">Since Jan 1, 2026 · Based on merged PRs</div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="text-sm font-semibold text-white mb-2">Project links</div>
                    {projectProjectsList.length ? (
                      <div className="space-y-2">
                        {projectProjectsList.slice(0, 3).map((proj, i) => (
                          <div key={i} className="text-sm">
                            {proj.repoUrl ? (
                              <a
                                href={proj.repoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-300 underline break-all"
                              >
                                {proj.name || 'Project'}
                              </a>
                            ) : (
                              <div className="text-gray-500">{proj.name || 'Project'}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">No projects found.</div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="text-sm font-semibold text-white mb-2">Tip</div>
                    <div className="text-sm text-gray-300">Merge PRs with the DSoC26 label to get counted.</div>
                    <div className="text-xs text-gray-500 mt-2">This replaces the generic empty state.</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-16 text-center border border-white/10">
                <div className="text-8xl mb-6">🚀</div>
                <h3 className="text-3xl font-bold text-white mb-3">Just Getting Started</h3>
                <p className="text-gray-300 text-lg max-w-md mx-auto">
                  {user.isSelected 
                    ? "Start contributing to projects and your stats will appear here!"
                    : "Once selected, your contributions and achievements will be tracked here."}
                </p>
              </div>
            )
          )}
        </div>

        <Footer />
      </div>
      
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}
