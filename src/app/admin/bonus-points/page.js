"use client";

import { useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

function parseUsernamesPreview(raw) {
  const parts = String(raw || '')
    .split(/[\s,]+/g)
    .map((p) => p.trim())
    .filter(Boolean);

  const usernameRegex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
  const seenValid = new Set();
  const valid = [];
  const invalid = [];
  const duplicates = [];
  const tokens = [];

  const cleanToken = (s) => String(s || '').trim().replace(/^@+/, '');

  for (let i = 0; i < parts.length; i++) {
    const original = parts[i];
    if (!original) continue;

    const cleaned = cleanToken(original);
    const lower = cleaned.toLowerCase();

    if (!cleaned || !usernameRegex.test(cleaned)) {
      invalid.push({ value: cleaned || original, index: i });
      tokens.push({ value: cleaned || original, original, cleaned, lower, index: i, isValid: false, isDuplicate: false });
      continue;
    }
    if (seenValid.has(lower)) {
      duplicates.push({ value: cleaned, index: i });
      tokens.push({ value: cleaned, original, cleaned, lower, index: i, isValid: true, isDuplicate: true });
      continue;
    }
    seenValid.add(lower);
    valid.push(cleaned);
    tokens.push({ value: cleaned, original, cleaned, lower, index: i, isValid: true, isDuplicate: false });
  }

  return { all: parts, valid, invalid, duplicates, tokens };
}

export default function BonusPointsAdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [raw, setRaw] = useState('');
  const [task, setTask] = useState('');
  const [reason, setReason] = useState('');
  const [points, setPoints] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [recent, setRecent] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [lastBatchCreatedAt, setLastBatchCreatedAt] = useState('');
  const [lastBatchTask, setLastBatchTask] = useState('');
  const [renameTaskValue, setRenameTaskValue] = useState('');
  const [renamingTask, setRenamingTask] = useState(false);
  const [previewTab, setPreviewTab] = useState('valid');
  const [roleFilter, setRoleFilter] = useState('all');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState(null);
  const [lookupMap, setLookupMap] = useState(null);
  const [invalidEdits, setInvalidEdits] = useState({});

  const checkServerSession = async () => {
    try {
      const res = await fetch('/api/admin/session', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      const ok = Boolean(res.ok && data?.authenticated);
      setIsAuthenticated(ok);
      if (ok) sessionStorage.setItem('adminAuthenticated', 'true');
      else sessionStorage.removeItem('adminAuthenticated');
      return ok;
    } catch {
      setIsAuthenticated(false);
      sessionStorage.removeItem('adminAuthenticated');
      return false;
    }
  };

  useEffect(() => {
    let active = true;
    const run = async () => {
      setAuthLoading(true);
      const ok = await checkServerSession();
      if (!active) return;
      setAuthLoading(false);
      if (!ok) setAuthError('');
    };
    void run();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const preview = useMemo(() => parseUsernamesPreview(raw), [raw]);

  useEffect(() => {
    // Reset validation results when input changes.
    setLookupMap(null);
    setLookupError(null);
    setRoleFilter('all');
  }, [raw]);

  const normalizeGh = (v) => String(v || '').trim().replace(/^@/, '').toLowerCase();

  const lookupRoles = async () => {
    if (!preview.valid.length) return;
    setLookupError(null);
    setLookupLoading(true);
    try {
      const res = await fetch('/api/admin/bonus-points/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubUsernames: preview.valid }),
      });
      const data = await res.json();
      if (res.ok && data?.success && Array.isArray(data?.items)) {
        const map = new Map();
        for (const it of data.items) {
          const key = normalizeGh(it?.githubUsernameLower || it?.githubUsername);
          if (!key) continue;
          map.set(key, it);
        }
        setLookupMap(map);
      } else {
        setLookupError(data?.message || 'Failed to validate usernames.');
        setLookupMap(null);
      }
    } catch {
      setLookupError('Failed to validate usernames.');
      setLookupMap(null);
    } finally {
      setLookupLoading(false);
    }
  };

  const roleCounts = useMemo(() => {
    const counts = { contributor: 0, 'project-admin': 0, admin: 0, other: 0, unknown: 0 };
    if (!lookupMap) return counts;
    for (const gh of preview.valid) {
      const key = normalizeGh(gh);
      const item = lookupMap.get(key);
      if (!item || !item.exists) {
        counts.unknown += 1;
        continue;
      }
      const role = String(item.role || '').toLowerCase();
      if (role === 'contributor') counts.contributor += 1;
      else if (role === 'project-admin') counts['project-admin'] += 1;
      else if (role === 'admin') counts.admin += 1;
      else counts.other += 1;
    }
    return counts;
  }, [lookupMap, preview.valid]);

  const previewList = useMemo(() => {
    const tab = String(previewTab || 'valid');

    let list = [];
    if (tab === 'all') list = preview.tokens;
    else if (tab === 'valid') list = preview.valid;
    else if (tab === 'invalid') list = preview.invalid;
    else if (tab === 'duplicates') list = preview.duplicates;
    else list = preview.valid;

    if (!lookupMap) return list;
    if (tab !== 'valid') return list;
    if (roleFilter === 'all') return list;

    return list.filter((gh) => {
      const key = normalizeGh(gh);
      const item = lookupMap.get(key);
      const exists = Boolean(item?.exists);
      const role = String(item?.role || '').toLowerCase();

      if (roleFilter === 'unknown') return !exists;
      if (!exists) return false;
      if (roleFilter === 'contributor') return role === 'contributor';
      if (roleFilter === 'project-admin') return role === 'project-admin';
      if (roleFilter === 'admin') return role === 'admin';
      if (roleFilter === 'other') return role !== 'contributor' && role !== 'project-admin' && role !== 'admin';
      return true;
    });
  }, [preview, previewTab, lookupMap, roleFilter]);

  const buildRawFromTokens = (tokenList) => tokenList.map((t) => t.value).filter(Boolean).join('\n');

  const removeAllDuplicates = () => {
    const seen = new Set();
    const nextTokens = [];
    for (const t of preview.tokens) {
      const key = String(t?.value || '').trim().toLowerCase();
      if (!key) continue;
      if (seen.has(key)) continue;
      seen.add(key);
      nextTokens.push({ ...t, value: String(t.value).trim() });
    }
    setInvalidEdits({});
    setRaw(buildRawFromTokens(nextTokens));
    setPreviewTab('valid');
  };

  const removeTokenAtIndex = (indexToRemove) => {
    // Keep any in-progress invalid edits, but remap their indices since raw will be rebuilt.
    setInvalidEdits((prev) => {
      const next = {};
      for (const [k, v] of Object.entries(prev || {})) {
        const idx = parseInt(k, 10);
        if (!Number.isFinite(idx)) continue;
        if (idx === indexToRemove) continue;
        const nextIdx = idx > indexToRemove ? idx - 1 : idx;
        next[String(nextIdx)] = v;
      }
      return next;
    });

    const nextTokens = preview.tokens.filter((t) => t.index !== indexToRemove);
    setRaw(buildRawFromTokens(nextTokens));
  };

  const applyInvalidEdits = () => {
    const nextTokens = preview.tokens.map((t) => {
      if (t.isValid) return t;
      const edited = invalidEdits[String(t.index)];
      if (!edited) return t;
      const cleaned = String(edited).trim().replace(/^@+/, '');
      return { ...t, value: cleaned || t.value };
    });
    setInvalidEdits({});
    setRaw(buildRawFromTokens(nextTokens));
    setPreviewTab('valid');
  };

  const renderPill = (key, label, count) => (
    <button
      key={key}
      type="button"
      onClick={() => setPreviewTab(key)}
      className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.18em] border transition ${
        previewTab === key
          ? 'border-white/20 bg-white/10 text-white'
          : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
      }`}
      aria-pressed={previewTab === key}
    >
      {label} <span className="ml-2 text-[11px] text-gray-400">{count}</span>
    </button>
  );

  const loadRecent = async () => {
    try {
      setRecentLoading(true);
      const res = await fetch('/api/admin/bonus-points?limit=50');
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.entries)) {
        setRecent(data.entries);
      } else {
        setRecent([]);
      }
    } catch {
      setRecent([]);
    } finally {
      setRecentLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadRecent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const doLogin = async (e) => {
    e?.preventDefault?.();
    setAuthError('');
    try {
      const res = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: authPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        setAuthPassword('');
        await checkServerSession();
        return;
      }
      setAuthError(data?.message || 'Incorrect password.');
    } catch {
      setAuthError('Login failed. Please try again.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 pb-10 max-w-3xl">
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8">
            <h1 className="text-2xl font-bold text-white">Bonus Points Admin</h1>
            <p className="mt-2 text-gray-300">Checking admin session…</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 pb-10 max-w-3xl">
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8">
            <h1 className="text-2xl font-bold text-white">Bonus Points Admin</h1>
            <p className="mt-2 text-gray-300">Enter admin password to continue.</p>

            <form onSubmit={doLogin} className="mt-6 space-y-4">
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
                required
              />

              {authError ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {authError}
                </div>
              ) : null}

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 text-white font-semibold hover:from-purple-700 hover:to-blue-700 transition"
              >
                Login
              </button>
            </form>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const submit = async () => {
    setMessage(null);
    if (!task.trim()) {
      setMessage({ type: 'error', text: 'Task is required.' });
      return;
    }
    if (!Number.isFinite(Number(points)) || Number(points) === 0) {
      setMessage({ type: 'error', text: 'Points must be a non-zero number.' });
      return;
    }
    if (!preview.valid.length) {
      setMessage({ type: 'error', text: 'Paste at least one valid GitHub username.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/bonus-points/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw, task, reason, points: Number(points) }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ type: 'success', text: `Added bonus points to ${data.created}/${data.requested} users.` });
        setRaw('');
        setLastBatchCreatedAt(String(data?.batchCreatedAt || ''));
        setLastBatchTask(String(data?.task || task || ''));
        setRenameTaskValue('');
        await loadRecent();
      } else {
        setMessage({ type: 'error', text: data?.message || 'Failed to add bonus points.' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to add bonus points.' });
    } finally {
      setSubmitting(false);
    }
  };

  const renameTaskForLastBatch = async () => {
    const toTask = String(renameTaskValue || '').trim();
    if (!lastBatchCreatedAt) {
      setMessage({ type: 'error', text: 'No last batch found. Add bonus points first.' });
      return;
    }
    if (!toTask) {
      setMessage({ type: 'error', text: 'Enter a new task name.' });
      return;
    }

    setRenamingTask(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/bonus-points', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'batch',
          batchCreatedAt: lastBatchCreatedAt,
          fromTask: lastBatchTask,
          toTask,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.success) {
        setMessage({
          type: 'success',
          text: `Updated task for ${data.modified || 0} recent entries.`,
        });
        setLastBatchTask(toTask);
        await loadRecent();
      } else {
        setMessage({ type: 'error', text: data?.message || 'Failed to update task.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to update task.' });
    } finally {
      setRenamingTask(false);
    }
  };

  const renameTaskForVisibleRecent = async () => {
    const toTask = String(renameTaskValue || '').trim();
    if (!toTask) {
      setMessage({ type: 'error', text: 'Enter a new task name.' });
      return;
    }
    const ids = (recent || []).map((e) => e?._id).filter(Boolean);
    if (!ids.length) {
      setMessage({ type: 'error', text: 'No recent entries to update.' });
      return;
    }

    setRenamingTask(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/bonus-points', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'ids', ids, toTask }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        setMessage({ type: 'success', text: `Updated task for ${data.modified || 0} recent entries.` });
        await loadRecent();
      } else {
        setMessage({ type: 'error', text: data?.message || 'Failed to update task.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to update task.' });
    } finally {
      setRenamingTask(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 pt-28 pb-14 max-w-5xl">
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-7">
          <h1 className="text-3xl font-bold text-white">Bonus Points</h1>
          <p className="mt-2 text-gray-300">
            Paste GitHub usernames (space/comma/newline separated) and apply a bonus task.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 sm:p-7">
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Task (required)</label>
                <input
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  placeholder="e.g. Bonus Task #3 - Bug Bash"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Reason (optional)</label>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Completed extra challenge"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Points (can be negative)</label>
                <input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">GitHub usernames</label>
                <textarea
                  value={raw}
                  onChange={(e) => {
                    // If user manually edits the textarea, discard staged invalid edits
                    // (since indices/tokens may change in non-trivial ways).
                    setInvalidEdits({});
                    setRaw(e.target.value);
                  }}
                  rows={8}
                  placeholder="e.g.\nuser1 user2\nuser3,user4"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
                />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {renderPill('all', 'All', preview.all.length)}
                  {renderPill('valid', 'Valid', preview.valid.length)}
                  {renderPill('invalid', 'Invalid', preview.invalid.length)}
                  {renderPill('duplicates', 'Duplicates', preview.duplicates.length)}
                  <button
                    type="button"
                    disabled={!preview.duplicates.length}
                    onClick={removeAllDuplicates}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Remove all duplicates
                  </button>
                  {previewTab === 'invalid' && (
                    <button
                      type="button"
                      disabled={!preview.invalid.length}
                      onClick={applyInvalidEdits}
                      className="rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs text-white hover:bg-purple-500/15 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Apply invalid fixes
                    </button>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={lookupLoading || !preview.valid.length}
                    onClick={lookupRoles}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {lookupLoading ? 'Checking roles…' : 'Check roles (contributors / project-admin)'}
                  </button>

                  {lookupMap && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-gray-400">Filter:</span>
                      {[
                        ['all', 'All'],
                        ['contributor', `Contributors (${roleCounts.contributor})`],
                        ['project-admin', `Project Admins (${roleCounts['project-admin']})`],
                        ['admin', `Admins (${roleCounts.admin})`],
                        ['other', `Other (${roleCounts.other})`],
                        ['unknown', `Not Registered (${roleCounts.unknown})`],
                      ].map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setRoleFilter(key)}
                          className={`rounded-full px-3 py-2 text-xs border transition ${
                            roleFilter === key
                              ? 'border-white/20 bg-white/10 text-white'
                              : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                          }`}
                          aria-pressed={roleFilter === key}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {lookupError && (
                  <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {lookupError}
                  </div>
                )}

                <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-gray-400">
                      Showing
                      <span className="ml-2 text-white font-semibold">{previewTab}</span>
                      <span className="ml-2 text-gray-500">
                        ({previewList.length})
                      </span>
                    </div>
                    {previewTab === 'valid' && (
                      <div className="text-xs text-gray-400">
                        Bonus points apply to contributors and project admins.
                      </div>
                    )}
                  </div>

                  {previewList.length === 0 ? (
                    <div className="mt-3 text-sm text-gray-300">Nothing to show.</div>
                  ) : (
                    <div className="mt-3 max-h-56 overflow-auto pr-1 space-y-2">
                      {previewTab === 'all' && (
                        previewList.slice(0, 5000).map((t, idx) => (
                          <div key={`${t.value}-${t.index}-${idx}`} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                            <div className="min-w-0">
                              <div className="text-sm text-white font-semibold truncate">@{t.value}</div>
                              <div className="text-xs text-gray-500">
                                {t.isValid ? (t.isDuplicate ? 'valid (duplicate)' : 'valid') : 'invalid'}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeTokenAtIndex(t.index)}
                              className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-gray-200 hover:bg-white/10 transition"
                            >
                              Remove
                            </button>
                          </div>
                        ))
                      )}

                      {previewTab === 'valid' && (
                        previewList.slice(0, 5000).map((gh, idx) => {
                          const key = normalizeGh(gh);
                          const info = lookupMap?.get?.(key) || null;
                          const role = info?.exists ? String(info?.role || '').toLowerCase() : null;
                          const badge =
                            !lookupMap
                              ? null
                              : !info || !info.exists
                                ? { text: 'not registered', cls: 'border-amber-500/20 bg-amber-500/10 text-amber-100' }
                                : role === 'project-admin'
                                  ? { text: 'project-admin', cls: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-100' }
                                  : role === 'contributor'
                                    ? { text: 'contributor', cls: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100' }
                                    : role === 'admin'
                                      ? { text: 'admin', cls: 'border-purple-500/20 bg-purple-500/10 text-purple-100' }
                                      : { text: role || 'other', cls: 'border-white/10 bg-white/5 text-gray-200' };

                          return (
                            <div key={`${gh}-${idx}`} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                              <div className="min-w-0">
                                <div className="text-sm text-white font-semibold truncate">@{gh}</div>
                                {info?.exists && (info?.name || info?.username) ? (
                                  <div className="text-xs text-gray-400 truncate">
                                    {info?.name ? info.name : ''}{info?.name && info?.username ? ' • ' : ''}{info?.username ? info.username : ''}
                                  </div>
                                ) : null}
                              </div>
                              {badge ? (
                                <span className={`shrink-0 rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${badge.cls}`}>{badge.text}</span>
                              ) : null}
                            </div>
                          );
                        })
                      )}

                      {previewTab === 'duplicates' && (
                        previewList.slice(0, 5000).map((d, idx) => (
                          <div key={`${d.value}-${d.index}-${idx}`} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                            <div className="min-w-0">
                              <div className="text-sm text-white font-semibold truncate">@{d.value}</div>
                              <div className="text-xs text-gray-500">duplicate</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeTokenAtIndex(d.index)}
                              className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-gray-200 hover:bg-white/10 transition"
                            >
                              Remove
                            </button>
                          </div>
                        ))
                      )}

                      {previewTab === 'invalid' && (
                        previewList.slice(0, 5000).map((inv, idx) => (
                          <div key={`${inv.value}-${inv.index}-${idx}`} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                            <div className="shrink-0 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-amber-100">invalid</div>
                            <input
                              value={invalidEdits[String(inv.index)] ?? inv.value}
                              onChange={(e) => setInvalidEdits((prev) => ({ ...prev, [String(inv.index)]: e.target.value }))}
                              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
                              placeholder="Fix username (e.g. correct handle)"
                            />
                            <button
                              type="button"
                              onClick={() => removeTokenAtIndex(inv.index)}
                              className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-gray-200 hover:bg-white/10 transition"
                            >
                              Remove
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {message && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    message.type === 'success'
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100'
                      : 'border-red-500/20 bg-red-500/10 text-red-100'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <button
                type="button"
                disabled={submitting}
                onClick={submit}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 text-white font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {submitting ? 'Adding…' : 'Add Bonus Points'}
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold text-white">Recent bonus entries</h2>
              <button
                type="button"
                onClick={loadRecent}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white hover:bg-white/10 transition"
              >
                Refresh
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-sm font-semibold text-white">Fix task name</div>
              <div className="mt-1 text-xs text-gray-400">
                Use this if you pasted a batch and later realized the task name is wrong.
              </div>

              <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center">
                <input
                  value={renameTaskValue}
                  onChange={(e) => setRenameTaskValue(e.target.value)}
                  placeholder="New task name (e.g. Keploy Task)"
                  className="w-full md:flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
                />
                <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:justify-end">
                  <button
                    type="button"
                    disabled={renamingTask || !renameTaskValue.trim() || !lastBatchCreatedAt}
                    onClick={renameTaskForLastBatch}
                    className="w-full md:w-auto rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] sm:text-xs text-white hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    title={lastBatchCreatedAt ? `Last batch task: ${lastBatchTask || '(unknown)'}` : 'Add bonus points first'}
                  >
                    Rename last batch
                  </button>
                  <button
                    type="button"
                    disabled={renamingTask || !renameTaskValue.trim() || recent.length === 0}
                    onClick={renameTaskForVisibleRecent}
                    className="w-full md:w-auto rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] sm:text-xs text-white hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Renames the entries currently shown in Recent bonus entries"
                  >
                    Rename visible recent
                  </button>
                </div>
              </div>

              {lastBatchCreatedAt ? (
                <div className="mt-2 text-[11px] text-gray-500">
                  Last batch: {lastBatchTask ? `“${lastBatchTask}”` : 'unknown task'} · {new Date(lastBatchCreatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                </div>
              ) : null}
            </div>

            {recentLoading ? (
              <div className="mt-5 text-sm text-gray-300">Loading…</div>
            ) : recent.length === 0 ? (
              <div className="mt-5 text-sm text-gray-300">No entries yet.</div>
            ) : (
              <div className="mt-5 space-y-3 max-h-[60vh] sm:max-h-[520px] overflow-y-auto pr-1">
                {recent.map((e) => (
                  <div key={e._id} className="rounded-2xl border border-white/10 bg-black/30 px-3 sm:px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-white font-semibold truncate">@{e.githubUsername}</div>
                        <div className="text-xs text-gray-300 truncate">{e.task}</div>
                        {e.reason ? (
                          <div className="text-xs text-gray-400 mt-1">{e.reason}</div>
                        ) : null}
                      </div>
                      <div className="shrink-0 text-sm font-semibold text-purple-100">
                        {e.points > 0 ? `+${e.points}` : String(e.points)}
                      </div>
                    </div>
                    <div className="mt-2 text-[11px] text-gray-500">
                      {e.createdAt ? new Date(e.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
