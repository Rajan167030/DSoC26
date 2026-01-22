'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

function formatNum(value) {
  const n = typeof value === 'number' ? value : parseFloat(String(value || '0'));
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString();
}

function formatIST(value) {
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
}

function getRankColor(rank) {
  if (rank === 1) return 'from-yellow-400 to-yellow-600';
  if (rank === 2) return 'from-gray-300 to-gray-500';
  if (rank === 3) return 'from-orange-400 to-orange-600';
  return 'from-purple-500 to-blue-500';
}

function formatSigned(value) {
  const n = typeof value === 'number' ? value : parseFloat(String(value || '0'));
  if (!Number.isFinite(n)) return '0';
  if (n === 0) return '0';
  return n > 0 ? `+${n}` : String(n);
}

function formatPoints(value) {
  return formatNum(value);
}

function GithubIcon(props) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 .5C5.648.5.5 5.648.5 12c0 5.088 3.292 9.397 7.865 10.92.575.105.786-.25.786-.556 0-.274-.01-1.156-.015-2.098-3.2.695-3.878-1.345-3.878-1.345-.523-1.33-1.277-1.685-1.277-1.685-1.043-.713.08-.698.08-.698 1.153.081 1.76 1.184 1.76 1.184 1.026 1.758 2.69 1.25 3.344.956.104-.743.401-1.25.728-1.538-2.553-.29-5.238-1.276-5.238-5.68 0-1.255.448-2.28 1.183-3.083-.119-.29-.513-1.457.113-3.037 0 0 .966-.31 3.167 1.178a11.03 11.03 0 0 1 2.884-.388c.978.005 1.963.132 2.884.388 2.2-1.488 3.164-1.178 3.164-1.178.628 1.58.234 2.747.116 3.037.737.803 1.182 1.828 1.182 3.083 0 4.415-2.69 5.386-5.254 5.67.413.356.781 1.06.781 2.138 0 1.545-.014 2.792-.014 3.172 0 .309.208.667.792.554C20.21 21.393 23.5 17.084 23.5 12 23.5 5.648 18.352.5 12 .5Z" />
    </svg>
  );
}

function LinkedinIcon(props) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M4.98 3.5C4.98 4.88 3.87 6 2.49 6 1.11 6 0 4.88 0 3.5 0 2.12 1.11 1 2.49 1 3.87 1 4.98 2.12 4.98 3.5ZM.22 8.25h4.54V24H.22V8.25ZM8.34 8.25h4.35v2.14h.06c.61-1.16 2.1-2.38 4.32-2.38 4.62 0 5.48 3.04 5.48 6.98V24h-4.54v-7.79c0-1.86-.03-4.26-2.6-4.26-2.6 0-3 2.03-3 4.12V24H8.34V8.25Z" />
    </svg>
  );
}

