'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { profileService } from '@/lib/supabase/services/profile';
import { UserProfile } from '@/lib/domain/types';
import { useWebPush } from '@/hooks/use-web-push';

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    authLoading: boolean;
    profileLoading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    authLoading: true,
    profileLoading: false,
    signOut: async () => { },
    refreshProfile: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(false);
    const supabaseRef = useRef(createClient());
    const userRef = useRef<User | null>(null);
    const profileFetchControllerRef = useRef<AbortController | null>(null);

    const supabase = supabaseRef.current;

    // Auto-register web push token when user is authenticated (PWA only)
    useWebPush(user?.id ?? null);

    const refreshProfile = useCallback(async () => {
        if (user) {
            try {
                const userProfile = await profileService.getProfile(user.id);
                setProfile(userProfile);
            } catch (error) {
                console.error('Error loading profile:', error);
            }
        }
    }, [user]);

    useEffect(() => {
        let cancelled = false;

        const SESSION_TIMEOUT_MS = 15000;

        const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> =>
            Promise.race([
                promise,
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error(`${label} timed out`)), ms)
                ),
            ]);

        const checkSession = async () => {
            try {
                // Try getSession() — retry once on timeout
                let session = null;
                try {
                    const { data } = await withTimeout(supabase.auth.getSession(), SESSION_TIMEOUT_MS, 'Session check');
                    session = data.session;
                } catch {
                    // Retry once
                    const { data } = await withTimeout(supabase.auth.getSession(), SESSION_TIMEOUT_MS, 'Session check retry');
                    session = data.session;
                }
                if (cancelled) return;

                const currentUser = session?.user ?? null;
                setUser(currentUser);
                setAuthLoading(false);

                if (currentUser) {
                    await fetchProfile(currentUser.id);
                }
            } catch (error) {
                // getSession failed twice — try getUser() as fallback (works server-side)
                try {
                    const { data: { user: fallbackUser } } = await withTimeout(
                        supabase.auth.getUser(),
                        SESSION_TIMEOUT_MS,
                        'getUser fallback'
                    );
                    if (cancelled) return;
                    if (fallbackUser) {
                        setUser(fallbackUser);
                        setAuthLoading(false);
                        await fetchProfile(fallbackUser.id);
                        return;
                    }
                } catch {
                    // Both methods failed — likely a corrupted or expired token
                    console.error("Session restore failed, clearing session", error);
                }
                if (cancelled) return;
                // Clear corrupted state so the app can proceed to login
                await supabase.auth.signOut().catch(() => {});
                setUser(null);
                setProfile(null);
                setAuthLoading(false);
            }
        };

        const fetchProfile = async (userId: string) => {
            setProfileLoading(true);
            try {
                const userProfile = await withTimeout(
                    profileService.getProfile(userId),
                    10000,
                    'Profile fetch'
                );
                if (!cancelled) setProfile(userProfile as UserProfile);
            } catch (profileError) {
                console.error('Profile fetch error', profileError);
            } finally {
                if (!cancelled) setProfileLoading(false);
            }
        };

        checkSession();

        // Proactive token refresh — call getUser() every 50 minutes to trigger
        // Supabase's automatic token refresh before the 60-minute JWT expiry.
        const REFRESH_INTERVAL_MS = 50 * 60 * 1000; // 50 minutes
        const refreshInterval = setInterval(() => {
            supabase.auth.getUser().catch(() => {
                // Silently ignore — will be caught by onAuthStateChange if session expires
            });
        }, REFRESH_INTERVAL_MS);

        // Auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            const currentUser = session?.user ?? null;
            const previousUser = userRef.current;
            userRef.current = currentUser;
            setUser(currentUser);

            if (event === 'SIGNED_OUT' || !currentUser) {
                setProfile(null);
                setUser(null);
                userRef.current = null;
                setAuthLoading(false);
                return;
            }

            setAuthLoading(false);

            const userChanged = !previousUser || currentUser.id !== previousUser.id;
            if (userChanged) {
                // Cancel any in-flight profile fetch to prevent stale data overwriting
                if (profileFetchControllerRef.current) {
                    profileFetchControllerRef.current.abort();
                }
                const controller = new AbortController();
                profileFetchControllerRef.current = controller;

                setProfileLoading(true);
                const PROFILE_TIMEOUT_MS = 15000;
                const fetchWithTimeout = () => Promise.race([
                    profileService.getProfile(currentUser.id),
                    new Promise<never>((_, reject) =>
                        setTimeout(() => reject(new Error('Profile fetch timed out')), PROFILE_TIMEOUT_MS)
                    ),
                ]);
                try {
                    let userProfile: UserProfile | null = null;
                    try {
                        userProfile = await fetchWithTimeout() as UserProfile;
                    } catch {
                        // Retry once on timeout
                        userProfile = await fetchWithTimeout() as UserProfile;
                    }
                    if (!cancelled && !controller.signal.aborted) setProfile(userProfile);
                } catch (e) {
                    if (!cancelled && !controller.signal.aborted) setProfile(null);
                } finally {
                    if (!cancelled && !controller.signal.aborted) setProfileLoading(false);
                }
            }
        });

        return () => {
            clearInterval(refreshInterval);
            subscription.unsubscribe();
        };
    }, []);

    const handleSignOut = useCallback(async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        userRef.current = null;
    }, []);

    const contextValue = useMemo(() => ({
        user,
        profile,
        authLoading,
        profileLoading,
        signOut: handleSignOut,
        refreshProfile,
    }), [user, profile, authLoading, profileLoading, handleSignOut, refreshProfile]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
