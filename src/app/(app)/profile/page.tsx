"use client";

import { useAuth } from "@/contexts/AuthContext";
import { trackEvent } from "@/lib/tracking/client";
import { calculateCompleteness } from "@/lib/utils/completeness";
import { TrustBadge } from "@/components/ui/premium/TrustBadge";
import { BadgeChipList } from "@/components/profile/BadgeChip";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, Edit, Eye, Music, CheckCircle, ChevronRight, Shield, Sparkles, MessageCircle, X, Mic, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { logger } from "@/lib/logger";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ProfileHighlights } from "@/components/profile/ProfileHighlights";
import { VoicePlayer } from "@/components/audio/VoicePlayer";
import { SpotifySection } from "@/components/profile/SpotifySection";

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
  const [profileStats, setProfileStats] = useState<{ likesReceived: number; matchesCount: number; profileViews: number } | null>(null);

  useEffect(() => {
    setDismissedVerification(localStorage.getItem('dismissedVerification') === 'true');
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const fetchStats = () => {
      fetch('/api/profile/stats')
        .then(r => r.json())
        .then(data => {
          if (data.likesReceived !== undefined) {
            setProfileStats(data);
          }
        })
        .catch(() => logger.warn('Failed to fetch profile stats'));
    };
    fetchStats();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    fetch('/api/daily-question', {
        headers: { 'x-timezone': Intl.DateTimeFormat().resolvedOptions().timeZone },
    })
      .then(r => r.json())
      .then(data => {
        if (data.answered && data.userAnswer) {
          setLatestAnswer({
            questionId: data.questionId,
            question: data.question,
            category: data.category,
            answer: data.userAnswer,
            createdAt: new Date().toISOString(),
          });
        }
      })
      .catch(() => logger.warn('Failed to fetch daily answer for own profile'));
  }, [user?.id]);

  if (loading) {
    return (
      <div>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 pt-safe">
          <Skeleton className="h-8 w-32" />
        </header>
        <main className="pb-24 md:pb-4">
          <Skeleton className="w-full h-96" />
          <div className="p-4 space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 pt-safe">
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

  return (
    <div>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/90 px-3 backdrop-blur-md sm:px-6 pt-safe">
        <h1 className="text-xl font-bold md:text-2xl text-foreground shrink-0">Mi Perfil</h1>
        <div className="ml-auto flex items-center gap-1 sm:gap-2 min-w-0">
          <Button size="icon" variant="ghost" className="shrink-0" onClick={async () => { await signOut(); router.replace('/login'); }} title="Cerrar sesión">
            <LogOut className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="ghost" asChild className="shrink-0">
            <Link href="/settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
          <Button size="icon" variant="ghost" asChild className="shrink-0">
            <Link href={`/profile/${user?.id}?preview=1`} title="Vista previa">
              <Eye className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="default" size="sm" asChild className="shrink-0 text-xs sm:text-sm px-2 sm:px-4">
            <Link href="/profile/edit">
              <Edit className="h-4 w-4 sm:mr-2" />
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
                      <Image
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
            <Image
              src={profile.photos?.[0] || '/placeholder.svg'}
              alt={profile.displayName}
              width={600}
              height={800}
              className="w-full aspect-[4/5] object-cover"
              priority
            />
          )}
        </div>

        {/* Stats — only show when there's real data */}
        {profileStats && (profileStats.likesReceived > 0 || profileStats.matchesCount > 0 || profileStats.profileViews > 0) && (
        <div className="grid grid-cols-3 gap-4 px-4 py-4 border-b">
          {profileStats.likesReceived > 0 && (
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{profileStats.likesReceived}</p>
            <p className="text-xs text-muted-foreground">Me gusta</p>
          </div>
          )}
          {profileStats.matchesCount > 0 && (
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{profileStats.matchesCount}</p>
            <p className="text-xs text-muted-foreground">Conexiones</p>
          </div>
          )}
          {profileStats.profileViews > 0 && (
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{profileStats.profileViews}</p>
            <p className="text-xs text-muted-foreground">Visitas</p>
          </div>
          )}
        </div>
        )}

        <div className="p-4 space-y-6">
          {/* 2. Name + badges + bio */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-bold font-headline">{profile.displayName}, {profile.age}</h2>
              {profile.isVerified && <TrustBadge type="verified" />}
              {completenessScore >= 90 && <TrustBadge type="complete" />}
              {profile.subscriptionStatus === 'plus' && <TrustBadge type="premium" />}
            </div>

            {!profile.isVerified && !dismissedVerification && (
              <Card className="rounded-2xl border border-primary/20 bg-primary/5 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative" onClick={() => router.push('/settings/verification')}>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDismissedVerification(true); localStorage.setItem('dismissedVerification', 'true'); }}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-primary/10 transition-colors"
                  aria-label="Ocultar"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-xl">
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

          {profile.voiceIntro && (
            <Card className="rounded-2xl border border-border/60 bg-card/90 shadow-sm overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Mic className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm text-foreground">Presentación de voz</h3>
                </div>
                <VoicePlayer src={profile.voiceIntro} />
              </CardContent>
            </Card>
          )}

          {/* 3. Highlights & Voice Intro */}
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
            <Card className="rounded-2xl border border-border/60 bg-card/90 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm text-foreground">
                    {latestAnswer.category || 'Respuesta del día'}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mb-1">{latestAnswer.question}</p>
                <p className="text-sm text-foreground leading-relaxed">"{latestAnswer.answer}"</p>
              </CardContent>
            </Card>
          )}

          {/* 4. Interests / Values / Music */}
          {((profile.interests && profile.interests.length > 0) || (profile.values && profile.values.length > 0) || (profile.musicGenres && profile.musicGenres.length > 0)) && (
            <Card className="rounded-2xl border border-border/60 bg-card/90 shadow-sm">
              <CardContent className="p-5 space-y-4">
                {profile.interests && profile.interests.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm mb-2">Intereses</h3>
                    <BadgeChipList 
                      items={profile.interests} 
                      type="interest" 
                      onItemClick={(tag) => handleTagClick(tag, 'interest')}
                    />
                  </div>
                )}
                {profile.values && profile.values.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm mb-2">Valores</h3>
                    <BadgeChipList 
                      items={profile.values} 
                      type="value" 
                      onItemClick={(tag) => handleTagClick(tag, 'value')}
                    />
                  </div>
                )}
                {profile.musicGenres && profile.musicGenres.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
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

          {/* 5. Spotify Section */}
          {((profile as any).spotify || true) && (
            <SpotifySection spotify={(profile as any).spotify ?? null} isOwn={true} />
          )}

          {/* 6. Completeness CTA — ALWAYS visible */}
          {completenessScore < 100 && (
            <Card className="rounded-2xl border border-border/60 bg-card/90 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-bold text-sm text-foreground">Tu perfil al {completenessScore}%</span>
                  </div>
                </div>
                <Progress value={completenessScore} className="h-1.5 mb-3" />
                <div className="space-y-2 text-sm">
                  {[
                    { label: 'Foto principal', done: (profile as any)?.photos?.length > 0 },
                    { label: 'Bio (50+ caracteres)', done: (profile as any)?.bio?.length >= 50 },
                    { label: 'Ciudad', done: !!(profile as any)?.city },
                    { label: 'Intereses (3+)', done: (profile as any)?.interests?.length >= 3 },
                    { label: 'Valores (2+)', done: (profile as any)?.values?.length >= 2 },
                    { label: 'Gustos musicales', done: (profile as any)?.musicGenres?.length > 0 },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {item.done ? (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                      )}
                      <span className={item.done ? 'text-muted-foreground opacity-60' : ''}>{item.label}</span>
                    </div>
                  ))}
                </div>
                <Button variant="link" asChild className="p-0 h-auto text-xs font-bold text-primary mt-3">
                  <Link href="/profile/edit">Completar perfil →</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {completenessScore >= 90 && (
            <Card className="rounded-2xl border border-primary/20 bg-primary/5 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <span className="text-2xl">⭐</span>
                <div>
                  <p className="font-bold text-sm text-primary">Perfil destacado</p>
                  <p className="text-xs text-muted-foreground">Tu perfil está en el top 10% de completitud</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 6. Quick links */}
          <div className="rounded-2xl border border-border/60 bg-card/90 shadow-sm divide-y divide-muted/30 overflow-hidden">
            <Link href="/profile/favorites" className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/20 transition-colors">
              <span className="text-sm font-medium">Perfiles guardados</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link href="/profile/trust" className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/20 transition-colors">
              <span className="text-sm font-medium">Score de confianza</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link href="/profile/visitors" className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/20 transition-colors">
              <span className="text-sm font-medium">Visitantes del perfil</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
