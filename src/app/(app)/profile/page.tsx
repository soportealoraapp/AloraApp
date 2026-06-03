"use client";

import { useAuth } from "@/contexts/AuthContext";
import { trackEvent } from "@/lib/tracking/client";
import { calculateCompleteness } from "@/lib/utils/completeness";
import { TrustBadge } from "@/components/ui/premium/TrustBadge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Edit, MapPin, Briefcase, Cigarette, GlassWater, Baby, Star, BookOpen, Music, CheckCircle, AlertCircle, ShieldCheck, Shield, Sparkles, Eye, ChevronRight, Trophy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
import { BoostDashboard } from "@/components/premium/BoostDashboard";
import { StreakCard } from "@/components/gamification/StreakCard";
import { FirstWeekJourney } from "@/components/gamification/FirstWeekJourney";
import { PaywallModal } from "@/components/premium/PaywallModal";
import { LikesCounter } from "@/components/discover/LikesCounter";
import { VoiceIntro } from "@/components/audio/VoiceIntro";
import { useState, useEffect } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const DynamicFirstWeekJourney = dynamic(() => import("@/components/gamification/FirstWeekJourney").then(m => ({ default: m.FirstWeekJourney })), { ssr: false });
const DynamicStreakCard = dynamic(() => import("@/components/gamification/StreakCard").then(m => ({ default: m.StreakCard })), { ssr: false });

export default function ProfilePage() {
  const { profile, loading } = useAuth();
  const [showPaywall, setShowPaywall] = useState(false);
  const [quizResults, setQuizResults] = useState<{ quizId: string; score: number; archetype: string }[]>([]);

  useEffect(() => {
    fetch('/api/compatibility/list')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.completedQuizzes)) setQuizResults(data.completedQuizzes);
      })
      .catch(() => {});
  }, []);

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
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/90 px-4 backdrop-blur-md sm:px-6">
        <h1 className="text-xl font-bold md:text-2xl text-foreground">Alora</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button size="icon" variant="ghost" asChild>
            <Link href="/settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="default" asChild>
            <Link href="/profile/edit">
              <Edit className="h-4 w-4 mr-2" />
              Editar
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
                    <div className="w-full aspect-[3/4] relative">
                      <Image
                        src={photo}
                        alt={`${profile.displayName} ${index + 1}`}
                        fill
                        className="object-cover"
                        data-ai-hint="person"
                        priority={index === 0}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>
          ) : (
            <Image
              src={profile.photos?.[0] || '/placeholder.svg'}
              alt={profile.displayName}
              width={600}
              height={800}
              className="w-full aspect-[3/4] object-cover"
              data-ai-hint="person"
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
              <CardContent className="p-6">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
              </CardContent>
            </Card>
          )}

          {profile.personalGuide && profile.personalGuide.length > 0 && (
            <Card className="rounded-3xl border shadow-sm">
              <CardContent className="p-6 space-y-3">
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
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4">Más sobre mí</h3>
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                  {details.map(detail => {
                    const Icon = detailIcons[detail.icon];
                    return (
                      <div key={detail.label} className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-muted/50">
                          {Icon && <Icon className="h-5 w-5 text-primary/70" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm leading-tight">{detail.value}</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{detail.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.interests && profile.interests.length > 0 && (
              <Card className="rounded-3xl">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3">Intereses</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map(i => (
                      <Badge key={i} variant="secondary" className="rounded-full">{i}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {profile.values && profile.values.length > 0 && (
              <Card className="rounded-3xl">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3">Valores</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.values.map(v => (
                      <Badge key={v} variant="outline" className="rounded-full">{v}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {profile.musicGenres && profile.musicGenres.length > 0 && (
            <Card className="rounded-3xl">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
                  <Music className="h-5 w-5" />
                  Gustos Musicales
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.musicGenres.map(genre => (
                    <Badge key={genre} variant="secondary" className="rounded-full">{genre}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {(profile as any).voiceIntro && (
            <VoiceIntro
              audioUrl={(profile as any).voiceIntro}
              duration={(profile as any).voiceIntroDuration}
              onSave={() => {}}
              onDelete={() => {}}
              isOwn={false}
            />
          )}

          {profile.photos && profile.photos.length > 1 && (
            <Card className="rounded-3xl">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4">Galería</h3>
                <div className="grid grid-cols-3 gap-2">
                  {profile.photos.slice(1).map((photo, index) => (
                    <div key={index} className="aspect-square relative rounded-2xl overflow-hidden shadow-sm">
                      <Image
                        src={photo}
                        alt={`Galería ${index + 1}`}
                        fill
                        className="object-cover"
                        data-ai-hint="person"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {completenessScore < 100 && (
            <Card className="rounded-3xl border shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-bold text-sm text-foreground">Completa tu perfil</span>
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
                    { label: 'Quiz completado', done: false },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {item.done ? (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                      )}
                      <span className={item.done ? 'text-muted-foreground line-through' : ''}>{item.label}</span>
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

          {quizResults.length > 0 && (
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
              </CardContent>
            </Card>
          )}

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

          <Link href="/profile/trust">
            <Card className="rounded-3xl border hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">Score de confianza</h4>
                    <p className="text-xs text-muted-foreground">Tu reputación en la comunidad</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/profile/review">
            <Card className="rounded-3xl border hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-r from-primary/5 to-primary/5">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">Revisión IA de tu perfil</h4>
                    <p className="text-xs text-muted-foreground">Descubre cómo mejorarlo</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/profile/visitors">
            <Card className="rounded-3xl border hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Eye className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">Visitantes del perfil</h4>
                    <p className="text-xs text-muted-foreground">¿Quién vio tu perfil?</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>

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
        </div>
      </main>

      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  );
}