'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, CheckCircle, XCircle, Trash2, Edit2, Plus, Heart } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface Story {
    id: string;
    title: string;
    story: string;
    photoUrl?: string | null;
    authorId?: string | null;
    approved: boolean;
    createdAt: string;
}

export default function AdminSuccessStoriesPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<Story | null>(null);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ title: '', story: '', photoUrl: '' });

    useEffect(() => {
        fetchStories();
    }, []);

    const fetchStories = async () => {
        try {
            const res = await fetch('/api/admin/success-stories');
            const data = await res.json();
            setStories(data.stories || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (story: Story) => {
        try {
            await fetch('/api/admin/success-stories', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: story.id, approved: !story.approved }),
            });
            toast({ title: story.approved ? 'Historia rechazada' : 'Historia aprobada' });
            fetchStories();
        } catch (error) {
            toast({ title: 'Error', variant: 'destructive' });
        }
    };

    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        setShowDeleteConfirm(id);
    };

    const confirmDeleteStory = async () => {
        const id = showDeleteConfirm;
        if (!id) return;
        setShowDeleteConfirm(null);
        try {
            await fetch(`/api/admin/success-stories?id=${id}`, { method: 'DELETE' });
            toast({ title: 'Historia eliminada' });
            fetchStories();
        } catch (error) {
            toast({ title: 'Error', variant: 'destructive' });
        }
    };

    const handleSave = async () => {
        if (!form.title || !form.story) {
            toast({ title: 'Faltan campos', variant: 'destructive' });
            return;
        }
        try {
            if (editing) {
                await fetch('/api/admin/success-stories', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: editing.id,
                        title: form.title,
                        story: form.story,
                        photoUrl: form.photoUrl || null,
                    }),
                });
                toast({ title: 'Historia actualizada' });
            } else {
                await fetch('/api/admin/success-stories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...form,
                        photoUrl: form.photoUrl || null,
                        approved: false,
                    }),
                });
                toast({ title: 'Historia creada' });
            }
            setEditing(null);
            setCreating(false);
            setForm({ title: '', story: '', photoUrl: '' });
            fetchStories();
        } catch (error) {
            toast({ title: 'Error', variant: 'destructive' });
        }
    };

    const startEdit = (story: Story) => {
        setEditing(story);
        setCreating(true);
        setForm({ title: story.title, story: story.story, photoUrl: story.photoUrl || '' });
    };

    const startCreate = () => {
        setEditing(null);
        setCreating(true);
        setForm({ title: '', story: '', photoUrl: '' });
    };

    if (loading) {
        return (
            <div className="md:pl-sidebar p-6 flex justify-center py-20">
                <Loader2 className="animate-spin text-primary h-8 w-8" />
            </div>
        );
    }

    return (
        <>
        <div className="md:pl-sidebar p-6 space-y-6 bg-muted/30 min-h-dvh">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />
                        Historias de éxito
                    </h1>
                    <p className="text-sm text-muted-foreground">Administra las historias de la comunidad</p>
                </div>
                {!creating && (
                    <Button onClick={startCreate}>
                        <Plus className="h-4 w-4 mr-2" /> Nueva
                    </Button>
                )}
            </div>

            {creating && (
                <Card>
                    <CardContent className="p-6 space-y-3">
                        <h3 className="font-bold">{editing ? 'Editar historia' : 'Nueva historia'}</h3>
                        <Input
                            placeholder="Título"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                        />
                        <Textarea
                            placeholder="Historia"
                            value={form.story}
                            onChange={(e) => setForm({ ...form, story: e.target.value })}
                            rows={6}
                        />
                        <Input
                            placeholder="URL de foto (opcional)"
                            value={form.photoUrl}
                            onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                        />
                        <div className="flex gap-2">
                            <Button onClick={handleSave}>{editing ? 'Guardar' : 'Crear'}</Button>
                            <Button variant="outline" onClick={() => { setCreating(false); setEditing(null); }}>
                                Cancelar
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {stories.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center text-muted-foreground">
                        No hay historias todavía
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {stories.map((s) => (
                        <Card key={s.id} className={s.approved ? 'border-green-200' : 'border-amber-200'}>
                            <CardContent className="p-4 space-y-2">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold truncate">{s.title}</h3>
                                            {s.approved ? (
                                                <span className="text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                                                    Aprobada
                                                </span>
                                            ) : (
                                                <span className="text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
                                                    Pendiente
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{s.story}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {new Date(s.createdAt).toLocaleDateString('es-MX')}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => handleApprove(s)}
                                            title={s.approved ? 'Rechazar' : 'Aprobar'}
                                            aria-label={s.approved ? "Desaprobar historia" : "Aprobar historia"}
                                        >
                                            {s.approved ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => startEdit(s)}
                                            title="Editar"
                                            aria-label="Editar historia"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => handleDelete(s.id)}
                                            title="Eliminar"
                                            aria-label="Eliminar historia"
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
            <AlertDialog open={!!showDeleteConfirm} onOpenChange={(open) => { if (!open) setShowDeleteConfirm(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar historia?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. La historia se eliminará permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowDeleteConfirm(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteStory} className="bg-destructive hover:bg-destructive/90">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
