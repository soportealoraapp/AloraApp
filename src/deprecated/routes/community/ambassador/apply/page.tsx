/**
 * @deprecated Moved to deprecated route tree in V3.4.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle } from 'lucide-react';

export default function ApplicationPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();
    const [city, setCity] = useState('');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!city.trim() || !reason.trim()) {
            toast({ title: 'Campos requeridos', description: 'Completa todos los campos.', variant: 'destructive' });
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch('/api/user/ambassador-apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.id, city: city.trim(), reason: reason.trim() }),
            });
            if (!res.ok) throw new Error('submit failed');
            setSubmitted(true);
            toast({ title: 'Aplicación enviada', description: 'Te contactaremos pronto.' });
        } catch {
            toast({ title: 'Error', description: 'No se pudo enviar la aplicación.', variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="md:pl-60 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 min-h-screen flex items-center justify-center">
                <Card className="max-w-md w-full p-8 text-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">¡Aplicación enviada!</h1>
                    <p className="text-gray-500 mb-6">Revisaremos tu aplicación y te contactaremos pronto.</p>
                    <Button onClick={() => router.push('/discover')}>Volver a Descubrir</Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="md:pl-60 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 min-h-screen flex items-center justify-center">
            <Card className="max-w-md w-full p-8">
                <h1 className="text-2xl font-bold mb-4">Conviértete en Embajador</h1>
                <p className="text-gray-500 mb-6 font-light">Lidera la comunidad Alora en tu ciudad. Organiza eventos éticos y seguros.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input placeholder="Tu Ciudad / Región" value={city} onChange={e => setCity(e.target.value)} disabled={submitting} required />
                    <Textarea placeholder="¿Por qué quieres ser embajador? (Cuéntanos tu visión de comunidad)" value={reason} onChange={e => setReason(e.target.value)} disabled={submitting} required />
                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={submitting}>
                        {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</> : 'Enviar Aplicación'}
                    </Button>
                </form>
            </Card>
        </div>
    );
}

