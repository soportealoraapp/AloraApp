"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { FloatingMatchCard } from "@/components/ui/premium/FloatingMatchCard";
import { MatchScreen } from "@/components/ui/premium/MatchScreen";
import { Button } from "@/components/ui/button";
import { Filter, Loader2, RefreshCcw, Sparkles, SlidersHorizontal } from "lucide-react";
import { DiscoverFilters, Filters } from "@/components/discover/discover-filters";
import { useDiscover } from "@/hooks/use-discover";
import { useAuth } from "@/contexts/AuthContext";
import { useMatches } from "@/hooks/use-matches";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { UserProfile } from "@/lib/domain/types";
import { BRAND_VOICE } from "@/lib/constants/brand-voice";
import { Skeleton } from "@/components/ui/skeleton";
import { DailyQuestionCard } from "@/components/daily-question/DailyQuestionCard";
import { DailyCompatibilityCard } from "@/components/compatibility/DailyCompatibilityCard";
import { useAnalytics, AnalyticsEvents } from "@/hooks/use-analytics";
import { LikesCounter } from "@/components/discover/LikesCounter";
import { StoryCircle } from "@/components/stories/StoryCircle";
import { DailyPicks } from "@/components/discover/DailyPicks";

const DEFAULT_FILTERS: Filters = {
  ageRange: [18, 60],
  distance: 100,
  seeking: 'all',
  verifiedOnly: false,
  interests: [],
  values: []
};