function ProjectAdminLeaderboardContent({ snapshotId, forceLive }) {

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [liveNow, setLiveNow] = useState(() => new Date());
  const [activeHistoryAdmin, setActiveHistoryAdmin] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [historyData, setHistoryData] = useState(null);
  const [historyTab, setHistoryTab] = useState('prs');
  const [visibleHistoryPrs, setVisibleHistoryPrs] = useState(150);
  const [visibleHistoryIssues, setVisibleHistoryIssues] = useState(150);

  const historyByEmailLower = useMemo(() => {
    const map = new Map();
    const list = Array.isArray(data?.histories) ? data.histories : [];
    for (const h of list) {
      const emailLower = String(h?.emailLower || '').trim().toLowerCase();
      if (!emailLower) continue;
      if (h?.payload) map.set(emailLower, h.payload);
    }
    return map;
  }, [data]);

  useEffect(() => {
    const t = setInterval(() => setLiveNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setActiveHistoryAdmin(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const run = async () => {
      try {
        setLoading(true);
        setError('');
        const baseUrl = '/api/leaderboard/project-admin';
        const qs = [];
        if (snapshotId) qs.push(`snapshotId=${encodeURIComponent(snapshotId)}`);
        if (forceLive) qs.push('live=1');
        qs.push('withHistory=1');
        const url = qs.length ? `${baseUrl}?${qs.join('&')}` : baseUrl;
        const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        const json = await res.json();
        if (!active || controller.signal.aborted) return;
        if (!res.ok) {
          setError(json?.error || 'Failed to load project admin leaderboard.');
          setData(null);
          return;
        }
        setData(json);
      } catch (e) {
        if (e?.name === 'AbortError') return;
        setError('Failed to load project admin leaderboard.');
        setData(null);
      } finally {
        if (!active || controller.signal.aborted) return;
        setLoading(false);
      }
    };

    run();

    return () => {
      active = false;
      controller.abort();
    };
  }, [snapshotId, forceLive]);

  const openHistory = async (adminRow) => {
    const email = adminRow?.email ? String(adminRow.email) : '';
    if (!email) return;

    const emailLower = email.trim().toLowerCase();
    const preloaded = historyByEmailLower.get(emailLower);

    setActiveHistoryAdmin(adminRow);
    setHistoryLoading(true);
    setHistoryError('');
    setHistoryData(null);
    setHistoryTab('prs');
    setVisibleHistoryPrs(150);
    setVisibleHistoryIssues(150);

    if (preloaded) {
      setHistoryData(preloaded);
      setHistoryLoading(false);
      return;
    }

    try {
      const sid = data?.snapshotId ? `&snapshotId=${encodeURIComponent(String(data.snapshotId))}` : '';
      const url = `/api/leaderboard/project-admin/history?email=${encodeURIComponent(email)}${sid}`;
      const res = await fetch(url, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) {
        setHistoryError(json?.error || 'Failed to load history.');
        return;
      }
      setHistoryData(json);
    } catch {
      setHistoryError('Failed to load history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const admins = useMemo(() => (Array.isArray(data?.admins) ? data.admins : []), [data]);
  const totalAdminPoints = useMemo(
    () => admins.reduce((sum, a) => sum + (typeof a?.score === 'number' ? a.score : 0), 0),
    [admins]
  );
  const totalAdminBonusPoints = useMemo(
    () => admins.reduce((sum, a) => sum + (typeof a?.bonusPoints === 'number' ? a.bonusPoints : 0), 0),
    [admins]
  );
  const notConfiguredCount = useMemo(
    () => admins.filter((a) => a?.breakdown?.configured?.ok === false).length,
    [admins]
  );
  const podiumAdmins = useMemo(() => admins.slice(0, 3), [admins]);

  const adminEntries = useMemo(() => admins.map((a, idx) => ({ a, rank: idx + 1 })), [admins]);
  const filteredEntries = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return adminEntries;
    return adminEntries.filter(({ a, rank }) => {
      const name = String(a?.name || '').toLowerCase();
      const username = String(a?.username || '').toLowerCase();
      const githubUsername = String(a?.githubUsername || '').toLowerCase();
      const email = String(a?.email || '').toLowerCase();
      const rankText = String(rank);
      return (
        rankText.includes(q) ||
        name.includes(q) ||
        username.includes(q) ||
        githubUsername.includes(q) ||
        email.includes(q)
      );
    });
  }, [adminEntries, searchTerm]);

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize));
  const pagedAdmins = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredEntries.slice(start, start + pageSize);
  }, [filteredEntries, page]);

  useEffect(() => {
    setPage(1);
  }, [admins.length, searchTerm]);

  return (
    <div className="relative min-h-screen bg-black text-gray-100 overflow-x-hidden">
      {activeHistoryAdmin && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm px-4 pb-4 pt-24 sm:pt-28"
          role="dialog"
          aria-modal="true"
          aria-label="Project admin history"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setActiveHistoryAdmin(null);
          }}
        >
          <div className="w-full max-w-4xl max-h-[calc(100vh-7rem)] sm:max-h-[calc(100vh-8rem)] rounded-2xl border border-white/10 bg-black/80 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
            <div className="flex items-start justify-between gap-4 px-4 sm:px-6 py-4 border-b border-white/10">
              <div className="flex flex-col min-w-0">
                <div className="text-xs uppercase tracking-[0.2em] text-gray-400">History</div>
                <div className="text-lg font-semibold text-white truncate">
                  {activeHistoryAdmin?.name || 'Project Admin'}
                </div>
                <div className="mt-1 text-sm text-gray-400 font-thin-custom truncate">
                  {activeHistoryAdmin?.username
                    ? `@${activeHistoryAdmin.username}`
                    : activeHistoryAdmin?.githubUsername
                      ? `@${activeHistoryAdmin.githubUsername}`
                      : ''}
                </div>
                <div className="mt-2 text-[11px] uppercase tracking-[0.2em] text-gray-400">
                  Points per PR/Issue since Jan 1, 2026 (UTC)
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveHistoryAdmin(null)}
                className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="px-4 sm:px-6 py-5 overflow-auto flex-1 min-h-0">
              {historyLoading && (
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center text-gray-300 font-thin-custom">
                  Loading history…
                </div>
              )}

              {!historyLoading && historyError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-6 text-center text-red-100 font-thin-custom">
                  {historyError}
                </div>
              )}

              {!historyLoading && !historyError && historyData && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-gray-400">Totals</div>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-gray-400">Points</div>
                        <div className="mt-1 text-lg font-semibold text-emerald-200">{formatPoints(historyData?.totals?.score || 0)}</div>
                        {typeof historyData?.totals?.bonusPoints === 'number' && historyData.totals.bonusPoints !== 0 ? (
                          <div className="mt-0.5 text-[11px] text-gray-400">
                            Base {formatPoints(historyData?.totals?.baseScore || 0)} <span className="text-gray-600">+ </span>
                            Bonus {formatSigned(historyData?.totals?.bonusPoints || 0)}
                          </div>
                        ) : null}
                      </div>
                      <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-gray-400">PR (+ / -)</div>
                        <div className="mt-1 text-sm text-gray-100">
                          <span className="text-emerald-200 font-semibold">+{formatNum(historyData?.totals?.prFirstPlus || 0)}</span>
                          <span className="text-gray-400"> / </span>
                          <span className="text-amber-200 font-semibold">
                            {formatSigned((historyData?.totals?.prFirstMinus || 0) + (historyData?.totals?.prInactionMinus || 0))}
                          </span>
                        </div>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-gray-400">Issue (+ / -)</div>
                        <div className="mt-1 text-sm text-gray-100">
                          <span className="text-emerald-200 font-semibold">+{formatNum(historyData?.totals?.issueClosePlus || 0)}</span>
                          <span className="text-gray-400"> / </span>
                          <span className="text-amber-200 font-semibold">
                            {formatSigned((historyData?.totals?.issueCloseMinus || 0) + (historyData?.totals?.issueInactionMinus || 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-gray-400">Items</div>
                        <div className="mt-1 text-sm text-gray-300 font-thin-custom">
                          {historyTab === 'prs'
                            ? 'Shows PR-level deltas (merge, first-response, inaction, closing-issue).'
                            : 'Shows issue inaction penalties (-5) when applicable.'}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 rounded-full border border-white/10 bg-black/40 p-1 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => setHistoryTab('prs')}
                          className={`px-3 py-1.5 rounded-full text-[11px] uppercase tracking-[0.18em] transition-colors flex-1 sm:flex-none text-center ${
                            historyTab === 'prs' ? 'bg-white/10 text-gray-100' : 'text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          PRs ({formatNum(historyData?.items?.prs?.length || 0)})
                        </button>
                        <button
                          type="button"
                          onClick={() => setHistoryTab('issues')}
                          className={`px-3 py-1.5 rounded-full text-[11px] uppercase tracking-[0.18em] transition-colors flex-1 sm:flex-none text-center ${
                            historyTab === 'issues' ? 'bg-white/10 text-gray-100' : 'text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          Issues ({formatNum(historyData?.items?.issues?.length || 0)})
                        </button>
                      </div>
                    </div>

                    {historyTab === 'prs' && (
                      <div className="mt-3">
                        <div className="space-y-2">
                          {(historyData?.items?.prs || []).slice(0, visibleHistoryPrs).map((it, i) => (
                            <div key={`${it?.url || i}`} className="rounded-lg border border-white/10 bg-black/40 px-3 py-2">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div className="min-w-0">
                                  <a
                                    href={it.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-300 hover:text-blue-200 underline underline-offset-2 truncate block"
                                  >
                                    {it.url}
                                  </a>
                                  <div className="mt-1 text-xs text-gray-400 font-thin-custom truncate">{it.repo}</div>
                                  {it.prFirstLabel && <div className="mt-1 text-xs text-gray-300">PR first: {it.prFirstLabel}</div>}
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-sm font-semibold text-emerald-200">{formatSigned(it.totalDelta || 0)}</div>
                                </div>
                              </div>

                              {(it.issueClosure || []).length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {it.issueClosure.map((cl, j) => (
                                    <div key={`${cl?.url || j}`} className="text-xs text-gray-200">
                                      <span className="text-gray-400">Issue: </span>
                                      {cl?.url ? (
                                        <a
                                          href={cl.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-300 hover:text-blue-200 underline underline-offset-2 break-all"
                                        >
                                          {cl.url}
                                        </a>
                                      ) : (
                                        <span className="text-gray-300">(no url)</span>
                                      )}
                                      <span className="text-gray-400"> · </span>
                                      <span className={cl.delta >= 0 ? 'text-emerald-200 font-semibold' : 'text-amber-200 font-semibold'}>
                                        {formatSigned(cl.delta)}
                                      </span>
                                      {cl.label ? <span className="text-gray-300"> — {cl.label}</span> : null}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {(() => {
                          const total = historyData?.items?.prs?.length || 0;
                          if (total <= visibleHistoryPrs) return null;
                          return (
                            <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div className="text-xs text-gray-400 font-thin-custom">Showing {formatNum(visibleHistoryPrs)} of {formatNum(total)} PR items.</div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setVisibleHistoryPrs((v) => Math.min(total, v + 150))}
                                  className="rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors px-4 py-2 text-xs uppercase tracking-[0.18em]"
                                >
                                  Show more
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setVisibleHistoryPrs(total)}
                                  className="rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors px-4 py-2 text-xs uppercase tracking-[0.18em]"
                                >
                                  Show all
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {historyTab === 'issues' && (
                      <div className="mt-3">
                        <div className="space-y-2">
                          {(historyData?.items?.issues || []).slice(0, visibleHistoryIssues).map((it, i) => (
                            <div key={`${it?.url || i}`} className="rounded-lg border border-white/10 bg-black/40 px-3 py-2">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div className="min-w-0">
                                  <a
                                    href={it.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-300 hover:text-blue-200 underline underline-offset-2 truncate block"
                                  >
                                    {it.url}
                                  </a>
                                  <div className="mt-1 text-xs text-gray-400 font-thin-custom truncate">{it.repo}</div>
                                  {it.label && <div className="mt-1 text-xs text-gray-300">{it.label}</div>}
                                </div>
                                <div className="text-sm font-semibold text-amber-200">{formatSigned(it.delta || 0)}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {(() => {
                          const total = historyData?.items?.issues?.length || 0;
                          if (total <= visibleHistoryIssues) return null;
                          return (
                            <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div className="text-xs text-gray-400 font-thin-custom">Showing {formatNum(visibleHistoryIssues)} of {formatNum(total)} issue items.</div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setVisibleHistoryIssues((v) => Math.min(total, v + 150))}
                                  className="rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors px-4 py-2 text-xs uppercase tracking-[0.18em]"
                                >
                                  Show more
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setVisibleHistoryIssues(total)}
                                  className="rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors px-4 py-2 text-xs uppercase tracking-[0.18em]"
                                >
                                  Show all
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showRules && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-4 pt-24 sm:pt-28"
          role="dialog"
          aria-modal="true"
          aria-label="Project admin leaderboard rules"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowRules(false);
          }}
        >
          <div className="w-full max-w-2xl max-h-[calc(100vh-7rem)] sm:max-h-[calc(100vh-8rem)] rounded-2xl border border-white/10 bg-black/80 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
            <div className="flex items-start justify-between gap-4 px-4 sm:px-6 py-4 border-b border-white/10">
              <div className="flex flex-col">
                <div className="text-xs uppercase tracking-[0.2em] text-gray-400">Rules</div>
                <div className="text-lg font-semibold text-white">Project Admin Leaderboard</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-gray-400">
                  All calculations from Jan 1, 2026 (UTC)
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRules(false)}
                className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="px-4 sm:px-6 py-5 overflow-auto flex-1 min-h-0">
              <div className="space-y-3 text-sm text-gray-200">
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-gray-400">Updates</div>
                  <div className="mt-2 text-gray-200">The leaderboard is updated after every 6 hours.</div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-gray-400">PR first response (DSoC26 PRs only)</div>
                  <div className="mt-2 text-gray-200">≤24h: +6 · 24–48h: +4 · &gt;48h: +1 · No response ≥4 days: -10</div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-gray-400">Issue closure after merge (DSoC26 PRs only)</div>
                  <div className="mt-2 text-gray-200">Issue closed within 48h after PR merge: +2 · Otherwise: -5</div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-gray-400">Inaction penalties</div>
                  <div className="mt-2 text-gray-200">
                    PR open &gt;5 days with no admin action: -10 (per PR)
                    <br />
                    Issue (not opened by admin) with no admin action within 36h: -5 (per issue)
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-gray-400">DSoC26 merges</div>
                  <div className="mt-2 text-gray-200">Merged PR with label DSoC26: +3 (per PR)</div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-gray-400">Weekly activity</div>
                  <div className="mt-2 text-gray-200">
                    For 7 continuous active days: +10 points
                    <br />
                    -10 if inactive for the last 7 days
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-gray-400">Bot configured</div>
                  <div className="mt-2 text-gray-200">
                    If dsoc-sentinel is not detected for a repo, score is forced to 0 and the entry is shown as Not configured.
                  </div>
                </div>
              </div>
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
        <div className="mb-12 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 sm:p-8 md:p-10 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold-custom text-white leading-tight mb-3">
                Project Admin <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">Leaderboard</span>
              </h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 shadow-inner">
                <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">Project Admins</p>
                <p className="text-3xl font-bold text-white">{formatNum(admins.length)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/20 to-blue-500/15 px-4 py-3 shadow-inner">
                <p className="text-[11px] uppercase tracking-[0.18em] text-gray-300">Total Points</p>
                <p className="text-3xl font-bold text-purple-100">{formatNum(totalAdminPoints)}</p>
                <p className="mt-1 text-[11px] text-gray-300">Bonus: {formatNum(totalAdminBonusPoints)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-amber-500/15 to-red-500/10 px-4 py-3 shadow-inner">
                <p className="text-[11px] uppercase tracking-[0.18em] text-gray-300">Bot Not Configured</p>
                <p className="text-3xl font-bold text-amber-100">{formatNum(notConfiguredCount)}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-gray-200">
            <button
              type="button"
              onClick={() => setShowRules(true)}
              className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-red-100 hover:bg-red-500/20 transition"
            >
              Rules
            </button>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur shadow-inner">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
              <span className="uppercase tracking-[0.18em] text-xs text-gray-400">Last Updated</span>
              <span className="font-semibold text-white">{formatIST(data?.generatedAt)}</span>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur shadow-inner">
              <span className="h-2 w-2 rounded-full bg-cyan-300 animate-pulse" aria-hidden />
              <span className="uppercase tracking-[0.18em] text-xs text-gray-400">Live (IST)</span>
              <span className="font-semibold text-white">{formatIST(liveNow)}</span>
            </div>

            <a
              href="/leaderboard"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur shadow-inner hover:bg-white/10 transition"
              aria-label="Open contributor leaderboard"
            >
              <span className="h-2 w-2 rounded-full bg-purple-300" aria-hidden />
              <span className="uppercase tracking-[0.18em] text-xs text-gray-400">Link</span>
              <span className="font-semibold text-white">Contributor Leaderboard ↗</span>
            </a>
          </div>
        </div>

        {!loading && !error && page === 1 && !searchTerm.trim() && podiumAdmins.length > 0 && (
          <div className="mb-12 rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-purple-500/5 to-blue-500/5 backdrop-blur-xl p-6 sm:p-8 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.6)] relative overflow-hidden">
            <div className="absolute -left-10 -top-16 h-64 w-64 rounded-full bg-purple-600/25 blur-3xl" aria-hidden />
            <div className="absolute right-0 top-10 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl" aria-hidden />
            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              {podiumAdmins.map((admin, idx) => {
                const rank = idx + 1;
                const gh = admin?.githubUsername ? String(admin.githubUsername) : '';
                const uname = admin?.username ? String(admin.username) : '';
                const linkedin = admin?.linkedin ? String(admin.linkedin) : '';
                const avatarUrl = gh ? `https://github.com/${gh}.png?size=300` : '';

                const isGold = rank === 1;
                const sizeClass = isGold ? 'w-44 h-44 sm:w-56 sm:h-56' : 'w-36 h-36 sm:w-44 sm:h-44';
                const orderClass = rank === 1 ? 'md:col-span-1 md:order-2' : rank === 2 ? 'md:order-1' : 'md:order-3';
                const ringColor = isGold
                  ? 'border-amber-300 shadow-[0_0_25px_-6px_rgba(251,191,36,0.8)]'
                  : 'border-purple-300 shadow-[0_0_18px_-8px_rgba(167,139,250,0.7)]';

                return (
                  <div key={`${admin?.email || gh || idx}`} className={`relative flex flex-col items-center gap-4 text-center ${orderClass}`}>
                    <div
                      className={`relative ${sizeClass} rounded-full border-4 ${ringColor} overflow-hidden bg-black/30 backdrop-blur-md flex items-center justify-center`}
                    >
                      {avatarUrl ? (
                        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${avatarUrl})` }} />
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-br ${getRankColor(rank)} opacity-70`} />
                      )}
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-amber-300 to-yellow-500 text-black font-black text-2xl flex items-center justify-center border-4 border-black shadow-lg">
                        {rank}
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-1 mt-6">
                      <p className="text-lg font-bold text-white tracking-wide uppercase">{admin?.name || 'Project Admin'}</p>
                      <p className="text-sm text-gray-400 font-thin-custom">@{uname || gh || '—'}</p>
                      <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-amber-200 mt-1 flex items-center gap-2">
                        <span className="uppercase tracking-[0.18em] text-gray-300">Points</span>
                        <span className="text-white">{formatPoints(admin?.score || 0)}</span>
                      </div>
                      {typeof admin?.bonusPoints === 'number' && admin.bonusPoints !== 0 ? (
                        <div className="text-[11px] text-gray-300">
                          Base {formatPoints(typeof admin?.baseScore === 'number' ? admin.baseScore : (admin?.score || 0) - admin.bonusPoints)}
                          <span className="text-gray-500"> • </span>
                          Bonus {formatSigned(admin.bonusPoints)}
                        </div>
                      ) : null}
                      <div className="flex items-center gap-3 text-sm text-white/80">
                        {gh && (
                          <a
                            href={`https://github.com/${gh}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center hover:text-white transition-colors"
                            aria-label="GitHub profile"
                          >
                            <GithubIcon className="w-[18px] h-[18px]" />
                          </a>
                        )}
                        {linkedin && (
                          <a
                            href={linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center hover:text-white transition-colors"
                            aria-label="LinkedIn profile"
                          >
                            <LinkedinIcon className="w-[18px] h-[18px]" />
                          </a>
                        )}
                        <span className="text-xs uppercase tracking-[0.2em] text-gray-400">Rank #{rank}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {loading && (
          <div className="space-y-6 pb-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-8 animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex flex-col items-center gap-4 text-center">
                    <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-white/10 border border-white/10" />
                    <div className="h-4 w-40 rounded bg-white/10" />
                    <div className="h-3 w-28 rounded bg-white/10" />
                    <div className="h-8 w-32 rounded-full bg-white/10 border border-white/10" />
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
                  <div className="relative grid grid-cols-1 md:grid-cols-5 items-center gap-4 md:gap-4">
                    <div className="flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/10" />
                    </div>

                    <div className="text-left flex items-center gap-3 w-full">
                      <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10" />
                      <div className="flex flex-col gap-2 w-full">
                        <div className="h-4 w-44 rounded bg-white/10" />
                        <div className="h-3 w-28 rounded bg-white/10" />
                        <div className="flex items-center gap-3">
                          <div className="h-4 w-4 rounded bg-white/10" />
                          <div className="h-4 w-4 rounded bg-white/10" />
                          <div className="h-3 w-40 rounded bg-white/10" />
                        </div>
                      </div>
                    </div>

                    {[0, 1, 2].map((j) => (
                      <div key={j} className="w-full flex items-center justify-between md:flex-col md:items-center md:justify-center md:space-y-2">
                        <div className="h-3 w-24 rounded bg-white/10" />
                        <div className="h-5 w-16 rounded bg-white/10" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 backdrop-blur-xl p-10 text-center">
            <div className="text-red-100 font-thin-custom">{error}</div>
          </div>
        )}

        {!loading && !error && admins.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 text-center">
            <div className="text-gray-300 font-thin-custom">No project admins found.</div>
          </div>
        )}

        {!loading && !error && admins.length > 0 && (
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

        {!loading && !error && admins.length > 0 && filteredEntries.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 text-center">
            <div className="text-gray-300 font-thin-custom">
              No project admin matches <span className="text-white font-semibold">“{searchTerm.trim()}”</span>. Try a different name, username, or rank number.
            </div>
          </div>
        )}

        {!loading && !error && admins.length > 0 && filteredEntries.length > 0 && (
          <div className="mb-16 space-y-3">
            {pagedAdmins.map(({ a, rank }, idx) => {
              const gh = a?.githubUsername ? String(a.githubUsername) : '';
              const uname = a?.username ? String(a.username) : '';
              const linkedin = a?.linkedin ? String(a.linkedin) : '';
              const score = typeof a?.score === 'number' ? a.score : 0;
              const bonusPoints = typeof a?.bonusPoints === 'number' ? a.bonusPoints : 0;
              const baseScore = typeof a?.baseScore === 'number' ? a.baseScore : score - bonusPoints;
              const configuredOk = a?.breakdown?.configured?.ok !== false;
              const errors = Array.isArray(a?.errors) ? a.errors : [];
              const rankColor = getRankColor(rank);
              const avatarUrl = gh ? `https://github.com/${gh}.png?size=100` : '';
              const repos = Array.isArray(a?.repos) ? a.repos.filter(Boolean) : [];

              const prFirstPlus = a?.breakdown?.prFirstResponse?.plus || 0;
              const prFirstMinus = a?.breakdown?.prFirstResponse?.minus || 0;
              const mergesPlus = a?.breakdown?.ecwocMerges?.plus || 0;
              const mergesCount = a?.breakdown?.ecwocMerges?.mergedCount || 0;
              const prInactionMinus = a?.breakdown?.prInaction?.minus || 0;
              const issueInactionMinus = a?.breakdown?.issueInaction?.minus || 0;
              const issueClosePlus = a?.breakdown?.issueClosedAfterMerge?.plus || 0;
              const issueCloseMinus = a?.breakdown?.issueClosedAfterMerge?.minus || 0;
              const weeklyPlus = a?.breakdown?.weekly?.plus || 0;
              const weeklyMinus = a?.breakdown?.weekly?.minus || 0;

              return (
                <div
                  key={`${a?.email || a?.githubUsername || idx}`}
                  className={`relative overflow-hidden rounded-2xl border bg-white/5 backdrop-blur-lg px-5 py-4 shadow-[0_10px_40px_-24px_rgba(0,0,0,0.65)] transition ${
                    idx < 3 ? 'border-purple-400/30' : 'border-white/10'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/3 via-transparent to-transparent" aria-hidden />

                  <div className="relative grid grid-cols-1 md:grid-cols-5 items-center gap-4 md:gap-4 md:justify-items-center">
                    <div className="flex items-center justify-center">
                      <div
                        className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r ${rankColor} text-white font-bold shadow-lg text-sm`}
                      >
                        {rank}
                      </div>
                    </div>

                    <div className="text-left sm:text-left flex items-center gap-3 justify-start w-full">
                      <div
                        className="w-10 h-10 rounded-full bg-white/10 border border-white/10 overflow-hidden flex-shrink-0"
                        style={{
                          backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                        aria-hidden={!gh}
                      />
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="text-white font-semibold leading-none truncate">{a?.name || 'Project Admin'}</div>
                        <div className="flex flex-wrap items-center gap-3">
                          {(uname || gh) ? (
                            <span
                              className="text-sm text-gray-400 font-thin-custom leading-none"
                              title={uname ? `@${uname}` : gh ? `@${gh}` : undefined}
                            >
                              @{uname || gh}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500 font-thin-custom leading-none">@—</span>
                          )}
                          {!configuredOk && (
                            <span className="text-[11px] uppercase tracking-[0.18em] rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-100 px-3 py-1">
                              Not configured
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-blue-300 mt-1">
                          {gh && (
                            <a
                              href={`https://github.com/${gh}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-blue-200 transition-colors flex items-center"
                              aria-label="GitHub profile"
                            >
                              <GithubIcon className="w-4 h-4" />
                            </a>
                          )}
                          {linkedin && (
                            <a
                              href={linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-blue-200 transition-colors flex items-center"
                              aria-label="LinkedIn profile"
                            >
                              <LinkedinIcon className="w-4 h-4" />
                            </a>
                          )}
                        </div>

                        <div className="text-xs text-gray-400 font-thin-custom truncate">
                          {repos.length ? (
                            <span className="flex flex-wrap gap-x-2 gap-y-1">
                              {repos.map((r, i) => (
                                <a
                                  key={`${r}-${i}`}
                                  href={`https://github.com/${r}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-blue-200 transition-colors underline underline-offset-2 break-all"
                                  title={r}
                                >
                                  {r}
                                </a>
                              ))}
                            </span>
                          ) : (
                            '—'
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="w-full flex items-center justify-between md:flex-col md:items-center md:justify-center md:space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400">Points</p>
                      <div className="flex flex-col items-end md:items-center">
                        <p className={`text-lg font-semibold ${configuredOk ? 'text-emerald-200' : 'text-amber-200'}`}>{formatPoints(score)}</p>
                        {bonusPoints !== 0 ? (
                          <p className="text-[11px] text-gray-400">
                            Base {formatPoints(baseScore)} <span className="text-gray-600">+ </span>
                            Bonus {formatSigned(bonusPoints)}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="w-full flex items-center justify-between md:flex-col md:items-center md:justify-center md:space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400">DSoC26 Merges</p>
                      <p className="text-lg font-semibold text-emerald-200">
                        {formatSigned(mergesPlus)}
                        <span className="text-xs text-gray-400 font-thin-custom ml-2">({formatNum(mergesCount)} PRs)</span>
                      </p>
                    </div>

                    <div className="w-full flex items-center justify-between md:flex-col md:items-center md:justify-center md:space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400">Response / Penalty</p>
                      <div className="text-sm text-gray-200 text-right md:text-center">
                        <div>
                          <span className="text-gray-400">PR first:</span>{' '}
                          <span className="text-purple-100 font-semibold">+{formatNum(prFirstPlus)}</span>{' / '}
                          <span className="text-amber-200 font-semibold">{formatSigned(prFirstMinus)}</span>
                        </div>
                        <div className="mt-1">
                          <span className="text-gray-400">Inaction:</span>{' '}
                          <span className="text-amber-200 font-semibold">PR {formatSigned(prInactionMinus)}</span>
                          <span className="text-gray-400"> · </span>
                          <span className="text-amber-200 font-semibold">Issue {formatSigned(issueInactionMinus)}</span>
                        </div>
                        <div className="mt-1">
                          <span className="text-gray-400">Issue close:</span>{' '}
                          <span className="text-emerald-200 font-semibold">+{formatNum(issueClosePlus)}</span>
                          <span className="text-gray-400"> / </span>
                          <span className="text-amber-200 font-semibold">{formatSigned(issueCloseMinus)}</span>
                        </div>
                        <div className="mt-1">
                          <span className="text-gray-400">Weekly:</span>{' '}
                          <span className="text-emerald-200 font-semibold">{formatSigned(weeklyPlus)}</span>
                          <span className="text-gray-400"> / </span>
                          <span className="text-amber-200 font-semibold">{formatSigned(weeklyMinus)}</span>
                        </div>
                        <div className="mt-3 flex items-center justify-end md:justify-center">
                          <button
                            type="button"
                            onClick={() => openHistory(a)}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 border border-white/15 hover:border-white/40 hover:bg-white/15 transition-colors"
                            aria-label="View history"
                            title="View history"
                          >
                            <svg aria-hidden="true" viewBox="0 0 64 64" className="w-5 h-5 text-amber-300" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="14" cy="32" r="7" />
                              <circle cx="50" cy="14" r="7" />
                              <circle cx="50" cy="50" r="7" />
                              <path d="M21 32h15M43 14H21m22 36H21" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {errors.length > 0 && (
                    <div className="relative mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                      {errors[0]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && admins.length > 0 && totalPages > 1 && (
          <div className="mb-16 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-5 py-2 rounded-full border border-white/10 bg-white/5 text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition"
            >
              Prev
            </button>
            <div className="text-xs uppercase tracking-[0.22em] text-gray-400">
              Page <span className="text-white font-semibold">{page}</span> /{' '}
              <span className="text-white font-semibold">{totalPages}</span>
            </div>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-5 py-2 rounded-full border border-white/10 bg-white/5 text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition"
            >
              Next
            </button>
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
}

function ProjectAdminLeaderboardWithSearchParams() {
  const searchParams = useSearchParams();
  const snapshotId = searchParams?.get?.('snapshotId') || '';
  const forceLive = searchParams?.get?.('live') === '1';
  return <ProjectAdminLeaderboardContent snapshotId={snapshotId} forceLive={forceLive} />;
}

export default function ProjectAdminLeaderboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-gray-100 overflow-x-hidden">
          <Navbar />
          <div className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-14 max-w-6xl">
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
              <div className="text-gray-300 font-thin-custom">Loading leaderboard…</div>
            </div>
          </div>
          <Footer />
        </div>
      }
    >
      <ProjectAdminLeaderboardWithSearchParams />
    </Suspense>
  );
}
