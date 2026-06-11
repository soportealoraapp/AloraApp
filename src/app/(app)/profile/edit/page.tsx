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
import { ArrowLeft, Upload, Loader2 } from "lucide-react";
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
    religion: ["Ninguna", "Cristiana", "Católica", "Musulmana", "Judía", "Budista", "Otra"],
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
    const swipeBackRef = useRef({ startX: 0, startY: 0 });
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
    const [cropIndex, setCropIndex] = useState<number | null>(null);
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
    const [voiceIntroUrl, setVoiceIntroUrl] = useState<string | undefined>(undefined);
    const [voiceIntroDuration, setVoiceIntroDuration] = useState<number | undefined>(undefined);
    const [voiceIntroChanged, setVoiceIntroChanged] = useState(false);
    const isDirtyRef = useRef(false);

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
            setCityId((currentProfile as any).cityId || "");
            setCountryCode((currentProfile as any).countryCode || "");
            setStateCode((currentProfile as any).stateCode || "");
            setLatitude((currentProfile as any).latitude || null);
            setLongitude((currentProfile as any).longitude || null);
            setLookingFor((currentProfile as any).lookingFor || "");
            setVoiceIntroUrl((currentProfile as any).voiceIntro ?? undefined);
            setVoiceIntroDuration((currentProfile as any).voiceIntroDuration ?? undefined);
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
            const newUrls = result.map((r: any) => r.url);
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
            const permanentUrl = (result as any)[0]?.url;
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
            <div className="md:pl-60">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                    <Skeleton className="h-8 w-48" />
                </header>
                <main className="p-4 space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-lg" />)}
                </main>
            </div>
        );
    }

    const handleTouchStart = (e: React.TouchEvent) => {
        swipeBackRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY };
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!swipeBackRef.current) return;
        const dx = e.changedTouches[0].clientX - swipeBackRef.current.startX;
        const dy = e.changedTouches[0].clientY - swipeBackRef.current.startY;
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        if (dx > 80 && Math.abs(dy) < 60 && scrollY <= 0) {
            goBack();
        }
    };

    return (
        <div className="md:pl-60" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                <Button variant="ghost" size="icon" onClick={goBack}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-semibold md:text-2xl font-headline">Editar Perfil</h1>
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

            <main className="p-4 space-y-6 pb-24">
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
                                            {uploading ? "Subiendo..." : "Click para subir fotos"}
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
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Tu nombre"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="city">Ciudad</Label>
                            <CityAutocomplete
                                value={city}
                                onSelect={(location: LocationResult) => {
                                    setCity(location.city.name);
                                    setCityId(location.city.id);
                                    setCountryCode(location.country.code);
                                    setStateCode(location.city.stateCode);
                                    setLatitude(location.city.lat);
                                    setLongitude(location.city.lng);
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
                            <Label htmlFor="status">Estado</Label>
                            <Input
                                id="status"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                placeholder="Conociendo gente nueva"
                                maxLength={50}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bio">Biografía</Label>
                            <Textarea
                                id="bio"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
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

                <Card>
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
