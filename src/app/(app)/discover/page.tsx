"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { FloatingMatchCard } from "@/components/ui/premium/FloatingMatchCard";
import { MatchScreen } from "@/components/ui/premium/MatchScreen";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw, Sparkles, SlidersHorizontal, RotateCcw, Heart, X, ArrowRight, ArrowLeft } from "lucide-react";
import { HeartArrow } from "@/components/ui/custom/HeartArrow";
import { DiscoverFilters, Filters } from "@/components/discover/discover-filters";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { useDiscover } from "@/hooks/use-discover";
import { useAuth } from "@/contexts/AuthContext";
import { useMatches } from "@/hooks/use-matches";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { UserProfile } from "@/lib/domain/types";
import { BRAND_VOICE } from "@/lib/constants/brand-voice";
import { Skeleton } from "@/components/ui/skeleton";
import { LikesCounter } from "@/components/discover/LikesCounter";
import { DailyPicks } from "@/components/discover/DailyPicks";
import { PostOnboardingJourney } from "@/components/onboarding/PostOnboardingJourney";
import { Handshake } from "lucide-react";
import { useAnalytics, AnalyticsEvents } from "@/hooks/use-analytics";
import { DailyCompatibilityCard } from "@/components/compatibility/DailyCompatibilityCard";



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
  if (f.featuredOnly) count++;
  if (f.highCompatibility) count++;
  if (f.activeToday) count++;
  return count;
}

