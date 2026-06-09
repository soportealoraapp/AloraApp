"use client";

import { useState } from "react";
import { CreditCard, LayoutGrid } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { allInterests, allValues, allMusicGenres, lifestyleOptions } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { getEmoji } from "@/components/profile/BadgeChip";
import { ScrollArea } from "../ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Separator } from "../ui/separator";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

export interface Filters {
  ageRange: [number, number];
  distance: number;
  seeking: 'women' | 'men' | 'all';
  verifiedOnly: boolean;
  interests: string[];
  values: string[];
  musicGenres?: string[];
  smoking?: string;
  drinking?: string;
  children?: string;
  education?: string;
  religion?: string;
  userLat?: number;
  userLng?: number;
  countryCode?: string;
  stateCode?: string;
  city?: string;
  withVoiceIntro?: boolean;
  withQuiz?: boolean;
  featuredOnly?: boolean;
  highCompatibility?: boolean;
  activeToday?: boolean;
  intent?: 'dating' | 'friendship';
}

interface DiscoverFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFilters: (filters: Filters) => void;
  initialFilters: Filters;
  browseMode?: 'swipe' | 'grid';
  onBrowseModeChange?: (mode: 'swipe' | 'grid') => void;
}

export function DiscoverFilters({ open, onOpenChange, onApplyFilters, initialFilters, browseMode, onBrowseModeChange }: DiscoverFiltersProps) {
  const [ageRange, setAgeRange] = useState<[number, number]>(initialFilters.ageRange);
  const [distance, setDistance] = useState([initialFilters.distance]);
  const [seeking, setSeeking] = useState(initialFilters.seeking);
  const [verifiedOnly, setVerifiedOnly] = useState(initialFilters.verifiedOnly);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(initialFilters.interests);
  const [selectedValues, setSelectedValues] = useState<string[]>(initialFilters.values);
  const [selectedMusicGenres, setSelectedMusicGenres] = useState<string[]>(initialFilters.musicGenres || []);
  const [selectedSmoking, setSelectedSmoking] = useState<string | undefined>(initialFilters.smoking);
  const [selectedDrinking, setSelectedDrinking] = useState<string | undefined>(initialFilters.drinking);
  const [selectedChildren, setSelectedChildren] = useState<string | undefined>(initialFilters.children);
  const [selectedEducation, setSelectedEducation] = useState<string | undefined>(initialFilters.education);
  const [selectedReligion, setSelectedReligion] = useState<string | undefined>(initialFilters.religion);
  const [withVoiceIntro, setWithVoiceIntro] = useState(initialFilters.withVoiceIntro || false);
  const [withQuiz, setWithQuiz] = useState(initialFilters.withQuiz || false);
  const [featuredOnly, setFeaturedOnly] = useState(initialFilters.featuredOnly || false);
  const [highCompatibility, setHighCompatibility] = useState(initialFilters.highCompatibility || false);
  const [activeToday, setActiveToday] = useState(initialFilters.activeToday || false);

  const toggleSelection = (
    item: string,
    list: string[],
    setter: (list: string[]) => void,
    max: number = 10
  ) => {
    if (list.includes(item)) {
      setter(list.filter((i) => i !== item));
    } else {
      if (list.length < max) {
        setter([...list, item]);
      }
    }
  };

  const handleApply = () => {
    onApplyFilters({
      ageRange,
      distance: distance[0],
      seeking,
      verifiedOnly,
      interests: selectedInterests,
      values: selectedValues,
      musicGenres: selectedMusicGenres,
      smoking: selectedSmoking,
      drinking: selectedDrinking,
      children: selectedChildren,
      education: selectedEducation,
      religion: selectedReligion,
      withVoiceIntro,
      withQuiz,
      featuredOnly,
      highCompatibility,
      activeToday,
      userLat: initialFilters.userLat,
      userLng: initialFilters.userLng,
      countryCode: initialFilters.countryCode,
      stateCode: initialFilters.stateCode,
      city: initialFilters.city,
    });
    onOpenChange(false);
  }

  const handleClearFilters = () => {
    const defaultFilters: Filters = {
      ageRange: [18, 60],
      distance: 100,
      seeking: 'all',
      verifiedOnly: false,
      interests: [],
      values: [],
      musicGenres: [],
      smoking: undefined,
      drinking: undefined,
      children: undefined,
      education: undefined,
      religion: undefined,
      withVoiceIntro: false,
      withQuiz: false,
      featuredOnly: false,
      highCompatibility: false,
      activeToday: false,
      userLat: initialFilters.userLat,
      userLng: initialFilters.userLng,
      countryCode: initialFilters.countryCode,
      stateCode: initialFilters.stateCode,
      city: initialFilters.city,
    }
    setAgeRange(defaultFilters.ageRange);
    setDistance([defaultFilters.distance]);
    setSeeking(defaultFilters.seeking);
    setVerifiedOnly(defaultFilters.verifiedOnly);
    setSelectedInterests(defaultFilters.interests);
    setSelectedValues(defaultFilters.values);
    setSelectedMusicGenres(defaultFilters.musicGenres || []);
    setSelectedSmoking(defaultFilters.smoking);
    setSelectedDrinking(defaultFilters.drinking);
    setSelectedChildren(defaultFilters.children);
    setSelectedEducation(defaultFilters.education);
    setSelectedReligion(defaultFilters.religion);
    setWithVoiceIntro(false);
    setWithQuiz(false);
    setFeaturedOnly(false);
    setHighCompatibility(false);
    setActiveToday(false);
    onApplyFilters(defaultFilters);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-headline">Filtros de Búsqueda</SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-8 py-4">
            <div className="space-y-4">
              <Label>Busco a</Label>
              <RadioGroup defaultValue="women" value={seeking} onValueChange={(v: "women" | "men" | "all") => setSeeking(v)} className="grid grid-cols-3 gap-2">
                <div>
                  <RadioGroupItem value="women" id="r-women" className="peer sr-only" />
                  <Label htmlFor="r-women" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                    Mujeres
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="men" id="r-men" className="peer sr-only" />
                  <Label htmlFor="r-men" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                    Hombres
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="all" id="r-all" className="peer sr-only" />
                  <Label htmlFor="r-all" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                    Todos
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>Modo de exploración</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onBrowseModeChange?.('swipe')}
                  className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all ${browseMode === 'swipe' ? 'border-primary bg-primary/5' : 'border-muted bg-transparent hover:bg-accent'}`}
                >
                  <CreditCard className="h-4 w-4" /> Swipe
                </button>
                <button
                  onClick={() => onBrowseModeChange?.('grid')}
                  className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all ${browseMode === 'grid' ? 'border-primary bg-primary/5' : 'border-muted bg-transparent hover:bg-accent'}`}
                >
                  <LayoutGrid className="h-4 w-4" /> Explorar
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Rango de Edad: {ageRange[0]} - {ageRange[1]} años</Label>
              <Slider
                value={ageRange}
                onValueChange={(value: [number, number]) => setAgeRange(value)}
                min={18}
                max={60}
                step={1}
              />
            </div>
            <div className="space-y-4">
              <Label>Distancia: hasta {distance[0]} km</Label>
              <Slider
                value={distance}
                onValueChange={(value: [number]) => setDistance(value)}
                min={5}
                max={200}
                step={5}
              />
            </div>

            <div className="space-y-3">
              <Label>Verificación de Perfil</Label>
              <div className="flex items-center space-x-2 rounded-lg border p-3">
                <Switch id="verified-only" checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
                <Label htmlFor="verified-only" className="flex-grow cursor-pointer">Mostrar solo perfiles verificados</Label>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Filtros inteligentes</Label>

              <div className="flex items-center space-x-2 rounded-lg border p-3">
                <Switch id="voice-intro" checked={withVoiceIntro} onCheckedChange={setWithVoiceIntro} />
                <Label htmlFor="voice-intro" className="flex-grow cursor-pointer">🎤 Con presentación de voz</Label>
              </div>

              <div className="flex items-center space-x-2 rounded-lg border p-3">
                <Switch id="quiz-completed" checked={withQuiz} onCheckedChange={setWithQuiz} />
                <Label htmlFor="quiz-completed" className="flex-grow cursor-pointer">🧪 Con quiz completado</Label>
              </div>

              <div className="flex items-center space-x-2 rounded-lg border p-3">
                <Switch id="active-today" checked={activeToday} onCheckedChange={setActiveToday} />
                <Label htmlFor="active-today" className="flex-grow cursor-pointer">🟢 Activo hoy</Label>
              </div>

              <div className="flex items-center space-x-2 rounded-lg border p-3 bg-amber-50/30">
                <Switch id="featured" checked={featuredOnly} onCheckedChange={setFeaturedOnly} />
                <Label htmlFor="featured" className="flex-grow cursor-pointer">
                  ⭐ Perfil destacado
                  <span className="block text-[10px] text-muted-foreground">Completitud 90%+</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2 rounded-lg border p-3 bg-violet-50/30">
                <Switch id="high-compatibility" checked={highCompatibility} onCheckedChange={setHighCompatibility} />
                <Label htmlFor="high-compatibility" className="flex-grow cursor-pointer">
                  💜 Alta compatibilidad
                  <span className="block text-[10px] text-muted-foreground">Coincidencia en valores e intereses</span>
                </Label>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-semibold">Estilo de vida</h4>
              <div className="space-y-2">
                <Label>Tabaco</Label>
                <Select value={selectedSmoking} onValueChange={setSelectedSmoking}>
                  <SelectTrigger><SelectValue placeholder="Cualquiera" /></SelectTrigger>
                  <SelectContent>{lifestyleOptions.smoking.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Alcohol</Label>
                <Select value={selectedDrinking} onValueChange={setSelectedDrinking}>
                  <SelectTrigger><SelectValue placeholder="Cualquiera" /></SelectTrigger>
                  <SelectContent>{lifestyleOptions.drinking.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hijos</Label>
                <Select value={selectedChildren} onValueChange={setSelectedChildren}>
                  <SelectTrigger><SelectValue placeholder="Cualquiera" /></SelectTrigger>
                  <SelectContent>{lifestyleOptions.children.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Educación</Label>
                <Select value={selectedEducation} onValueChange={setSelectedEducation}>
                  <SelectTrigger><SelectValue placeholder="Cualquiera" /></SelectTrigger>
                  <SelectContent>
                    {['Secundaria', 'Preparatoria', 'Universidad', 'Maestría', 'Doctorado'].map(e => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Religión</Label>
                <Select value={selectedReligion} onValueChange={setSelectedReligion}>
                  <SelectTrigger><SelectValue placeholder="Cualquiera" /></SelectTrigger>
                  <SelectContent>
                    {['Cristiano', 'Católico', 'Ateo', 'Agnóstico', 'Otro'].map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Intereses en Común (hasta 10)</Label>
                <div className="flex flex-wrap gap-2">
                {allInterests.slice(0, 20).map((interest) => (
                  <button key={interest} onClick={() => toggleSelection(interest, selectedInterests, setSelectedInterests, 10)}>
                    <Badge variant={selectedInterests.includes(interest) ? 'default' : 'secondary'} className="cursor-pointer text-sm py-1">
                      {getEmoji(interest, 'interest')} {interest}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Valores Compartidos (hasta 5)</Label>
                <div className="flex flex-wrap gap-2">
                {allValues.slice(0, 15).map((value) => (
                  <button key={value} onClick={() => toggleSelection(value, selectedValues, setSelectedValues)}>
                    <Badge variant={selectedValues.includes(value) ? 'default' : 'secondary'} className="cursor-pointer text-sm py-1">
                      {getEmoji(value, 'value')} {value}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Géneros Musicales (hasta 5)</Label>
                <div className="flex flex-wrap gap-2">
                {allMusicGenres.map((genre) => (
                  <button key={genre} onClick={() => toggleSelection(genre, selectedMusicGenres, setSelectedMusicGenres, 5)}>
                    <Badge variant={selectedMusicGenres.includes(genre) ? 'default' : 'secondary'} className="cursor-pointer text-sm py-1">
                      {getEmoji(genre, 'music')} {genre}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
        <SheetFooter className="grid grid-cols-2 gap-2 pt-4">
          <Button variant="secondary" onClick={handleClearFilters}>Limpiar</Button>
          <Button onClick={handleApply}>Aplicar Filtros</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
