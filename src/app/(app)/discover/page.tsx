"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useVirtualizer } from "@tanstack/react-virtual";
const FloatingMatchCard = dynamic(() => import("@/components/ui/premium/FloatingMatchCard").then(m => m.FloatingMatchCard), { ssr: false });
const MatchScreen = dynamic(() => import("@/components/ui/premium/MatchScreen").then(m => m.MatchScreen), { ssr: false });
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw, Sparkles, SlidersHorizontal, RotateCcw, Heart, X, ArrowRight, ArrowLeft } from "lucide-react";
import { HeartArrow } from "@/components/ui/custom/HeartArrow";
import { DiscoverFilters, Filters } from "@/components/discover/discover-filters";
import { Card, CardContent } from "@/components/ui/card";
import { SafeImage } from "@/components/ui/safe-image";
import { useDiscover } from "@/hooks/use-discover";
import { useAuth } from "@/contexts/AuthContext";
import { useSendLike } from "@/hooks/use-send-like";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { UserProfile, ConnectionIntent } from "@/lib/domain/types";
import { BRAND_VOICE } from "@/lib/constants/brand-voice";
import { Skeleton } from "@/components/ui/skeleton";
import { LikesCounter } from "@/components/discover/LikesCounter";
import { DailyPicks } from "@/components/discover/DailyPicks";
import { PostOnboardingJourney } from "@/components/onboarding/PostOnboardingJourney";
import { Handshake } from "lucide-react";
import { useAnalytics, AnalyticsEvents } from "@/hooks/use-analytics";
import { DailyCompatibilityCard } from "@/components/compatibility/DailyCompatibilityCard";
import { SecondChanceSection } from "@/components/discover/SecondChanceSection";
import { LikesSentSection } from "@/components/discover/LikesSentSection";
import { PaywallModal } from "@/components/premium/PaywallModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";



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

