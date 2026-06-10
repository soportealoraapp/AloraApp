"use client";

import { useAuth } from "@/contexts/AuthContext";
import { trackEvent } from "@/lib/tracking/client";
import { calculateCompleteness } from "@/lib/utils/completeness";
import { TrustBadge } from "@/components/ui/premium/TrustBadge";
import { BadgeChipList } from "@/components/profile/BadgeChip";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings, Edit, Eye, MapPin, Briefcase, Cigarette, GlassWater, Baby, Star, BookOpen, Music, CheckCircle, AlertCircle, ShieldCheck, Shield, Sparkles, ChevronRight, ChevronDown, Trophy, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
import { BoostDashboard } from "@/components/premium/BoostDashboard";
import { SpotifySection } from "@/components/profile/SpotifySection";
import { StreakCard } from "@/components/gamification/StreakCard";
import { FirstWeekJourney } from "@/components/gamification/FirstWeekJourney";
import { PaywallModal } from "@/components/premium/PaywallModal";
import { LikesCounter } from "@/components/discover/LikesCounter";
import { VoiceIntro } from "@/components/audio/VoiceIntro";
import { useState, useEffect } from "react";
import { logger } from "@/lib/logger";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const DynamicFirstWeekJourney = dynamic(() => import("@/components/gamification/FirstWeekJourney").then(m => ({ default: m.FirstWeekJourney })), { ssr: false });
const DynamicStreakCard = dynamic(() => import("@/components/gamification/StreakCard").then(m => ({ default: m.StreakCard })), { ssr: false });

