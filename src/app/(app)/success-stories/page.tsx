'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Loader2, ArrowLeft, Sparkles, Quote } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Story {
    id: string;
    title: string;
    story: string;
    photoUrl?: string | null;
    createdAt: string;
}

export default function SuccessStoriesPage() {
    const router = useRouter();
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/success-stories')
            .then(r => r.json())
            .then(data => setStories(data.stories || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="md:pl-60 p-6 flex justify-center py-20">
                <Loader2 className="animate-spin text-primary h-8 w-8" />
            </div>
        );
    }

    return (
        <div className="md:pl-60 p-6 space-y-6 bg-gray-50 min-h-screen">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Heart className="h-6 w-6 text-pink-500 fill-pink-500" />
                        Historias de éxito
                    </h1>
                    <p className="text-sm text-muted-foreground">Parejas que se encontraron en Alora</p>
                </div>
            </div>

            {stories.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-semibold">Pronto tendremos historias</p>
                        <p className="text-sm text-muted-foreground text-center mt-1">
                            Las primeras historias de éxito de la comunidad se publicarán pronto.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stories.map((s) => {
                        const isExpanded = expanded === s.id;
                        const shouldTruncate = s.story.length > 200 && !isExpanded;
                        return (
                            <Card key={s.id} className="rounded-3xl border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                                {s.photoUrl && (
                                    <div className="aspect-[16/9] relative overflow-hidden bg-muted">
                                        <img
                                            src={s.photoUrl}
                                            alt={s.title}
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <CardContent className="p-6 space-y-3">
                                    <Quote className="h-6 w-6 text-primary/40" />
                                    <h3 className="font-bold text-lg">{s.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                        {shouldTruncate ? `${s.story.substring(0, 200)}…` : s.story}
                                    </p>
                                    {s.story.length > 200 && (
                                        <Button
                                            variant="link"
                                            size="sm"
                                            onClick={() => setExpanded(isExpanded ? null : s.id)}
                                            className="p-0 h-auto font-bold text-primary"
                                        >
                                            {isExpanded ? 'Ver menos' : 'Leer más →'}
                                        </Button>
                                    )}
                                    <p className="text-[10px] text-muted-foreground pt-2 border-t">
                                        {new Date(s.createdAt).toLocaleDateString('es-MX', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Card className="rounded-3xl border-none shadow-sm bg-gradient-to-r from-primary/5 to-pink-500/5">
                <CardContent className="p-6 text-center space-y-3">
                    <p className="text-2xl">💕</p>
                    <p className="font-bold">¿Tienes una historia que contar?</p>
                    <p className="text-sm text-muted-foreground">
                        Comparte cómo encontraste el amor en Alora
                    </p>
                    <Button asChild>
                        <Link href="/support">Contactar al equipo</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
