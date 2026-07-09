"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import { DiscoverFilters, Filters } from "@/components/discover/discover-filters";
import { useDiscover } from "@/hooks/use-discover";
import { useAuth } from "@/contexts/AuthContext";
import { useSendLike } from "@/hooks/use-send-like";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { UserProfile, ConnectionIntent } from "@/lib/domain/types";
import { hapticsLight, hapticsMedium, hapticsHeavy } from "@/lib/mobile";
import { useAnalytics, AnalyticsEvents } from "@/hooks/use-analytics";

// New Components
import { DiscoverHeader } from "./components/DiscoverHeader";
import { DiscoverIntentSelector } from "./components/DiscoverIntentSelector";
import { DiscoverFeed } from "./components/DiscoverFeed";
import { DiscoverEmptyState } from "./components/DiscoverEmptyState";
import { LikesCounter } from "@/components/discover/LikesCounter";

// Dynamic sections for code splitting and better performance
const MatchScreen = dynamic(() => import("@/components/ui/premium/MatchScreen").then(m => m.MatchScreen), { ssr: false });
const DailyCompatibilityCard = dynamic(() => import("@/components/compatibility/DailyCompatibilityCard").then(m => m.DailyCompatibilityCard), { ssr: false });
const PostOnboardingJourney = dynamic(() => import("@/components/onboarding/PostOnboardingJourney").then(m => m.PostOnboardingJourney), { ssr: false });
const DailyPicks = dynamic(() => import("@/components/discover/DailyPicks").then(m => m.DailyPicks), { ssr: false });
const SecondChanceModal = dynamic(() => import("@/components/discover/SecondChanceModal").then(m => m.SecondChanceModal), { ssr: false });
const LikesSentSection = dynamic(() => import("@/components/discover/LikesSentSection").then(m => m.LikesSentSection), { ssr: false });
const PaywallModal = dynamic(() => import("@/components/premium/PaywallModal").then(m => m.PaywallModal), { ssr: false });

const DEFAULT_FILTERS: Filters = {
  ageRange: [18, 60],
  distance: 100,
  seeking: 'all',
  verifiedOnly: false,
  interests: [],
  values: [],
  musicGenres: [],
  highCompatibility: false,
  intent: 'dating',
};

const SWIPE_LIMIT = 50;

// Helper functions for search params and filtering logic
function filtersToSearchParams(filters: Filters, intent: string): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.ageRange[0] !== 18 || filters.ageRange[1] !== 60) params.set('age', `${filters.ageRange[0]}-${filters.ageRange[1]}`);
  if (filters.distance !== 100) params.set('dist', String(filters.distance));
  if (filters.seeking !== 'all') params.set('seeking', filters.seeking);
  if (filters.verifiedOnly) params.set('verified', '1');
  if (filters.interests.length > 0) params.set('interests', filters.interests.join(','));
  if (filters.values.length > 0) params.set('values', filters.values.join(','));
  if (filters.musicGenres && filters.musicGenres.length > 0) params.set('music', filters.musicGenres.join(','));
  if (filters.highCompatibility) params.set('compat', '1');
  if (filters.activeToday) params.set('active', '1');
  if (filters.withVoiceIntro) params.set('voice', '1');
  if (filters.withQuiz) params.set('quiz', '1');
  if (intent !== 'dating') params.set('intent', intent);
  return params;
}

function searchParamsToFilters(params: URLSearchParams): { filters: Partial<Filters>; intent: string | null } {
  const filters: Partial<Filters> = {};
  const age = params.get('age');
  if (age) {
    const [min, max] = age.split('-').map(Number);
    if (min >= 18 && max >= min) filters.ageRange = [min, max];
  }
  const dist = params.get('dist');
  if (dist) { const d = Number(dist); if (d > 0) filters.distance = d; }
  const seeking = params.get('seeking');
  if (seeking === 'women' || seeking === 'men' || seeking === 'all') filters.seeking = seeking;
  if (params.get('verified') === '1') filters.verifiedOnly = true;
  const interests = params.get('interests');
  if (interests) filters.interests = interests.split(',').filter(Boolean);
  const values = params.get('values');
  if (values) filters.values = values.split(',').filter(Boolean);
  const music = params.get('music');
  if (music) filters.musicGenres = music.split(',').filter(Boolean);
  if (params.get('compat') === '1') filters.highCompatibility = true;
  if (params.get('active') === '1') filters.activeToday = true;
  if (params.get('voice') === '1') filters.withVoiceIntro = true;
  if (params.get('quiz') === '1') filters.withQuiz = true;
  const intent = params.get('intent');
  return { filters, intent: (intent === 'friendship' || intent === 'both' || intent === 'dating') ? intent : null };
}

