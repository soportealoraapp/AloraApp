'use client';

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const PUBLIC_ROUTES = ['/login', '/signup', '/auth/callback', '/', '/onboarding'];

export function AuthGate({ children }: { children: React.ReactNode }) {
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (loading) return;

        const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

        if (!user && !isPublicRoute) {
            router.replace('/login');
        } else if (user && profile && (pathname === '/login' || pathname === '/signup' || pathname === '/onboarding')) {
            router.replace('/discover');
        }
    }, [user, profile, loading, pathname, router]);

    if (loading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
                <div className="relative">
                    <div className="absolute inset-0 bg-pink-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                    <Loader2 className="h-10 w-10 animate-spin text-pink-500 relative z-10" />
                </div>
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-pink-500/60 animate-pulse">
                    Alora
                </p>
            </div>
        );
    }

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    if (!user && !isPublicRoute) return null;

    return <>{children}</>;
}
