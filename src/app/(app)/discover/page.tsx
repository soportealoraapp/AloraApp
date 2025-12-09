"use client";

import { useState, useMemo } from "react";
import { ProfileCard } from "@/components/discover/profile-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Search, Filter, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useDiscover } from "@/hooks/use-discover";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

const allInterests = [
  'Viajar', 'Yoga', 'Arte', 'Música', 'Cocinar', 'Leer',
  'Deportes', 'Cine', 'Fotografía', 'Bailar', 'Tecnología',
  'Naturaleza', 'Moda', 'Escritura', 'Gaming'
];

const allValues = [
  'Honestidad', 'Amabilidad', 'Crecimiento', 'Lealtad',
  'Humor', 'Aventura', 'Respeto', 'Creatividad', 'Empatía', 'Autenticidad'
];

export default function DiscoverPage() {
  const { profile: currentUserProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 60]);
  const [seeking, setSeeking] = useState<"women" | "men" | "all">("all");
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [selectedLifestyle, setSelectedLifestyle] = useState<{
    smoking?: string;
    drinking?: string;
    children?: string;
  }>({});

  const { profiles, loading, error, refresh } = useDiscover(searchTerm);

  // Client-side filtering based on preferences
  const filteredProfiles = useMemo(() => {
    return profiles.filter(({ profile }) => {
      // Age filter
      if (profile.age < ageRange[0] || profile.age > ageRange[1]) return false;

      // Gender filter
      if (seeking !== "all" && profile.gender !== seeking) return false;

      // Verified filter
      if (verifiedOnly && !profile.isVerified) return false;

      // Interests filter
      if (selectedInterests.length > 0) {
        const hasMatchingInterest = selectedInterests.some(interest =>
          profile.interests?.includes(interest)
        );
        if (!hasMatchingInterest) return false;
      }

      // Values filter
      if (selectedValues.length > 0) {
        const hasMatchingValue = selectedValues.some(value =>
          profile.values?.includes(value)
        );
        if (!hasMatchingValue) return false;
      }

      // Lifestyle filters
      if (selectedLifestyle.smoking && profile.smoking !== selectedLifestyle.smoking) return false;
      if (selectedLifestyle.drinking && profile.drinking !== selectedLifestyle.drinking) return false;
      if (selectedLifestyle.children && profile.children !== selectedLifestyle.children) return false;

      return true;
    });
  }, [profiles, ageRange, seeking, verifiedOnly, selectedInterests, selectedValues, selectedLifestyle]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const toggleValue = (value: string) => {
    setSelectedValues(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  const clearFilters = () => {
    setAgeRange([18, 60]);
    setSeeking("all");
    setVerifiedOnly(true);
    setSelectedInterests([]);
    setSelectedValues([]);
    setSelectedLifestyle({});
  };

  return (
    <div className="md:pl-60">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
        <h1 className="text-xl font-semibold md:text-2xl font-headline">Descubrir</h1>
        <div className="ml-auto flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 py-6">
                <div className="space-y-2">
                  <Label>Rango de edad: {ageRange[0]} - {ageRange[1]}</Label>
                  <Slider
                    min={18}
                    max={80}
                    step={1}
                    value={ageRange}
                    onValueChange={(value) => setAgeRange(value as [number, number])}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Buscando</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={seeking === "women" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSeeking("women")}
                    >
                      Mujeres
                    </Button>
                    <Button
                      variant={seeking === "men" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSeeking("men")}
                    >
                      Hombres
                    </Button>
                    <Button
                      variant={seeking === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSeeking("all")}
                    >
                      Todos
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="verified-only">Solo verificados</Label>
                  <Switch
                    id="verified-only"
                    checked={verifiedOnly}
                    onCheckedChange={setVerifiedOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Intereses compartidos</Label>
                  <div className="flex flex-wrap gap-2">
                    {allInterests.map(interest => (
                      <Badge
                        key={interest}
                        variant={selectedInterests.includes(interest) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleInterest(interest)}
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Valores compartidos</Label>
                  <div className="flex flex-wrap gap-2">
                    {allValues.map(value => (
                      <Badge
                        key={value}
                        variant={selectedValues.includes(value) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleValue(value)}
                      >
                        {value}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Estilo de vida</Label>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm">Tabaco</Label>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        <Button
                          variant={selectedLifestyle.smoking === "No fumo" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedLifestyle(prev => ({ ...prev, smoking: prev.smoking === "No fumo" ? undefined : "No fumo" }))}
                        >
                          No
                        </Button>
                        <Button
                          variant={selectedLifestyle.smoking === "Ocasionalmente" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedLifestyle(prev => ({ ...prev, smoking: prev.smoking === "Ocasionalmente" ? undefined : "Ocasionalmente" }))}
                        >
                          A veces
                        </Button>
                        <Button
                          variant={selectedLifestyle.smoking === "Sí, fumo" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedLifestyle(prev => ({ ...prev, smoking: prev.smoking === "Sí, fumo" ? undefined : "Sí, fumo" }))}
                        >
                          Sí
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm">Alcohol</Label>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        <Button
                          variant={selectedLifestyle.drinking === "No bebo" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedLifestyle(prev => ({ ...prev, drinking: prev.drinking === "No bebo" ? undefined : "No bebo" }))}
                        >
                          No
                        </Button>
                        <Button
                          variant={selectedLifestyle.drinking === "Socialmente" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedLifestyle(prev => ({ ...prev, drinking: prev.drinking === "Socialmente" ? undefined : "Socialmente" }))}
                        >
                          Social
                        </Button>
                        <Button
                          variant={selectedLifestyle.drinking === "Regularmente" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedLifestyle(prev => ({ ...prev, drinking: prev.drinking === "Regularmente" ? undefined : "Regularmente" }))}
                        >
                          Regular
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="w-full" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por intereses..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {error && (
          <div className="text-center py-8 text-destructive">
            <p>{error}</p>
            <Button onClick={refresh} variant="outline" className="mt-4">
              Reintentar
            </Button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-96 rounded-lg" />
            ))}
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No hay perfiles que coincidan con tus filtros.
            </p>
            <Button onClick={clearFilters} variant="outline">
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProfiles.map(({ profile, compatibility }) => (
              <ProfileCard
                key={profile.uid}
                profile={profile}
                compatibility={compatibility}
                onRefresh={refresh}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
