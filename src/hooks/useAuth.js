'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
// Unified auth hook: merges local application user (dsoc_user) and github_session cookie session
export default function useAuth() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const buildLocalUsername = (email) => {
        if (!email) return null;
        return email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    };

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Local application user (after Application ID login)
            const localStr = typeof window !== 'undefined' ? localStorage.getItem('ecwoc_user') : null;
            if (localStr) {
                try {
                    const localUser = JSON.parse(localStr);
                    setUser(localUser);
                    setLoading(false);
                    return;
                } catch (e) {
                    console.error('Failed parsing local ecwoc_user:', e);
                    localStorage.removeItem('ecwoc_user');
                }
            }

            // 2. GitHub OAuth session cookie fallback
            const sessionRes = await fetch('/api/auth/session', { cache: 'no-store' });
            let sessionData = null;
            try {
                // Some environments may return empty body or non-JSON; guard parsing
                const contentType = sessionRes.headers.get('content-type') || '';
                if (!sessionRes.ok) {
                    sessionData = null;
                } else if (contentType.includes('application/json')) {
                    sessionData = await sessionRes.json();
                } else {
                    const rawText = await sessionRes.text();
                    sessionData = rawText ? JSON.parse(rawText) : null;
                }
            } catch (parseErr) {
                console.warn('Session parse failed:', parseErr);
                sessionData = null;
            }
            if (sessionData?.user?.email) {
                const email = sessionData.user.email.toLowerCase();
                // Attempt to get application status/profile
                let mergedUser = {
                    name: sessionData.user.name,
                    email,
                    username: sessionData.user.username || buildLocalUsername(email),
                    image: sessionData.user.image,
                    isApproved: false,
                    role: null,
                    status: null,
                    applicationId: null,
                    hasProfile: false
                };
                try {
                    const profileRes = await fetch(`/api/user/profile?email=${encodeURIComponent(email)}`);
                    let profile = null;
                    try {
                        const ct = profileRes.headers.get('content-type') || '';
                        if (profileRes.ok && ct.includes('application/json')) {
                            profile = await profileRes.json();
                        } else if (profileRes.ok) {
                            const text = await profileRes.text();
                            profile = text ? JSON.parse(text) : null;
                        }
                    } catch (pe) {
                        profile = null;
                    }
                    if (profile?.success && profile?.data?.application) {
                        mergedUser = {
                            ...mergedUser,
                            role: profile.data.application.role,
                            status: profile.data.application.status,
                            applicationId: profile.data.application.id,
                            isApproved: profile.data.application.status === 'approved',
                            hasProfile: (profile.data.idCards || []).length > 0,
                        };
                    }
                } catch (e) {
                    // Non-critical
                }
                setUser(mergedUser);
            } else {
                setUser(null);
            }
        } catch (e) {
            console.error('Auth refresh error:', e);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    // Listen for global auth change events
    useEffect(() => {
        const handler = () => refresh();
        window.addEventListener('ecwoc-auth-changed', handler);
        return () => window.removeEventListener('ecwoc-auth-changed', handler);
    }, [refresh]);

    const isLoggedIn = !!user;

    const setLocalUser = (u) => {
        try {
            localStorage.setItem('ecwoc_user', JSON.stringify(u));
            setUser(u);
            window.dispatchEvent(new Event('ecwoc-auth-changed'));
        } catch (e) {
            console.error('Failed to set local user:', e);
        }
    };

    const logout = async () => {
        try {
            await fetch('/api/auth/signout', { method: 'POST' });
        } catch (e) {
            // ignore
        }
        localStorage.removeItem('ecwoc_user');
        setUser(null);
        router.push("/login")
        window.dispatchEvent(new Event('ecwoc-auth-changed'));
    };

    return { user, isLoggedIn, loading, refresh, logout, setLocalUser };
}
