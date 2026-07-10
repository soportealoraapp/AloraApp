'use client';

import { useAuth } from '@/contexts/AuthContext';

import { calculateCompleteness } from '@/lib/utils/completeness';
import { TrustBadge } from '@/components/ui/premium/TrustBadge';
import { BadgeChipList } from '@/components/profile/BadgeChip';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Settings, Edit, Eye, Music, CheckCircle, ChevronRight, Shield, Sparkles, MessageCircle, X, Mic, LogOut, Heart, BarChart2, Users } from 'lucide-react';
import { SafeImage } from '@/components/ui/safe-image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { ProfileHighlights } from '@/components/profile/ProfileHighlights';
import { VoicePlayer } from '@/components/audio/VoicePlayer';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SpotifySection } from '@/components/profile/SpotifySection';
import { PromptCards } from '@/components/profile/PromptCards';
import { dailyQuestionCategoryLabel } from '@/lib/daily-question-categories';

export default function ProfilePage() {
  const { user, profile, authLoading, profileLoading, signOut } = useAuth();
  const router = useRouter();
  const loading = authLoading || profileLoading;
  const [latestAnswer, setLatestAnswer] = useState<{
    questionId: string;
    question: string | null;
    category: string | null;
    answer: string;
    createdAt: string;
  } | null>(null);
    const [dismissedVerification, setDismissedVerification] = useState(false);
    const [logoutOpen, setLogoutOpen] = useState(false);
  const [profileStats, setProfileStats] = useState<{ likesReceived: number; matchesCount: number; profileViews: number } | null>(null);
  const [prompts, setPrompts] = useState<{ id: string; promptId: string; question: string; answer: string; position: number }[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    const controller = new AbortController();
    fetch('/api/prompts', { signal: controller.signal })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.prompts) setPrompts(data.prompts); })
      .catch(() => {});
    return () => controller.abort();
  }, [user?.id]);

  useEffect(() => {
    setDismissedVerification(localStorage.getItem('dismissedVerification') === 'true');
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const controller = new AbortController();
    fetch('/api/profile/stats', { signal: controller.signal })
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch');
        return r.json();
      })
      .then(data => {
        if (data.likesReceived !== undefined) {
          setProfileStats(data);
        }
      })
      .catch(() => logger.warn('Failed to fetch profile stats'));
    return () => controller.abort();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const controller = new AbortController();
    fetch('/api/daily-question', {
        headers: { 'x-timezone': Intl.DateTimeFormat().resolvedOptions().timeZone },
        signal: controller.signal,
    })
      .then(r => {
        if (r.status === 404) return null; // no active question — expected, not an error
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        if (data?.answered && data.userAnswer) {
          setLatestAnswer({
            questionId: data.questionId,
            question: data.question,
            category: data.category,
            answer: data.userAnswer,
            createdAt: new Date().toISOString(),
          });
        }
      })
      .catch((err) => logger.warn('Failed to fetch daily answer for own profile', { metadata: { error: err instanceof Error ? err.message : String(err) } }));
    return () => controller.abort();
  }, [user?.id]);

  if (loading) {
    return (
      <div>
        <header className="app-page-header gap-4 sm:px-6">
          <Skeleton className="h-8 w-32" />
        </header>
        <main className="pb-24 md:pb-4">
          <Skeleton className="w-full h-96" />
          <div className="p-4 space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
          </div>
        </main>

    <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
      <AlertDialogContent className="rounded-3xl border-none glass">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-headline text-xl">¿Cerrar sesión?</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Tendrás que iniciar sesión de nuevo para ver tus conexiones.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="rounded-full font-bold">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => { await signOut(); router.replace('/login'); }}
            className="bg-destructive text-white hover:bg-destructive/90 rounded-full font-bold"
          >
            Cerrar sesión
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </div>
  );
}

  if (!profile) {
    return (
      <div>
        <header className="app-page-header gap-4 sm:px-6">
          <h1 className="text-xl font-bold md:text-2xl text-foreground">Mi Perfil</h1>
        </header>
        <main className="pb-24 md:pb-4 flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
          <Shield className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">No pudimos cargar tu perfil</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Ocurrió un error al obtener tu información. Por favor, revisa tu conexión e intenta de nuevo.
          </p>
          <Button onClick={() => router.refresh()} variant="default">
            Intentar de nuevo
          </Button>
        </main>
      </div>
    );
  }

  const completenessScore = calculateCompleteness(profile);

  const handleTagClick = (tag: string, type: 'interest' | 'value' | 'music') => {
    const queryParam = type === 'interest' ? 'interest' : type === 'value' ? 'value' : 'music';
    router.push(`/discover?${queryParam}=${encodeURIComponent(tag)}`);
  };

  const hasStats = profileStats && (profileStats.likesReceived > 0 || profileStats.matchesCount > 0 || profileStats.profileViews > 0);

  return (
    <div>
      {/* Header */}
      <header className="app-page-header gap-2 px-3 sm:px-6"
        style={{ borderBottomColor: 'hsl(var(--border) / 0.5)' }}
      >
        <h1 className="text-xl font-headline font-bold text-gradient shrink-0">Mi Perfil</h1>
        <div className="ml-auto flex items-center gap-1 sm:gap-2 min-w-0">
          <Button
            size="icon"
            variant="ghost"
            className="shrink-0 rounded-xl hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setLogoutOpen(true)}
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="ghost" asChild className="shrink-0 rounded-xl" aria-label="Configuración">
            <Link href="/settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
          <Button size="icon" variant="ghost" asChild className="shrink-0 rounded-xl" aria-label="Vista previa del perfil">
            <Link href={`/profile/${user?.id}?preview=1`}>
              <Eye className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="default" size="sm" asChild className="shrink-0 rounded-xl px-3 sm:px-4 text-xs sm:text-sm">
            <Link href="/profile/edit">
              <Edit className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Editar</span>
            </Link>
          </Button>
        </div>
      </header>

      <main className="pb-24 md:pb-4">
        {/* 1. Photo carousel */}
        <div className="w-full relative">
          {(profile.photos?.length ?? 0) > 1 ? (
            <Carousel className="w-full">
              <CarouselContent>
                {profile.photos?.map((photo, index) => (
                  <CarouselItem key={index}>
                    <div className="w-full aspect-[4/5] relative">
                      <SafeImage
                        src={photo}
                        alt={`${profile.displayName} ${index + 1}`}
                        fill
                        className="object-cover"
                        priority={index === 0}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2 z-10 shadow-lg" />
              <CarouselNext className="right-2 z-10 shadow-lg" />
            </Carousel>
          ) : (
            <SafeImage
              src={profile.photos?.[0] || '/placeholder.svg'}
              alt={profile.displayName}
              width={600}
              height={800}
              className="w-full aspect-[4/5] object-cover"
              priority
            />
          )}
          {/* Gradient overlay at bottom of photo */}
          <div
            className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, hsl(var(--background)) 0%, transparent 100%)',
            }}
          />
        </div>

        {/* Stats — with gradient separators */}
        {hasStats && (
          <div
            className="mx-4 mb-4 -mt-1 grid auto-cols-fr grid-flow-col gap-0 overflow-hidden rounded-2xl border border-border/40"
            style={{
              background: 'linear-gradient(135deg, hsl(335 85% 76% / 0.06) 0%, hsl(280 60% 70% / 0.04) 100%)',
            }}
          >
            {profileStats.likesReceived > 0 && (
              <Link href="/matches" className="border-r border-border/40 px-2 py-4 text-center transition-colors hover:bg-primary/5 last:border-r-0">
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <Heart className="h-3.5 w-3.5 text-primary" />
                  <p className="text-xl font-bold text-gradient">{profileStats.likesReceived}</p>
                </div>
                <p className="text-xs text-muted-foreground">Me gusta</p>
              </Link>
            )}
            {profileStats.matchesCount > 0 && (
              <Link href="/matches" className="border-r border-border/40 px-2 py-4 text-center transition-colors hover:bg-primary/5 last:border-r-0">
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <p className="text-xl font-bold text-gradient">{profileStats.matchesCount}</p>
                </div>
                <p className="text-xs text-muted-foreground">Conexiones</p>
              </Link>
            )}
            {profileStats.profileViews > 0 && (
              <Link href="/profile/visitors" className="px-2 py-4 text-center transition-colors hover:bg-primary/5">
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <BarChart2 className="h-3.5 w-3.5 text-primary" />
                  <p className="text-xl font-bold text-gradient">{profileStats.profileViews}</p>
                </div>
                <p className="text-xs text-muted-foreground">Visitas</p>
              </Link>
            )}
          </div>
        )}

        <div className="app-page-content space-y-5">
          {/* 2. Name + badges + bio */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-3xl font-bold font-headline text-foreground">{profile.displayName}, {profile.age}</h2>
              {profile.isVerified && <TrustBadge type="verified" />}
              {completenessScore >= 90 && <TrustBadge type="complete" />}
              {profile.subscriptionStatus === 'plus' && <TrustBadge type="premium" />}
            </div>

            {!profile.isVerified && !dismissedVerification && (
              <Card
                className="rounded-2xl relative overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  border: '1px solid hsl(335 85% 76% / 0.25)',
                  background: 'linear-gradient(135deg, hsl(335 85% 76% / 0.07) 0%, hsl(280 60% 70% / 0.05) 100%)',
                  boxShadow: '0 2px 12px hsl(335 85% 76% / 0.1)',
                }}
                onClick={() => router.push('/settings/verification')}
              >
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDismissedVerification(true); localStorage.setItem('dismissedVerification', 'true'); }}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-primary/10 transition-colors"
                  aria-label="Ocultar"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2.5 rounded-xl"
                      style={{ background: 'linear-gradient(135deg, hsl(335 85% 76% / 0.2) 0%, hsl(280 60% 70% / 0.15) 100%)' }}
                    >
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm">Verifica tu identidad</h4>
                      <p className="text-xs text-muted-foreground">Aparece primero en Discover</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            )}

            {profile.bio && (
              <p className="text-foreground leading-relaxed whitespace-pre-wrap text-sm">{profile.bio}</p>
            )}
          </div>

          {/* Voice intro */}
          {profile.voiceIntro && (
            <Card
              className="rounded-2xl overflow-hidden border"
              style={{ borderColor: 'hsl(335 85% 76% / 0.2)', background: 'linear-gradient(135deg, hsl(335 85% 76% / 0.05) 0%, hsl(280 60% 70% / 0.03) 100%)' }}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Mic className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm text-foreground">Presentación de voz</h3>
                </div>
                <VoicePlayer src={profile.voiceIntro} />
              </CardContent>
            </Card>
          )}

          {/* 3. Highlights */}
          <ProfileHighlights
            bio={profile.bio}
            interests={profile.interests}
            values={profile.values}
            lookingFor={profile.lookingFor}
            musicGenres={profile.musicGenres}
            voiceIntro={profile.voiceIntro}
          />

          {/* 4. Daily answer */}
          {latestAnswer && (
            <Card
              className="rounded-2xl border"
              style={{ borderColor: 'hsl(280 60% 70% / 0.2)', background: 'linear-gradient(135deg, hsl(280 60% 70% / 0.05) 0%, hsl(335 85% 76% / 0.03) 100%)' }}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-accent/20">
                    <MessageCircle className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <h3 className="font-semibold text-sm text-foreground">
                    {dailyQuestionCategoryLabel(latestAnswer.category)}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mb-1.5">{latestAnswer.question}</p>
                <p className="text-sm text-foreground leading-relaxed italic">"{latestAnswer.answer}"</p>
              </CardContent>
            </Card>
          )}

          {/* 4b. Profile prompts (Tinder / Parejas style) */}
          {prompts.length > 0 && <PromptCards prompts={prompts} />}

          {/* 5. Interests / Values / Music */}
          {((profile.interests && profile.interests.length > 0) || (profile.values && profile.values.length > 0) || (profile.musicGenres && profile.musicGenres.length > 0)) && (
            <Card className="app-prose-section rounded-2xl">
              <CardContent className="p-5 space-y-5">
                {profile.interests && profile.interests.length > 0 && (
                  <div>
                    <h3 className="font-bold text-sm mb-3 text-foreground flex items-center gap-2">
                      <span className="h-1 w-3 rounded-full bg-gradient-to-r from-primary to-violet-500 inline-block" />
                      Intereses
                    </h3>
                    <BadgeChipList
                      items={profile.interests}
                      type="interest"
                      onItemClick={(tag) => handleTagClick(tag, 'interest')}
                    />
                  </div>
                )}
                {profile.values && profile.values.length > 0 && (
                  <div>
                    <h3 className="font-bold text-sm mb-3 text-foreground flex items-center gap-2">
                      <span className="h-1 w-3 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 inline-block" />
                      Valores
                    </h3>
                    <BadgeChipList
                      items={profile.values}
                      type="value"
                      onItemClick={(tag) => handleTagClick(tag, 'value')}
                    />
                  </div>
                )}
                {profile.musicGenres && profile.musicGenres.length > 0 && (
                  <div>
                    <h3 className="font-bold text-sm flex items-center gap-2 mb-3 text-foreground">
                      <span className="h-1 w-3 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 inline-block" />
                      <Music className="h-4 w-4" />
                      Música
                    </h3>
                    <BadgeChipList
                      items={profile.musicGenres}
                      type="music"
                      onItemClick={(tag) => handleTagClick(tag, 'music')}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 6. Spotify Section */}
          <ErrorBoundary fallback={null}>
            <SpotifySection spotify={profile?.spotify ?? null} isOwn={true} />
          </ErrorBoundary>

          {/* 7. Completeness CTA */}
          {completenessScore < 100 && (
            <Card
              className="rounded-2xl border overflow-hidden"
              style={{ borderColor: 'hsl(335 85% 76% / 0.2)' }}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-bold text-sm text-foreground">Tu perfil al {completenessScore}%</span>
                  </div>
                </div>
                {/* Gradient progress bar */}
                <div className="h-2 rounded-full bg-muted overflow-hidden mb-4">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${completenessScore}%`,
                      background: 'linear-gradient(90deg, hsl(335 85% 76%) 0%, hsl(280 60% 70%) 100%)',
                    }}
                    role="progressbar"
                    aria-valuenow={completenessScore}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Completitud del perfil"
                  />
                </div>
                <div className="space-y-2 text-sm">
                  {[
                    { label: 'Foto principal', done: (profile?.photos?.length ?? 0) > 0 },
                    { label: 'Bio (50+ caracteres)', done: (profile?.bio?.length ?? 0) >= 50 },
                    { label: 'Ciudad', done: !!profile?.city },
                    { label: 'Intereses (3+)', done: (profile?.interests?.length ?? 0) >= 3 },
                    { label: 'Valores (2+)', done: (profile?.values?.length ?? 0) >= 2 },
                    { label: 'Gustos musicales', done: (profile?.musicGenres?.length ?? 0) > 0 },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {item.done ? (
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                      )}
                      <span className={item.done ? 'text-muted-foreground/60 line-through' : 'text-foreground/80'}>{item.label}</span>
                    </div>
                  ))}
                </div>
                <Button variant="default" asChild className="w-full mt-4 rounded-xl h-10 text-sm">
                  <Link href="/profile/edit">Completar perfil →</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {completenessScore >= 90 && (
            <Card
              className="rounded-2xl border overflow-hidden"
              style={{
                borderColor: 'hsl(335 85% 76% / 0.25)',
                background: 'linear-gradient(135deg, hsl(335 85% 76% / 0.08) 0%, hsl(280 60% 70% / 0.06) 100%)',
              }}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <span className="text-2xl">⭐</span>
                <div>
                  <p className="font-bold text-sm text-gradient">Perfil destacado</p>
                  <p className="text-xs text-muted-foreground">Tu perfil está muy completo — ¡sigue así!</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 8. Quick links */}
          <div className="app-prose-section rounded-2xl overflow-hidden">
            {[
              { href: '/profile/favorites', label: 'Perfiles guardados' },
              { href: '/profile/trust', label: 'Score de confianza' },
              { href: '/profile/visitors', label: 'Visitantes del perfil' },
            ].map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3.5 hover:bg-muted/30 transition-colors ${i > 0 ? 'border-t border-border/30' : ''}`}
              >
                <span className="text-sm font-medium">{item.label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
