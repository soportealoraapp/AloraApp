'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Global edge-swipe-back gesture for native-like navigation.
 * Activates when touch starts within 30px of the left edge.
 */
export function useEdgeSwipeBack() {
    const router = useRouter();
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);
    const swipingRef = useRef(false);

    useEffect(() => {
        const handleTouchStart = (e: TouchEvent) => {
            const x = e.touches[0].clientX;
            const y = e.touches[0].clientY;
            if (x < 30) {
                touchStartRef.current = { x, y };
                swipingRef.current = false;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!touchStartRef.current) return;
            const dx = e.touches[0].clientX - touchStartRef.current.x;
            const dy = Math.abs(e.touches[0].clientY - touchStartRef.current.y);
            // Must be horizontal and > 60px
            if (dx > 60 && dy < 60) {
                swipingRef.current = true;
            }
        };

        const handleTouchEnd = () => {
            if (swipingRef.current) {
                router.back();
            }
            touchStartRef.current = null;
            swipingRef.current = false;
        };

        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [router]);
}
