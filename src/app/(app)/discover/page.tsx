"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { FloatingMatchCard } from "@/components/ui/premium/FloatingMatchCard";
import { MatchScreen } from "@/components/ui/premium/MatchScreen";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCcw, Sparkles, SlidersHorizontal, RotateCcw, LayoutGrid, CreditCard, Heart, Handshake, X, Heart as HeartIcon, CheckCircle, Circle, ChevronRight } from "lucide-react";
import { DiscoverFilters, Filters } from "@/components/discover/discover-filters";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
import { DailyPicks } from "@/components/discover/DailyPicks";
import { SecondChanceSection } from "@/components/discover/SecondChanceSection";
import { logger } from "@/lib/logger";

const DEFAULT_FILTERS: Filters = {
  ageRange: [18, 60],
  distance: 100,
  seeking: 'all',
  verifiedOnly: false,
  interests: [],
  values: [],
  musicGenres: [],
  highCompatibility: false,
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
  const [swipeCount, setSwipeCount] = useState(0);
  const [rewinding, setRewinding] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<number | null>(1);
  const [browseMode, setBrowseMode] = useState<'swipe' | 'grid'>('swipe');
  const [intent, setIntent] = useState<'dating' | 'friendship'>('dating');
  const [intentChanging, setIntentChanging] = useState(false);

  const lastSwipeRef = useRef<{ profileId: string; direction: string } | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const geoRequestedRef = useRef(false);
  const dailyQuestionRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pullToRefresh, setPullToRefresh] = useState(0);
  const pullStartRef = useRef(0);

  const [activationScore, setActivationScore] = useState<number | null>(null);
  const [activationTasks, setActivationTasks] = useState<{ id: string; title: string; completed: boolean; rewardText: string }[]>([]);
  const [activationCardEnabled, setActivationCardEnabled] = useState(true);

  const handleTaskClick = (title: string) => {
    switch (title) {
      case "Completa tu registro":
      case "Escribe tu biografía":
      case "Elige 3 intereses":
      case "Define tus valores":
      case "Sube 3 fotos":
      case "Graba tu voz":
        router.push('/profile/edit');
        break;
      case "Haz un quiz":
        router.push('/compatibility');
        break;
      case "Responde la pregunta diaria":
        dailyQuestionRef.current?.scrollIntoView({ behavior: 'smooth' });
        break;
      case "Verifícate":
        router.push('/settings/verification');
        break;
      case "Da tu primer like":
        break;
      case "Consigue tu primer match":
      case "Envía tu primer mensaje":
        router.push('/chat');
        break;
    }
  };

  useEffect(() => {
    fetch('/api/discover/activation')
      .then(r => r.json())
      .then(data => {
        if (data.score) {
          setActivationScore(data.score.score);
          setActivationTasks(data.tasks || []);
        }
      })
      .catch(() => logger.warn('Failed to fetch activation data'));
    fetch('/api/experiments/flags')
      .then(r => r.json())
      .then(data => {
        if (data.activationCardEnabled !== undefined) {
          setActivationCardEnabled(data.activationCardEnabled);
        }
      })
      .catch(() => logger.warn('Failed to fetch experiment flags'));
  }, []);

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
        () => { /* User denied geolocation */ },
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

  const handleSwipe = async (direction: 'left' | 'right') => {
    const profileToActOn = profilesRef.current[0]?.profile;
    if (!profileToActOn || !currentUserProfile) return;

    if (swipeCount >= SWIPE_LIMIT) {
      toast({
        title: "¡Tómate un respiro!",
        description: "Has visto muchos perfiles. Vuelve en un momento para asegurar conexiones de calidad.",
        variant: "default"
      });
      return;
    }

    const previousProfiles = profilesRef.current;

    setSwipeCount(prev => prev + 1);

    const currentProfiles = profilesRef.current;
    const remainingProfiles = currentProfiles.slice(1);
    setProfiles(remainingProfiles as any);

    try {
      if (direction === 'right') {
        track(AnalyticsEvents.LIKE_SENT, { targetUserId: profileToActOn.id, intent });
        const result = await sendLike(profileToActOn.id, 'like', intent);
        lastSwipeRef.current = { profileId: profileToActOn.id, direction };
        toast({ title: 'Like enviado', description: `Le gustas a ${profileToActOn.displayName}?` });
        if (result?.matched) {
          track(AnalyticsEvents.MATCH_CREATED, { partnerId: profileToActOn.id, intent });
          setMatchedProfile(profileToActOn);
          setMatchId((result as any)?.matchId);
          setShowMatchScreen(true);
        }
      } else {
        track(AnalyticsEvents.PASS_SENT, { targetUserId: profileToActOn.id, intent });
        await sendLike(profileToActOn.id, 'pass', intent);
        lastSwipeRef.current = { profileId: profileToActOn.id, direction };
        toast({ title: 'Descartado', description: 'Perfil descartado.' });
      }
    } catch (error) {
      console.error("Action failed", error);
      setProfiles(previousProfiles as any);
      lastSwipeRef.current = null;
      toast({ title: "Error", description: "No se pudo procesar la acción. Perfil restaurado.", variant: "destructive" });
    }
  };

  const handleFlechado = async () => {
    const profileToActOn = profilesRef.current[0]?.profile;
    if (!profileToActOn || !currentUserProfile) return;

    const previousProfiles = profilesRef.current;
    setSwipeCount(prev => prev + 1);

    const remainingProfiles = profilesRef.current.slice(1);
    setProfiles(remainingProfiles as any);

    try {
      track(AnalyticsEvents.LIKE_SENT, { targetUserId: profileToActOn.id, intent });
      const result = await sendLike(profileToActOn.id, 'superlike', intent);
      lastSwipeRef.current = { profileId: profileToActOn.id, direction: 'flechado' };
      toast({ title: '¡Flechado enviado!', description: `${profileToActOn.displayName} lo recibirá como superlike.` });
      if (result?.matched) {
        track(AnalyticsEvents.MATCH_CREATED, { partnerId: profileToActOn.id });
        setMatchedProfile(profileToActOn);
        setMatchId((result as any)?.matchId);
        setShowMatchScreen(true);
      }
    } catch (error) {
      console.error("Flechado failed", error);
      setProfiles(previousProfiles as any);
      lastSwipeRef.current = null;
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

  const handlePullTouchStart = useCallback((e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop <= 0 && !loading) {
      pullStartRef.current = e.touches[0].clientY;
    }
  }, [loading]);

  const handlePullTouchMove = useCallback((e: React.TouchEvent) => {
    if (pullStartRef.current === 0) return;
    const pull = e.touches[0].clientY - pullStartRef.current;
    if (pull > 0) {
      setPullToRefresh(Math.min(pull / 300, 1));
      if (pull > 100) {
        e.preventDefault();
      }
    }
  }, []);

  const handlePullTouchEnd = useCallback(() => {
    if (pullToRefresh >= 1) {
      refresh();
    }
    setPullToRefresh(0);
    pullStartRef.current = 0;
  }, [pullToRefresh, refresh]);

  return (
    <div
      ref={scrollRef}
      className="md:pl-60 h-screen flex flex-col overflow-y-auto bg-gradient-to-br from-background to-muted/30"
      style={{ overscrollBehavior: 'contain' } as React.CSSProperties}
      onTouchStart={handlePullTouchStart}
      onTouchMove={handlePullTouchMove}
      onTouchEnd={handlePullTouchEnd}
    >
      {pullToRefresh > 0 && (
        <div className="flex items-center justify-center py-2 -mb-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className={`h-3.5 w-3.5 ${pullToRefresh >= 1 ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullToRefresh * 180}deg)` }} />
            {pullToRefresh >= 1 ? 'Actualizando...' : 'Suelta para actualizar'}
          </div>
        </div>
      )}
      <header className="flex h-16 items-center justify-between px-4 z-10">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Alora</h1>
          {(currentUserProfile as any)?.travelModeEnabled && (
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              ✈️ Explorando: {(currentUserProfile as any).travelCity}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <div className="hidden md:flex">
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
          </div>
          <Tabs value={browseMode} onValueChange={(v) => setBrowseMode(v as 'swipe' | 'grid')} className="hidden md:block">
            <TabsList className="h-8">
              <TabsTrigger value="swipe" className="text-xs px-3 h-7 gap-1">
                <CreditCard className="h-3.5 w-3.5" /> Swipe
              </TabsTrigger>
              <TabsTrigger value="grid" className="text-xs px-3 h-7 gap-1">
                <LayoutGrid className="h-3.5 w-3.5" /> Explorar
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="md:hidden flex">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setBrowseMode(b => b === 'swipe' ? 'grid' : 'swipe')}
              title={browseMode === 'swipe' ? 'Vista exploración' : 'Vista swipe'}
              aria-label={browseMode === 'swipe' ? 'Vista exploración' : 'Vista swipe'}
              className="h-8 w-8"
            >
              {browseMode === 'swipe' ? <LayoutGrid className="h-4 w-4 text-muted-foreground" /> : <CreditCard className="h-4 w-4 text-muted-foreground" />}
            </Button>
          </div>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={handleRewind} disabled={!lastSwipeRef.current || rewinding} title={`Rewind: deshace el último swipe (${rewindsRemaining}/${maxRewinds} disponibles)`} aria-label="Deshacer último swipe">
              <RotateCcw className="h-5 w-5 text-muted-foreground" />
            </Button>
            <span className="text-[10px] text-muted-foreground font-bold -ml-1.5">{rewindsRemaining}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setFilterOpen(true)} title="Filtros de búsqueda" aria-label="Filtros de búsqueda" className="relative">
            <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
            {countActiveFilters(filters) > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm border border-background">
                {countActiveFilters(filters)}
              </span>
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => refresh()} title="Refrescar perfiles" aria-label="Refrescar perfiles">
            <RefreshCcw className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </header>

      <div className="md:hidden px-4 pt-2">
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
      </div>

      <div className="px-4 pt-2">
        <Tabs value={intent} onValueChange={(v) => { setIntentChanging(true); setIntent(v as 'dating' | 'friendship'); }}>
          <TabsList className="w-full h-10">
            <TabsTrigger value="dating" className="flex-1 text-sm gap-1.5 h-8">
              <HeartIcon className="h-4 w-4" /> Citas
            </TabsTrigger>
            <TabsTrigger value="friendship" className="flex-1 text-sm gap-1.5 h-8">
              <Handshake className="h-4 w-4" /> Amistad
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {!currentUserProfile?.isVerified && (
        <div className="px-4 pt-2">
          <div className="bg-warning/10 border border-warning/20 rounded-xl p-3 flex items-center justify-between">
            <p className="text-xs text-warning-foreground font-medium">Los perfiles verificados aparecen primero en Discover</p>
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => router.push('/settings/verification')}>
              Verificar
            </Button>
          </div>
        </div>
      )}

      {activationScore !== null && activationScore < 80 && activationCardEnabled && (
        <div className="px-4 pt-2">
          <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold">Tu perfil está al {activationScore}%</p>
              <span className="text-[10px] text-muted-foreground">Completa estas acciones</span>
            </div>
            <Progress value={activationScore} className="h-2 mb-3" />
            <div className="space-y-1.5">
              {activationTasks
                .filter(t => !t.completed)
                .sort((a, b) => {
                  const priority: Record<string, number> = {
                    'Verifícate': 0,
                    'Graba tu voz': 1,
                    'Haz un quiz': 2,
                    'Responde la pregunta diaria': 3,
                    'Escribe tu biografía': 4,
                    'Elige 3 intereses': 5,
                    'Define tus valores': 6,
                    'Sube 3 fotos': 7,
                    'Da tu primer like': 8,
                    'Consigue tu primer match': 9,
                    'Envía tu primer mensaje': 10,
                  };
                  return (priority[a.title] ?? 99) - (priority[b.title] ?? 99);
                })
                .slice(0, 4).map(task => (
                <button
                  key={task.id}
                  onClick={() => handleTaskClick(task.title)}
                  className="w-full flex items-center gap-2 text-xs text-left"
                >
                  <Circle className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="flex-1">{task.title}</span>
                  <span className="text-[9px] text-primary font-medium">{task.rewardText}</span>
                </button>
              ))}
            </div>
            {activationTasks.filter(t => !t.completed).length > 4 && (
              <button onClick={() => router.push('/profile/edit')} className="text-[10px] text-primary font-medium mt-2 flex items-center gap-1">
                Ver más <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </Card>
        </div>
      )}

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
                        <div className="absolute top-2 left-2 bg-green-500/90 backdrop-blur-sm text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 border border-green-300/30">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-200" />
                          </span>
                          Activa
                        </div>
                      )}
                      {(p as any).latestAnswer && (
                        <div className="absolute top-2 right-2 bg-amber-500/90 backdrop-blur-sm text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                          💬 Resp.
                        </div>
                      )}
                      {p.voiceIntro && (
                        <div className="absolute top-8 left-2 bg-indigo-500/90 backdrop-blur-sm text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                          🎵 Voz
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="text-white text-xs font-bold leading-tight">{p.displayName}, {p.age}</div>
                        {p.city && <div className="text-white/70 text-[10px]">{p.city}</div>}
                        {p.sharedInterests !== undefined && p.sharedInterests > 0 && (
                          <div className="text-purple-200 text-[9px] mt-0.5">{p.sharedInterests} interés(es) en común</div>
                        )}
                        {compatibility != null && (
                          <div className="inline-block bg-primary/80 text-white text-[10px] px-1.5 py-0.5 rounded mt-1">
                            {Math.round(compatibility)}% compatibles
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 p-1.5">
                      <Button size="sm" variant="ghost" className="flex-1 h-8" aria-label={`Descartar a ${p.displayName || ''}`} onClick={async () => {
                        track(AnalyticsEvents.PASS_SENT, { targetUserId: p.id, intent });
                        await sendLike(p.id, 'pass', intent);
                        setProfiles(prev => prev.filter(item => item.profile.id !== p.id));
                      }}>
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                      <Button size="sm" variant="ghost" className="flex-1 h-8" aria-label={`Dar like a ${p.displayName || ''}`} onClick={async () => {
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
              {/* Tutorial de swipe — primera vez */}
              {tutorialStep !== null && (
                <div className="absolute -top-14 left-0 right-0 flex justify-center z-30">
                  <div className="bg-foreground/90 text-background px-5 py-3 rounded-2xl text-sm font-medium shadow-lg max-w-[260px]">
                    {tutorialStep === 1 && <p>👉 Desliza a la derecha para dar <strong>Like</strong></p>}
                    {tutorialStep === 2 && <p>👈 Desliza a la izquierda para <strong>Pasar</strong></p>}
                    {tutorialStep === 3 && <p>⭐ Toca la estrella para <strong>Flechado</strong> (superlike)</p>}
                    <div className="flex justify-between items-center mt-2.5">
                      <span className="text-[10px] opacity-50">{tutorialStep}/3</span>
                      <button onClick={tutorialStep === 3 ? dismissTutorial : nextTutorialStep} className="text-[11px] font-bold underline">
                        {tutorialStep === 3 ? 'Cerrar' : 'Siguiente →'}
                      </button>
                    </div>
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
                  explanations={profiles[0]?.score?.explanation}
                  onSwipe={handleSwipe}
                  onFlechado={handleFlechado}
                  superlikesRemaining={3}
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

      {/* Daily Picks - below the feed */}
      <div className="px-4 pb-2">
        <DailyPicks />
      </div>

      {/* Daily Question and Compatibility - shown below the feed */}
      <div className="px-4 pb-4 max-w-sm mx-auto w-full space-y-3">
        <SecondChanceSection />
        <DailyCompatibilityCard />
        <div ref={dailyQuestionRef}>
          <DailyQuestionCard />
        </div>
      </div>

      <DiscoverFilters
        open={filterOpen}
        onOpenChange={setFilterOpen}
        onApplyFilters={handleApplyFilters}
        initialFilters={filters}
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
    </div>
  );
}
