'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

function LeaderboardContent() {
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);
  const [now, setNow] = useState(new Date());
  const [useDummy, setUseDummy] = useState(false);
  const [urlReady, setUrlReady] = useState(false);
  const [activeHistoryUser, setActiveHistoryUser] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [historyTab, setHistoryTab] = useState('prs');
  const [bonusLoading, setBonusLoading] = useState(false);
  const [bonusError, setBonusError] = useState(null);
  const [bonusInfo, setBonusInfo] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 30, total: 0, totalPages: 1, hasPrev: false, hasNext: false });

  const getDummyUsers = () => {
    const dummy = [
      {
        _id: 'dummy-1',
        rank: 1,
        name: 'Dinesh',
        username: 'dinesh2047',
        githubUsername: 'dinesh2047',
        linkedin: 'https://www.linkedin.com/in/dinesh2047',
        prHistory: [
          {
            level: 'L1',
            prUrl: 'https://github.com/example/repo/pull/1',
            prTitle: 'Example PR (dummy)'
          }
        ],
        stats: {
          totalPoints: 420,
          pullRequests: { merged: 18, open: 3, closed: 5 },
          issues: { open: 2, closed: 14 },
          projectsContributed: 6,
        },
      },
      {
        _id: 'dummy-2',
        rank: 2,
        name: 'Dinesh',
        username: 'dinesh2047',
        githubUsername: 'dinesh2047',
        linkedin: 'https://www.linkedin.com/in/dinesh2047',
        prHistory: [
          {
            level: 'L2',
            prUrl: 'https://github.com/example/repo/pull/2',
            prTitle: 'Example PR (dummy)'
          }
        ],
        stats: {
          totalPoints: 360,
          pullRequests: { merged: 14, open: 2, closed: 4 },
          issues: { open: 1, closed: 11 },
          projectsContributed: 5,
        },
      },
      {
        _id: 'dummy-3',
        rank: 3,
        name: 'Dinesh',
        username: 'dinesh2047',
        githubUsername: 'dinesh2047',
        linkedin: 'https://www.linkedin.com/in/dinesh2047',
        prHistory: [
          {
            level: 'L1',
            prUrl: 'https://github.com/example/repo/pull/3',
            prTitle: 'Example PR (dummy)'
          }
        ],
        stats: {
          totalPoints: 310,
          pullRequests: { merged: 12, open: 4, closed: 2 },
          issues: { open: 3, closed: 9 },
          projectsContributed: 4,
        },
      },
      {
        _id: 'dummy-4',
        rank: 4,
        name: 'Dinesh',
        username: 'dinesh2047',
        githubUsername: 'dinesh2047',
        linkedin: 'https://www.linkedin.com/in/dinesh2047',
        prHistory: [
          {
            level: 'L3',
            prUrl: 'https://github.com/example/repo/pull/4',
            prTitle: 'Example PR (dummy)'
          }
        ],
        stats: {
          totalPoints: 260,
          pullRequests: { merged: 9, open: 1, closed: 6 },
          issues: { open: 0, closed: 8 },
          projectsContributed: 3,
        },
      },
      {
        _id: 'dummy-5',
        rank: 5,
        name: 'Dinesh',
        username: 'dinesh2047',
        githubUsername: 'dinesh2047',
        linkedin: 'https://www.linkedin.com/in/dinesh2047',
        prHistory: [
          {
            level: 'L2',
            prUrl: 'https://github.com/example/repo/pull/5',
            prTitle: 'Example PR (dummy)'
          }
        ],
        stats: {
          totalPoints: 210,
          pullRequests: { merged: 7, open: 2, closed: 1 },
          issues: { open: 2, closed: 5 },
          projectsContributed: 2,
        },
      },
    ];

    return dummy;
  };
  useEffect(() => {
    const readDummyFromUrl = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        setUseDummy(params.get('dummy') === '1');
      } catch {
        setUseDummy(false);
      }
    };

    readDummyFromUrl();
    setUrlReady(true);

    const onPopState = () => readDummyFromUrl();
    window.addEventListener('popstate', onPopState);

    // Patch history methods so client-side navigation updates dummy mode.
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    const notify = () => window.dispatchEvent(new Event('ecwoc:locationchange'));
    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      notify();
    };
    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      notify();
    };

    window.addEventListener('ecwoc:locationchange', readDummyFromUrl);

    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('ecwoc:locationchange', readDummyFromUrl);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setActiveHistoryUser(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!urlReady) return;

    let active = true;
    const isActive = () => active;

    if (useDummy) {
      const dummyUsers = getDummyUsers();
      setUsers(dummyUsers);
      setSummary(computeSummary(dummyUsers));
      setUpdatedAt(new Date());
      setPagination({
        page: 1,
        limit: 30,
        total: dummyUsers.length,
        totalPages: 1,
        hasPrev: false,
        hasNext: false,
      });
      setLoading(false);
      return () => {
        active = false;
      };
    }

    const controller = new AbortController();
    fetchLeaderboard({ signal: controller.signal, isActive, page, q: debouncedSearch });

    return () => {
      active = false;
      controller.abort();
    };
  }, [useDummy, urlReady, page, debouncedSearch]);

  useEffect(() => {
    const next = searchTerm.trim();
    const id = setTimeout(() => {
      setDebouncedSearch((prev) => (prev === next ? prev : next));
    }, 900);
    return () => clearTimeout(id);
  }, [searchTerm]);

  useEffect(() => {
    // When searching real data, restart from page 1.
    if (!useDummy) setPage(1);
  }, [debouncedSearch, useDummy]);

  useEffect(() => {
    // When switching from dummy to real data, restart from page 1.
    if (!useDummy) setPage(1);
  }, [useDummy]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const computeSummary = (list) => {
    const totalUsers = list.length;
    const totalPoints = list.reduce((sum, u) => sum + (u.stats?.totalPoints || 0), 0);
    const totalPRsMerged = list.reduce((sum, u) => sum + (u.stats?.pullRequests?.merged || 0), 0);
    return { totalUsers, totalPoints, totalPRsMerged };
  };

  const formatIST = (value) => {
    if (!value) return '----';
    return new Date(value).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const fetchLeaderboard = async ({ signal, isActive, page: pageArg, q } = {}) => {
    try {
      setLoading(true);
      // Fetch contributor leaderboard only; other role tabs were removed
      const pageToFetch = pageArg || 1;
      const qParam = q ? `&q=${encodeURIComponent(q)}` : '';
      const res = await fetch(`/api/leaderboard?role=contributor&page=${pageToFetch}&limit=30${qParam}`, { signal });
      const data = await res.json();

      if (signal?.aborted) return;
      if (isActive && !isActive()) return;

      if (res.ok && Array.isArray(data.users)) {
        setUsers(data.users);
        setSummary(data.summary || computeSummary(data.users));
        setPagination(
          data.pagination || {
            page: pageToFetch,
            limit: 30,
            total: data.users.length,
            totalPages: 1,
            hasPrev: pageToFetch > 1,
            hasNext: false,
          }
        );
        setUpdatedAt(data.updatedAt ? new Date(data.updatedAt) : null);
      } else {
        setUsers([]);
        setSummary((prev) => prev || computeSummary([]));
        setPagination({ page: pageToFetch, limit: 30, total: 0, totalPages: 1, hasPrev: pageToFetch > 1, hasNext: false });
        setUpdatedAt((prev) => prev);
      }
    } catch (error) {
      if (error?.name === 'AbortError') return;
      console.error('Error fetching leaderboard:', error);
      setUsers([]);
      setSummary((prev) => prev || computeSummary([]));
      setPagination({ page: pageArg || 1, limit: 30, total: 0, totalPages: 1, hasPrev: (pageArg || 1) > 1, hasNext: false });
      setUpdatedAt((prev) => prev);
    } finally {
      if (signal?.aborted) return;
      if (isActive && !isActive()) return;
      setLoading(false);
    }
  };

  const openHistory = async (user) => {
    if (!user) return;
    setHistoryError(null);
    setHistoryTab('prs');
    setBonusError(null);
    setBonusInfo(null);

    // Dummy mode already includes PR history in-memory.
    if (useDummy) {
      setActiveHistoryUser(user);
      return;
    }

    const gh = String(user.githubUsername || user.username || '').trim();
    // Open modal immediately with whatever we have, then hydrate with full history.
    setActiveHistoryUser({
      ...user,
      prHistory: Array.isArray(user.prHistory) ? user.prHistory : [],
    });

    if (!gh) return;

    const ghKey = gh.toLowerCase();
    setHistoryLoading(true);
    setBonusLoading(true);
    try {
      fetch(`/api/leaderboard/bonus?github=${encodeURIComponent(gh)}&limit=200`)
        .then((r) => r.json().then((j) => ({ ok: r.ok, data: j })))
        .then(({ ok, data }) => {
          if (ok && data?.success) {
            setBonusInfo({
              total: data?.total || 0,
              count: data?.count || 0,
              entries: Array.isArray(data?.entries) ? data.entries : [],
            });
          } else {
            setBonusError(data?.message || 'Failed to load bonus points.');
          }
        })
        .catch(() => setBonusError('Failed to load bonus points.'))
        .finally(() => setBonusLoading(false));

      const res = await fetch(
        `/api/leaderboard?role=contributor&github=${encodeURIComponent(gh)}&limit=1&prLimit=5000`
      );
      const data = await res.json();
      if (res.ok && Array.isArray(data.users) && data.users[0]) {
        const nextUser = data.users[0];
        setActiveHistoryUser((prev) => {
          const prevKey = String(prev?.githubUsername || prev?.username || '').toLowerCase();
          if (!prev || prevKey !== ghKey) return prev;
          return nextUser;
        });
      } else {
        setHistoryError(data?.error || 'Failed to load PR history.');
      }
    } catch (error) {
      console.error('Error fetching PR history:', error);
      setHistoryError('Failed to load PR history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const getRankIcon = (rank) => String(rank);

  const getRankColor = (rank) => {
    if (rank === 1) return 'from-yellow-400 to-yellow-600';
    if (rank === 2) return 'from-gray-300 to-gray-500';
    if (rank === 3) return 'from-orange-400 to-orange-600';
    return 'from-violet-500 to-purple-500';
  };

  const filteredUsers = useMemo(() => {
    // Dummy mode keeps local filtering. Real mode searches server-side across all pages.
    if (!useDummy) return users;
    const q = searchTerm.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const rankMatch = String(u.rank || '').toLowerCase().includes(q);
      const nameMatch = (u.name || '').toLowerCase().includes(q);
      const userMatch = (u.username || '').toLowerCase().includes(q);
      return rankMatch || nameMatch || userMatch;
    });
  }, [users, searchTerm, useDummy]);

  const podium = useMemo(() => filteredUsers.slice(0, 3), [filteredUsers]);
  const topPoints = useMemo(() => {
    if (!filteredUsers.length) return 1;
    return Math.max(...filteredUsers.map((u) => u?.stats?.totalPoints || 0), 1);
  }, [filteredUsers]);

  const formatNum = (value) => (value ? value.toLocaleString() : '0');

  return (
    <div className="relative min-h-screen bg-black text-gray-100 overflow-x-hidden">
      {activeHistoryUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 pt-24 pb-4 sm:pt-25"
          role="dialog"
          aria-modal="true"
          aria-label="Pull request history"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setActiveHistoryUser(null);
          }}
        >
          <div className="w-full max-w-2xl max-h-[calc(100vh-8rem)] rounded-2xl border border-white/10 bg-black/80 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex flex-col">
                <div className="text-xs uppercase tracking-[0.2em] text-gray-400">
                  {historyTab === 'bonus' ? 'Bonus Points' : 'Pull Requests'}
                </div>
                <div className="text-lg font-semibold text-white">
                  @{activeHistoryUser.githubUsername || activeHistoryUser.username || 'contributor'}
                </div>
                {historyLoading && (
                  <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-gray-400">Loading all PRs…</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHistoryTab('prs')}
                  className={`rounded-full px-3 py-2 text-xs uppercase tracking-[0.18em] border transition ${
                    historyTab === 'prs'
                      ? 'border-white/20 bg-white/10 text-white'
                      : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                  aria-pressed={historyTab === 'prs'}
                >
                  PRs
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryTab('bonus')}
                  className={`rounded-full px-3 py-2 text-xs uppercase tracking-[0.18em] border transition ${
                    historyTab === 'bonus'
                      ? 'border-white/20 bg-white/10 text-white'
                      : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                  aria-pressed={historyTab === 'bonus'}
                >
                  Bonus
                </button>
                <button
                  type="button"
                  onClick={() => setActiveHistoryUser(null)}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="px-6 py-5 flex-1 overflow-auto">
              {historyTab === 'prs' ? (
                <>
                  {historyError && (
                    <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                      {historyError}
                    </div>
                  )}
                  {Array.isArray(activeHistoryUser.prHistory) && activeHistoryUser.prHistory.length > 0 ? (
                    <div className="space-y-3">
                      {activeHistoryUser.prHistory.map((pr, idx) => (
                        <div key={`${pr.prUrl || 'pr'}-${idx}`} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm text-gray-200 font-semibold">
                                {idx + 1}:
                                <a
                                  href={pr.prUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-2 underline underline-offset-4 hover:text-white break-all"
                                >
                                  {pr.prUrl}
                                </a>
                              </div>
                              {pr.prTitle && <div className="text-xs text-gray-400 mt-1">{pr.prTitle}</div>}
                            </div>
                            {pr.level && (
                              <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-purple-200">
                                {pr.level}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-300 font-thin-custom">
                      {historyLoading ? 'Loading PR history…' : 'No PR history found.'}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {bonusError && (
                    <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                      {bonusError}
                    </div>
                  )}

                  <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-gray-400">Total Bonus Points</div>
                    <div className="mt-1 text-3xl font-bold text-purple-100">
                      {formatNum(
                        bonusInfo?.total ??
                          activeHistoryUser?.stats?.bonusPoints ??
                          0
                      )}
                    </div>
                    <div className="mt-1 text-xs text-gray-400">
                      {formatNum(bonusInfo?.count ?? 0)} entries
                    </div>
                  </div>

                  {Array.isArray(bonusInfo?.entries) && bonusInfo.entries.length > 0 ? (
                    <div className="space-y-3">
                      {bonusInfo.entries.map((b, idx) => (
                        <div
                          key={`${b?._id || 'bonus'}-${idx}`}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm text-gray-200 font-semibold break-words">
                                {b?.task || 'Bonus'}
                              </div>
                              {b?.reason ? (
                                <div className="text-xs text-gray-400 mt-1 break-words">{b.reason}</div>
                              ) : null}
                              {b?.createdAt ? (
                                <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500 mt-2">
                                  {new Date(b.createdAt).toLocaleString()}
                                </div>
                              ) : null}
                            </div>
                            <span
                              className={`shrink-0 rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${
                                (b?.points || 0) >= 0
                                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100'
                                  : 'border-red-500/20 bg-red-500/10 text-red-100'
                              }`}
                            >
                              {(b?.points || 0) >= 0 ? '+' : ''}
                              {b?.points || 0}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-300 font-thin-custom">
                      {bonusLoading ? 'Loading bonus points…' : 'No bonus points found.'}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden>
        <div className="absolute -top-24 left-10 h-72 w-72 bg-purple-600/30 blur-[110px]" />
        <div className="absolute top-10 right-10 h-64 w-64 bg-cyan-500/25 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-64 w-80 bg-indigo-500/20 blur-[140px]" />
      </div>

      <Navbar />
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-14 max-w-6xl">
        <div className="mb-12 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 md:p-10 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold-custom text-white leading-tight mb-3">
                DSoC 2026 <span className="italic text-indigo-500">Leaderboard.</span>
              </h1>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 shadow-inner">
                <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">Contributors</p>
                <p className="text-3xl font-bold text-white">{formatNum(summary?.totalUsers)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/20 to-blue-500/15 px-3 py-3 shadow-inner">
                <p className="text-[11px] uppercase tracking-[0.18em] text-gray-300">Total Points</p>
                <p className="text-3xl font-bold text-purple-100">{formatNum(summary?.totalPoints)}</p>
                {(() => {
                  const total = Number(summary?.totalPoints || 0) || 0;
                  const bonus = Number(summary?.totalBonusPoints || 0) || 0;
                  const base = Math.max(total - bonus, 0);

                  return (
                    <div className="mt-1 text-[11px] text-gray-300 space-y-0.5">
                      <p>
                        Base: <span className="text-gray-200 font-semibold">{formatNum(base)}</span>
                      </p>
                      {bonus ? (
                        <p>
                          Bonus: <span className="text-purple-200 font-semibold">{formatNum(bonus)}</span>
                        </p>
                      ) : null}
                    </div>
                  );
                })()}
              </div>
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/20 to-cyan-500/15 px-4 py-3 shadow-inner">
                <p className="text-[11px] uppercase tracking-[0.18em] text-gray-300">Merged PRs (Scored L1–L3)</p>
                <p className="text-3xl font-bold text-emerald-100">{formatNum(summary?.totalPRsMergedScoredL123 ?? summary?.totalPRsMerged)}</p>
                {Number(summary?.totalPRsMergedAll || 0) ? (
                  <p className="mt-1 text-[11px] text-gray-300">
                    All merged: <span className="text-gray-200 font-semibold">{formatNum(summary?.totalPRsMergedAll)}</span>
                  </p>
                ) : null}
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-gray-200">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur shadow-inner">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
              <span className="uppercase tracking-[0.18em] text-xs text-gray-400">Last Updated</span>
              <span className="font-semibold text-white">{formatIST(updatedAt)}</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur shadow-inner">
              <span className="h-2 w-2 rounded-full bg-cyan-300 animate-pulse" aria-hidden />
              <span className="uppercase tracking-[0.18em] text-xs text-gray-400">Live (IST)</span>
              <span className="font-semibold text-white">{formatIST(now)}</span>
            </div>
            <a
              href="/leaderboard/project-admin"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur shadow-inner hover:bg-white/10 transition"
              aria-label="Open project admin leaderboard"
            >
              <span className="h-2 w-2 rounded-full bg-purple-300" aria-hidden />
              <span className="uppercase tracking-[0.18em] text-xs text-gray-400">Link</span>
              <span className="font-semibold text-white">Project Admin Leaderboard ↗</span>
            </a>
          </div>
        </div>

        {!loading && page === 1 && !debouncedSearch && podium.length > 0 && (
          <div className="mb-12 rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-purple-500/5 to-blue-500/5 backdrop-blur-xl p-6 sm:p-8 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.6)] relative overflow-hidden">
            <div className="absolute -left-10 -top-16 h-64 w-64 rounded-full bg-purple-600/25 blur-3xl" aria-hidden />
            <div className="absolute right-0 top-10 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl" aria-hidden />
            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              {podium.map((user, idx) => {
                const avatarUrl = user.githubUsername
                  ? `https://github.com/${user.githubUsername}.png?size=300`
                  : '';
                const isGold = user.rank === 1;
                const sizeClass = isGold ? 'w-44 h-44 sm:w-56 sm:h-56' : 'w-36 h-36 sm:w-44 sm:h-44';
                const orderClass = user.rank === 1 ? 'md:col-span-1 md:order-2' : user.rank === 2 ? 'md:order-1' : 'md:order-3';
                const ringColor = isGold ? 'border-amber-300 shadow-[0_0_25px_-6px_rgba(251,191,36,0.8)]' : 'border-purple-300 shadow-[0_0_18px_-8px_rgba(167,139,250,0.7)]';
                return (
                  <div
                    key={user._id}
                    className={`relative flex flex-col items-center gap-4 text-center ${orderClass}`}
                  >
                    <div className={`relative ${sizeClass} rounded-full border-4 ${ringColor} overflow-hidden bg-black/30 backdrop-blur-md flex items-center justify-center`}>
                      {avatarUrl ? (
                        <div
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ backgroundImage: `url(${avatarUrl})` }}
                        />
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-br ${getRankColor(user.rank)} opacity-70`} />
                      )}
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-amber-300 to-yellow-500 text-black font-black text-2xl flex items-center justify-center border-4 border-black shadow-lg">
                        {user.rank}
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2 mt-6">
                      <p className="text-lg font-bold text-white tracking-wide uppercase">{user.name}</p>
                      <p className="text-sm text-gray-400 font-thin-custom">@{user.username}</p>
                      <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-amber-200 mt-1 flex items-center gap-2">
                        <span className="uppercase tracking-[0.18em] text-gray-300">Points</span>
                        <span className="text-white">{user.stats?.totalPoints || 0}</span>
                      </div>
                      <div className="flex justify-center items-center gap-3 text-sm text-white/80 mt-2">
                        {user.githubUsername && (
                          <a
                            href={`https://github.com/${user.githubUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center hover:text-white transition-colors"
                            aria-label="GitHub profile"
                          >
                            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 .5C5.648.5.5 5.648.5 12c0 5.088 3.292 9.397 7.865 10.92.575.105.786-.25.786-.556 0-.274-.01-1.156-.015-2.098-3.2.695-3.878-1.345-3.878-1.345-.523-1.33-1.277-1.685-1.277-1.685-1.043-.713.08-.698.08-.698 1.153.081 1.76 1.184 1.76 1.184 1.026 1.758 2.69 1.25 3.344.956.104-.743.401-1.25.728-1.538-2.553-.29-5.238-1.276-5.238-5.68 0-1.255.448-2.28 1.183-3.083-.119-.29-.513-1.457.113-3.037 0 0 .966-.31 3.167 1.178a11.03 11.03 0 0 1 2.884-.388c.978.005 1.963.132 2.884.388 2.2-1.488 3.164-1.178 3.164-1.178.628 1.58.234 2.747.116 3.037.737.803 1.182 1.828 1.182 3.083 0 4.415-2.69 5.386-5.254 5.67.413.356.781 1.06.781 2.138 0 1.545-.014 2.792-.014 3.172 0 .309.208.667.792.554C20.21 21.393 23.5 17.084 23.5 12 23.5 5.648 18.352.5 12 .5Z" />
                            </svg>
                          </a>
                        )}
                        {user.linkedin && (
                          <a
                            href={user.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center hover:text-white transition-colors"
                            aria-label="LinkedIn profile"
                          >
                            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M4.98 3.5C4.98 4.88 3.87 6 2.49 6 1.11 6 0 4.88 0 3.5 0 2.12 1.11 1 2.49 1 3.87 1 4.98 2.12 4.98 3.5ZM.22 8.25h4.54V24H.22V8.25ZM8.34 8.25h4.35v2.14h.06c.61-1.16 2.1-2.38 4.32-2.38 4.62 0 5.48 3.04 5.48 6.98V24h-4.54v-7.79c0-1.86-.03-4.26-2.6-4.26-2.6 0-3 2.03-3 4.12V24H8.34V8.25Z" />
                            </svg>
                          </a>
                        )}
                        <span className="text-xs uppercase tracking-[0.2em] text-gray-400 mt-2">Rank #{user.rank}</span>
                      </div>
                    </div>
                    {/* Top 3 keep minimal: name, rank chip (above), points chip, socials */}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {loading && (
          <div className="space-y-6 pb-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-8 animate-pulse">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="space-y-3">
                  <div className="h-9 w-72 sm:w-96 rounded-xl bg-white/10" />
                  <div className="h-4 w-60 rounded-lg bg-white/10" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                      <div className="h-3 w-20 rounded bg-white/10" />
                      <div className="mt-3 h-8 w-16 rounded-lg bg-white/10" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="h-10 w-72 rounded-full border border-white/10 bg-white/5" />
                <div className="h-10 w-56 rounded-full border border-white/10 bg-white/5" />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-8 animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex flex-col items-center gap-4 text-center">
                    <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-white/10 border border-white/10" />
                    <div className="h-4 w-32 rounded bg-white/10" />
                    <div className="h-3 w-24 rounded bg-white/10" />
                    <div className="h-8 w-28 rounded-full bg-white/10 border border-white/10" />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg px-5 py-4 shadow-[0_10px_40px_-24px_rgba(0,0,0,0.65)] animate-pulse"
                >
                  <div className="relative grid grid-cols-1 sm:grid-cols-5 items-center gap-4 sm:gap-4">
                    <div className="flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/10" />
                    </div>

                    <div className="text-left flex items-center gap-3 w-full">
                      <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10" />
                      <div className="flex flex-col gap-2 w-full">
                        <div className="h-4 w-40 rounded bg-white/10" />
                        <div className="h-3 w-28 rounded bg-white/10" />
                        <div className="flex items-center gap-3">
                          <div className="h-4 w-4 rounded bg-white/10" />
                          <div className="h-4 w-4 rounded bg-white/10" />
                        </div>
                      </div>
                    </div>

                    <div className="w-full flex items-center justify-between sm:flex-col sm:items-center sm:justify-center sm:space-y-2">
                      <div className="h-3 w-24 rounded bg-white/10" />
                      <div className="h-6 w-10 rounded bg-white/10" />
                      <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10" />
                    </div>

                    <div className="w-full flex items-center justify-between sm:flex-col sm:items-center sm:justify-center sm:space-y-2">
                      <div className="h-3 w-20 rounded bg-white/10" />
                      <div className="h-6 w-10 rounded bg-white/10" />
                    </div>

                    <div className="w-full flex items-center justify-between sm:flex-col sm:items-center sm:justify-center sm:space-y-2">
                      <div className="h-3 w-16 rounded bg-white/10" />
                      <div className="h-6 w-12 rounded bg-white/10" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && (
          <div className="flex justify-end mb-4">
            <div className="w-full sm:w-80">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">🔎</div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search rank or name"
                  className="w-full rounded-full border border-white/10 bg-white/5 px-10 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
                />
              </div>
            </div>
          </div>
        )}

        {!loading && filteredUsers.length > 0 && (
          <div className="mb-14 space-y-3">
            {filteredUsers.map((user, index) => {
              const dominance = Math.max(Math.round(((user.stats?.totalPoints || 0) / topPoints) * 100), 1);
              return (
                <div
                  key={user._id}
                  className={`relative overflow-hidden rounded-2xl border bg-white/5 backdrop-blur-lg px-5 py-4 shadow-[0_10px_40px_-24px_rgba(0,0,0,0.65)] transition ${
                    index < 3 ? 'border-purple-400/30' : 'border-white/10'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/3 via-transparent to-transparent" />
                  <div className="relative grid grid-cols-1 sm:grid-cols-5 items-center gap-4 sm:gap-4 sm:justify-items-center">
                    <div className="flex items-center justify-center">
                      <div
                        className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r ${getRankColor(
                          user.rank
                        )} text-white font-bold shadow-lg text-sm`}
                      >
                        {getRankIcon(user.rank)}
                      </div>
                    </div>

                    <div className="text-left sm:text-left flex items-center gap-3 justify-start w-full">
                      <div
                        className="w-10 h-10 rounded-full bg-white/10 border border-white/10 overflow-hidden flex-shrink-0"
                        style={{ backgroundImage: user.githubUsername ? `url(https://github.com/${user.githubUsername}.png?size=100)` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}
                        aria-hidden={!user.githubUsername}
                      />
                      <div className="flex flex-col gap-1">
                        <div className="text-white font-semibold leading-none">{user.name}</div>
                        <div className="text-xs text-gray-400 font-thin-custom leading-none">@{user.username}</div>
                        <div className="flex items-center gap-3 text-blue-300 mt-1">
                          {user.githubUsername && (
                            <a
                              href={`https://github.com/${user.githubUsername}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-blue-200 transition-colors flex items-center"
                              aria-label="GitHub profile"
                            >
                              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 .5C5.648.5.5 5.648.5 12c0 5.088 3.292 9.397 7.865 10.92.575.105.786-.25.786-.556 0-.274-.01-1.156-.015-2.098-3.2.695-3.878-1.345-3.878-1.345-.523-1.33-1.277-1.685-1.277-1.685-1.043-.713.08-.698.08-.698 1.153.081 1.76 1.184 1.76 1.184 1.026 1.758 2.69 1.25 3.344.956.104-.743.401-1.25.728-1.538-2.553-.29-5.238-1.276-5.238-5.68 0-1.255.448-2.28 1.183-3.083-.119-.29-.513-1.457.113-3.037 0 0 .966-.31 3.167 1.178a11.03 11.03 0 0 1 2.884-.388c.978.005 1.963.132 2.884.388 2.2-1.488 3.164-1.178 3.164-1.178.628 1.58.234 2.747.116 3.037.737.803 1.182 1.828 1.182 3.083 0 4.415-2.69 5.386-5.254 5.67.413.356.781 1.06.781 2.138 0 1.545-.014 2.792-.014 3.172 0 .309.208.667.792.554C20.21 21.393 23.5 17.084 23.5 12 23.5 5.648 18.352.5 12 .5Z" />
                              </svg>
                            </a>
                          )}
                          {user.linkedin && (
                            <a
                              href={user.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-blue-200 transition-colors flex items-center"
                              aria-label="LinkedIn profile"
                            >
                              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M4.98 3.5C4.98 4.88 3.87 6 2.49 6 1.11 6 0 4.88 0 3.5 0 2.12 1.11 1 2.49 1 3.87 1 4.98 2.12 4.98 3.5ZM.22 8.25h4.54V24H.22V8.25ZM8.34 8.25h4.35v2.14h.06c.61-1.16 2.1-2.38 4.32-2.38 4.62 0 5.48 3.04 5.48 6.98V24h-4.54v-7.79c0-1.86-.03-4.26-2.6-4.26-2.6 0-3 2.03-3 4.12V24H8.34V8.25Z" />
                              </svg>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="w-40 flex items-center justify-between flex-col md:flex-row space-y-1">
                      <div className="flex flex-col sm:items-center">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400">Merged PRs</p>
                        <p className="text-lg font-semibold text-emerald-200">{user.stats?.pullRequests?.merged || 0}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openHistory(user)}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 border border-white/15 hover:border-white/40 hover:bg-white/15 transition-colors"
                        aria-label="View merged PR history"
                      >
                        <svg aria-hidden="true" viewBox="0 0 64 64" className="w-5 h-5 text-amber-300" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="14" cy="32" r="7" />
                          <circle cx="50" cy="14" r="7" />
                          <circle cx="50" cy="50" r="7" />
                          <path d="M21 32h15M43 14H21m22 36H21" />
                        </svg>
                      </button>
                    </div>

                    <div className="w-full flex items-center justify-between sm:flex-col sm:items-center sm:justify-center sm:space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400">Projects</p>
                      <p className="text-lg font-semibold text-amber-100">{user.stats?.projectsContributed || 0}</p>
                    </div>

                    <div className="w-full flex items-center justify-between sm:flex-col sm:items-center sm:justify-center sm:space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400">Points</p>
                      <p className="text-lg font-semibold text-purple-100">{user.stats?.totalPoints || 0}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !useDummy && pagination?.totalPages > 1 && (
          <div className="mb-16 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={!pagination?.hasPrev}
              onClick={() => {
                setActiveHistoryUser(null);
                setPage((p) => Math.max(p - 1, 1));
              }}
              className="px-5 py-2 rounded-full border border-white/10 bg-white/5 text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition"
            >
              Prev
            </button>
            <div className="text-xs uppercase tracking-[0.22em] text-gray-400">
              Page <span className="text-white font-semibold">{pagination?.page || page}</span> /{' '}
              <span className="text-white font-semibold">{pagination?.totalPages || 1}</span>
            </div>
            <button
              type="button"
              disabled={!pagination?.hasNext}
              onClick={() => {
                setActiveHistoryUser(null);
                setPage((p) => p + 1);
              }}
              className="px-5 py-2 rounded-full border border-white/10 bg-white/5 text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition"
            >
              Next
            </button>
          </div>
        )}

        {!loading && users.length > 0 && filteredUsers.length === 0 && (
          <div className="bg-white/5 backdrop-blur-md rounded-3xl shadow-xl p-10 text-center border border-white/10 mb-16">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-white mb-2">No matches</h3>
            <p className="text-gray-300 font-thin-custom">Try another rank or name.</p>
          </div>
        )}

        {!loading && users.length === 0 && (
          debouncedSearch ? (
            <div className="bg-white/5 backdrop-blur-md rounded-3xl shadow-xl p-10 text-center border border-white/10 mb-16">
              <div className="text-5xl mb-4">😕</div>
              <h3 className="text-2xl font-bold text-white mb-2">No contributor found</h3>
              <p className="text-gray-300 font-thin-custom">
                No contributor matches <span className="text-white font-semibold">“{debouncedSearch}”</span>. Try a different name, username, or rank number.
              </p>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-black via-slate-900 to-purple-900 p-14 sm:p-16 text-center shadow-[0_24px_90px_-34px_rgba(0,0,0,0.65)] mb-16">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(124,58,237,0.28),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.22),transparent_40%),radial-gradient(circle_at_60%_80%,rgba(59,130,246,0.2),transparent_40%)]" aria-hidden />
              <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/8 via-transparent to-transparent" aria-hidden />
              <div className="relative flex flex-col items-center gap-5">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <div className="absolute inset-2 rounded-full bg-white/10 blur-xl animate-ping" aria-hidden />
                  <div className="absolute inset-0 rounded-full bg-white/5 border border-white/15" aria-hidden />
                  <div className="relative inline-flex w-full h-full items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-black font-black text-2xl shadow-[0_10px_35px_-18px_rgba(0,0,0,0.7)] animate-bounce">
                    ✦
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <p className="uppercase tracking-[0.28em] text-xs text-purple-200/80">DSoC leaderboard</p>
                  <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-wide">Coming Soon</h3>
                </div>
                <p className="text-gray-200 font-thin-custom text-lg max-w-2xl mx-auto">
                  We’re loading the first wave of contributors. Check back in a moment to see the rankings ignite.
                </p>
                <div className="flex items-center gap-3 text-sm text-purple-100/80">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 backdrop-blur">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
                    Refreshing soon
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 backdrop-blur">
                    <span className="h-2 w-2 rounded-full bg-amber-300 animate-pulse" aria-hidden />
                    Stay tuned
                  </span>
                </div>
              </div>
            </div>
          )
        )}


        <Footer />
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-14 max-w-6xl">
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-8 animate-pulse">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="space-y-3">
                  <div className="h-9 w-72 sm:w-96 rounded-xl bg-white/10" />
                  <div className="h-4 w-60 rounded-lg bg-white/10" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                      <div className="h-3 w-20 rounded bg-white/10" />
                      <div className="mt-3 h-8 w-16 rounded-lg bg-white/10" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="h-10 w-72 rounded-full border border-white/10 bg-white/5" />
                <div className="h-10 w-56 rounded-full border border-white/10 bg-white/5" />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <LeaderboardContent />
    </Suspense>
  );
}