export default function DiscoverPage() {
  const { user, profile: currentUserProfile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize filters from URL params on mount
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

  // Handle URL filters (interest, value, music) from profile badge clicks
  useEffect(() => {
    const interest = searchParams.get('interest');
    const value = searchParams.get('value');
    const music = searchParams.get('music');

    const updates: Partial<Filters> = {};
    if (interest) updates.interests = [interest];
    if (value) updates.values = [value];
    if (music) updates.musicGenres = [music];

    if (Object.keys(updates).length > 0) {
      setFilters(prev => ({ ...prev, ...updates }));
      setFilterOpen(false);
    }
  }, [searchParams]);

  // Sync filters to URL when they change
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
  const [rewinding, setRewinding] = useState(false);
  const [rewindedProfileId, setRewindedProfileId] = useState<string | null>(null);
  const [tutorialStep, setTutorialStep] = useState<number | null>(1);
  const [browseMode, setBrowseMode] = useState<'swipe' | 'grid'>('swipe');
  const [intentChanging, setIntentChanging] = useState(false);
  const [pendingGridActions, setPendingGridActions] = useState<Set<string>>(new Set());
  const [gridInteractionBadges, setGridInteractionBadges] = useState<Map<string, { matched: boolean; interactionType: string | null }>>(new Map());
  const [currentInteractionState, setCurrentInteractionState] = useState<{
    hasExistingMatch: boolean;
    priorInteraction: 'like' | 'superlike' | 'pass' | null;
  }>({ hasExistingMatch: false, priorInteraction: null });

  // When 'both', derive intent from target profile's connectionModes
  // If profile only has 'friendship', send as friendship. Otherwise default to 'dating'.
  const getEffectiveIntent = useCallback((targetConnectionModes?: string[]): ConnectionIntent => {
    if (intent !== 'both') return intent;
    if (targetConnectionModes?.length === 1 && targetConnectionModes[0] === 'friendship') return 'friendship';
    return 'dating';
  }, [intent]);

  // Sync with user profile on mount (swipeCount, intent, countryCode)
  useEffect(() => {
    if (!user?.id) return;
    const controller = new AbortController();

    // Sync swipeCount with server
    fetch('/api/profile', { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        if (typeof data.dailyLikesUsed === 'number') {
          setSwipeCount(data.dailyLikesUsed);
        }
      })
      .catch(() => {});

    // Initialize intent from user's connectionModes
    if (currentUserProfile?.connectionModes?.length) {
      const modes = currentUserProfile.connectionModes;
      if (modes.includes('dating') && modes.includes('friendship')) {
        setIntent('both');
      } else if (modes[0] === 'dating' || modes[0] === 'friendship') {
        setIntent(modes[0]);
      }
    }

    // Auto-set countryCode from user profile
    if (currentUserProfile?.countryCode) {
      setFilters(prev => ({ ...prev, countryCode: currentUserProfile.countryCode }));
    }
    return () => controller.abort();
  }, [user?.id, currentUserProfile?.connectionModes, currentUserProfile?.countryCode]);

  const lastSwipeRef = useRef<{ profileId: string; direction: string } | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const geoRequestedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [pullToRefresh, setPullToRefresh] = useState(0);
  const pullStartRef = useRef<number | null>(null);
  const scrollElementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    scrollElementRef.current = el;

    const handleTouchStart = (e: TouchEvent) => {
      if (el.scrollTop <= 0 && !loading) {
        pullStartRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (pullStartRef.current === null) return;
      const pull = e.touches[0].clientY - pullStartRef.current;
      if (pull > 0) {
        setPullToRefresh(Math.min(pull / 300, 1));
        if (pull > 100) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = () => {
      setPullToRefresh(prev => {
        if (prev >= 1) refresh();
        return 0;
      });
      pullStartRef.current = null;
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);



  // One-time init: tutorial check + paywall listener
  useEffect(() => {
    const tutorialDone = localStorage.getItem('swipeTutorialDone');
    if (tutorialDone) setTutorialStep(null);
    const handler = () => setShowPaywall(true);
    window.addEventListener('open-paywall', handler);
    return () => window.removeEventListener('open-paywall', handler);
  }, []);

  // Request geolocation for distance filter (only once per session)
  useEffect(() => {
    if (geoRequestedRef.current) return;
    if (typeof window !== 'undefined' && localStorage.getItem('geoDenied') === 'permanent') return;
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
        (error) => {
          if (error?.code === 1) {
            localStorage.setItem('geoDenied', 'permanent');
          } else {
            console.warn('Geolocation denied or unavailable — using default distance filter');
            toast({ title: 'Ubicación no disponible', description: 'Usando distancia predeterminada de 100 km' });
          }
        },
        { enableHighAccuracy: false, timeout: 10000 }
      );
    }
  }, []);

  const currentProfile = profiles[0]?.profile;
  const profilesRef = useRef(profiles);

  // Sync intent to filters and clear intent changing state
  useEffect(() => {
    // When intent is 'both', don't filter by intent — show all profiles
    if (intent === 'both') {
      setFilters(prev => {
        const { intent: _, ...rest } = prev;
        return rest;
      });
    } else {
      setFilters(prev => ({ ...prev, intent }));
    }
    if (!loading && intentChanging) {
      setIntentChanging(false);
    }
  }, [intent, loading, intentChanging]);

  // Fetch interaction state for current profile and grid badges
  useEffect(() => {
    if (!user?.id) {
      setCurrentInteractionState({ hasExistingMatch: false, priorInteraction: null });
      setGridInteractionBadges(new Map());
      return;
    }

    const controller = new AbortController();

    // Fetch current profile interaction state (swipe mode)
    if (currentProfile?.id) {
      setCurrentInteractionState({ hasExistingMatch: false, priorInteraction: null });
      fetch(`/api/match/check?targetUserId=${currentProfile.id}${intent !== 'both' ? `&intent=${intent}` : ''}`, { signal: controller.signal })
        .then(r => r.json())
        .then(data => {
          setCurrentInteractionState({
            hasExistingMatch: data.matched || false,
            priorInteraction: data.interactionType || null,
          });
        })
        .catch(() => {
          setCurrentInteractionState({ hasExistingMatch: false, priorInteraction: null });
        });
    }

    // Batch fetch for grid badges
    if (browseMode === 'grid' && profiles.length > 0) {
      const profileIds = profiles.map(p => p.profile.id).filter(Boolean);
      if (profileIds.length > 0) {
        fetch('/api/match/check-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUserIds: profileIds, intent: intent !== 'both' ? intent : undefined }),
          signal: controller.signal,
        })
          .then(r => r.json())
          .then(data => {
            const map = new Map<string, { matched: boolean; interactionType: string | null }>();
            for (const [id, state] of Object.entries(data)) {
              const s = state as { matched: boolean; interactionType: string | null };
              map.set(id, { matched: s.matched, interactionType: s.interactionType });
            }
            setGridInteractionBadges(map);
          })
          .catch(() => {});
      }
    } else {
      setGridInteractionBadges(new Map());
    }

    return () => controller.abort();
  }, [currentProfile?.id, user?.id, intent, browseMode, profiles.length]);

  profilesRef.current = profiles;

  const maxRewinds = currentUserProfile?.subscriptionStatus === 'plus' ? 3 : 1;
  const isNewRewindDay = !currentUserProfile?.rewindsResetAt || 
    new Date().toDateString() !== new Date(currentUserProfile.rewindsResetAt).toDateString();
  const rewindsUsed = isNewRewindDay ? 0 : (currentUserProfile?.rewindsUsed ?? 0);
  const rewindsRemaining = maxRewinds - rewindsUsed;

  // Grid virtualization — react to viewport width changes
  const [gridColumns, setGridColumns] = useState(typeof window !== 'undefined' && window.innerWidth >= 640 ? 3 : 2);
  useEffect(() => {
    const updateColumns = () => setGridColumns(window.innerWidth >= 640 ? 3 : 2);
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);
  const gridRowCount = Math.ceil(profiles.length / gridColumns);
  const gridVirtualizer = useVirtualizer({
    count: gridRowCount,
    getScrollElement: () => gridContainerRef.current,
    estimateSize: () => 340,
    overscan: 2,
  });

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

  const [pendingSwipe, setPendingSwipe] = useState(false);
  const pendingSwipeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const executeAction = useCallback(async (
    action: 'like' | 'pass' | 'superlike',
    direction: 'right' | 'left' | 'flechado'
  ) => {
    const profileToActOn = profilesRef.current[0]?.profile;
    if (!profileToActOn || !currentUserProfile || pendingSwipe) return;

    if (action !== 'superlike' && swipeCount >= SWIPE_LIMIT) {
      toast({
        title: "¡Tómate un respiro!",
        description: "Has visto muchos perfiles. Vuelve en un momento para asegurar conexiones de calidad.",
        variant: "default"
      });
      return;
    }

    const previousProfiles = profilesRef.current;
    setPendingSwipe(true);
    // Safety timeout: if API call takes >10s, unlock UI to prevent permanent block
    if (pendingSwipeTimeoutRef.current) clearTimeout(pendingSwipeTimeoutRef.current);
    pendingSwipeTimeoutRef.current = setTimeout(() => setPendingSwipe(false), 10000);
    if (action !== 'pass') {
      setSwipeCount(prev => prev + 1);
    }

    const remainingProfiles = previousProfiles.slice(1);
    setProfiles(remainingProfiles as any);

    try {
      const profileIntent = getEffectiveIntent(profileToActOn.connectionModes);
      const analyticsEvent = action === 'pass' ? AnalyticsEvents.PASS_SENT
        : action === 'superlike' ? AnalyticsEvents.SUPERLIKE_SENT
        : AnalyticsEvents.LIKE_SENT;
      track(analyticsEvent, { targetUserId: profileToActOn.id, intent: profileIntent });
      const result = await sendLike(profileToActOn.id, action, profileIntent, false);
      lastSwipeRef.current = { profileId: profileToActOn.id, direction };

      if (action === 'pass') {
        toast({ title: 'Perfil descartado', description: 'Puedes verlo más tarde en Segunda Oportunidad' });
      } else if (action === 'superlike') {
        toast({ title: '¡💘 Flechado enviado!', description: `${profileToActOn.displayName} recibirá tu interés destacado.` });
      } else {
        toast({ title: 'Me gusta enviado', description: '¡Esperamos que sea mutuo!' });
      }

      if (result?.matched) {
        track(AnalyticsEvents.MATCH_CREATED, { partnerId: profileToActOn.id, intent: profileIntent });
        setMatchedProfile(profileToActOn);
        setMatchId((result as any)?.matchId);
        setShowMatchScreen(true);
      }
    } catch (error) {
      console.error("Action failed", error);
      setProfiles(previousProfiles as any);
      if (action !== 'pass') {
        setSwipeCount(prev => prev - 1);
      }
      lastSwipeRef.current = null;
      toast({
        title: "Error",
        description: action === 'superlike' ? "No se pudo enviar el Flechado." : "No se pudo procesar la acción. Perfil restaurado.",
        variant: "destructive"
      });
    } finally {
      if (pendingSwipeTimeoutRef.current) clearTimeout(pendingSwipeTimeoutRef.current);
      setPendingSwipe(false);
    }
  }, [currentUserProfile, pendingSwipe, swipeCount, intent, sendLike, track, toast, setProfiles]);

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    executeAction(direction === 'right' ? 'like' : 'pass', direction);
  }, [executeAction]);

  const handleFlechado = useCallback(() => {
    executeAction('superlike', 'flechado');
  }, [executeAction]);

  const handleRewind = async () => {
    if (!lastSwipeRef.current || rewinding) return;
    setRewinding(true);
    try {
      const res = await fetch('/api/match/rewind', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        const restoredUserId = data.undone?.targetUserId;
        if (restoredUserId) {
          // Fetch the restored profile
          const profileRes = await fetch(`/api/profile/${restoredUserId}`);
          if (profileRes.ok) {
            const restoredProfile = await profileRes.json();
            setRewindedProfileId(restoredUserId);
            setProfiles(prev => [{ profile: restoredProfile.profile || restoredProfile, compatibility: null }, ...prev] as any);
            // Clear the rewind animation flag after animation completes
            setTimeout(() => setRewindedProfileId(null), 800);
          }
        }
        setSwipeCount(prev => Math.max(0, prev - 1));
        lastSwipeRef.current = null;
        toast({ title: "Deshecho", description: "Último swipe revertido. Si había match, también se deshizo." });
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

  const dismissTutorial = () => {
    setTutorialStep(null);
    localStorage.setItem('swipeTutorialDone', 'true');
  };

  const nextTutorialStep = () => {
    if (tutorialStep === 3) {
      dismissTutorial();
    } else {
      setTutorialStep(prev => (prev ?? 1) + 1);
    }
  };

  const handleApplyFilters = (newFilters: Filters) => {
    setFilters({ ...newFilters, intent });
    setFilterOpen(false);
  };

  const handleChat = () => {
    setShowMatchScreen(false);
    router.push('/chat');
  };

  return (
    <div
      ref={scrollRef}
      className="min-h-dvh md:min-h-0 h-dvh flex flex-col overflow-y-auto bg-gradient-to-br from-background to-muted/30"
      style={{ overscrollBehavior: 'contain' } as React.CSSProperties}
    >
      {pullToRefresh > 0 && (
        <div className="flex items-center justify-center py-3 -mb-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-full px-4 py-2 shadow-sm">
            <Loader2 className={`h-5 w-5 ${pullToRefresh >= 1 ? 'animate-spin text-primary' : ''}`} style={{ transform: `rotate(${pullToRefresh * 180}deg)` }} />
            <span className="font-medium">{pullToRefresh >= 1 ? 'Actualizando...' : 'Suelta para actualizar'}</span>
          </div>
        </div>
      )}
      {/* Flechado sound / visual feedback could be triggered here */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-4 backdrop-blur-md border-b bg-background/90 pt-safe">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Alora</h1>
          {currentUserProfile?.travelModeEnabled && (
            <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              ✈️ Explorando: {currentUserProfile.travelCity}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <div className="hidden md:flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleRewind} disabled={!lastSwipeRef.current || rewinding}     title={`Deshacer último swipe — ventana de 5 min (${rewindsRemaining}/${maxRewinds} disponibles)`} aria-label="Deshacer último swipe">
              <RotateCcw className="h-5 w-5 text-muted-foreground" />
            </Button>
            <span className="text-[11px] text-muted-foreground font-bold -ml-1">{rewindsRemaining}</span>
            <Button variant="ghost" size="icon" onClick={() => setFilterOpen(true)} title="Filtros de búsqueda" aria-label="Filtros de búsqueda" className="relative">
              <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
              {countActiveFilters(filters) > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[11px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center shadow-sm border border-background">
                  {countActiveFilters(filters)}
                </span>
              )}
            </Button>
          </div>
          <div className="md:hidden flex items-center gap-0.5">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={handleRewind} disabled={!lastSwipeRef.current || rewinding} title={`Deshacer último swipe — ventana de 5 min (${rewindsRemaining}/${maxRewinds} disponibles)`} aria-label="Deshacer último swipe" className="touch-target">
                <RotateCcw className="h-4 w-4 text-muted-foreground" />
              </Button>
              <span className="text-[11px] text-muted-foreground font-bold">{rewindsRemaining}</span>
            </div>
            
            <Button variant="ghost" size="icon" onClick={() => setFilterOpen(true)} title="Filtros de búsqueda" aria-label="Filtros de búsqueda" className="relative touch-target">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              {countActiveFilters(filters) > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[11px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center shadow-sm border border-background">
                  {countActiveFilters(filters)}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Likes counter — compact, above feed */}
      <div className="px-4 pt-2 max-w-sm mx-auto w-full space-y-3">
        {/* Mode selector — 3 options: dating, friendship, both */}
        {(currentUserProfile?.connectionModes?.includes('dating') && currentUserProfile?.connectionModes?.includes('friendship')) && (
          <TooltipProvider>
          <div className="flex gap-1 p-1 bg-muted/50 rounded-xl">
            <Tooltip>
              <TooltipTrigger asChild>
            <button
              onClick={() => { setIntent('dating'); setIntentChanging(true); }}
              aria-pressed={intent === 'dating'}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                intent === 'dating'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Citas
            </button>
              </TooltipTrigger>
              <TooltipContent side="bottom"><p className="text-xs">Muestra perfiles que buscan citas</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
            <button
              onClick={() => { setIntent('both'); setIntentChanging(true); }}
              aria-pressed={intent === 'both'}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                intent === 'both'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Ambos
            </button>
              </TooltipTrigger>
              <TooltipContent side="bottom"><p className="text-xs">Muestra perfiles de citas y amistad juntos</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
            <button
              onClick={() => { setIntent('friendship'); setIntentChanging(true); }}
              aria-pressed={intent === 'friendship'}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                intent === 'friendship'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Amistad
            </button>
              </TooltipTrigger>
              <TooltipContent side="bottom"><p className="text-xs">Muestra perfiles que buscan amistad</p></TooltipContent>
            </Tooltip>
          </div>
          </TooltipProvider>
        )}

        {intent === 'dating' && !(currentUserProfile?.connectionModes?.includes('dating') && currentUserProfile?.connectionModes?.includes('friendship')) && (
          <Card className="border-none bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-500/5 dark:to-indigo-500/5 rounded-2xl overflow-hidden cursor-pointer hover:bg-indigo-500/20 dark:hover:bg-indigo-500/10 transition-all" onClick={() => setIntent('friendship')}>
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/20 dark:bg-blue-400/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Handshake className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-blue-700 dark:text-blue-400">Modo Amistad</p>
                  <p className="text-[10px] text-blue-600/80 dark:text-blue-400/60">Busca conexiones platónicas</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-blue-400 dark:text-blue-500" />
            </CardContent>
          </Card>
        )}

        {intent === 'friendship' && !(currentUserProfile?.connectionModes?.includes('dating') && currentUserProfile?.connectionModes?.includes('friendship')) && (
          <Card className="border-none bg-gradient-to-r from-pink-500/10 to-primary/10 dark:from-pink-500/5 dark:to-primary/5 rounded-2xl overflow-hidden cursor-pointer hover:bg-primary/20 dark:hover:bg-primary/10 transition-all" onClick={() => setIntent('dating')}>
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-pink-500/20 dark:bg-pink-400/10 flex items-center justify-center text-primary dark:text-primary/80">
                  <Heart className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-primary dark:text-primary/80">Modo Citas</p>
                  <p className="text-[10px] text-primary/80 dark:text-primary/50">Vuelve a buscar tu alma gemela</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-primary/40 dark:text-primary/30" />
            </CardContent>
          </Card>
        )}

        <LikesCounter
          dailyLikesUsed={swipeCount}
          dailyLikesLimit={SWIPE_LIMIT}
          superlikesRemaining={currentUserProfile?.superlikesRemaining ?? 0}
          resetAt={currentUserProfile?.dailyLikesResetAt
            ? new Date(new Date(currentUserProfile.dailyLikesResetAt).setHours(24, 0, 0, 0))
            : new Date(new Date().setHours(24, 0, 0, 0))
          }
          subscriptionStatus={currentUserProfile?.subscriptionStatus ?? 'free'}
          onReset={() => refresh()}
        />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-4 relative">
        {countActiveFilters(filters) > 0 && !loading && (
          <div className="mb-4 text-center px-4">
            <p className="text-xs text-muted-foreground bg-muted/50 py-1.5 px-3 rounded-full inline-flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-primary" />
              Mostrando resultados filtrados por {filters.interests.length > 0 ? filters.interests[0] : filters.values.length > 0 ? filters.values[0] : filters.musicGenres && filters.musicGenres.length > 0 ? filters.musicGenres[0] : 'tus preferencias'}
              <button 
                onClick={() => { setFilters(DEFAULT_FILTERS); setIntent(currentUserProfile?.connectionModes?.[0] || 'dating'); }}
                className="ml-1 text-primary font-bold hover:underline"
              >
                Limpiar
              </button>
            </p>
          </div>
        )}
        {error && !loading && profiles.length === 0 && (
          <div className="text-center px-8 mb-4">
            <p className="text-destructive text-sm mb-2">Error al cargar perfiles</p>
            <Button variant="outline" size="sm" onClick={() => refresh()}>
              <RefreshCcw className="h-4 w-4 mr-2" /> Reintentar
            </Button>
          </div>
        )}

        <AnimatePresence>
          {(loading && (profiles.length === 0 || intentChanging)) ? (
            <div className="w-full max-w-sm space-y-4">
              <Skeleton className="h-[500px] w-full rounded-3xl" />
              <div className="flex justify-center gap-4">
                <Skeleton className="h-14 w-14 rounded-full" />
                <Skeleton className="h-14 w-14 rounded-full" />
              </div>
            </div>
          ) : browseMode === 'grid' && profiles.length > 0 ? (
            <div ref={gridContainerRef} className="w-full overflow-auto" style={{ height: 'calc(100dvh - 180px)' }}>
              <div
                style={{ height: gridVirtualizer.getTotalSize(), position: 'relative' }}
              >
                {gridVirtualizer.getVirtualItems().map((virtualRow) => {
                  const rowIndex = virtualRow.index;
                  return (
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
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 h-full">
                        {Array.from({ length: gridColumns }, (_, colIndex) => {
                          const profileIndex = rowIndex * gridColumns + colIndex;
                          if (profileIndex >= profiles.length) return <div key={colIndex} />;
                          const { profile: p, compatibility: compat } = profiles[profileIndex];
                          return (
                            <Card key={p.id} className="rounded-2xl overflow-hidden shadow-sm border group">
                              <div
                                className="aspect-[3/4] relative cursor-pointer"
                                onClick={() => router.push(`/profile/${p.id}?source=discover&intent=${intent}`)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push(`/profile/${p.id}?source=discover&intent=${intent}`); }}
                                tabIndex={0}
                                role="button"
                                aria-label={`Ver perfil de ${p.displayName || ''}`}
                                onTouchStart={(e) => {
                                  const timer = setTimeout(() => {
                                    import('@/lib/mobile').then(m => m.hapticsHeavy());
                                    router.push(`/profile/${p.id}?source=discover&intent=${intent}`);
                                  }, 500);
                                  (e.currentTarget as any)._lpTimer = timer;
                                }}
                                onTouchEnd={(e) => { clearTimeout((e.currentTarget as any)._lpTimer); }}
                                onTouchMove={(e) => { clearTimeout((e.currentTarget as any)._lpTimer); }}
                              >
                                <SafeImage
                                  src={p.photos?.[0] || '/placeholder.svg'}
                                  alt={p.displayName || ''}
                                  fill
                                  sizes="(max-width: 640px) 50vw, 33vw"
                                  className="object-cover"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                {p.activeNow && (
                                  <div title="En línea ahora" className="absolute top-2 left-2 bg-primary/90 backdrop-blur-sm text-primary-foreground text-[11px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 border border-primary/30">
                                    <span className="relative flex h-1.5 w-1.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/75 opacity-75" />
                                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary-foreground" />
                                    </span>
                                    Activa
                                  </div>
                                )}
                                {p.latestAnswer && (
                                  <div title="Respondió la pregunta del día" className="absolute top-2 right-2 bg-accent/90 backdrop-blur-sm text-accent-foreground text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                                    💬 Resp.
                                  </div>
                                )}
                                {p.voiceIntro && (
                                  <div title="Tiene presentación de voz" className="absolute top-8 left-2 bg-muted/90 backdrop-blur-sm text-muted-foreground text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                                    🎵 Voz
                                  </div>
                                )}
                                {gridInteractionBadges.get(p.id)?.matched && (
                                  <div className="absolute top-2 left-2 z-10 bg-green-500/90 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Heart className="h-3 w-3 fill-white" /> Match
                                  </div>
                                )}
                                {!gridInteractionBadges.get(p.id)?.matched && gridInteractionBadges.get(p.id)?.interactionType === 'superlike' && (
                                  <div className="absolute top-2 left-2 z-10 bg-amber-500/90 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                                    💘 Flechado enviado
                                  </div>
                                )}
                                {!gridInteractionBadges.get(p.id)?.matched && gridInteractionBadges.get(p.id)?.interactionType === 'like' && (
                                  <div className="absolute top-2 left-2 z-10 bg-primary/90 backdrop-blur-sm text-primary-foreground text-[11px] font-bold px-2 py-0.5 rounded-full">
                                    ❤️ Like enviado
                                  </div>
                                )}
                                <div className="absolute bottom-2 left-2 right-2">
                                  <div className="text-white text-xs font-bold leading-tight">{p.displayName}, {p.age}</div>
                                  {p.city && <div className="text-white/70 text-xs">{p.city}</div>}
                                  {p.sharedInterests !== undefined && p.sharedInterests > 0 && (
                                     <div className="text-primary-foreground/80 text-[10px] mt-0.5 bg-primary/20 backdrop-blur-sm rounded-full px-2 py-0.5 inline-block">{p.sharedInterests} intereses en común</div>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1 p-1.5">
                                <Button size="sm" variant="ghost" className="flex-1 h-11" aria-label={`Descartar a ${p.displayName || ''}`} disabled={pendingGridActions.has(p.id)} onClick={async () => {
                                  if (pendingGridActions.has(p.id)) return;
                                  if (swipeCount >= SWIPE_LIMIT) {
                                    toast({ title: "¡Tómate un respiro!", description: "Has visto muchos perfiles. Vuelve en un momento.", variant: "default" });
                                    return;
                                  }
                                  setPendingGridActions(prev => new Set(prev).add(p.id));
                                  const previousGridProfiles = profiles;
                                  try {
                                    track(AnalyticsEvents.PASS_SENT, { targetUserId: p.id, intent: getEffectiveIntent(p.connectionModes) });
                                    await sendLike(p.id, 'pass', getEffectiveIntent(p.connectionModes));
                                    setProfiles(prev => prev.filter(item => item.profile.id !== p.id));
                                  } catch (error) {
                                    setProfiles(previousGridProfiles);
                                    toast({ title: "Error", description: "No se pudo descartar. Inténtalo de nuevo.", variant: "destructive" });
                                  } finally {
                                    setPendingGridActions(prev => { const next = new Set(prev); next.delete(p.id); return next; });
                                  }
                                }}>
                                  <X className="h-5 w-5 text-destructive" />
                                </Button>
                                <Button size="sm" variant="ghost" className="flex-1 h-11" aria-label={`Flechado a ${p.displayName || ''}`} disabled={pendingGridActions.has(p.id)} onClick={async () => {
                                  if (pendingGridActions.has(p.id)) return;
                                  if (swipeCount >= SWIPE_LIMIT) {
                                    toast({ title: "¡Tómate un respiro!", description: "Has visto muchos perfiles. Vuelve en un momento.", variant: "default" });
                                    return;
                                  }
                                  setPendingGridActions(prev => new Set(prev).add(p.id));
                                  const previousGridProfiles = profiles;
                                  try {
                                    track(AnalyticsEvents.SUPERLIKE_SENT, { targetUserId: p.id, intent: getEffectiveIntent(p.connectionModes) });
                                    const result = await sendLike(p.id, 'superlike', getEffectiveIntent(p.connectionModes));
                                    setSwipeCount(prev => prev + 1);
                                    setProfiles(prev => prev.filter(item => item.profile.id !== p.id));
                                    toast({ title: '¡💘 Flechado enviado!', description: `${p.displayName} recibirá tu interés destacado.` });
                                    if (result?.matched) {
                                      track(AnalyticsEvents.MATCH_CREATED, { partnerId: p.id, intent: getEffectiveIntent(p.connectionModes) });
                                      setMatchedProfile(p);
                                      setMatchId((result as any)?.matchId);
                                      setShowMatchScreen(true);
                                    }
                                  } catch (error) {
                                    setProfiles(previousGridProfiles);
                                    setSwipeCount(prev => prev - 1);
                                    toast({ title: "Error", description: "No se pudo enviar el Flechado. Inténtalo de nuevo.", variant: "destructive" });
                                  } finally {
                                    setPendingGridActions(prev => { const next = new Set(prev); next.delete(p.id); return next; });
                                  }
                                }}>
                                  <HeartArrow className="h-5 w-5 text-amber-500 fill-amber-500" />
                                </Button>
                                <Button size="sm" variant="ghost" className="flex-1 h-11" aria-label={`Dar like a ${p.displayName || ''}`} disabled={pendingGridActions.has(p.id)} onClick={async () => {
                                  if (pendingGridActions.has(p.id)) return;
                                  if (swipeCount >= SWIPE_LIMIT) {
                                    toast({ title: "¡Tómate un respiro!", description: "Has visto muchos perfiles. Vuelve en un momento.", variant: "default" });
                                    return;
                                  }
                                  setPendingGridActions(prev => new Set(prev).add(p.id));
                                  const previousGridProfiles = profiles;
                                  try {
                                    track(AnalyticsEvents.LIKE_SENT, { targetUserId: p.id, intent: getEffectiveIntent(p.connectionModes) });
                                    const result = await sendLike(p.id, 'like', getEffectiveIntent(p.connectionModes));
                                    setSwipeCount(prev => prev + 1);
                                    setProfiles(prev => prev.filter(item => item.profile.id !== p.id));
                                    if (result?.matched) {
                                      track(AnalyticsEvents.MATCH_CREATED, { partnerId: p.id, intent: getEffectiveIntent(p.connectionModes) });
                                      setMatchedProfile(p);
                                      setMatchId((result as any)?.matchId);
                                      setShowMatchScreen(true);
                                    }
                                  } catch (error) {
                                    setProfiles(previousGridProfiles);
                                    setSwipeCount(prev => prev - 1);
                                    toast({ title: "Error", description: "No se pudo enviar el like. Inténtalo de nuevo.", variant: "destructive" });
                                  } finally {
                                    setPendingGridActions(prev => { const next = new Set(prev); next.delete(p.id); return next; });
                                  }
                                }}>
                                  <Heart className="h-5 w-5 text-primary fill-primary" />
                                </Button>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : currentProfile ? (
            <div className="w-full max-w-sm min-h-[500px] max-h-[calc(100dvh-180px)] h-full relative">
              {/* Tutorial de swipe — primera vez */}
              {tutorialStep !== null && (
                <div className="absolute -top-14 left-0 right-0 flex justify-center z-30" aria-live="polite">
                  <div className="bg-foreground/90 text-background px-5 py-3 rounded-2xl text-sm font-medium shadow-lg max-w-[260px]">
                    {tutorialStep === 1 && <p className="flex items-center gap-2"><ArrowRight className="h-4 w-4" /> Desliza a la derecha para dar <strong>Like</strong></p>}
                    {tutorialStep === 2 && <p className="flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Desliza a la izquierda para <strong>Pasar</strong></p>}
                    {tutorialStep === 3 && <p className="flex items-center gap-2"><HeartArrow className="h-4 w-4 text-amber-500 fill-amber-500" /> El <strong>Flechado</strong> destaca tu interés con una notificación especial. Tienes 3 por día.</p>}
                    <div className="flex justify-between items-center mt-2.5">
                      <span className="text-xs opacity-50">{tutorialStep}/3</span>
                      <button onClick={tutorialStep === 3 ? dismissTutorial : nextTutorialStep} className="text-[11px] font-bold underline">
                        {tutorialStep === 3 ? 'Cerrar' : 'Siguiente →'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {profiles[1] && (
                <div className="absolute inset-0 top-4 scale-95 opacity-50 bg-card rounded-3xl shadow-xl z-0 transform translate-y-2" />
              )}
              <div className="relative z-10 h-full">
                <motion.div
                  key={currentProfile.id}
                  initial={rewindedProfileId === currentProfile.id ? { scale: 0.85, opacity: 0, y: 40 } : false}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 250, damping: 22 }}
                  className="h-full"
                >
                <FloatingMatchCard
                  profile={currentProfile}
                  compatibility={profiles[0]?.compatibility}
                  explanations={profiles[0]?.score?.explanation}
                  onSwipe={handleSwipe}
                  onFlechado={handleFlechado}
                  superlikesRemaining={currentUserProfile?.superlikesRemaining}
                  hasExistingMatch={currentInteractionState.hasExistingMatch}
                  priorInteraction={currentInteractionState.priorInteraction}
                />
                </motion.div>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-sm space-y-6">
              <div className="text-center px-8">
                <div className="bg-muted/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="h-10 w-10 text-muted-foreground" />
                </div>
                {countActiveFilters(filters) > 0 ? (
                  <>
                    <p className="text-xl font-bold text-foreground mb-2">{BRAND_VOICE.states.noFilterResults.title}</p>
                    <p className="text-muted-foreground mb-8 max-w-xs mx-auto">{BRAND_VOICE.states.noFilterResults.subtitle}</p>
                    <Button onClick={() => { setFilters(DEFAULT_FILTERS); setIntent(currentUserProfile?.connectionModes?.[0] || 'dating'); }} className="px-8 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all">
                      Limpiar filtros
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-bold text-foreground mb-2">{BRAND_VOICE.states.noMatches.title}</p>
                    <p className="text-muted-foreground mb-8 max-w-xs mx-auto">{BRAND_VOICE.states.noMatches.subtitle}</p>
                    <Button onClick={() => refresh()} className="px-8 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all">
                      Explorar de nuevo
                    </Button>
                  </>
                )}
              </div>
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

      {/* Secondary sections — below the feed, wrapped in Suspense for progressive rendering */}
      <div className="px-4 pb-3 max-w-sm mx-auto w-full">
        <Suspense fallback={null}>
          <DailyCompatibilityCard />
        </Suspense>
      </div>

      <div className="px-4 pb-3 max-w-sm mx-auto w-full">
        <Suspense fallback={null}>
          <PostOnboardingJourney />
        </Suspense>
      </div>

      <div className="px-4 pb-3 max-w-sm mx-auto w-full">
        <Suspense fallback={null}>
          <DailyPicks subscriptionStatus={currentUserProfile?.subscriptionStatus ?? 'free'} />
        </Suspense>
      </div>

      <div className="px-4 pb-3 max-w-sm mx-auto w-full">
        <Suspense fallback={null}>
          <SecondChanceSection intent={intent === 'both' ? 'dating' : intent} />
        </Suspense>
      </div>

      <div className="px-4 pb-3 max-w-sm mx-auto w-full">
        <Suspense fallback={null}>
          <LikesSentSection intent={intent === 'both' ? 'dating' : intent} />
        </Suspense>
      </div>

      <DiscoverFilters
        open={filterOpen}
        onOpenChange={setFilterOpen}
        onApplyFilters={handleApplyFilters}
        initialFilters={filters}
        browseMode={browseMode}
        onBrowseModeChange={setBrowseMode}
        intent={intent}
        onIntentChange={setIntent}
      />

      {showMatchScreen && matchedProfile && currentUserProfile && (
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
      )}

      {/* Bottom spacing for scrolling — layout already adds pb-20 */}
      <div className="h-4 md:hidden" />

      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  );
}
