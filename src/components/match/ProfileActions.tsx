'use client';

import { useState } from "react";
import { AlertTriangle, ShieldOff, VolumeX } from "lucide-react";
import { MuteDialog } from "@/components/chat/MuteDialog";
import { ReportDialog } from "@/components/safety/ReportDialog";
import { BlockDialog } from "@/components/safety/BlockDialog";
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
    onBlockSuccess?: () => void;
}

export function ProfileActions({ userId, userName, matchId, isMuted = false, onMuteChange, onBlockSuccess }: ProfileActionsProps) {
    const { toast } = useToast();
    const { user: currentUser } = useAuth();
    const [showMuteDialog, setShowMute] = useState(false);
    const [showReportDialog, setShowReportDialog] = useState(false);
    const [showBlockDialog, setShowBlockDialog] = useState(false);

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

    const handleAction = (type: "report" | "block" | "mute") => {
        if (!currentUser) return;

        if (type === 'report') {
            setShowReportDialog(true);
        } else if (type === 'block') {
            setShowBlockDialog(true);
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
                    <DropdownMenuItem onClick={() => handleAction("block")} className="gap-2 cursor-pointer text-orange-600 dark:text-orange-400 focus:text-orange-600 dark:focus:text-orange-400">
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
            <ReportDialog
                isOpen={showReportDialog}
                onClose={() => setShowReportDialog(false)}
                reportedId={userId}
                matchId={matchId}
            />
            <BlockDialog
                isOpen={showBlockDialog}
                onClose={() => setShowBlockDialog(false)}
                blockedId={userId}
                onSuccess={() => {
                    setShowBlockDialog(false);
                    onBlockSuccess?.();
                }}
            />
        </>
    );
}