function countActiveFilters(f: Filters): number {
  let count = 0;
  if (f.ageRange && (f.ageRange[0] !== 18 || f.ageRange[1] !== 60)) count++;
  if (f.distance && f.distance !== 100) count++;
  if (f.seeking && f.seeking !== 'all') count++;
  if (f.verifiedOnly) count++;
  if (f.interests && f.interests.length > 0) count++;
  if (f.values && f.values.length > 0) count++;
  if (f.musicGenres && f.musicGenres.length > 0) count++;
  if (f.smoking) count++;
  if (f.drinking) count++;
  if (f.children) count++;
  if (f.education) count++;
  if (f.religion) count++;
  if (f.withVoiceIntro) count++;
  if (f.withQuiz) count++;
  if (f.highCompatibility) count++;
  if (f.activeToday) count++;
  return count;
}

/**
 * DiscoverPage is the core matchmaking interface, supporting both Swipe and Grid browsing.
 */
export default function DiscoverPage() {
  const { user, profile: currentUserProfile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [filters, setFilters] = useState<Filters>(() => {
    const { filters: urlFilters } = searchParamsToFilters(searchParams);
    return { ...DEFAULT_FILTERS, ...urlFilters };
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [intent, setIntent] = useState<'dating' | 'friendship' | 'both'>(() => {
    const { intent: urlIntent } = searchParamsToFilters(searchParams);
    if (urlIntent === 'friendship' || urlIntent === 'both') return urlIntent;
    return 'dating';
  });

  // Sync filters to URL
  useEffect(() => {
    const params = filtersToSearchParams(filters, intent);
    const newUrl = params.toString() ? `/discover?${params.toString()}` : '/discover';
    router.replace(newUrl, { scroll: false });
  }, [filters, intent, router]);

  const { profiles, loading, loadingMore, refresh, loadMore, hasMore, setProfiles, error } = useDiscover("", filters);
  const { sendLike } = useSendLike();
  const { toast } = useToast();
  const { track } = useAnalytics();

  const [matchedProfile, setMatchedProfile] = useState<UserProfile | null>(null);
  const [matchId, setMatchId] = useState<string | undefined>(undefined);
  const [showMatchScreen, setShowMatchScreen] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [swipeCount, setSwipeCount] = useState(0);
  const [rewindedProfileId, setRewindedProfileId] = useState<string | null>(null);
  const [tutorialStep, setTutorialStep] = useState<number | null>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('swipeTutorialDone')) return null;
    return 1;
  });
  const [browseMode, setBrowseMode] = useState<'swipe' | 'grid'>('swipe');
  const [intentChanging, setIntentChanging] = useState(false);
  const [gridInteractionBadges, setGridInteractionBadges] = useState<Map<string, any>>(new Map());
  const [currentInteractionState, setCurrentInteractionState] = useState<any>({ hasExistingMatch: false, priorInteraction: null });
  const [passedCount, setPassedCount] = useState(0);
  const [sentLikesCount, setSentLikesCount] = useState(0);
  const [secondChanceOpen, setSecondChanceOpen] = useState(false);
  const geoRequestedRef = useRef(false);

  const getEffectiveIntent = useCallback((targetConnectionModes?: string[]): ConnectionIntent => {
    if (intent !== 'both') return intent;
    if (targetConnectionModes?.length === 1 && targetConnectionModes[0] === 'friendship') return 'friendship';
    return 'dating';
  }, [intent]);

  // Sync swipeCount and intent with server profile
  useEffect(() => {
    if (!user?.id) return;
    fetch('/api/profile').then(r => r.json()).then(data => {
      if (typeof data.dailyLikesUsed === 'number') setSwipeCount(data.dailyLikesUsed);
    }).catch(() => {});

    if (currentUserProfile?.connectionModes?.length) {
      const modes = currentUserProfile.connectionModes;
      if (modes.includes('dating') && modes.includes('friendship')) setIntent('both');
      else if (modes[0] === 'dating' || modes[0] === 'friendship') setIntent(modes[0]);
    }
  }, [user?.id, currentUserProfile?.connectionModes]);

  // Geolocation for distance filtering
  useEffect(() => {
    if (geoRequestedRef.current || (typeof window !== 'undefined' && localStorage.getItem('geoDenied') === 'permanent')) return;
    if ('geolocation' in navigator) {
      geoRequestedRef.current = true;
      navigator.geolocation.getCurrentPosition(
        (pos) => setFilters(prev => ({ ...prev, userLat: pos.coords.latitude, userLng: pos.coords.longitude })),
        (err) => { if (err.code === 1) localStorage.setItem('geoDenied', 'permanent'); },
        { timeout: 10000 }
      );
    }
  }, []);

  // Sync intent to filters
  useEffect(() => {
    if (intent === 'both') {
      setFilters(prev => { const { intent: _, ...rest } = prev; return rest as Filters; });
    } else {
      setFilters(prev => ({ ...prev, intent }));
    }
    if (!loading && intentChanging) setIntentChanging(false);
  }, [intent, loading, intentChanging]);

  // Fetch counts for the Second Chance badge and the sent-likes counter
  useEffect(() => {
    if (!user?.id) return;
    const intentParam = intent === 'both' ? 'dating' : intent;

    const c1 = new AbortController();
    fetch(`/api/match/passed?intent=${intentParam}`, { signal: c1.signal })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.profiles) setPassedCount(d.profiles.length); })
      .catch(() => {});

    const c2 = new AbortController();
    fetch(`/api/match/likes-sent?intent=${intentParam}&limit=1`, { signal: c2.signal })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (typeof d?.total === 'number') setSentLikesCount(d.total); })
      .catch(() => {});

    return () => { c1.abort(); c2.abort(); };
  }, [user?.id, intent]);

  // Batch fetch interaction state for current profile and grid badges
  useEffect(() => {
    if (!user?.id) return;
    const controller = new AbortController();
    const currentProfileId = profiles[0]?.profile?.id;

    if (currentProfileId) {
      fetch(`/api/match/check?targetUserId=${currentProfileId}${intent !== 'both' ? `&intent=${intent}` : ''}`, { signal: controller.signal })
        .then(r => r.json()).then(data => setCurrentInteractionState({ hasExistingMatch: data.matched || false, priorInteraction: data.interactionType || null }))
        .catch(() => setCurrentInteractionState({ hasExistingMatch: false, priorInteraction: null }));
    }

    if (browseMode === 'grid' && profiles.length > 0) {
      const ids = profiles.map(p => p.profile.id).filter(Boolean);
      fetch('/api/match/check-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserIds: ids, intent: intent !== 'both' ? intent : undefined }),
        signal: controller.signal,
      }).then(r => r.json()).then(data => {
        const map = new Map();
        Object.entries(data).forEach(([id, s]: any) => map.set(id, s));
        setGridInteractionBadges(map);
      }).catch(() => {});
    }
    return () => controller.abort();
  }, [profiles, user?.id, intent, browseMode]);

  const [pendingSwipe, setPendingSwipe] = useState(false);
  const executeAction = useCallback(async (
    action: 'like' | 'pass' | 'superlike', 
    direction: 'right' | 'left' | 'flechado',
    targetId?: string
  ) => {
    const profileToActOn = targetId 
      ? profiles.find(p => p.profile.id === targetId)?.profile 
      : profiles[0]?.profile;
    
    if (!profileToActOn || !currentUserProfile || pendingSwipe) return;

    if (action !== 'superlike' && swipeCount >= SWIPE_LIMIT) {
      toast({ title: "¡Tómate un respiro!", description: "Has visto muchos perfiles hoy. Vuelve mañana.", variant: "default" });
      return;
    }

    const previousProfiles = profiles;
    setPendingSwipe(true);
    if (action !== 'pass') setSwipeCount(prev => prev + 1);
    
    // Update profiles state: remove the target profile
    setProfiles(prev => targetId ? prev.filter(p => p.profile.id !== targetId) : prev.slice(1));

    try {
      const profileIntent = getEffectiveIntent(profileToActOn.connectionModes);
      const analyticsEvent = action === 'pass' ? AnalyticsEvents.PASS_SENT : action === 'superlike' ? AnalyticsEvents.SUPERLIKE_SENT : AnalyticsEvents.LIKE_SENT;
      track(analyticsEvent, { targetUserId: profileToActOn.id, intent: profileIntent });
      
      const result = await sendLike(profileToActOn.id, action, profileIntent, false);

      if (result?.matched) {
        track(AnalyticsEvents.MATCH_CREATED, { partnerId: profileToActOn.id, intent: profileIntent });
        setMatchedProfile(profileToActOn);
        setMatchId((result as any)?.matchId);
        setShowMatchScreen(true);
      }
    } catch (error) {
      setProfiles(previousProfiles);
      if (action !== 'pass') setSwipeCount(prev => prev - 1);
      toast({ title: "Error", description: "No se pudo procesar la acción. Reintentando...", variant: "destructive" });
    } finally {
      setPendingSwipe(false);
    }
  }, [profiles, currentUserProfile, pendingSwipe, swipeCount, intent, sendLike, track, toast, setProfiles, getEffectiveIntent]);

  const handleSwipe = useCallback((dir: 'left' | 'right') => executeAction(dir === 'right' ? 'like' : 'pass', dir), [executeAction]);
  const handleFlechado = useCallback(() => executeAction('superlike', 'flechado'), [executeAction]);

  const handleRelaxFilters = useCallback(() => {
    hapticsMedium();
    setFilters(prev => ({ ...prev, distance: 100, ageRange: [18, 60], verifiedOnly: false, highCompatibility: false, activeToday: false }));
    toast({ title: "Filtros relajados", description: "Ampliamos tu búsqueda para encontrar más conexiones." });
  }, [toast]);

  const activeFiltersCount = countActiveFilters(filters);

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-br from-background to-muted/30 overflow-y-auto">
      <DiscoverHeader 
        currentUserProfile={currentUserProfile}
        onOpenSecondChance={() => setSecondChanceOpen(true)}
        passedCount={passedCount}
        onOpenFilters={() => setFilterOpen(true)}
        activeFiltersCount={activeFiltersCount}
      />

      <div className="mx-auto w-full max-w-md px-4 pt-4 space-y-4 md:max-w-2xl">
        <DiscoverIntentSelector 
          intent={intent}
          setIntent={setIntent}
          setIntentChanging={setIntentChanging}
          currentUserProfile={currentUserProfile}
        />

        <LikesCounter
          dailyLikesUsed={swipeCount}
          dailyLikesLimit={SWIPE_LIMIT}
          superlikesRemaining={currentUserProfile?.superlikesRemaining ?? 0}
          sentLikesCount={sentLikesCount}
          resetAt={currentUserProfile?.dailyLikesResetAt
            ? new Date(new Date(currentUserProfile.dailyLikesResetAt).setHours(24, 0, 0, 0))
            : new Date(new Date().setHours(24, 0, 0, 0))
          }
          subscriptionStatus={currentUserProfile?.subscriptionStatus ?? 'free'}
          onReset={() => refresh()}
        />
      </div>

      <main className="relative flex min-h-[400px] flex-1 flex-col items-center justify-center px-4 py-4 md:px-6">
        {profiles.length > 0 ? (
          <DiscoverFeed 
            profiles={profiles}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            browseMode={browseMode}
            intent={intent}
            intentChanging={intentChanging}
            onSwipe={handleSwipe}
            onFlechado={handleFlechado}
            onLoadMore={loadMore}
            onAction={async (id, action) => executeAction(action, action === 'pass' ? 'left' : 'right', id)}
            currentUserProfile={currentUserProfile}
            gridInteractionBadges={gridInteractionBadges}
            currentInteractionState={currentInteractionState}
            rewindedProfileId={rewindedProfileId}
            tutorialStep={tutorialStep}
            dismissTutorial={() => { setTutorialStep(null); localStorage.setItem('swipeTutorialDone', 'true'); }}
            nextTutorialStep={() => setTutorialStep(prev => (prev === 3 ? null : (prev ?? 1) + 1))}
          />
        ) : (
          <DiscoverEmptyState 
            hasActiveFilters={activeFiltersCount > 0}
            onRefresh={refresh}
            onRelaxFilters={handleRelaxFilters}
          />
        )}
      </main>

      {/* Secondary content as progressive loading */}
      <div className="mx-auto w-full max-w-md space-y-3 px-4 pb-6 md:max-w-2xl">
        <Suspense fallback={null}><DailyCompatibilityCard /></Suspense>
        <Suspense fallback={null}><PostOnboardingJourney /></Suspense>
        <Suspense fallback={null}><DailyPicks subscriptionStatus={currentUserProfile?.subscriptionStatus ?? 'free'} /></Suspense>
        <Suspense fallback={null}><LikesSentSection intent={intent === 'both' ? 'dating' : intent} /></Suspense>
      </div>

      <DiscoverFilters
        open={filterOpen}
        onOpenChange={setFilterOpen}
        onApplyFilters={(f) => { setFilters({ ...f, intent }); setFilterOpen(false); }}
        initialFilters={filters}
        browseMode={browseMode}
        onBrowseModeChange={setBrowseMode}
        intent={intent}
        onIntentChange={setIntent}
      />

      {/* Overlays */}
      {showMatchScreen && matchedProfile && currentUserProfile && (
        <MatchScreen
          userProfile={currentUserProfile as unknown as UserProfile}
          matchedProfile={matchedProfile}
          matchId={matchId}
          onChat={() => { setShowMatchScreen(false); router.push('/chat'); }}
          onKeepSwiping={() => { setShowMatchScreen(false); setMatchId(undefined); }}
        />
      )}
      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
      <SecondChanceModal
        open={secondChanceOpen}
        onOpenChange={setSecondChanceOpen}
        intent={intent === 'both' ? 'dating' : intent}
      />
    </div>
  );
}
