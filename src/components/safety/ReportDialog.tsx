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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Loader2 } from 'lucide-react';

interface ReportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    reportedId: string;
    matchId?: string;
    messageIds?: string[];
}

export function ReportDialog({ isOpen, onClose, reportedId, matchId, messageIds }: ReportDialogProps) {
    const [category, setCategory] = useState<string>('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async () => {
        if (!category) return;

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/safety/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportedId,
                    category,
                    matchId,
                    messageIds,
                    description
                })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Error al enviar el reporte');

            toast({
                title: "Reporte enviado",
                description: "Gracias por ayudarnos a mantener Alora segura.",
            });
            onClose();
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
            <DialogContent className="sm:max-w-[425px] max-w-[95vw]">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-destructive mb-2">
                        <AlertCircle className="h-5 w-5" />
                        <DialogTitle>Reportar Usuario</DialogTitle>
                    </div>
                    <DialogDescription>
                        Dinos qué ha sucedido. Tu reporte es anónimo y será revisado por nuestro equipo.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="category">¿Cuál es el motivo?</Label>
                        <Select onValueChange={setCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="harassment">Acoso o comportamiento abusivo</SelectItem>
                                <SelectItem value="offensive_language">Lenguaje ofensivo</SelectItem>
                                <SelectItem value="sexual_content">Contenido sexual inapropiado</SelectItem>
                                <SelectItem value="impersonation">Suplantación de identidad</SelectItem>
                                <SelectItem value="spam_fraud">Spam o fraude</SelectItem>
                                <SelectItem value="minor">Menor de edad</SelectItem>
                                <SelectItem value="violence">Violencia</SelectItem>
                                <SelectItem value="fake_identity">Identidad falsa</SelectItem>
                                <SelectItem value="other">Otro motivo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Detalles adicionales (opcional)</Label>
                        <Textarea
                            id="description"
                            placeholder="Danos más contexto sobre lo ocurrido..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleSubmit}
                        disabled={!category || isSubmitting}
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Enviar Reporte
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
