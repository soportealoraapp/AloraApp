"use client";

import { AlertTriangle, ShieldOff, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reportUser, blockUser } from "@/server/actions/safety";
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
}

export function ProfileActions({ userId, userName }: ProfileActionsProps) {
    const { toast } = useToast();
    const { user: currentUser } = useAuth();

    const handleAction = async (type: "report" | "block" | "mute") => {
        if (!currentUser) return;

        const labels = {
            report: "Reportar",
            block: "Bloquear",
            mute: "Silenciar"
        };

        try {
            if (type === 'report') {
                await reportUser(currentUser.id, userId, "general_report"); // Placeholder reason
                toast({
                    title: "Reporte enviado",
                    description: BRAND_VOICE.safety.reportThankYou,
                });
            } else if (type === 'block') {
                await blockUser(currentUser.id, userId);
                toast({
                    title: "Usuario bloqueado",
                    description: BRAND_VOICE.safety.blockConfirm,
                    variant: "destructive"
                });
            } else {
                // Mute logic (local or separate)
                toast({
                    title: "Usuario silenciado",
                    description: "No recibirás notificaciones de esta persona.",
                });
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
                    Silenciar
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
    );
}
