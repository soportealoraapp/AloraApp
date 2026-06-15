"use client";

import { useState } from "react";
import { AlertTriangle, ShieldOff, VolumeX } from "lucide-react";
import { MuteDialog } from "@/components/chat/MuteDialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { BRAND_VOICE } from "@/lib/constants/brand-voice";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProfileActionsProps {
    userId: string;
    userName: string;
    matchId?: string;
    isMuted?: boolean;
    onMuteChange?: () => void;
}

export function ProfileActions({ userId, userName, matchId, isMuted = false, onMuteChange }: ProfileActionsProps) {
    const { toast } = useToast();
    const { user: currentUser } = useAuth();
    const [showMuteDialog, setShowMute] = useState(false);

    const handleMute = async (duration: number | null) => {
        if (!currentUser || !matchId) return;

        try {
            const res = await fetch('/api/chat/mute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId, duration })
            });

            if (!res.ok) throw new Error('Failed to mute');

            toast({
                title: duration === -1 ? "Notificaciones activadas" : "Conversación silenciada",
                description: duration === -1 
                    ? "Recibirás notificaciones de nuevos mensajes." 
                    : "No recibirás notificaciones de esta persona.",
            });
            onMuteChange?.();
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo silenciar la conversación.",
                variant: "destructive"
            });
        }
    };

    const handleAction = async (type: "report" | "block" | "mute") => {
        if (!currentUser) return;

        try {
            if (type === 'report') {
                const res = await fetch('/api/safety/report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reportedId: userId, category: 'other' })
                });
                if (!res.ok) throw new Error('Error al enviar reporte');
                toast({
                    title: "Reporte enviado",
                    description: BRAND_VOICE.safety.reportThankYou,
                });
            } else if (type === 'block') {
                const res = await fetch('/api/safety/block', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ blockedId: userId })
                });
                if (!res.ok) throw new Error('Error al bloquear usuario');
                toast({
                    title: "Usuario bloqueado",
                    description: BRAND_VOICE.safety.blockConfirm,
                    variant: "destructive"
                });
            } else {
                if (!matchId) {
                    toast({
                        title: "Sin conversación activa",
                        description: "No hay una conversación activa para silenciar.",
                        variant: "destructive"
                    });
                    return;
                }
                setShowMute(true);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo procesar la acción. Inténtalo de nuevo.",
                variant: "destructive"
            });
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <MoreVertical className="h-5 w-5 text-muted-foreground" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[180px] rounded-2xl">
                    <DropdownMenuLabel>Seguridad</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleAction("mute")} className="gap-2 cursor-pointer">
                        <VolumeX className="h-4 w-4" />
                        {isMuted ? "Gestionar silencio" : "Silenciar"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAction("block")} className="gap-2 cursor-pointer text-orange-600 focus:text-orange-600">
                        <ShieldOff className="h-4 w-4" />
                        Bloquear
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleAction("report")} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        Reportar Perfil
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <MuteDialog
                isOpen={showMuteDialog}
                onClose={() => setShowMute(false)}
                onMute={handleMute}
                isMuted={isMuted}
            />
        </>
    );
}
