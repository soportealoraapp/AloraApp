'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BellOff, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MuteDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onMute: (duration: number | null) => void;
    isMuted: boolean;
}

const MUTE_OPTIONS = [
    { label: '1 hora', duration: 1 * 60 * 60 * 1000, icon: Clock },
    { label: '8 horas', duration: 8 * 60 * 60 * 1000, icon: Clock },
    { label: '24 horas', duration: 24 * 60 * 60 * 1000, icon: Clock },
    { label: 'Siempre', duration: null, icon: BellOff },
];

export function MuteDialog({ isOpen, onClose, onMute, isMuted }: MuteDialogProps) {
    const [selectedDuration, setSelectedDuration] = useState<number | null>(null);

    const handleMute = () => {
        onMute(selectedDuration);
        onClose();
    };

    const handleUnmute = () => {
        onMute(-1);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BellOff className="h-5 w-5" />
                        {isMuted ? 'Gestionar silencio' : 'Silenciar conversación'}
                    </DialogTitle>
                    <DialogDescription className="sr-only">Silenciar notificaciones de esta conversación</DialogDescription>
                </DialogHeader>

                {isMuted ? (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Esta conversación está silenciada. No recibirás notificaciones de nuevos mensajes.
                        </p>
                        <Button onClick={handleUnmute} className="w-full">
                            Activar notificaciones
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {MUTE_OPTIONS.map((option) => (
                            <button
                                key={option.label}
                                onClick={() => setSelectedDuration(option.duration)}
                                className={cn(
                                    "w-full flex items-center gap-3 p-3 rounded-lg border transition-colors",
                                    selectedDuration === option.duration
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:bg-muted/50"
                                )}
                            >
                                <option.icon className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-sm">{option.label}</span>
                            </button>
                        ))}
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    {!isMuted && (
                        <Button onClick={handleMute} disabled={selectedDuration === null}>
                            Silenciar
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
