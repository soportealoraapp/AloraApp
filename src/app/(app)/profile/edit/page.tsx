"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, X, Loader2, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { CityAutocomplete } from "@/components/ui/city-autocomplete";
import type { LocationResult } from "@/lib/location";

const lifestyleOptions = {
    smoking: ["No fumo", "Ocasionalmente", "Sí, fumo"],
    drinking: ["No bebo", "Socialmente", "Regularmente"],
    children: ["No tengo", "Tengo hijos", "Quiero tener"],
    religion: ["Ninguna", "Cristiana", "Católica", "Musulmana", "Judía", "Budista", "Otra"],
};

const zodiacSigns = ["Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo", "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis"];
const educationLevels = ["Secundaria", "Preparatoria", "Universidad", "Licenciatura", "Maestría", "Doctorado"];
const allInterests = ['Viajar', 'Yoga', 'Arte', 'Música', 'Cocinar', 'Leer', 'Deportes', 'Cine', 'Fotografía', 'Bailar', 'Tecnología', 'Naturaleza', 'Moda', 'Escritura', 'Gaming'];
const allValues = ['Honestidad', 'Amabilidad', 'Crecimiento', 'Lealtad', 'Humor', 'Aventura', 'Respeto', 'Creatividad', 'Empatía', 'Autenticidad'];
const allMusicGenres = ['Pop', 'Rock', 'Jazz', 'Clásica', 'Electrónica', 'Hip-Hop', 'Reggaeton', 'Salsa', 'Country', 'Indie', 'R&B', 'Folk'];

export default function ProfileEditPage() {
    const router = useRouter();
    const { user, profile: currentProfile, refreshProfile } = useAuth();
    const { updateProfile } = useProfile();
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
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
        }
    }, [currentProfile]);

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

    const removePhoto = (index: number) => {
        setPhotos(photos.filter((_, i) => i !== index));
    };

    const movePhoto = (fromIndex: number, toIndex: number) => {
        const newPhotos = [...photos];
        const [removed] = newPhotos.splice(fromIndex, 1);
        newPhotos.splice(toIndex, 0, removed);
        setPhotos(newPhotos);
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
                latitude,
                longitude,
                lookingFor,
            });

            await refreshProfile();

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

    return (
        <div className="md:pl-60">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
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
                        <div className="grid grid-cols-3 gap-3">
                            {photos.map((photo, index) => (
                                <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                                    <Image src={photo} alt={`Foto ${index + 1}`} fill className="object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        {index > 0 && (
                                            <Button size="sm" variant="secondary" onClick={() => movePhoto(index, index - 1)}>
                                                ←
                                            </Button>
                                        )}
                                        <Button size="sm" variant="destructive" onClick={() => removePhoto(index)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                        {index < photos.length - 1 && (
                                            <Button size="sm" variant="secondary" onClick={() => movePhoto(index, index + 1)}>
                                                →
                                            </Button>
                                        )}
                                    </div>
                                    {index === 0 && (
                                        <Badge className="absolute top-2 left-2">Principal</Badge>
                                    )}
                                </div>
                            ))}
                        </div>

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
                                    {interest}
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
                                    {value}
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
                                    {genre}
                                </Badge>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            {musicGenres.length}/5 seleccionados
                        </p>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