export default function DiscoverPage() {
  const { profile: currentUserProfile } = useAuth();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  // Handle URL filters
  useEffect(() => {
    const interest = searchParams.get('interest');
    const value = searchParams.get('value');
    const music = searchParams.get('music');

    if (interest || value || music) {
      setFilters(prev => ({
        ...prev,
        interests: interest ? [interest] : prev.interests,
        values: value ? [value] : prev.values,
        musicGenres: music ? [music] : prev.musicGenres,
      }));
      setFilterOpen(false);
    }
  }, [searchParams]);
  const { profiles, loading, loadingMore, refresh, loadMore, hasMore, setProfiles, error } = useDiscover("", filters);
  const { sendLike } = useMatches();
  const { toast } = useToast();
  const router = useRouter();
  const { track } = useAnalytics();

  const [matchedProfile, setMatchedProfile] = useState<UserProfile | null>(null);
  const [matchId, setMatchId] = useState<string | undefined>(undefined);
  const [showMatchScreen, setShowMatchScreen] = useState(false);
  const [swipeCount, setSwipeCount] = useState(0);
  const [rewinding, setRewinding] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<number | null>(1);
  const [browseMode, setBrowseMode] = useState<'swipe' | 'grid'>('swipe');
  const [intent, setIntent] = useState<'dating' | 'friendship'>('dating');
  const [intentChanging, setIntentChanging] = useState(false);

  // Handle URL intent
  useEffect(() => {
    const urlIntent = searchParams.get('intent');
    if (urlIntent === 'friendship' || urlIntent === 'dating') {
      setIntent(urlIntent);
    }
  }, [searchParams]);

  const lastSwipeRef = useRef<{ profileId: string; direction: string } | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const geoRequestedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
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
  }, [loading, refresh]);



  useEffect(() => {
    const tutorialDone = localStorage.getItem('swipeTutorialDone');
    if (tutorialDone) setTutorialStep(null);
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
        () => {
          console.warn('Geolocation denied or unavailable — using default distance filter');
          toast({ title: 'Ubicación no disponible', description: 'Usando distancia predeterminada de 100 km' });
        },
        { enableHighAccuracy: false, timeout: 10000 }
      );
    }
  }, []);

  const currentProfile = profiles[0]?.profile;
  const profilesRef = useRef(profiles);

  useEffect(() => {
    setFilters(prev => ({ ...prev, intent }));
  }, [intent]);

  useEffect(() => {
    if (!loading && intentChanging) {
      setIntentChanging(false);
    }
  }, [loading, intentChanging]);

  profilesRef.current = profiles;

  const maxRewinds = currentUserProfile?.subscriptionStatus === 'plus' ? 3 : 1;
  const isNewRewindDay = !currentUserProfile?.rewindsResetAt || 
    new Date().toDateString() !== new Date(currentUserProfile.rewindsResetAt).toDateString();
  const rewindsUsed = isNewRewindDay ? 0 : (currentUserProfile?.rewindsUsed ?? 0);
  const rewindsRemaining = maxRewinds - rewindsUsed;

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
    setSwipeCount(prev => prev + 1);

    const remainingProfiles = previousProfiles.slice(1);
    setProfiles(remainingProfiles as any);

    try {
      track(AnalyticsEvents.LIKE_SENT, { targetUserId: profileToActOn.id, intent });
      const result = await sendLike(profileToActOn.id, action, intent);
      lastSwipeRef.current = { profileId: profileToActOn.id, direction };

      if (action === 'pass') {
        toast({ title: 'Descartado', description: 'Perfil descartado.' });
      } else if (action === 'superlike') {
        toast({ title: '¡💘 Flechado enviado!', description: `${profileToActOn.displayName} recibirá tu interés destacado.` });
      } else {
        toast({ title: 'Like enviado', description: '¡Esperamos que sea mutuo!' });
      }

      if (result?.matched) {
        track(AnalyticsEvents.MATCH_CREATED, { partnerId: profileToActOn.id, intent });
        setMatchedProfile(profileToActOn);
        setMatchId((result as any)?.matchId);
        setShowMatchScreen(true);
      }
    } catch (error) {
      console.error("Action failed", error);
      setProfiles(previousProfiles as any);
      setSwipeCount(prev => prev - 1);
      lastSwipeRef.current = null;
      toast({
        title: "Error",
        description: action === 'superlike' ? "No se pudo enviar el Flechado." : "No se pudo procesar la acción. Perfil restaurado.",
        variant: "destructive"
      });
    } finally {
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
        <div className="flex items-center justify-center py-2 -mb-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className={`h-3.5 w-3.5 ${pullToRefresh >= 1 ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullToRefresh * 180}deg)` }} />
            {pullToRefresh >= 1 ? 'Actualizando...' : 'Suelta para actualizar'}
          </div>
        </div>
      )}
      {/* Flechado sound / visual feedback could be triggered here */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-4 backdrop-blur-md border-b bg-background/90 pt-safe">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Alora</h1>
          {(currentUserProfile as any)?.travelModeEnabled && (
            <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              ✈️ Explorando: {(currentUserProfile as any).travelCity}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <div className="hidden md:flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleRewind} disabled={!lastSwipeRef.current || rewinding} title={`Rewind: deshace el último swipe (${rewindsRemaining}/${maxRewinds} disponibles)`} aria-label="Deshacer último swipe">
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
              <Button variant="ghost" size="icon" onClick={handleRewind} disabled={!lastSwipeRef.current || rewinding} title={`Rewind: deshace el último swipe (${rewindsRemaining}/${maxRewinds} disponibles)`} aria-label="Deshacer último swipe" className="touch-target">
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
        {intent === 'dating' && (
          <Card className="border-none bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-2xl overflow-hidden cursor-pointer hover:bg-indigo-500/20 transition-all" onClick={() => setIntent('friendship')}>
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-600">
                  <Handshake className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-blue-700">Modo Amistad</p>
                  <p className="text-[10px] text-blue-600/80">Busca conexiones platónicas</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-blue-400" />
            </CardContent>
          </Card>
        )}

        {intent === 'friendship' && (
          <Card className="border-none bg-gradient-to-r from-pink-500/10 to-primary/10 rounded-2xl overflow-hidden cursor-pointer hover:bg-primary/20 transition-all" onClick={() => setIntent('dating')}>
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-pink-500/20 flex items-center justify-center text-primary">
                  <Heart className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-primary">Modo Citas</p>
                  <p className="text-[10px] text-primary/80">Vuelve a buscar tu alma gemela</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-primary/40" />
            </CardContent>
          </Card>
        )}

        <LikesCounter
          dailyLikesUsed={currentUserProfile?.dailyLikesUsed ?? 0}
          dailyLikesLimit={SWIPE_LIMIT}
          superlikesRemaining={currentUserProfile?.superlikesRemaining ?? 0}
          resetAt={new Date(new Date().setHours(24, 0, 0, 0))}
          subscriptionStatus={currentUserProfile?.subscriptionStatus ?? 'free'}
        />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-4 relative">
        {countActiveFilters(filters) > 0 && !loading && (
          <div className="mb-4 text-center px-4">
            <p className="text-xs text-muted-foreground bg-muted/50 py-1.5 px-3 rounded-full inline-flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-primary" />
              Mostrando resultados filtrados por {filters.interests.length > 0 ? filters.interests[0] : filters.values.length > 0 ? filters.values[0] : filters.musicGenres && filters.musicGenres.length > 0 ? filters.musicGenres[0] : 'tus preferencias'}
              <button 
                onClick={() => setFilters(DEFAULT_FILTERS)}
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
            <div className="w-full">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {profiles.map(({ profile: p, compatibility }: any) => (
                  <Card key={p.id} className="rounded-2xl overflow-hidden shadow-sm border group">
                    <div
                      className="aspect-[3/4] relative cursor-pointer"
                      onClick={() => router.push(`/profile/${p.id}?source=discover&intent=${intent}`)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push(`/profile/${p.id}?source=discover&intent=${intent}`); }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Ver perfil de ${p.displayName || ''}`}
                    >
                      <Image
                        src={p.photos?.[0] || '/placeholder.svg'}
                        alt={p.displayName || ''}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      {p.activeNow && (
                        <div className="absolute top-2 left-2 bg-primary/90 backdrop-blur-sm text-primary-foreground text-[11px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 border border-primary/30">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/75 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary-foreground" />
                          </span>
                          Activa
                        </div>
                      )}
                      {(p as any).latestAnswer && (
                        <div className="absolute top-2 right-2 bg-accent/90 backdrop-blur-sm text-accent-foreground text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                          💬 Resp.
                        </div>
                      )}
                      {p.voiceIntro && (
                        <div className="absolute top-8 left-2 bg-muted/90 backdrop-blur-sm text-muted-foreground text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                          🎵 Voz
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="text-white text-xs font-bold leading-tight">{p.displayName}, {p.age}</div>
                        {p.city && <div className="text-white/70 text-xs">{p.city}</div>}
                        {p.sharedInterests !== undefined && p.sharedInterests > 0 && (
                          <div className="text-primary-foreground/80 text-[10px] mt-0.5 bg-primary/20 backdrop-blur-sm rounded-full px-2 py-0.5 inline-block">{p.sharedInterests} intereses común</div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 p-1.5">
                      <Button size="sm" variant="ghost" className="flex-1 h-11" aria-label={`Descartar a ${p.displayName || ''}`} onClick={async () => {
                        track(AnalyticsEvents.PASS_SENT, { targetUserId: p.id, intent });
                        await sendLike(p.id, 'pass', intent);
                        setProfiles(prev => prev.filter(item => item.profile.id !== p.id));
                      }}>
                        <X className="h-5 w-5 text-destructive" />
                      </Button>
                      <Button size="sm" variant="ghost" className="flex-1 h-11" aria-label={`Dar like a ${p.displayName || ''}`} onClick={async () => {
                        track(AnalyticsEvents.LIKE_SENT, { targetUserId: p.id, intent });
                        const result = await sendLike(p.id, 'like', intent);
                        setProfiles(prev => prev.filter(item => item.profile.id !== p.id));
                        if (result?.matched) {
                          track(AnalyticsEvents.MATCH_CREATED, { partnerId: p.id, intent });
                          setMatchedProfile(p);
                          setMatchId((result as any)?.matchId);
                          setShowMatchScreen(true);
                        }
                      }}>
                        <Heart className="h-5 w-5 text-primary fill-primary" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : currentProfile ? (
            <div className="w-full max-w-sm min-h-[500px] max-h-[calc(100dvh-180px)] h-full relative">
              {/* Tutorial de swipe — primera vez */}
              {tutorialStep !== null && (
                <div className="absolute -top-14 left-0 right-0 flex justify-center z-30">
                  <div className="bg-foreground/90 text-background px-5 py-3 rounded-2xl text-sm font-medium shadow-lg max-w-[260px]">
                    {tutorialStep === 1 && <p className="flex items-center gap-2"><ArrowRight className="h-4 w-4" /> Desliza a la derecha para dar <strong>Like</strong></p>}
                    {tutorialStep === 2 && <p className="flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Desliza a la izquierda para <strong>Pasar</strong></p>}
                    {tutorialStep === 3 && <p className="flex items-center gap-2"><HeartArrow className="h-4 w-4 text-amber-500 fill-amber-500" /> Toca el corazón flechado para enviar un <strong>Flechado</strong></p>}
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
                <FloatingMatchCard
                  key={currentProfile.id}
                  profile={currentProfile}
                  compatibility={profiles[0]?.compatibility}
                  explanations={profiles[0]?.score?.explanation}
                  onSwipe={handleSwipe}
                  onFlechado={handleFlechado}
                  superlikesRemaining={currentUserProfile?.superlikesRemaining}
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

      {/* Secondary sections — below the feed */}
      <div className="px-4 pb-3 max-w-sm mx-auto w-full">
        <DailyCompatibilityCard />
      </div>

      <div className="px-4 pb-3 max-w-sm mx-auto w-full">
        <PostOnboardingJourney />
      </div>

      <div className="px-4 pb-3 max-w-sm mx-auto w-full">
        <DailyPicks subscriptionStatus={currentUserProfile?.subscriptionStatus ?? 'free'} />
      </div>

      <DiscoverFilters
        open={filterOpen}
        onOpenChange={setFilterOpen}
        onApplyFilters={handleApplyFilters}
        initialFilters={filters}
        browseMode={browseMode}
        onBrowseModeChange={setBrowseMode}
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

      {/* Bottom spacing for scrolling */}
      <div className="h-20 md:hidden" />
    </div>
  );
}
