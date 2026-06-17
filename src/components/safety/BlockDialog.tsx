'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface BlockDialogProps {
    isOpen: boolean;
    onClose: () => void;
    blockedId: string;
    onSuccess?: () => void;
}

export function BlockDialog({ isOpen, onClose, blockedId, onSuccess }: BlockDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleBlock = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/safety/block', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blockedId })
            });

            if (!response.ok) throw new Error('Error al bloquear usuario');

            toast({
                title: "Usuario bloqueado",
                description: "Ya no podrán contactar ni verse en Alora.",
            });
            onClose();
            if (onSuccess) onSuccess();
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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-destructive mb-2">
                        <ShieldAlert className="h-5 w-5" />
                        <DialogTitle>¿Bloquear a este usuario?</DialogTitle>
                    </div>
                    <DialogDescription>
                        Esta acción es irreversible y definitiva. Al bloquear:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>El match se deshará inmediatamente.</li>
                            <li>Ya no podrán ver sus perfiles.</li>
                            <li>No podrán enviarse mensajes.</li>
                        </ul>
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleBlock}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Bloquear Definitivamente
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
