'use client';

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button } from "@/components/ui/button";
import { Loader2, X, Heart, ArrowRight, ArrowLeft, Smile } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SafeImage } from "@/components/ui/safe-image";
import { HeartArrow } from "@/components/ui/custom/HeartArrow";
import { UserProfile } from "@/lib/domain/types";
import { Skeleton } from "@/components/ui/skeleton";
import { hapticsLight, hapticsMedium, hapticsHeavy } from "@/lib/mobile";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const FloatingMatchCard = dynamic(() => import("@/components/ui/premium/FloatingMatchCard").then(m => m.FloatingMatchCard), { ssr: false });

interface DiscoverFeedProps {
  profiles: any[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  browseMode: 'swipe' | 'grid';
  intent: 'dating' | 'friendship' | 'both';
  effectiveIntent?: 'dating' | 'friendship';
  intentChanging: boolean;
  onSwipe: (direction: 'left' | 'right') => void;
  onFlechado: () => void;
  onLoadMore: () => void;
  onAction: (profileId: string, action: 'like' | 'pass' | 'superlike') => Promise<void>;
  currentUserProfile: UserProfile | null;
  gridInteractionBadges: Map<string, any>;
  currentInteractionState: any;
  rewindedProfileId: string | null;
  tutorialStep: number | null;
  dismissTutorial: () => void;
  nextTutorialStep: () => void;
}

/**
 * DiscoverFeed manages the display of profiles in either Swipe or Grid mode.
 * It handles virtualization for the grid and gestures for the swipe view.
 */
export function DiscoverFeed({
  profiles,
  loading,
  loadingMore,
  hasMore,
  browseMode,
  intent,
  effectiveIntent,
  intentChanging,
  onSwipe,
  onFlechado,
  onLoadMore,
  onAction,
  currentUserProfile,
  gridInteractionBadges,
  currentInteractionState,
  rewindedProfileId,
  tutorialStep,
  dismissTutorial,
  nextTutorialStep
}: DiscoverFeedProps) {
  const router = useRouter();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [gridColumns, setGridColumns] = useState(2);
  const [pendingGridActions, setPendingGridActions] = useState<Set<string>>(new Set());

  // Infinite scroll observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, onLoadMore]);

  // Responsive grid columns
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 640px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setGridColumns(e.matches ? 3 : 2);
    handler(mql);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const gridRowCount = Math.ceil(profiles.length / gridColumns);
  const gridVirtualizer = useVirtualizer({
    count: gridRowCount,
    getScrollElement: () => gridContainerRef.current,
    estimateSize: () => 340,
    overscan: 2,
  });

  // Loading state with stable skeleton
  if (loading && (profiles.length === 0 || intentChanging)) {
    return (
      <div className="w-full max-w-sm space-y-4 px-4 animate-in fade-in duration-500">
        <Skeleton className="h-[500px] w-full rounded-3xl shadow-sm" />
        <div className="flex justify-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <Skeleton className="h-14 w-14 rounded-full" />
          <Skeleton className="h-14 w-14 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col items-center">
      <AnimatePresence mode="wait">
        {browseMode === 'grid' ? (
          <motion.div 
            key="grid-mode"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            ref={gridContainerRef} 
            className="w-full overflow-auto px-4 scrollbar-hide" 
            style={{ height: 'calc(100dvh - 240px)' }}
          >
            <div style={{ height: gridVirtualizer.getTotalSize(), position: 'relative' }}>
              {gridVirtualizer.getVirtualItems().map((virtualRow) => (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Array.from({ length: gridColumns }).map((_, colIndex) => {
                      const profileIndex = virtualRow.index * gridColumns + colIndex;
                      const profileData = profiles[profileIndex];
                      if (!profileData) return <div key={colIndex} />;
                      const p = profileData.profile;
                      
                       return (
                         <DiscoverGridItem
                           key={p.id}
                           profile={p}
                           intent={intent}
                           effectiveIntent={
                             intent !== 'both'
                               ? intent
                               : (p.connectionModes?.length === 1 && p.connectionModes[0] === 'friendship'
                                   ? 'friendship'
                                   : 'dating')
                           }
                           isPending={pendingGridActions.has(p.id)}
                           badge={gridInteractionBadges.get(p.id)}
                           onAction={async (action: 'like' | 'pass' | 'superlike') => {
                             setPendingGridActions(prev => new Set(prev).add(p.id));
                             await onAction(p.id, action);
                             setPendingGridActions(prev => { const next = new Set(prev); next.delete(p.id); return next; });
                           }}
                         />
                       );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div ref={sentinelRef} className="h-20 flex items-center justify-center">
              {loadingMore && <Loader2 className="h-6 w-6 animate-spin text-primary/60" />}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="swipe-mode"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-sm px-4 h-full relative flex flex-col items-center"
            style={{ height: 'calc(100dvh - 240px)' }}
          >
            {/* Tutorial Overlay */}
            <AnimatePresence>
              {tutorialStep !== null && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: -14 }}
                  exit={{ opacity: 0 }}
                  className="absolute left-0 right-0 flex justify-center z-30"
                  aria-live="polite"
                >
                  <div className="bg-foreground/90 text-background px-5 py-3 rounded-2xl text-sm font-medium shadow-xl max-w-[260px] glass border-border/20">
                    {tutorialStep === 1 && <p className="flex items-center gap-2"><ArrowRight className="h-4 w-4" /> Desliza a la derecha para <strong>Like</strong></p>}
                    {tutorialStep === 2 && <p className="flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Desliza a la izquierda para <strong>Pasar</strong></p>}
                    {tutorialStep === 3 && <p className="flex items-center gap-2"><HeartArrow className="h-4 w-4 text-primary fill-primary" /> El <strong>Flechado</strong> destaca tu interés.</p>}
                    <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-background/20">
                      <span className="text-xs opacity-50">{tutorialStep}/3</span>
                      <button onClick={tutorialStep === 3 ? dismissTutorial : nextTutorialStep} className="text-[11px] font-bold underline hover:opacity-80 transition-opacity">
                        {tutorialStep === 3 ? 'Empezar' : 'Siguiente'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Back Card Decoration */}
            {profiles[1] && (
              <div className="absolute inset-x-8 top-4 bottom-4 scale-95 opacity-40 bg-card rounded-3xl shadow-xl z-0 transform translate-y-2 border border-border/50" />
            )}

            {/* Active Swipe Card */}
            {profiles[0]?.profile && (
              <motion.div
                key={profiles[0].profile.id}
                initial={rewindedProfileId === profiles[0].profile.id ? { scale: 0.85, opacity: 0, y: 40 } : false}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 25 }}
                className="w-full h-full z-10"
              >
                 <FloatingMatchCard
                  profile={profiles[0].profile}
                  compatibility={profiles[0]?.compatibility}
                  explanations={profiles[0]?.score?.explanation}
                  onSwipe={onSwipe}
                  onFlechado={onFlechado}
                  superlikesRemaining={currentUserProfile?.superlikesRemaining}
                  hasExistingMatch={currentInteractionState.hasExistingMatch}
                  priorInteraction={currentInteractionState.priorInteraction}
                  effectiveIntent={effectiveIntent}
                />
              </motion.div>
            )}
            
            <div ref={sentinelRef} className="h-4 w-full flex items-center justify-center">
              {loadingMore && <Loader2 className="h-6 w-6 animate-spin text-primary/60" />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Individual grid item for the Discover feed.
 */
function DiscoverGridItem({ profile, intent, effectiveIntent, isPending, badge, onAction }: any) {
  const router = useRouter();
  
  return (
    <Card className="rounded-2xl overflow-hidden shadow-sm border border-border/60 group hover-lift relative bg-card transition-all duration-300">
      <div
        className="aspect-[3/4] relative cursor-pointer overflow-hidden"
        onClick={() => router.push(`/profile/${profile.id}?source=discover&intent=${intent}`)}
      >
        <SafeImage
          src={profile.photos?.[0] || '/placeholder.svg'}
          alt={profile.displayName || ''}
          fill
          sizes="(max-width: 640px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />
        
        {/* Status Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {profile.activeNow && (
            <div className="bg-green-500/90 backdrop-blur-sm text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/20 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              ACTIVA
            </div>
          )}
          {badge?.matched && (
            <div className="bg-primary/90 backdrop-blur-sm text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/20 shadow-sm">
              <Heart className="h-2 w-2 fill-white" /> MATCH
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="absolute bottom-2 left-2 right-2 text-white z-10">
          <div className="text-xs font-bold truncate leading-tight">{profile.displayName}, {profile.age}</div>
          {profile.city && <div className="text-[10px] text-white/80 truncate">{profile.city}</div>}
        </div>
      </div>
      
      {/* Grid Quick Actions */}
      <div className="flex gap-2 p-2 bg-secondary/20 border-t border-border/40 justify-center">
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-11 w-11 rounded-full bg-background/90 hover:bg-destructive/10 text-destructive border border-border/40 shadow-sm transition-all active:scale-90" 
          disabled={isPending} 
          onClick={(e) => { e.stopPropagation(); hapticsLight(); onAction('pass'); }}
          aria-label="Descartar"
        >
          <X className="h-5 w-5" />
        </Button>
        {effectiveIntent === 'friendship' ? (
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-11 w-11 rounded-full bg-background/90 hover:bg-primary/10 text-primary border border-border/40 shadow-sm transition-all active:scale-90" 
            disabled={isPending} 
            onClick={(e) => { e.stopPropagation(); hapticsMedium(); onAction('like'); }}
            aria-label="Amigo"
            title="Enviar like de amistad"
          >
            <Smile className="h-5 w-5 fill-primary" />
          </Button>
        ) : (
          <>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-11 w-11 rounded-full bg-background/90 hover:bg-primary/10 text-primary border border-border/40 shadow-sm transition-all active:scale-90" 
              disabled={isPending} 
              onClick={(e) => { e.stopPropagation(); hapticsHeavy(); onAction('superlike'); }}
              aria-label="Flechado"
            >
              <HeartArrow className="h-5 w-5 fill-primary" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-11 w-11 rounded-full bg-background/90 hover:bg-primary/10 text-primary border border-border/40 shadow-sm transition-all active:scale-90" 
              disabled={isPending} 
              onClick={(e) => { e.stopPropagation(); hapticsMedium(); onAction('like'); }}
              aria-label="Me gusta"
            >
              <Heart className="h-5 w-5 fill-primary" />
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
