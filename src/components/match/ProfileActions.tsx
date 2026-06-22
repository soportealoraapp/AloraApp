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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { MoreVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const REPORT_CATEGORIES = [
    { value: 'spam', label: 'Spam o contenido no deseado' },
    { value: 'harassment', label: 'Acoso o intimidación' },
    { value: 'offensive_language', label: 'Lenguaje ofensivo' },
    { value: 'sexual_content', label: 'Contenido sexual no deseado' },
    { value: 'impersonation', label: 'Suplantación de identidad' },
    { value: 'fake_identity', label: 'Identidad falsa' },
    { value: 'violence', label: 'Amenazas o violencia' },
    { value: 'minor', label: 'Menor de edad' },
    { value: 'other', label: 'Otro motivo' },
] as const;

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
    const [showReportDialog, setShowReportDialog] = useState(false);
    const [showBlockConfirm, setShowBlockConfirm] = useState(false);

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

    const handleReport = async (category: string) => {
        if (!currentUser) return;

        try {
            const res = await fetch('/api/safety/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportedId: userId, category })
            });
            if (!res.ok) throw new Error('Error al enviar reporte');
            toast({
                title: "Reporte enviado",
                description: BRAND_VOICE.safety.reportThankYou,
            });
            setShowReportDialog(false);
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo enviar el reporte. Inténtalo de nuevo.",
                variant: "destructive"
            });
        }
    };

    const handleAction = async (type: "report" | "block" | "mute") => {
        if (!currentUser) return;

        if (type === 'report') {
            setShowReportDialog(true);
        } else if (type === 'block') {
            setShowBlockConfirm(true);
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

    const handleConfirmBlock = async () => {
        if (!currentUser) return;
        setShowBlockConfirm(false);
        try {
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
            <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>¿Por qué reportas a {userName}?</DialogTitle>
                        <DialogDescription>
                            Selecciona el motivo de tu reporte. Esto nos ayuda a mantener la comunidad segura.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                        {REPORT_CATEGORIES.map((cat) => (
                            <Button
                                key={cat.value}
                                variant="outline"
                                className="w-full justify-start text-left h-auto py-3"
                                onClick={() => handleReport(cat.value)}
                            >
                                {cat.label}
                            </Button>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowReportDialog(false)}>
                            Cancelar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={showBlockConfirm} onOpenChange={setShowBlockConfirm}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>¿Bloquear a {userName}?</DialogTitle>
                        <DialogDescription>
                            {userName} no podrá ver tu perfil ni enviarte mensajes. Esta acción se puede revertir desde Ajustes.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setShowBlockConfirm(false)}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmBlock}>
                            Bloquear
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
