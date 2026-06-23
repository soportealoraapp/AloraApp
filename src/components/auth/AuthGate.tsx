'use client';

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const PUBLIC_ROUTES = ['/login', '/signup', '/auth/callback', '/', '/onboarding'];

export function AuthGate({ children }: { children: React.ReactNode }) {
    const { user, profile, authLoading: loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [hasChecked, setHasChecked] = useState(false);
    const [timedOut, setTimedOut] = useState(false);

    useEffect(() => {
        if (loading) return;
        setHasChecked(true);
    }, [loading]);

    // Safety timeout: if authLoading never resolves, force check after 15s
    useEffect(() => {
        if (hasChecked) return;
        const timeout = setTimeout(() => {
            if (!hasChecked) {
                setTimedOut(true);
                setHasChecked(true);
            }
        }, 15000);
        return () => clearTimeout(timeout);
    }, [hasChecked]);

    useEffect(() => {
        if (!hasChecked) return;

        const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

        if (!user && !isPublicRoute) {
            router.replace('/login');
        } else if (user && profile && (pathname === '/login' || pathname === '/signup')) {
            if (!profile.isCompleted) {
                router.replace('/onboarding');
            } else {
                router.replace('/discover');
            }
        } else if (user && profile && pathname === '/onboarding' && profile.isCompleted) {
            router.replace('/discover');
        } else if (user && !profile && !isPublicRoute && pathname !== '/onboarding') {
            router.replace('/onboarding');
        }
    }, [user, profile, hasChecked, pathname, router]);

    if (loading && !hasChecked) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                    <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
                </div>
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-primary/60 animate-pulse">
                    Alora
                </p>
            </div>
        );
    }

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    if (!user && !isPublicRoute && hasChecked) return null;

    return <>{children}</>;
}
