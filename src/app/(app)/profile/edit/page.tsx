"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getEmoji } from "@/components/profile/BadgeChip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, Loader2, MapPin, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { CityAutocomplete } from "@/components/ui/city-autocomplete";
import type { LocationResult } from "@/lib/location";
import { INTERESTS, VALUES, MUSIC_GENRES, LIFESTYLE_OPTIONS } from "@/lib/constants/preferences";
import { PhotoGrid } from "@/components/photos/PhotoGrid";
import { PhotoCrop } from "@/components/photos/PhotoCrop";
import { VoiceIntro } from "@/components/audio/VoiceIntro";
import { trackEvent } from "@/lib/tracking/client";

const lifestyleOptions = {
    smoking: [...LIFESTYLE_OPTIONS.smoking],
    drinking: [...LIFESTYLE_OPTIONS.drinking],
    children: [...LIFESTYLE_OPTIONS.children],
    religion: [...LIFESTYLE_OPTIONS.religion],
};

const zodiacSigns = ["Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo", "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis"];
const educationLevels = ["Secundaria", "Preparatoria", "Universidad", "Licenciatura", "Maestría", "Doctorado"];
const allInterests = [...INTERESTS];
const allValues = [...VALUES];
const allMusicGenres = [...MUSIC_GENRES];

