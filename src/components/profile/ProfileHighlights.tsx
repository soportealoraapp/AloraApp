'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Home, Plane, PawPrint, Palette, BookOpen, Heart, Briefcase, Coffee, Music, Camera, Dumbbell, Sparkles, Users, Compass, type LucideIcon } from 'lucide-react';
import { BadgeChipList } from '@/components/profile/BadgeChip';

interface ProfileHighlightsProps {
    bio?: string | null;
    interests?: string[];
    values?: string[];
    lookingFor?: string | null;
    musicGenres?: string[];
    personalGuide?: any;
}

const KEYWORD_ICON_MAP: Array<{ keywords: string[]; label: string; icon: LucideIcon; color: string }> = [
    { keywords: ['familia', 'family', 'hijos', 'mamá', 'papá', 'padres'], label: 'Familia', icon: Home, color: 'bg-amber-100 text-amber-700' },
    { keywords: ['viajar', 'viajes', 'travel', 'viaje', 'mundo', 'destino'], label: 'Viajes', icon: Plane, color: 'bg-sky-100 text-sky-700' },
    { keywords: ['mascota', 'perro', 'gato', 'animal', 'pet'], label: 'Mascotas', icon: PawPrint, color: 'bg-pink-100 text-pink-700' },
    { keywords: ['arte', 'pintura', 'creatividad', 'diseño', 'creativa'], label: 'Creatividad', icon: Palette, color: 'bg-purple-100 text-purple-700' },
    { keywords: ['lectura', 'leer', 'libro', 'literatura', 'escritura'], label: 'Lectura', icon: BookOpen, color: 'bg-indigo-100 text-indigo-700' },
    { keywords: ['música', 'musica', 'concierto', 'banda', 'guitarra', 'cantar'], label: 'Música', icon: Music, color: 'bg-rose-100 text-rose-700' },
    { keywords: ['cocinar', 'cocina', 'gastronomía', 'comida', 'recetas'], label: 'Cocina', icon: Coffee, color: 'bg-orange-100 text-orange-700' },
    { keywords: ['foto', 'fotografía', 'camara', 'cámara'], label: 'Fotografía', icon: Camera, color: 'bg-cyan-100 text-cyan-700' },
    { keywords: ['deporte', 'gym', 'fitness', 'correr', 'yoga', 'ejercicio'], label: 'Deporte', icon: Dumbbell, color: 'bg-green-100 text-green-700' },
    { keywords: ['trabajo', 'carrera', 'profesión', 'empresa', 'emprendimiento'], label: 'Profesión', icon: Briefcase, color: 'bg-slate-100 text-slate-700' },
    { keywords: ['amigos', 'social', 'gente', 'comunidad'], label: 'Social', icon: Users, color: 'bg-teal-100 text-teal-700' },
    { keywords: ['aventura', 'explorar', 'naturaleza', 'outdoor'], label: 'Aventura', icon: Compass, color: 'bg-emerald-100 text-emerald-700' },
];

const VALUE_LABEL_MAP: Record<string, string> = {
    honestidad: 'Honestidad',
    lealtad: 'Lealtad',
    familia: 'Familia',
    respeto: 'Respeto',
    aventura: 'Aventura',
    estabilidad: 'Estabilidad',
    creatividad: 'Creatividad',
    empatía: 'Empatía',
    autenticidad: 'Autenticidad',
    amor: 'Amor',
    crecimiento: 'Crecimiento',
    libertad: 'Libertad',
};

const LOOKING_FOR_LABEL: Record<string, string> = {
    serious: 'Relación seria',
    casual: 'Conocer gente',
    friendship: 'Amistad',
    networking: 'Networking',
};

export function ProfileHighlights({ bio, interests = [], values = [], lookingFor, musicGenres = [] }: ProfileHighlightsProps) {
    const highlights = useMemo(() => {
        const result: Array<{ label: string; icon: LucideIcon; color: string; source: string }> = [];
        const seen = new Set<string>();

        const bioLower = (bio || '').toLowerCase();

        for (const entry of KEYWORD_ICON_MAP) {
            const inBio = entry.keywords.some(k => bioLower.includes(k));
            if (inBio && !seen.has(entry.label)) {
                result.push({ ...entry, source: 'bio' });
                seen.add(entry.label);
            }
            if (result.length >= 6) break;
        }

        if (result.length < 6) {
            for (const value of values) {
                const valueLower = value.toLowerCase();
                const matched = KEYWORD_ICON_MAP.find(e =>
                    e.keywords.some(k => valueLower.includes(k))
                );
                const label = VALUE_LABEL_MAP[valueLower] || matched?.label || value;
                if (matched && !seen.has(matched.label)) {
                    result.push({ label: matched.label, icon: matched.icon, color: matched.color, source: 'value' });
                    seen.add(matched.label);
                } else if (!seen.has(label)) {
                    result.push({ label, icon: Heart, color: 'bg-rose-100 text-rose-700', source: 'value' });
                    seen.add(label);
                }
                if (result.length >= 6) break;
            }
        }

        if (result.length < 6) {
            for (const interest of interests) {
                const interestLower = interest.toLowerCase();
                const matched = KEYWORD_ICON_MAP.find(e =>
                    e.keywords.some(k => interestLower.includes(k) || interestLower === k)
                );
                if (matched && !seen.has(matched.label)) {
                    result.push({ label: matched.label, icon: matched.icon, color: matched.color, source: 'interest' });
                    seen.add(matched.label);
                } else if (!seen.has(interest) && interest.length < 20) {
                    result.push({
                        label: interest,
                        icon: Sparkles,
                        color: 'bg-violet-100 text-violet-700',
                        source: 'interest'
                    });
                    seen.add(interest);
                }
                if (result.length >= 6) break;
            }
        }

        return result;
    }, [bio, interests, values]);

    const lookingForLabel = lookingFor ? LOOKING_FOR_LABEL[lookingFor] : null;

    if (highlights.length === 0 && !lookingForLabel) return null;

    return (
        <Card className="rounded-3xl border-none shadow-sm bg-gradient-to-br from-primary/5 to-purple-500/5">
            <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Lo mejor de esta persona
                </h3>

                {lookingForLabel && (
                    <div className="mb-3 inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-bold">
                        <Heart className="h-3 w-3" fill="currentColor" />
                        Busca: {lookingForLabel}
                    </div>
                )}

                {highlights.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {highlights.map((h, i) => {
                            const Icon = h.icon;
                            return (
                                <div
                                    key={i}
                                    className={`inline-flex items-center gap-1.5 ${h.color} px-3 py-1.5 rounded-full text-xs font-semibold`}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    {h.label}
                                </div>
                            );
                        })}
                    </div>
                )}

                {musicGenres.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Escucha</p>
                        <BadgeChipList items={musicGenres.slice(0, 4)} type="music" />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
