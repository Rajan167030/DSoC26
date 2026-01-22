"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import toast from 'react-hot-toast';

function formatIST(dateLike) {
  if (!dateLike) return '—';
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (Number.isNaN(d.getTime())) return '—';
  try {
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return d.toISOString();
  }
}

export default function AdminMasterPage() {
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(true);

  const [paSnapshots, setPaSnapshots] = useState([]);
  const [paSnapshotsLoading, setPaSnapshotsLoading] = useState(false);
  const [paSelectedSnapshotId, setPaSelectedSnapshotId] = useState('');
  const [paPublishLoading, setPaPublishLoading] = useState(false);
  const [paLastPublishedAt, setPaLastPublishedAt] = useState('');
  const [paActiveSnapshotId, setPaActiveSnapshotId] = useState('');
  const [paActivating, setPaActivating] = useState(false);

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

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuthenticated');
    setAuthPassword('');
    fetch('/api/admin/session', { method: 'DELETE' }).catch(() => {});
  };

  const loadPaSnapshots = async () => {
    setPaSnapshotsLoading(true);
    try {
      const res = await fetch('/api/leaderboard/project-admin?list=1', { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(json?.snapshots)) {
        setPaSnapshots(json.snapshots);
        setPaActiveSnapshotId(String(json?.activeSnapshotId || ''));
        const first = json.snapshots[0];
        if (first?.id) setPaSelectedSnapshotId(String(first.id));
        if (first?.generatedAt) setPaLastPublishedAt(String(first.generatedAt));
      } else {
        setPaSnapshots([]);
        setPaSelectedSnapshotId('');
        setPaLastPublishedAt('');
        setPaActiveSnapshotId('');
      }
    } catch {
      setPaSnapshots([]);
      setPaSelectedSnapshotId('');
      setPaLastPublishedAt('');
      setPaActiveSnapshotId('');
    } finally {
      setPaSnapshotsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadPaSnapshots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const fetchLatest = async () => {
    setPaPublishLoading(true);
    try {
      const res = await fetch('/api/leaderboard/project-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAuthError(json?.error || 'Failed to publish.');
        return;
      }
      if (json?.generatedAt) setPaLastPublishedAt(String(json.generatedAt));
      toast.success('Fetched latest successfully.');
      await loadPaSnapshots();
    } catch {
      setAuthError('Failed to publish.');
    } finally {
      setPaPublishLoading(false);
    }
  };

  const activatePaSnapshot = async (snapshotId, { successMessage } = {}) => {
    const sid = String(snapshotId || '').trim();
    if (!sid) return;
    setPaActivating(true);
    setAuthError('');
    try {
      const res = await fetch('/api/leaderboard/project-admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshotId: sid }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAuthError(json?.error || 'Failed to activate snapshot.');
        return;
      }
      setPaActiveSnapshotId(String(json?.activeSnapshotId || sid));
      toast.success(successMessage || 'Active snapshot updated.');
    } catch {
      setAuthError('Failed to activate snapshot.');
    } finally {
      setPaActivating(false);
    }
  };

  const lastPublishedDisplay = useMemo(() => formatIST(paLastPublishedAt), [paLastPublishedAt]);
  const activeSnapshotLabel = useMemo(() => {
    const sid = String(paActiveSnapshotId || '').trim();
    if (!sid) return 'Latest snapshot (default)';
    const found = (paSnapshots || []).find((s) => String(s?.id || '') === sid);
    const when = found?.generatedAt ? formatIST(found.generatedAt) : null;
    return when ? `Active: ${when}` : 'Active snapshot set';
  }, [paActiveSnapshotId, paSnapshots]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 pb-10 max-w-3xl">
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8">
            <h1 className="text-2xl font-bold text-white">Admin Master</h1>
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
            <h1 className="text-2xl font-bold text-white">Admin Master</h1>
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

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-14 max-w-6xl">
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Master Tools</h1>
            <p className="mt-2 text-gray-300">Sensitive admin utilities. Keep this page private.</p>
          </div>
          <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-3 w-full sm:w-auto">
            <button
              onClick={() => router.push('/admin')}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm text-white font-semibold transition w-full sm:w-auto"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Back to Admin
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 text-sm text-white font-semibold hover:from-red-600 hover:to-red-700 transition w-full sm:w-auto"
            >
              <span className="material-symbols-outlined">logout</span>
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Bonus Points</h2>
                <p className="mt-2 text-gray-300 text-sm">Add or adjust manual bonus points in the leaderboard DB.</p>
              </div>
              <button
                onClick={() => router.push('/admin/bonus-points')}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm text-white font-semibold hover:from-purple-700 hover:to-blue-700 transition w-full sm:w-auto"
              >
                <span className="material-symbols-outlined">add_circle</span>
                Open
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Project Admin Leaderboard</h2>
                <p className="mt-2 text-gray-300 text-sm">Publish a snapshot (including PR/issue history) for fast leaderboard + history views.</p>
                <p className="mt-2 text-xs text-gray-400">Last Fetched: <span className="font-semibold text-gray-200">{lastPublishedDisplay}</span></p>
                <p className="mt-1 text-xs text-gray-400">{activeSnapshotLabel}</p>
              </div>

              <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-3 w-full sm:w-auto">
                <button
                  onClick={fetchLatest}
                  disabled={paPublishLoading}
                  className={`inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm text-white font-semibold transition ${
                    paPublishLoading ? 'opacity-70 cursor-not-allowed' : 'hover:from-emerald-700 hover:to-teal-700'
                  } w-full sm:w-auto`}
                >
                  <span className="material-symbols-outlined">publish</span>
                  {paPublishLoading ? 'Fetching…' : 'Fetch Latest'}
                </button>

                <button
                  onClick={() => router.push('/leaderboard/project-admin')}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm text-white font-semibold hover:from-indigo-700 hover:to-purple-700 transition w-full sm:w-auto"
                >
                  <span className="material-symbols-outlined">leaderboard</span>
                  Open Curr
                </button>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <div className="text-sm font-semibold text-gray-200">Snapshots</div>
              <select
                value={paSelectedSnapshotId}
                onChange={(e) => setPaSelectedSnapshotId(e.target.value)}
                className="px-4 py-2 rounded-full border border-white/10 text-sm text-white bg-black/40 focus:ring-2 focus:ring-purple-500/60 focus:border-transparent"
                disabled={paSnapshotsLoading || paSnapshots.length === 0}
              >
                {paSnapshots.length === 0 ? (
                  <option value="">No snapshots</option>
                ) : (
                  paSnapshots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {formatIST(s.generatedAt)}
                    </option>
                  ))
                )}
              </select>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    if (!paSelectedSnapshotId) return;
                    router.push(`/leaderboard/project-admin?snapshotId=${encodeURIComponent(paSelectedSnapshotId)}`);
                  }}
                  disabled={!paSelectedSnapshotId}
                  className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                    paSelectedSnapshotId
                      ? 'bg-white text-black hover:bg-gray-200'
                      : 'bg-white/10 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Open Selected
                </button>

                <button
                  onClick={() => activatePaSnapshot(paSelectedSnapshotId, { successMessage: 'Snapshot set as active.' })}
                  disabled={!paSelectedSnapshotId || paActivating}
                  className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                    !paSelectedSnapshotId || paActivating
                      ? 'bg-white/10 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                  }`}
                >
                  {paActivating ? 'Activating…' : 'Set Active'}
                </button>

                <button
                  onClick={() => {
                    const latest = paSnapshots?.[0]?.id;
                    if (!latest) return;
                    activatePaSnapshot(latest, { successMessage: '1st snapshot activated.' });
                  }}
                  disabled={paSnapshots.length === 0 || paActivating}
                  className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                    paSnapshots.length === 0 || paActivating
                      ? 'bg-white/10 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700'
                  }`}
                >
                  {paActivating ? 'Activating…' : 'Activate 1st one'}
                </button>
              </div>
            </div>

            {authError ? (
              <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {authError}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