export default function ProfileEditPage() {
    const router = useRouter();
    const { user, profile: currentProfile, refreshProfile } = useAuth();
    const { updateProfile } = useProfile();
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const swipeBackRef = useRef<{ startX: number; startY: number; isEdge?: boolean }>({ startX: 0, startY: 0 });
    const goBack = useCallback(() => {
        if (isDirtyRef.current && !window.confirm('Tienes cambios sin guardar. ¿Estás seguro de salir?')) return;
        router.back();
    }, [router]);
    const [displayName, setDisplayName] = useState("");
    const [city, setCity] = useState("");
    const [bio, setBio] = useState("");
    const [status, setStatus] = useState("");
    const [photos, setPhotos] = useState<string[]>([]);
    const [zodiacSign, setZodiacSign] = useState("");
    const [education, setEducation] = useState("");
    const [smoking, setSmoking] = useState("");
    const [drinking, setDrinking] = useState("");
    const [children, setChildren] = useState("");
    const [religion, setReligion] = useState("");
    const [interests, setInterests] = useState<string[]>([]);
    const [values, setValues] = useState<string[]>([]);
    const [musicGenres, setMusicGenres] = useState<string[]>([]);
    const [cityId, setCityId] = useState("");
    const [countryCode, setCountryCode] = useState("");
    const [stateCode, setStateCode] = useState("");
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [lookingFor, setLookingFor] = useState("");
    const [connectionModes, setConnectionModes] = useState<string[]>(["dating"]);
    const [isLocating, setIsLocating] = useState(false);
    const [cropIndex, setCropIndex] = useState<number | null>(null);
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
    const [voiceIntroUrl, setVoiceIntroUrl] = useState<string | undefined>(undefined);
    const [voiceIntroDuration, setVoiceIntroDuration] = useState<number | undefined>(undefined);
    const [voiceIntroChanged, setVoiceIntroChanged] = useState(false);
    const isDirtyRef = useRef(false);

    const MAX_USER_PROMPTS = 5;
    const PROMPT_ANSWER_MAX = 140;
    const [userPrompts, setUserPrompts] = useState<{ id: string; promptId: string; question: string; answer: string; position: number }[]>([]);
    const [promptTemplates, setPromptTemplates] = useState<{ id: string; text: string; category: string }[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [newPromptAnswer, setNewPromptAnswer] = useState('');
    const [promptBusy, setPromptBusy] = useState(false);

    useEffect(() => {
        if (!user) return;
        const loadPrompts = fetch('/api/prompts').then(r => r.ok ? r.json() : null).then(d => { if (d?.prompts) setUserPrompts(d.prompts); }).catch(() => {});
        const loadTemplates = fetch('/api/prompts/templates').then(r => r.ok ? r.json() : null).then(d => { if (d?.templates) setPromptTemplates(d.templates); }).catch(() => {});
        Promise.all([loadPrompts, loadTemplates]);
    }, [user]);

    const availableTemplates = promptTemplates.filter(t => !userPrompts.some(p => p.promptId === t.id));

    const savePrompt = async () => {
        if (!selectedTemplateId || !newPromptAnswer.trim()) return;
        setPromptBusy(true);
        try {
            const res = await fetch('/api/prompts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ promptId: selectedTemplateId, answer: newPromptAnswer.trim(), position: userPrompts.length }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'No se pudo guardar');
            }
            const data = await res.json();
            setUserPrompts(prev => [...prev, data.prompt].sort((a, b) => a.position - b.position));
            setSelectedTemplateId('');
            setNewPromptAnswer('');
            toast({ title: 'Pregunta añadida' });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setPromptBusy(false);
        }
    };

    const updatePrompt = async (promptId: string, answer: string) => {
        if (!answer.trim()) return;
        setPromptBusy(true);
        try {
            const res = await fetch('/api/prompts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ promptId, answer: answer.trim() }),
            });
            if (!res.ok) throw new Error('No se pudo actualizar');
            const data = await res.json();
            setUserPrompts(prev => prev.map(p => p.promptId === promptId ? data.prompt : p));
            toast({ title: 'Respuesta actualizada' });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setPromptBusy(false);
        }
    };

    const deletePrompt = async (id: string) => {
        setPromptBusy(true);
        try {
            const res = await fetch('/api/prompts', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            if (!res.ok) throw new Error('No se pudo eliminar');
            setUserPrompts(prev => prev.filter(p => p.id !== id));
            toast({ title: 'Pregunta eliminada' });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setPromptBusy(false);
        }
    };

    useEffect(() => {
        if (currentProfile) {
            setDisplayName(currentProfile.displayName || "");
            setCity(currentProfile.city || "");
            setBio(currentProfile.bio || "");
            setStatus(currentProfile.status || "");
            setPhotos(currentProfile.photos || []);
            setZodiacSign(currentProfile.zodiacSign || "");
            setEducation(currentProfile.education || "");
            setSmoking(currentProfile.smoking || "");
            setDrinking(currentProfile.drinking || "");
            setChildren(currentProfile.children || "");
            setReligion(currentProfile.religion || "");
            setInterests(currentProfile.interests || []);
            setValues(currentProfile.values || []);
            setMusicGenres(currentProfile.musicGenres || []);
            setCityId(currentProfile.cityId || "");
            setCountryCode(currentProfile.countryCode || "");
            setStateCode(currentProfile.stateCode || "");
            setLatitude(currentProfile.latitude ?? null);
            setLongitude(currentProfile.longitude ?? null);
            setLookingFor(currentProfile.lookingFor || "");
            setConnectionModes(currentProfile.connectionModes || ["dating"]);
            setVoiceIntroUrl(currentProfile.voiceIntro ?? undefined);
            setVoiceIntroDuration(currentProfile.voiceIntroDuration ?? undefined);
            setVoiceIntroChanged(false);
        }
    }, [currentProfile]);

    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (isDirtyRef.current) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, []);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || !user) return;

        if (photos.length + files.length > 6) {
            toast({
                variant: "destructive",
                title: "Límite de fotos",
                description: "Puedes subir máximo 6 fotos",
            });
            return;
        }

        setUploading(true);
        try {
            const { uploadFiles } = await import('@/utils/uploadthing');
            const result = await uploadFiles('imageUploader', {
                files: Array.from(files),
            });
            const newUrls = result.map((r: any) => r.ufsUrl ?? r.url);
            setPhotos([...photos, ...newUrls]);
            markDirty();

            toast({
                title: "Fotos subidas",
                description: `${files.length} foto(s) añadidas`,
            });
        } catch (error) {
            console.error("Error uploading photos:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudieron subir las fotos",
            });
        } finally {
            setUploading(false);
        }
    };

    const markDirty = () => { isDirtyRef.current = true; };

    const removePhoto = (index: number) => {
        markDirty();
        setPhotos(photos.filter((_, i) => i !== index));
    };

    const handleCropStart = (index: number) => {
        setCropIndex(index);
        setCropImageSrc(photos[index]);
    };

    const handleCropComplete = async (blob: Blob) => {
        if (cropIndex === null) return;
        try {
            const { uploadFiles } = await import('@/utils/uploadthing');
            const file = new File([blob], `crop-${Date.now()}.jpg`, { type: 'image/jpeg' });
            const result = await uploadFiles('imageUploader', { files: [file] });
            const permanentUrl = (result as any)[0]?.ufsUrl ?? (result as any)[0]?.url;
            if (permanentUrl) {
                const newPhotos = [...photos];
                newPhotos[cropIndex] = permanentUrl;
                setPhotos(newPhotos);
                markDirty();
                toast({ title: "Foto recortada", description: "El cambio se guardará al confirmar" });
            }
        } catch (error) {
            console.error("Error uploading cropped photo:", error);
            toast({ title: "Error al recortar", description: "No se pudo procesar el recorte", variant: "destructive" });
        } finally {
            setCropIndex(null);
            setCropImageSrc(null);
        }
    };

    const toggleInterest = (interest: string) => {
        setInterests(prev =>
            prev.includes(interest)
                ? prev.filter(i => i !== interest)
                : prev.length < 10
                    ? [...prev, interest]
                    : prev
        );
    };

    const toggleValue = (value: string) => {
        setValues(prev =>
            prev.includes(value)
                ? prev.filter(v => v !== value)
                : prev.length < 5
                    ? [...prev, value]
                    : prev
        );
    };

    const toggleMusicGenre = (genre: string) => {
        setMusicGenres(prev =>
            prev.includes(genre)
                ? prev.filter(g => g !== genre)
                : prev.length < 5
                    ? [...prev, genre]
                    : prev
        );
    };

    const handleAutoLocate = useCallback(async () => {
        if (!navigator.geolocation) {
            toast({ title: "No disponible", description: "Tu navegador no soporta geolocalización", variant: "destructive" });
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const { latitude: lat, longitude: lng } = pos.coords;
                    setLatitude(lat);
                    setLongitude(lng);

                    // Fetch city name from coordinates
                    const res = await fetch(`/api/location/search?lat=${lat}&lng=${lng}`);
                    if (!res.ok) throw new Error("Failed to reverse geocode");
                    
                    const data = await res.json();
                    if (data.results && data.results.length > 0) {
                        const result = data.results[0];
                        setCity(`${result.city.name}, ${result.country.name}`);
                        setCityId(result.city.id);
                        setCountryCode(result.country.code);
                        setStateCode(result.city.stateCode || "");
                        markDirty();
                        toast({ title: "Ubicación actualizada", description: `Te encontramos en ${result.city.name}` });
                    }
                } catch (err) {
                    console.error("Locate error:", err);
                    toast({ title: "Error", description: "No pudimos determinar tu ciudad exacta", variant: "destructive" });
                } finally {
                    setIsLocating(false);
                }
            },
            () => {
                setIsLocating(false);
                toast({ title: "Acceso denegado", description: "Permite el acceso a tu ubicación para usar esta función", variant: "destructive" });
            },
            { timeout: 10000 }
        );
    }, [toast]);

    const handleSave = async () => {
        if (!user) return;

        setLoading(true);
        try {
            await updateProfile({
                displayName,
                city,
                bio,
                status,
                photos,
                zodiacSign,
                education,
                smoking,
                drinking,
                children,
                religion,
                interests,
                values,
                musicGenres,
                cityId,
                countryCode,
                stateCode,
                latitude: latitude ?? undefined,
                longitude: longitude ?? undefined,
                lookingFor,
                connectionModes,
                ...(voiceIntroChanged ? {
                    voiceIntro: voiceIntroUrl ?? null,
                    voiceIntroDuration: voiceIntroDuration ?? null,
                } : {}),
            } as any);

            await refreshProfile();
            isDirtyRef.current = false;

            toast({
                title: "Perfil actualizado",
                description: "Tus cambios han sido guardados",
            });

            router.push("/profile");
        } catch (error) {
            console.error("Error saving profile:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo guardar el perfil",
            });
        } finally {
            setLoading(false);
        }
    };

    if (!currentProfile) {
        return (
            <div>
                <header className="app-page-header gap-4 sm:px-6">
                    <Skeleton className="h-8 w-48" />
                </header>
                <main className="app-page-content-narrow space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-lg" />)}
                </main>
            </div>
        );
    }

    const handleTouchStart = (e: React.TouchEvent) => {
        const x = e.touches[0].clientX;
        swipeBackRef.current = { startX: x, startY: e.touches[0].clientY, isEdge: x < 30 };
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!swipeBackRef.current || !swipeBackRef.current.isEdge) return;
        const dx = e.changedTouches[0].clientX - swipeBackRef.current.startX;
        const dy = e.changedTouches[0].clientY - swipeBackRef.current.startY;
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        if (dx > 80 && Math.abs(dy) < 60 && scrollY <= 0) {
            goBack();
        }
    };

    return (
        <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <header className="app-page-header gap-4 sm:px-6">
                <Button variant="ghost" size="icon" onClick={goBack} aria-label="Volver">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="font-headline text-xl font-bold text-gradient md:text-2xl">Editar Perfil</h1>
                <Button onClick={handleSave} disabled={loading} className="ml-auto">
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        "Guardar Cambios"
                    )}
                </Button>
            </header>

            <main className="app-page-content space-y-6 pb-24">
                <Card>
                    <CardHeader>
                        <CardTitle>Fotos ({photos.length}/6)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <PhotoGrid
                            photos={photos}
                            onReorder={setPhotos}
                            onRemove={removePhoto}
                            onCrop={handleCropStart}
                        />

                        {photos.length < 6 && (
                            <div>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handlePhotoUpload}
                                    disabled={uploading}
                                    className="hidden"
                                    id="photo-upload"
                                />
                                <Label htmlFor="photo-upload">
                                    <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
                                        {uploading ? (
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                        ) : (
                                            <Upload className="h-8 w-8 mx-auto mb-2" />
                                        )}
                                        <p className="text-sm text-muted-foreground">
                                            {uploading ? "Subiendo..." : "Toca para subir fotos"}
                                        </p>
                                    </div>
                                </Label>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Información Básica</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="displayName">Nombre</Label>
                            <Input
                                id="displayName"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value.replace(/<[^>]*>/g, '').slice(0, 50))}
                                placeholder="Tu nombre"
                                maxLength={50}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="city">Ciudad</Label>
                                <button
                                    type="button"
                                    onClick={handleAutoLocate}
                                    disabled={isLocating}
                                    className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:underline disabled:opacity-50"
                                >
                                    {isLocating ? <Loader2 className="h-3 w-3 animate-spin" /> : <MapPin className="h-3 w-3" />}
                                    Auto-asignar
                                </button>
                            </div>
                            <CityAutocomplete
                                value={city}
                                onSelect={(location: LocationResult) => {
                                    setCity(`${location.city.name}, ${location.country.name}`);
                                    setCityId(location.city.id);
                                    setCountryCode(location.country.code);
                                    setStateCode(location.city.stateCode || "");
                                    setLatitude(location.city.lat);
                                    setLongitude(location.city.lng);
                                    markDirty();
                                }}
                                placeholder="Buscar tu ciudad..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="lookingFor">¿Qué buscas?</Label>
                            <Select value={lookingFor} onValueChange={setLookingFor}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="serious">Algo serio</SelectItem>
                                    <SelectItem value="casual">Algo casual</SelectItem>
                                    <SelectItem value="friendship">Amistad</SelectItem>
                                    <SelectItem value="open">Abierto a ver qué pasa</SelectItem>
                                    <SelectItem value="unsure">Prefiero no decir</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Modo de conexión</Label>
                            <p className="text-sm text-muted-foreground">Elige cómo quieres conectar con otros</p>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={connectionModes.includes('dating') ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => {
                                        setConnectionModes(prev => {
                                            if (prev.includes('dating')) {
                                                // Prevent deselecting the last mode
                                                return prev.length > 1 ? prev.filter(m => m !== 'dating') : prev;
                                            }
                                            return [...prev, 'dating'];
                                        });
                                    }}
                                >
                                    💑 Citas
                                </Button>
                                <Button
                                    type="button"
                                    variant={connectionModes.includes('friendship') ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => {
                                        setConnectionModes(prev => {
                                            if (prev.includes('friendship')) {
                                                // Prevent deselecting the last mode
                                                return prev.length > 1 ? prev.filter(m => m !== 'friendship') : prev;
                                            }
                                            return [...prev, 'friendship'];
                                        });
                                    }}
                                >
                                    🤝 Amistad
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Estado</Label>
                            <Input
                                id="status"
                                value={status}
                                onChange={(e) => setStatus(e.target.value.replace(/<[^>]*>/g, '').slice(0, 50))}
                                placeholder="Conociendo gente nueva"
                                maxLength={50}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bio">Biografía</Label>
                            <Textarea
                                id="bio"
                                value={bio}
                                onChange={(e) => setBio(e.target.value.replace(/<[^>]*>/g, '').slice(0, 500))}
                                placeholder="Cuéntanos sobre ti..."
                                rows={4}
                                maxLength={500}
                            />
                            <p className="text-xs text-muted-foreground text-right">
                                {bio.length}/500
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Detalles</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Signo Zodiacal</Label>
                                <Select value={zodiacSign} onValueChange={setZodiacSign}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {zodiacSigns.map(sign => (
                                            <SelectItem key={sign} value={sign}>{sign}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Educación</Label>
                                <Select value={education} onValueChange={setEducation}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {educationLevels.map(level => (
                                            <SelectItem key={level} value={level}>{level}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tabaco</Label>
                                <Select value={smoking} onValueChange={setSmoking}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {lifestyleOptions.smoking.map(option => (
                                            <SelectItem key={option} value={option}>{option}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Alcohol</Label>
                                <Select value={drinking} onValueChange={setDrinking}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {lifestyleOptions.drinking.map(option => (
                                            <SelectItem key={option} value={option}>{option}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Hijos</Label>
                                <Select value={children} onValueChange={setChildren}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {lifestyleOptions.children.map(option => (
                                            <SelectItem key={option} value={option}>{option}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Religión</Label>
                                <Select value={religion} onValueChange={setReligion}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {lifestyleOptions.religion.map(option => (
                                            <SelectItem key={option} value={option}>{option}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Intereses (hasta 10)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {allInterests.map(interest => (
                                <Badge
                                    key={interest}
                                    variant={interests.includes(interest) ? "default" : "outline"}
                                    className="cursor-pointer"
                                    onClick={() => toggleInterest(interest)}
                                >
                                    {getEmoji(interest, 'interest')} {interest}
                                </Badge>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            {interests.length}/10 seleccionados
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Valores (hasta 5)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {allValues.map(value => (
                                <Badge
                                    key={value}
                                    variant={values.includes(value) ? "default" : "outline"}
                                    className="cursor-pointer"
                                    onClick={() => toggleValue(value)}
                                >
                                    {getEmoji(value, 'value')} {value}
                                </Badge>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            {values.length}/5 seleccionados
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Gustos Musicales (hasta 5)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {allMusicGenres.map(genre => (
                                <Badge
                                    key={genre}
                                    variant={musicGenres.includes(genre) ? "default" : "outline"}
                                    className="cursor-pointer"
                                    onClick={() => toggleMusicGenre(genre)}
                                >
                                    {getEmoji(genre, 'music')} {genre}
                                </Badge>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            {musicGenres.length}/5 seleccionados
                        </p>
                    </CardContent>
                </Card>

                <Card className="app-prose-section rounded-2xl">
                    <CardHeader>
                        <CardTitle>Preguntas ({userPrompts.length}/{MAX_USER_PROMPTS})</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-xs text-muted-foreground">
                                Responde de 3 a 5 preguntas para mostrar tu personalidad en tu perfil (estilo Parejas).
                            </p>

                            {userPrompts.map((p) => (
                                <div key={p.id} className="border border-primary/10 rounded-xl p-3 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm font-medium text-foreground">{p.question}</p>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="shrink-0 h-7 w-7"
                                            onClick={() => deletePrompt(p.id)}
                                            disabled={promptBusy}
                                            aria-label="Eliminar pregunta"
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                    <Textarea
                                        defaultValue={p.answer}
                                        maxLength={PROMPT_ANSWER_MAX}
                                        onBlur={(e) => {
                                            if (e.target.value.trim() && e.target.value.trim() !== p.answer) {
                                                updatePrompt(p.promptId, e.target.value);
                                            }
                                        }}
                                        placeholder="Escribe tu respuesta..."
                                        className="min-h-[60px] text-sm resize-none"
                                    />
                                </div>
                            ))}

                            {userPrompts.length < MAX_USER_PROMPTS && availableTemplates.length > 0 && (
                                <div className="border border-dashed border-primary/30 rounded-xl p-3 space-y-2 bg-primary/5">
                                    <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Elige una pregunta..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableTemplates.map((t) => (
                                                <SelectItem key={t.id} value={t.id}>{t.text}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Textarea
                                        value={newPromptAnswer}
                                        onChange={(e) => setNewPromptAnswer(e.target.value)}
                                        maxLength={PROMPT_ANSWER_MAX}
                                        placeholder="Tu respuesta..."
                                        className="min-h-[60px] text-sm resize-none"
                                    />
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">{newPromptAnswer.length}/{PROMPT_ANSWER_MAX}</span>
                                        <Button
                                            size="sm"
                                            onClick={savePrompt}
                                            disabled={!selectedTemplateId || !newPromptAnswer.trim() || promptBusy}
                                        >
                                            {promptBusy ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
                                            Añadir
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {userPrompts.length >= MAX_USER_PROMPTS && (
                                <p className="text-xs text-muted-foreground text-center">Has alcanzado el máximo de {MAX_USER_PROMPTS} preguntas.</p>
                            )}
                            {userPrompts.length < MAX_USER_PROMPTS && availableTemplates.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center">No hay más preguntas disponibles.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="app-prose-section rounded-2xl">
                        <CardHeader>
                            <CardTitle>Presentación de voz</CardTitle>
                        </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground mb-3">
                            Graba una presentación de máximo 30 segundos para que otros te conozcan
                        </p>
                        <VoiceIntro
                            audioUrl={voiceIntroUrl}
                            duration={voiceIntroDuration}
                            onSave={(url, dur) => {
                                setVoiceIntroUrl(url);
                                setVoiceIntroDuration(dur);
                                setVoiceIntroChanged(true);
                                markDirty();
                                trackEvent('voice_intro_saved', { duration: dur });
                            }}
                            onDelete={() => {
                                setVoiceIntroUrl(undefined);
                                setVoiceIntroDuration(undefined);
                                setVoiceIntroChanged(true);
                                markDirty();
                            }}
                        />
                    </CardContent>
                </Card>
            </main>

            <PhotoCrop
                isOpen={cropIndex !== null}
                onClose={() => { setCropIndex(null); setCropImageSrc(null); }}
                imageSrc={cropImageSrc || ''}
                onCrop={handleCropComplete}
            />
        </div>
    );
}