export default function DiscoverPage() {
  const { profile: currentUserProfile } = useAuth();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const { profiles, loading, loadingMore, refresh, loadMore, hasMore, setProfiles } = useDiscover("", filters);
  const { sendLike } = useMatches();
  const { toast } = useToast();
  const router = useRouter();
  const { track } = useAnalytics();

  const [matchedProfile, setMatchedProfile] = useState<UserProfile | null>(null);
  const [matchId, setMatchId] = useState<string | undefined>(undefined);
  const [showMatchScreen, setShowMatchScreen] = useState(false);
  const [stories, setStories] = useState<any[]>([]);
  const [swipeCount, setSwipeCount] = useState(0);

  useEffect(() => {
    fetch('/api/stories')
      .then(r => r.json())
      .then(data => setStories(data.stories || []))
      .catch(() => {});
  }, []);
  const SWIPE_LIMIT = 20;
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Request geolocation for distance filter
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFilters(prev => ({
            ...prev,
            userLat: pos.coords.latitude,
            userLng: pos.coords.longitude
          }));
        },
        () => { /* User denied geolocation — distance filter won't work */ },
        { enableHighAccuracy: false, timeout: 10000 }
      );
    }
  }, []);

  const currentProfile = profiles[0]?.profile;
  const profilesRef = useRef(profiles);
  profilesRef.current = profiles;

  // Infinite scroll observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, loadMore]);

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!currentProfile || !currentUserProfile) return;

    if (swipeCount >= SWIPE_LIMIT) {
      toast({
        title: "¡Tómate un respiro! 🧘",
        description: "Has visto muchos perfiles. Vuelve en un momento para asegurar conexiones de calidad.",
        variant: "default"
      });
      return;
    }

    const profileToActOn = currentProfile;
    const previousProfiles = profilesRef.current;
    setSwipeCount(prev => prev + 1);

    const remainingProfiles = profiles.slice(1);
    setProfiles(remainingProfiles as any);

    try {
      if (direction === 'right') {
        track(AnalyticsEvents.LIKE_SENT, { targetUserId: profileToActOn.id });
        const result = await sendLike(profileToActOn.id, 'like');
        if (result?.matched) {
          track(AnalyticsEvents.MATCH_CREATED, { partnerId: profileToActOn.id });
          setMatchedProfile(profileToActOn);
          setMatchId((result as any)?.matchId);
          setShowMatchScreen(true);
        }
      } else {
        track(AnalyticsEvents.PASS_SENT, { targetUserId: profileToActOn.id });
        await sendLike(profileToActOn.id, 'pass');
      }
    } catch (error) {
      console.error("Action failed", error);
      setProfiles(previousProfiles as any);
      toast({ title: "Error", description: "No se pudo procesar la acción. Perfil restaurado.", variant: "destructive" });
    }
  };

  const handleApplyFilters = (newFilters: Filters) => {
    setFilters(newFilters);
    setFilterOpen(false);
    refresh();
  };

  const handleChat = () => {
    setShowMatchScreen(false);
    router.push('/chat');
  };

  if (showMatchScreen && matchedProfile && currentUserProfile) {
    return (
      <MatchScreen
        userProfile={currentUserProfile as unknown as UserProfile}
        matchedProfile={matchedProfile}
        matchId={matchId}
        onChat={handleChat}
        onKeepSwiping={() => {
          setShowMatchScreen(false);
          setMatchId(undefined);
        }}
      />
    );
  }

  return (
    <div className="md:pl-60 h-screen flex flex-col overflow-hidden bg-gradient-to-br from-background to-muted/30">
      <header className="flex h-16 items-center justify-between px-4 z-10">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Alora</h1>
          {(currentUserProfile as any)?.travelModeEnabled && (
            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              ✈️ Explorando: {(currentUserProfile as any).travelCity}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setFilterOpen(true)}>
            <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => refresh()}>
            <RefreshCcw className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </header>

      {stories.length > 0 && (
      <div className="px-4 pt-2 overflow-x-auto">
          <div className="flex gap-4 pb-2">
            {stories.map((storyGroup: any) => (
              <StoryCircle
                key={storyGroup.userId}
                photo={storyGroup.photo}
                name={storyGroup.displayName}
                hasUnviewed={!storyGroup.stories.some((s: any) => s.viewedByMe)}
                onClick={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      <div className="px-4 pt-2">
        <DailyPicks />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-4 relative">
        <AnimatePresence>
          {loading && profiles.length === 0 ? (
            <div className="w-full max-w-sm space-y-4">
              <Skeleton className="h-[500px] w-full rounded-3xl" />
              <div className="flex justify-center gap-4">
                <Skeleton className="h-14 w-14 rounded-full" />
                <Skeleton className="h-14 w-14 rounded-full" />
              </div>
            </div>
          ) : currentProfile ? (
            <div className="w-full max-w-sm h-[600px] relative">
              {profiles[1] && (
                <div className="absolute inset-0 top-4 scale-95 opacity-50 bg-white rounded-3xl shadow-xl z-0 transform translate-y-2" />
              )}
              <div className="relative z-10 h-full">
                <FloatingMatchCard
                  key={currentProfile.id}
                  profile={currentProfile}
                  compatibility={profiles[0]?.compatibility}
                  compatibilityDetails={
                    profiles[0]?.score?.details ? {
                      sharedValues: profiles[0].score.details.sharedValues,
                      sharedInterests: profiles[0].score.details.sharedInterests,
                      sharedMusic: profiles[0].score.details.sharedMusic,
                    } : undefined
                  }
                  onSwipe={handleSwipe}
                />
              </div>
            </div>
          ) : (
            <div className="text-center px-8">
              <div className="bg-muted/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-xl font-bold text-foreground mb-2">{BRAND_VOICE.states.noMatches.title}</p>
              <p className="text-muted-foreground mb-8 max-w-xs mx-auto">{BRAND_VOICE.states.noMatches.subtitle}</p>
              <Button onClick={() => refresh()} className="px-8 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all">
                Explorar de nuevo
              </Button>
            </div>
          )}
        </AnimatePresence>

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-4 w-full" />

        {loadingMore && (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando más perfiles...
          </div>
        )}
      </main>

      {/* Daily Question and Compatibility - shown below the feed */}
      <div className="px-4 pb-4 max-w-sm mx-auto w-full space-y-3">
        <LikesCounter
          dailyLikesUsed={currentUserProfile?.dailyLikesUsed ?? 0}
          dailyLikesLimit={20}
          resetAt={
            currentUserProfile?.dailyLikesResetAt
              ? new Date(currentUserProfile.dailyLikesResetAt)
              : new Date(new Date().setHours(24, 0, 0, 0))
          }
          subscriptionStatus={currentUserProfile?.subscriptionStatus ?? 'free'}
        />
        <DailyCompatibilityCard />
        <DailyQuestionCard />
      </div>

      <DiscoverFilters
        open={filterOpen}
        onOpenChange={setFilterOpen}
        onApplyFilters={handleApplyFilters}
        initialFilters={filters}
      />
    </div>
  );
}
