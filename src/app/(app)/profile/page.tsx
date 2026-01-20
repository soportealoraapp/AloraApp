"use client";

import { useAuth } from "@/contexts/AuthContext";
import { trackEvent } from "@/lib/tracking/client";
import { calculateCompleteness } from "@/lib/utils/completeness";
import { TrustBadge } from "@/components/ui/premium/TrustBadge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Edit, MapPin, Briefcase, Cigarette, GlassWater, Baby, Star, BookOpen, Music, CheckCircle, AlertCircle, ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { BoostActivation } from "@/components/premium/BoostActivation";
import { MissionCenter } from "@/components/retention/MissionCenter";
import { PaywallModal } from "@/components/premium/PaywallModal";
import { useState } from "react";

export default function ProfilePage() {
  const { profile, loading } = useAuth();
  const [showPaywall, setShowPaywall] = useState(false);

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
        <h1 className="text-xl font-bold md:text-2xl italic text-primary">Alora</h1>
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
          <Image
            src={profile.photos?.[0] || '/placeholder.jpg'}
            alt={profile.displayName}
            width={600}
            height={800}
            className="w-full aspect-[3/4] object-cover"
            data-ai-hint="person"
            priority
          />
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
                Alora Member since {new Date(profile.createdAt).getFullYear()}
              </p>
            </div>
          </div>

          {completenessScore < 100 && (
            <Card className="rounded-3xl border-none shadow-sm bg-gradient-to-r from-pink-50 to-orange-50 dark:from-pink-950/20 dark:to-orange-950/10">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-pink-500" />
                    <span className="font-bold text-sm text-gray-800 dark:text-gray-200">Completa tu perfil</span>
                  </div>
                  <span className="text-xs font-bold text-pink-600 dark:text-pink-400">{completenessScore}%</span>
                </div>
                <Progress value={completenessScore} className="h-2 bg-white/50 dark:bg-white/10" />
                <p className="mt-3 text-[11px] text-muted-foreground leading-snug">
                  Los perfiles completos reciben hasta un <strong>4x más de matches</strong> y tienen prioridad en Discover.
                </p>
                <Button variant="link" asChild className="p-0 h-auto text-xs font-bold text-primary mt-2">
                  <Link href="/profile/edit">Terminar de completar →</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <BoostActivation />

          <Card className="bg-gradient-to-r from-pink-500/10 to-rose-400/10 border-pink-200 rounded-3xl">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-pink-700">Pásate a Alora Plus</h4>
                <p className="text-xs text-pink-600">Likes ilimitados y mucho más.</p>
              </div>
              <Button size="sm" className="bg-pink-500 text-white rounded-full" onClick={() => setShowPaywall(true)}>
                Mejorar
              </Button>
            </CardContent>
          </Card>

          <MissionCenter />

          {profile.bio && (
            <Card className="rounded-3xl border-none shadow-sm bg-muted/30">
              <CardContent className="p-6">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
              </CardContent>
            </Card>
          )}

          {profile.personalGuide && profile.personalGuide.length > 0 && (
            <Card className="rounded-3xl border-none shadow-sm bg-pink-50/50 dark:bg-pink-900/10">
              <CardContent className="p-6 space-y-3">
                <h3 className="font-bold text-lg text-primary">Guía Personal</h3>
                <div className="space-y-2">
                  {profile.personalGuide.map((guide, index) => (
                    <div key={index} className="p-4 rounded-2xl bg-white/80 dark:bg-card/80 shadow-sm border border-pink-100 dark:border-pink-900/30">
                      <p className="font-bold text-sm text-pink-600 dark:text-pink-400">{guide.title}</p>
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
        </div>
      </main>

      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  );
}