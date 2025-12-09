"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Edit, MapPin, Briefcase, Cigarette, GlassWater, Baby, Star, BookOpen, Music, CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const { profile, loading } = useAuth();

  if (loading || !profile) {
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
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
        <h1 className="text-xl font-semibold md:text-2xl font-headline">Mi Perfil</h1>
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
          <div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-bold font-headline">
                {profile.displayName}, {profile.age}
              </h2>
              {profile.isVerified && (
                <CheckCircle className="h-6 w-6 text-primary" />
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground mt-2">
              <MapPin className="h-4 w-4" />
              <p>{profile.city}</p>
            </div>
            {profile.status && (
              <p className="text-muted-foreground mt-2 text-lg">
                "{profile.status}"
              </p>
            )}
          </div>

          {profile.bio && (
            <Card>
              <CardContent className="p-6">
                <p className="text-foreground whitespace-pre-wrap">{profile.bio}</p>
              </CardContent>
            </Card>
          )}

          {profile.personalGuide && profile.personalGuide.length > 0 && (
            <Card>
              <CardContent className="p-6 space-y-2">
                <h3 className="font-semibold text-lg mb-3">Guía Personal</h3>
                {profile.personalGuide.map((guide, index) => (
                  <div key={index} className="p-3 rounded-lg bg-secondary">
                    <p className="font-semibold text-sm">{guide.title}</p>
                    <p className="text-xs text-muted-foreground">{guide.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {details.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Más sobre mí</h3>
                <div className="grid grid-cols-2 gap-4">
                  {details.map(detail => {
                    const Icon = detailIcons[detail.icon];
                    return (
                      <div key={detail.label} className="flex items-center gap-3 text-sm">
                        {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
                        <div className="flex flex-col">
                          <span className="font-semibold">{detail.value}</span>
                          <span className="text-xs text-muted-foreground">{detail.label}</span>
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
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3">Intereses</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map(i => (
                      <Badge key={i}>{i}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {profile.values && profile.values.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3">Valores</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.values.map(v => (
                      <Badge key={v} variant="secondary">{v}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {profile.musicGenres && profile.musicGenres.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
                  <Music className="h-5 w-5" />
                  Gustos Musicales
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.musicGenres.map(genre => (
                    <Badge key={genre} variant="outline">{genre}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {profile.photos && profile.photos.length > 1 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-3">Galería</h3>
                <div className="grid grid-cols-3 gap-2">
                  {profile.photos.slice(1).map((photo, index) => (
                    <div key={index} className="aspect-square relative rounded-lg overflow-hidden">
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
    </div>
  );
}