export default function ProfilePage() {
  const { user, profile, authLoading, profileLoading } = useAuth();
  const loading = authLoading || profileLoading;
  const [showPaywall, setShowPaywall] = useState(false);
  const [voiceIntroDeleted, setVoiceIntroDeleted] = useState(false);
  const [quizResults, setQuizResults] = useState<{ quizId: string; score: number; archetype: string }[]>([]);
  const [latestAnswer, setLatestAnswer] = useState<{
    questionId: string;
    question: string | null;
    category: string | null;
    answer: string;
    createdAt: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/compatibility/list')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.completedQuizzes)) setQuizResults(data.completedQuizzes);
      })
      .catch(() => logger.warn('Failed to fetch quiz results'));
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    fetch('/api/daily-question')
      .then(r => r.json())
      .then(data => {
        if (data.answered && data.userAnswer) {
          const latestAnswerData = {
            questionId: data.questionId,
            question: data.question,
            category: data.category,
            answer: data.userAnswer,
            createdAt: new Date().toISOString(),
          };
          setLatestAnswer(latestAnswerData);
        }
      })
      .catch(() => logger.warn('Failed to fetch daily answer for own profile'));
  }, [user?.id]);

  if (loading) {
    return (
      <div className="md:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
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

  if (!profile) return null;

  const completenessScore = calculateCompleteness(profile);

  const handleDeleteVoiceIntro = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch('/api/user/delete-voice-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      if (res.ok) setVoiceIntroDeleted(true);
    } catch {
      // fallback: hide locally
      setVoiceIntroDeleted(true);
    }
  };

  const detailIcons: { [key: string]: React.ElementType } = {
    city: MapPin,
    zodiacSign: Star,
    education: BookOpen,
    smoking: Cigarette,
    drinking: GlassWater,
    children: Baby,
    religion: Briefcase,
  };

  const details = [
    { label: 'Ubicación', value: profile.city, icon: 'city' },
    { label: 'Signo', value: profile.zodiacSign, icon: 'zodiacSign' },
    { label: 'Educación', value: profile.education, icon: 'education' },
    { label: 'Tabaco', value: profile.smoking, icon: 'smoking' },
    { label: 'Alcohol', value: profile.drinking, icon: 'drinking' },
    { label: 'Hijos', value: profile.children, icon: 'children' },
    { label: 'Religión', value: profile.religion, icon: 'religion' },
  ].filter(detail => detail.value);

  return (
    <div className="md:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/90 px-3 backdrop-blur-md sm:px-6">
        <h1 className="text-xl font-bold md:text-2xl text-foreground shrink-0">Mi Perfil</h1>
        <div className="ml-auto flex items-center gap-1 sm:gap-2 min-w-0">
          <Button size="icon" variant="ghost" asChild className="shrink-0">
            <Link href="/settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex mr-1 shrink-0">
            <Link href={`/profile/${user?.id}?preview=1`}>
              <Eye className="h-4 w-4 mr-1" />
              Vista previa
            </Link>
          </Button>
          <Button size="icon" variant="ghost" asChild className="sm:hidden shrink-0">
            <Link href={`/profile/${user?.id}?preview=1`}>
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

        <div className="p-4 space-y-6">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-bold font-headline">{profile.displayName}, {profile.age}</h2>
                {profile.isVerified && <TrustBadge type="verified" />}
                {completenessScore >= 90 && <TrustBadge type="complete" />}
                {profile.subscriptionStatus === 'plus' && <TrustBadge type="premium" />}
              </div>
              <p className="text-muted-foreground flex items-center gap-1 text-sm font-medium">
                Miembro desde {new Date(profile.createdAt).getFullYear()}
              </p>
            </div>
          </div>

          {profile.bio && (
            <Card className="rounded-3xl border-none shadow-sm bg-muted/30">
              <CardContent className="p-5">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
              </CardContent>
            </Card>
          )}

          {latestAnswer && (
            <Card className="rounded-3xl border shadow-sm bg-amber-50/30">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="h-4 w-4 text-amber-600" />
                  <h3 className="font-semibold text-sm text-amber-800">
                    {latestAnswer.category || 'Respuesta del día'}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mb-1">{latestAnswer.question}</p>
                <p className="text-sm text-foreground leading-relaxed">
                  "{latestAnswer.answer}"
                </p>
<p className="text-xs text-muted-foreground mt-2">
                   {new Date(latestAnswer.createdAt).toLocaleDateString()}
                 </p>
              </CardContent>
            </Card>
          )}

          {profile.personalGuide && profile.personalGuide.length > 0 && (
            <Card className="rounded-3xl border shadow-sm">
              <CardContent className="p-5 space-y-3">
                <h3 className="font-bold text-lg text-primary">Guía Personal</h3>
                <div className="space-y-2">
                  {profile.personalGuide.map((guide, index) => (
                    <div key={index} className="p-4 rounded-2xl bg-card shadow-sm border">
                      <p className="font-bold text-sm text-foreground">{guide.title}</p>
                      <p className="text-xs text-muted-foreground leading-snug">{guide.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {details.length > 0 && (
            <Card className="rounded-3xl">
              <CardContent className="p-5">
                <h3 className="font-bold text-lg mb-4">Más sobre mí</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                  {details.map(detail => {
                    const Icon = detailIcons[detail.icon];
                    return (
                      <div key={detail.label} className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-muted/50">
                          {Icon && <Icon className="h-5 w-5 text-primary/70" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm leading-tight">{detail.value}</span>
                          <span className="text-xs text-muted-foreground uppercase tracking-wider">{detail.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {(profile.interests && profile.interests.length > 0) || (profile.values && profile.values.length > 0) || (profile.musicGenres && profile.musicGenres.length > 0) ? (
            <Card className="rounded-3xl">
              <CardContent className="p-5 space-y-4">
                {profile.interests && profile.interests.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Intereses</h3>
                    <BadgeChipList items={profile.interests} type="interest" />
                  </div>
                )}
                {(profile.interests && profile.interests.length > 0 && ((profile.values && profile.values.length > 0) || (profile.musicGenres && profile.musicGenres.length > 0))) && <Separator />}
                {profile.values && profile.values.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Valores</h3>
                    <BadgeChipList items={profile.values} type="value" />
                  </div>
                )}
                {(profile.values && profile.values.length > 0 && profile.musicGenres && profile.musicGenres.length > 0) && <Separator />}
                {profile.musicGenres && profile.musicGenres.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
                      <Music className="h-5 w-5" />
                      Gustos Musicales
                    </h3>
                    <BadgeChipList items={profile.musicGenres} type="music" />
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {(profile as any).spotify && <SpotifySection spotify={(profile as any).spotify} isOwn />}

          {(profile as any).voiceIntro && !voiceIntroDeleted && (
            <VoiceIntro
              audioUrl={(profile as any).voiceIntro}
              duration={(profile as any).voiceIntroDuration}
              onSave={() => {}}
              onDelete={handleDeleteVoiceIntro}
              isOwn={true}
            />
          )}

          <Collapsible defaultOpen={false}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full mb-2 group">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex-1 text-left">Configuración</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4">
          {completenessScore < 100 && (
            <Card className="rounded-3xl border shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-bold text-sm text-foreground">Completa tu perfil — 2.4x más matches</span>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">{completenessScore}%</span>
                </div>
                <Progress value={completenessScore} className="h-2 mb-3" />

                <div className="space-y-2 text-sm">
                  {[
                    { label: 'Foto principal', done: (profile as any)?.photos?.length > 0 },
                    { label: 'Bio (50+ caracteres)', done: (profile as any)?.bio?.length >= 50 },
                    { label: 'Ciudad', done: !!(profile as any)?.city },
                    { label: 'Intereses (3+)', done: (profile as any)?.interests?.length >= 3 },
                    { label: 'Valores (2+)', done: (profile as any)?.values?.length >= 2 },
                    { label: 'Gustos musicales', done: (profile as any)?.musicGenres?.length > 0 },
                    { label: 'Verificación', done: (profile as any)?.isVerified },
                    { label: 'Quiz completado', done: quizResults.length > 0 },
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
            <Card className="rounded-3xl border-warning bg-warning/10">
              <CardContent className="p-4 flex items-center gap-3">
                <span className="text-2xl">⭐</span>
                <div>
                  <p className="font-bold text-sm text-warning-foreground">Perfil destacado</p>
                  <p className="text-xs text-warning-foreground/80">Tu perfil está en el top 10% de completitud</p>
                </div>
              </CardContent>
            </Card>
          )}

          {!profile.isVerified && (
            <Link href="/settings/verification">
              <Card className="rounded-3xl border border-warning/20 bg-warning/10 hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-warning/20 rounded-xl">
                      <ShieldCheck className="h-5 w-5 text-warning-foreground" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm">Verifica tu identidad</h4>
                      <p className="text-xs text-muted-foreground">Los perfiles verificados aparecen primero en Discover</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          )}
            </CollapsibleContent>
          </Collapsible>

          <Collapsible defaultOpen={quizResults.length > 0}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full mb-2 group">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex-1 text-left">Compatibilidad</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4">
          {quizResults.length > 0 ? (
            <Card className="rounded-3xl border shadow-sm">
              <CardContent className="p-5">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-warning" />
                  Resultados de quizzes
                </h3>
                <div className="space-y-2">
                  {quizResults.map((qr) => (
                    <div key={qr.quizId} className="flex items-center justify-between p-3 rounded-2xl bg-muted/30">
                      <span className="text-sm font-medium capitalize">
                        {qr.quizId.replace(/-/g, ' ')}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {qr.score}/100
                        </span>
                        {qr.archetype && (
                          <span className="text-xs text-muted-foreground capitalize">
                            {qr.archetype}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="link" asChild className="p-0 h-auto text-xs font-bold text-primary mt-3">
                  <Link href="/compatibility">Ver todos los quizzes →</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Link href="/compatibility">
              <Card className="rounded-3xl border hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm">Descubre tu arquetipo de compatibilidad</h4>
                      <p className="text-xs text-muted-foreground">Responde preguntas sobre valores, comunicación y estilo de vida</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          )}
            </CollapsibleContent>
          </Collapsible>

          <Collapsible defaultOpen={true}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full mb-2 group">
              <Star className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex-1 text-left">Actividad</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4">
          <Card className="rounded-3xl border">
            <CardContent className="p-4">
              <LikesCounter
                dailyLikesUsed={(profile as any)?.dailyLikesUsed || 0}
                dailyLikesLimit={50}
                resetAt={(profile as any)?.dailyLikesResetAt || new Date()}
                subscriptionStatus={(profile as any)?.subscriptionStatus}
              />
            </CardContent>
          </Card>

          <div className="bg-card rounded-3xl border divide-y divide-muted/30 overflow-hidden">
            <Link href="/profile/favorites" className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-xl bg-primary/10">
                  <Star className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Perfiles guardados</h4>
                  <p className="text-xs text-muted-foreground">Tus favoritos</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>

            <Link href="/profile/trust" className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-xl bg-primary/10">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Score de confianza</h4>
                  <p className="text-xs text-muted-foreground">Tu reputación en la comunidad</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>

            <Link href="/profile/review" className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-xl bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Revisión de tu perfil</h4>
                  <p className="text-xs text-muted-foreground">Consejos para mejorar tu perfil</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>

            <Link href="/profile/visitors" className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-xl bg-primary/10">
                  <Eye className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Visitantes del perfil</h4>
                  <p className="text-xs text-muted-foreground">¿Quién vio tu perfil?</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>

          <BoostDashboard />

          <Card className="rounded-3xl border">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-foreground">Pásate a Alora Plus</h4>
                <p className="text-xs text-muted-foreground">Likes ilimitados y mucho más.</p>
              </div>
              <Button size="sm" variant="default" onClick={() => setShowPaywall(true)}>
                Mejorar
              </Button>
            </CardContent>
          </Card>

          <DynamicStreakCard />

          <DynamicFirstWeekJourney />
            </CollapsibleContent>
          </Collapsible>
        </div>
      </main>

      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-20 right-4 z-50 bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110 active:scale-95 md:bottom-6 pb-safe"
        aria-label="Volver arriba"
      >
        <ChevronRight className="h-5 w-5 rotate-[-90deg]" />
      </button>
    </div>
  );
}