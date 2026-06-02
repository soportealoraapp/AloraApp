'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { profileService } from '@/lib/supabase/services/profile';
import { UserProfile } from '@/lib/domain/types';

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    signOut: async () => { },
    refreshProfile: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

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
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Session check timed out')), SESSION_TIMEOUT_MS)
            );

            try {
                await Promise.race([
                    (async () => {
                        const { data: { session } } = await supabase.auth.getSession();
                        if (cancelled) return;
                        setUser(session?.user ?? null);

                        if (session?.user) {
                            const userProfile = await profileService.getProfile(session.user.id);
                            if (cancelled) return;
                            setProfile(userProfile);
                        }
                    })(),
                    timeoutPromise
                ]);
            } catch (error) {
                console.error("Session check error", error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        checkSession();

        // Auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (event === 'SIGNED_OUT' || !currentUser) {
                setProfile(null);
                setUser(null);
                setLoading(false);
                return;
            }

            if (currentUser && currentUser.id !== user?.id) {
                // User changed (e.g. login), fetch profile
                try {
                    const userProfile = await profileService.getProfile(currentUser.id);
                    setProfile(userProfile);
                } catch (e) {
                    console.error("Profile fetch on auth change failed", e);
                }
            }

            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                loading,
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
