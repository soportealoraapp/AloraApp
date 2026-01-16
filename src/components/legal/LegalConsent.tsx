'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Heart, Scale, Loader2 } from 'lucide-react';

export function LegalConsent() {
    const { profile, user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [accepted, setAccepted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const CURRENT_VERSION = '1.7';

    useEffect(() => {
        if (profile && profile.consentVersion !== CURRENT_VERSION) {
            setIsOpen(true);
        }
    }, [profile]);

    const handleAccept = async () => {
        if (!accepted || !user) return;

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/user/consent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ version: CURRENT_VERSION })
            });

            if (!response.ok) throw new Error('Error al guardar el consentimiento');

            toast({
                title: "Términos aceptados",
                description: "¡Bienvenido a la nueva versión de Alora!",
            });
            setIsOpen(false);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl rounded-3xl p-8" onPointerDownOutside={(e) => e.preventDefault()}>
                <DialogHeader className="text-center">
                    <div className="bg-pink-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Scale className="h-8 w-8 text-pink-500" />
                    </div>
                    <DialogTitle className="text-2xl font-bold">Actualización Legal (v1.7)</DialogTitle>
                    <DialogDescription className="text-base pt-2">
                        Para continuar usando Alora, necesitamos que revises y aceptes nuestras nuevas políticas de seguridad y privacidad.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 my-6">
                    <div className="bg-muted/50 p-4 rounded-2xl text-sm max-h-[200px] overflow-y-auto space-y-3">
                        <p><strong>Seguridad:</strong> Hemos reforzado nuestro sistema de reportes y bloqueo real.</p>
                        <p><strong>Privacidad:</strong> Tus datos ahora están protegidos con encriptación avanzada en reposo.</p>
                        <p><strong>Moderación:</strong> Alora utiliza IA para detectar y prevenir el acoso en tiempo real.</p>
                        <p><em>Al continuar, aceptas que Alora es una comunidad basada en el respeto mutuo.</em></p>
                    </div>

                    <div className="flex items-start space-x-3 pt-2">
                        <Checkbox
                            id="terms"
                            checked={accepted}
                            onCheckedChange={(checked) => setAccepted(checked as boolean)}
                            className="mt-1"
                        />
                        <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                            He leído y acepto los <strong>Términos y Condiciones</strong> y la <strong>Política de Privacidad</strong> actualizados de Alora.
                        </Label>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        className="w-full bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-full py-6 text-lg font-bold"
                        disabled={!accepted || isSubmitting}
                        onClick={handleAccept}
                    >
                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Heart className="h-5 w-5 mr-2" />}
                        Aceptar y Continuar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
