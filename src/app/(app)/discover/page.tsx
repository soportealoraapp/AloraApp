"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { FloatingMatchCard } from "@/components/ui/premium/FloatingMatchCard";
import { MatchScreen } from "@/components/ui/premium/MatchScreen";
import { Button } from "@/components/ui/button";
import { Filter, Loader2, RefreshCcw, Sparkles, SlidersHorizontal, RotateCcw, LayoutGrid, CreditCard, X, Heart } from "lucide-react";
import { DiscoverFilters, Filters } from "@/components/discover/discover-filters";
import { Card } from "@/components/ui/card";
import Image from "next/image";
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
import { SecondChanceSection } from "@/components/discover/SecondChanceSection";

const DEFAULT_FILTERS: Filters = {
  ageRange: [18, 60],
  distance: 100,
  seeking: 'all',
  verifiedOnly: false,
  interests: [],
  values: []
};

const SWIPE_LIMIT = 50;

export default function DiscoverPage() {
  const { profile: currentUserProfile } = useAuth();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const { profiles, loading, loadingMore, refresh, loadMore, hasMore, setProfiles, error } = useDiscover("", filters);
  const { sendLike } = useMatches();
  const { toast } = useToast();
  const router = useRouter();
  const { track } = useAnalytics();

  const [matchedProfile, setMatchedProfile] = useState<UserProfile | null>(null);
  const [matchId, setMatchId] = useState<string | undefined>(undefined);
  const [showMatchScreen, setShowMatchScreen] = useState(false);
  const [stories, setStories] = useState<any[]>([]);
  const [swipeCount, setSwipeCount] = useState(0);
  const [rewinding, setRewinding] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [browseMode, setBrowseMode] = useState<'swipe' | 'grid'>('swipe');

  const lastSwipeRef = useRef<{ profileId: string; direction: string } | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const geoRequestedRef = useRef(false);

  useEffect(() => {
    const hintDismissed = localStorage.getItem('swipeHintDismissed');
    if (hintDismissed) setShowSwipeHint(false);
  }, []);

  useEffect(() => {
    fetch('/api/stories')
      .then(r => r.json())
      .then(data => setStories(data.stories || []))
      .catch(() => {});
  }, []);

  // Auto-set countryCode from user profile (same-country matching by default)
  useEffect(() => {
    if (currentUserProfile?.countryCode) {
      setFilters(prev => ({
        ...prev,
        countryCode: currentUserProfile.countryCode,
      }));
    }
  }, [currentUserProfile?.countryCode]);

  // Request geolocation for distance filter (only once per session)
  useEffect(() => {
    if (geoRequestedRef.current) return;
    if ('geolocation' in navigator) {
      geoRequestedRef.current = true;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFilters(prev => ({
            ...prev,
            userLat: pos.coords.latitude,
            userLng: pos.coords.longitude
          }));
        },
        () => { /* User denied geolocation */ },
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
        title: "¡Tómate un respiro!",
        description: "Has visto muchos perfiles. Vuelve en un momento para asegurar conexiones de calidad.",
        variant: "default"
      });
      return;
    }

    const profileToActOn = currentProfile;
    const previousProfiles = profilesRef.current;

    lastSwipeRef.current = { profileId: profileToActOn.id, direction };
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

  const handleFlechado = async () => {
    if (!currentProfile || !currentUserProfile) return;

    const profileToActOn = currentProfile;
    lastSwipeRef.current = { profileId: profileToActOn.id, direction: 'flechado' };
    setSwipeCount(prev => prev + 1);

    const remainingProfiles = profiles.slice(1);
    setProfiles(remainingProfiles as any);

    try {
      track(AnalyticsEvents.LIKE_SENT, { targetUserId: profileToActOn.id });
      const result = await sendLike(profileToActOn.id, 'superlike');
      if (result?.matched) {
        track(AnalyticsEvents.MATCH_CREATED, { partnerId: profileToActOn.id });
        setMatchedProfile(profileToActOn);
        setMatchId((result as any)?.matchId);
        setShowMatchScreen(true);
      }
    } catch (error) {
      console.error("Flechado failed", error);
      toast({ title: "Error", description: "No se pudo enviar el Flechado.", variant: "destructive" });
    }
  };

  const handleRewind = async () => {
    if (!lastSwipeRef.current || rewinding) return;
    setRewinding(true);
    try {
      const res = await fetch('/api/match/rewind', { method: 'POST' });
      if (res.ok) {
        toast({ title: "Deshecho", description: "Último swipe revertido." });
        refresh();
      } else {
        const data = await res.json();
        toast({ title: "No se pudo deshacer", description: data.error || "Intenta de nuevo.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "No se pudo conectar.", variant: "destructive" });
    } finally {
      setRewinding(false);
    }
  };

  const dismissSwipeHint = () => {
    setShowSwipeHint(false);
    localStorage.setItem('swipeHintDismissed', 'true');
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
    <div className="md:pl-60 h-screen flex flex-col overflow-y-auto bg-gradient-to-br from-background to-muted/30">
      <header className="flex h-16 items-center justify-between px-4 z-10">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Alora</h1>
          {(currentUserProfile as any)?.travelModeEnabled && (
            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              ✈️ Explorando: {(currentUserProfile as any).travelCity}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setBrowseMode(b => b === 'swipe' ? 'grid' : 'swipe')}
            title={browseMode === 'swipe' ? 'Vista exploración' : 'Vista swipe'}
          >
            {browseMode === 'swipe' ? <LayoutGrid className="h-5 w-5 text-muted-foreground" /> : <CreditCard className="h-5 w-5 text-muted-foreground" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleRewind} disabled={!lastSwipeRef.current || rewinding} title="Deshacer último swipe">
            <RotateCcw className="h-5 w-5 text-muted-foreground" />
          </Button>
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
        {error && !loading && profiles.length === 0 && (
          <div className="text-center px-8 mb-4">
            <p className="text-destructive text-sm mb-2">Error al cargar perfiles</p>
            <Button variant="outline" size="sm" onClick={() => refresh()}>
              <RefreshCcw className="h-4 w-4 mr-2" /> Reintentar
            </Button>
          </div>
        )}

        <AnimatePresence>
          {loading && profiles.length === 0 ? (
            <div className="w-full max-w-sm space-y-4">
              <Skeleton className="h-[500px] w-full rounded-3xl" />
              <div className="flex justify-center gap-4">
                <Skeleton className="h-14 w-14 rounded-full" />
                <Skeleton className="h-14 w-14 rounded-full" />
              </div>
            </div>
          ) : browseMode === 'grid' && profiles.length > 0 ? (
            <div className="w-full">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {profiles.map(({ profile: p, compatibility }: any) => (
                  <Card key={p.id} className="rounded-2xl overflow-hidden shadow-sm border">
                    <div className="aspect-[3/4] relative cursor-pointer" onClick={() => router.push(`/profile/${p.id}?source=discover`)}>
                      <Image
                        src={p.photos?.[0] || '/placeholder.svg'}
                        alt={p.displayName || ''}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="text-white text-xs font-bold leading-tight">{p.displayName}, {p.age}</div>
                        {p.city && <div className="text-white/70 text-[10px]">{p.city}</div>}
                        {compatibility != null && (
                          <div className="inline-block bg-primary/80 text-white text-[10px] px-1.5 py-0.5 rounded mt-1">
                            {Math.round(compatibility)}% compatibles
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 p-1.5">
                      <Button size="sm" variant="ghost" className="flex-1 h-8" onClick={() => handleSwipe('left')}>
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                      <Button size="sm" variant="ghost" className="flex-1 h-8" onClick={() => handleSwipe('right')}>
                        <Heart className="h-4 w-4 text-green-500" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
              <SecondChanceSection />
            </div>
          ) : currentProfile ? (
            <div className="w-full max-w-sm h-[600px] relative">
              {/* Swipe hint for new users */}
              {showSwipeHint && (
                <div className="absolute -top-10 left-0 right-0 flex justify-center z-30 pointer-events-none" onClick={dismissSwipeHint}>
                  <div className="bg-foreground/90 text-background px-4 py-2 rounded-full text-xs font-medium shadow-lg animate-bounce cursor-pointer pointer-events-auto">
                    ← Pasar · Like →  <span className="opacity-50">(tocar para cerrar)</span>
                  </div>
                </div>
              )}
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
                  onFlechado={handleFlechado}
                />
              </div>
            </div>
          ) : (
            <div className="w-full max-w-sm space-y-6">
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
              <SecondChanceSection />
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
          dailyLikesLimit={SWIPE_LIMIT}
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
