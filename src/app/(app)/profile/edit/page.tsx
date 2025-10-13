

"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { allInterests, allValues, mockUser, zodiacSigns, educationLevels, lifestyleOptions, allMusicGenres, allPersonalGuideOptions, PersonalGuideItem } from '@/lib/mock-data';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Check, Star, Trash2, Upload, Edit, Music, UserCheck } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import placeholderImages from '@/lib/placeholder-images.json';

export default function EditProfilePage() {
    const router = useRouter();
    const { toast } = useToast();
    const [name, setName] = useState(mockUser.name);
    const [city, setCity] = useState(mockUser.city);
    const [status, setStatus] = useState(mockUser.status);
    const [bio, setBio] = useState(mockUser.bio);
    const [interests, setInterests] = useState(mockUser.interests);
    const [values, setValues] = useState(mockUser.values);
    const [musicGenres, setMusicGenres] = useState(mockUser.musicGenres);
    const [photos, setPhotos] = useState(mockUser.photos);
    const [personalGuide, setPersonalGuide] = useState<PersonalGuideItem[]>(mockUser.personalGuide || []);
    
    // New state for detailed info
    const [zodiacSign, setZodiacSign] = useState(mockUser.zodiacSign);
    const [education, setEducation] = useState(mockUser.education);
    const [smoking, setSmoking] = useState(mockUser.smoking);
    const [drinking, setDrinking] = useState(mockUser.drinking);
    const [children, setChildren] = useState(mockUser.children);
    const [religion, setReligion] = useState(mockUser.religion);


    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = () => {
        // Here you would typically save the data to a backend
        console.log({ status, bio, interests, values, photos, personalGuide });
        toast({
            title: "Perfil guardado ✨",
            description: "Tus cambios se han guardado exitosamente.",
        });
        router.push('/profile/me');
    };

    const toggleSelection = (item: string, list: string[], setList: (list: string[]) => void, max: number) => {
        if (list.includes(item)) {
            setList(list.filter(i => i !== item));
        } else {
            if (list.length < max) {
                setList([...list, item]);
            } else {
                toast({
                    variant: "destructive",
                    title: "Límite alcanzado",
                    description: `Puedes seleccionar hasta ${max} elementos.`,
                })
            }
        }
    };
    
    const toggleGuideSelection = (item: PersonalGuideItem) => {
        const max = 3;
        if (personalGuide.some(g => g.title === item.title)) {
            setPersonalGuide(personalGuide.filter(g => g.title !== item.title));
        } else {
            if (personalGuide.length < max) {
                setPersonalGuide([...personalGuide, item]);
            } else {
                 toast({
                    variant: "destructive",
                    title: "Límite alcanzado",
                    description: `Puedes seleccionar hasta ${max} guías personales.`,
                })
            }
        }
    };

    const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const files = Array.from(event.target.files);
            const newPhotoUrls = files.map(file => URL.createObjectURL(file));
            
            if (photos.length + newPhotoUrls.length > 6) {
                 toast({
                    variant: "destructive",
                    title: "Límite de fotos alcanzado",
                    description: "Puedes tener un máximo de 6 fotos.",
                });
                return;
            }

            setPhotos(prevPhotos => [...prevPhotos, ...newPhotoUrls]);
        }
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    const setAsProfilePicture = (photoToSet: string) => {
        setPhotos([photoToSet, ...photos.filter(p => p !== photoToSet)]);
        toast({
            title: "¡Nueva foto de perfil! ✨",
            description: "Tu foto principal ha sido actualizada.",
        });
    };

    const deletePhoto = (photoToDelete: string) => {
        if (photos.length <= 1) {
            toast({
                variant: "destructive",
                title: "Acción no permitida",
                description: "Debes tener al menos una foto en tu perfil.",
            });
            return;
        }
        setPhotos(photos.filter(p => p !== photoToDelete));
    };

    return (
        <div className="md:pl-60">
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                <div className='flex items-center gap-4'>
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-semibold md:text-2xl font-headline">Editar Perfil</h1>
                </div>
                <Button onClick={handleSave}>Guardar</Button>
            </header>

            <main className="p-4 space-y-6 pb-20">
                <Card>
                    <CardHeader>
                        <CardTitle>Tus Fotos</CardTitle>
                        <CardDescription>La primera foto es tu foto de perfil. Puedes subir hasta 6 fotos.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-4">
                        {photos.map((photo, i) => (
                             <div key={i} className="relative aspect-square group">
                                <Image 
                                    src={photo} 
                                    alt={`Tu foto ${i + 1}`} 
                                    fill
                                    className="rounded-lg object-cover"
                                />
                                {i === 0 && (
                                    <div className="absolute top-1 left-1 bg-primary text-primary-foreground p-1 rounded-full text-xs flex items-center gap-1">
                                        <Star className="h-3 w-3" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-1">
                                    {i !== 0 && (
                                        <Button size="sm" variant="ghost" className="text-white hover:bg-white/20 h-auto p-1" onClick={() => setAsProfilePicture(photo)}>
                                            <Star className="h-4 w-4 mr-1"/>
                                            Principal
                                        </Button>
                                    )}
                                    <Button size="sm" variant="ghost" className="text-white hover:bg-white/20 h-auto p-1" onClick={() => deletePhoto(photo)}>
                                        <Trash2 className="h-4 w-4 mr-1"/>
                                        Eliminar
                                    </Button>
                                </div>
                            </div>
                        ))}
                         {photos.length < 6 && (
                            <div 
                                className="relative aspect-square flex items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-secondary"
                                onClick={triggerFileUpload}
                            >
                                <div className="text-center text-muted-foreground">
                                    <Upload className="h-8 w-8 mx-auto"/>
                                    <span>Añadir foto</span>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    multiple
                                    accept="image/png, image/jpeg, image/webp"
                                    className="hidden"
                                    onChange={handlePhotoUpload}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Sobre mí</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Tu nombre</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder='¿Cómo te llamas?' />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="city">Tu ciudad</Label>
                            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder='Ej: Madrid, España' />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="status">Tu estado</Label>
                            <Input id="status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder='Ej: Buscando algo serio y real ✨' />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="bio">Tu biografía</Label>
                            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder='Cuéntale a la gente un poco sobre ti...' rows={4}/>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader><CardTitle>Información Básica</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Signo Zodiacal</Label>
                            <Select value={zodiacSign} onValueChange={setZodiacSign}>
                                <SelectTrigger><SelectValue placeholder="Selecciona tu signo" /></SelectTrigger>
                                <SelectContent><ScrollArea className="h-72">{zodiacSigns.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</ScrollArea></SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label>Nivel de estudios</Label>
                             <Select value={education} onValueChange={setEducation}>
                                <SelectTrigger><SelectValue placeholder="Selecciona tu nivel de estudios" /></SelectTrigger>
                                <SelectContent>{educationLevels.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader><CardTitle>Estilo de Vida</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Tabaco</Label>
                             <Select value={smoking} onValueChange={setSmoking}>
                                <SelectTrigger><SelectValue placeholder="¿Fumas?" /></SelectTrigger>
                                <SelectContent>{lifestyleOptions.smoking.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Alcohol</Label>
                             <Select value={drinking} onValueChange={setDrinking}>
                                <SelectTrigger><SelectValue placeholder="¿Bebes alcohol?" /></SelectTrigger>
                                <SelectContent>{lifestyleOptions.drinking.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label>Hijos</Label>
                             <Select value={children} onValueChange={setChildren}>
                                <SelectTrigger><SelectValue placeholder="¿Tienes o quieres hijos?" /></SelectTrigger>
                                <SelectContent>{lifestyleOptions.children.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label>Religión</Label>
                             <Select value={religion} onValueChange={setReligion}>
                                <SelectTrigger><SelectValue placeholder="¿Cuál es tu religión?" /></SelectTrigger>
                                <SelectContent>{lifestyleOptions.religion.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5"/> Guía Personal</CardTitle>
                            <CardDescription>Ayuda a otros a entender cómo te comunicas. (Máx. 3)</CardDescription>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Selecciona tu Guía Personal</DialogTitle>
                                </DialogHeader>
                                <ScrollArea className="max-h-80 -mx-4 px-4">
                                    <div className="flex flex-col gap-2 py-4">
                                    {allPersonalGuideOptions.map(option => (
                                        <button key={option.title} onClick={() => toggleGuideSelection(option)} className={`p-3 rounded-md text-left ${personalGuide.some(g => g.title === option.title) ? 'bg-primary/20' : 'bg-secondary'}`}>
                                            <p className="font-semibold">{option.title}</p>
                                            <p className="text-sm text-muted-foreground">{option.description}</p>
                                        </button>
                                    ))}
                                    </div>
                                </ScrollArea>
                                 <DialogClose asChild><Button>Hecho</Button></DialogClose>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {personalGuide.length > 0 ? personalGuide.map(g => (
                            <div key={g.title} className="p-3 rounded-lg bg-secondary">
                                <p className="font-semibold text-sm">{g.title}</p>
                                <p className="text-xs text-muted-foreground">{g.description}</p>
                            </div>
                        )) : <p className="text-sm text-muted-foreground">Añade guías para mejorar la comunicación.</p>}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Intereses</CardTitle>
                            <CardDescription>Selecciona hasta 10.</CardDescription>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                <DialogTitle>Selecciona tus intereses</DialogTitle>
                                </DialogHeader>
                                <ScrollArea className="max-h-80 -mx-4 px-4">
                                <div className="flex flex-wrap gap-2 py-4">
                                {allInterests.map(interest => (
                                    <button key={interest} onClick={() => toggleSelection(interest, interests, setInterests, 10)}>
                                        <Badge variant={interests.includes(interest) ? 'default' : 'secondary'} className="text-base py-1 px-3 cursor-pointer">
                                            {interest}
                                            {interests.includes(interest) && <Check className="ml-2 h-4 w-4"/>}
                                        </Badge>
                                    </button>
                                ))}
                                </div>
                                </ScrollArea>
                                <DialogClose asChild><Button>Hecho</Button></DialogClose>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        {interests.length > 0 ? interests.map(i => <Badge key={i}>{i}</Badge>) : <p className="text-sm text-muted-foreground">Añade tus intereses para conectar mejor.</p>}
                    </CardContent>
                </Card>
                <Card>
                     <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Valores</CardTitle>
                            <CardDescription>Selecciona hasta 5.</CardDescription>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                <DialogTitle>Selecciona tus valores</DialogTitle>
                                </DialogHeader>
                                <ScrollArea className="max-h-80 -mx-4 px-4">
                                    <div className="flex flex-wrap gap-2 py-4">
                                    {allValues.map(value => (
                                        <button key={value} onClick={() => toggleSelection(value, values, setValues, 5)}>
                                            <Badge variant={values.includes(value) ? 'default' : 'secondary'} className="text-base py-1 px-3 cursor-pointer">
                                                {value}
                                                {values.includes(value) && <Check className="ml-2 h-4 w-4"/>}
                                            </Badge>
                                        </button>
                                    ))}
                                    </div>
                                </ScrollArea>
                                 <DialogClose asChild><Button>Hecho</Button></DialogClose>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        {values.length > 0 ? values.map(v => <Badge variant="secondary" key={v}>{v}</Badge>) : <p className="text-sm text-muted-foreground">Tus valores nos ayudan a encontrar 'matches' compatibles.</p>}
                    </CardContent>
                </Card>
                
                <Card>
                     <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2"><Music className="h-5 w-5"/> Gustos Musicales</CardTitle>
                            <CardDescription>Selecciona hasta 5 géneros.</CardDescription>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                <DialogTitle>Selecciona tus gustos musicales</DialogTitle>
                                </DialogHeader>
                                <ScrollArea className="max-h-80 -mx-4 px-4">
                                    <div className="flex flex-wrap gap-2 py-4">
                                    {allMusicGenres.map(genre => (
                                        <button key={genre} onClick={() => toggleSelection(genre, musicGenres, setMusicGenres, 5)}>
                                            <Badge variant={musicGenres.includes(genre) ? 'default' : 'secondary'} className="text-base py-1 px-3 cursor-pointer">
                                                {genre}
                                                {musicGenres.includes(genre) && <Check className="ml-2 h-4 w-4"/>}
                                            </Badge>
                                        </button>
                                    ))}
                                    </div>
                                </ScrollArea>
                                 <DialogClose asChild><Button>Hecho</Button></DialogClose>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        {musicGenres.length > 0 ? musicGenres.map(genre => <Badge variant="outline" key={genre}>{genre}</Badge>) : <p className="text-sm text-muted-foreground">Añade tu música para encontrar gente con tu misma vibra.</p>}
                    </CardContent>
                </Card>


            </main>
        </div>
    );
}
