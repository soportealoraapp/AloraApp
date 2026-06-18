'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
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
    const supabase = createClient();
    const userRef = useRef<User | null>(null);

    // Auto-register web push token when user is authenticated (PWA only)
    useWebPush(user?.id ?? null);

    const refreshProfile = async () => {
        if (user) {
            try {
                const userProfile = await profileService.getProfile(user.id);
                setProfile(userProfile);
            } catch (error) {
                console.error('Error loading profile:', error);
            }
        }
    };

    useEffect(() => {
        let cancelled = false;

        // Initial session check with defensive timeout
        const checkSession = async () => {
            const SESSION_TIMEOUT_MS = 15000;

            try {
                // Separate timeout for session restore only
                const { data: { session } } = await Promise.race([
                    supabase.auth.getSession(),
                    new Promise<never>((_, reject) =>
                        setTimeout(() => reject(new Error('Session check timed out')), SESSION_TIMEOUT_MS)
                    ),
                ]);
                if (cancelled) return;

                const currentUser = session?.user ?? null;
                setUser(currentUser);
                setAuthLoading(false);

                // Independent profile fetch with its own timeout
                if (currentUser) {
                    setProfileLoading(true);
                    try {
                        const userProfile = await Promise.race([
                            profileService.getProfile(currentUser.id),
                            new Promise<never>((_, reject) =>
                                setTimeout(() => reject(new Error('Profile fetch timed out')), 10000)
                            ),
                        ]);
                        if (!cancelled) setProfile(userProfile as UserProfile);
                    } catch (profileError) {
                        console.error('Profile fetch error', profileError);
                    } finally {
                        if (!cancelled) setProfileLoading(false);
                    }
                }
            } catch (error) {
                console.error("Session check error", error);
                if (!cancelled) setAuthLoading(false);
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

            // Fetch profile when user changes (new sign-in) or on INITIAL_SESSION if no profile loaded
            const userChanged = !previousUser || currentUser.id !== previousUser.id;
            if (userChanged) {
                setProfileLoading(true);
                try {
                    const userProfile = await profileService.getProfile(currentUser.id);
                    setProfile(userProfile);
                } catch (e) {
                    console.error("Profile fetch on auth change failed", e);
                    setProfile(null);
                } finally {
                    setProfileLoading(false);
                }
            }
        });

        return () => {
            clearInterval(refreshInterval);
            subscription.unsubscribe();
        };
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        userRef.current = null;
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                authLoading,
                profileLoading,
                signOut: handleSignOut,
                refreshProfile,
            }}
        >
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
