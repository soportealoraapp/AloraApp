"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { preferencesService } from "@/lib/preferences-service";
import { setVerifiedOnlyFilter } from "@/server/actions/user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Shield, Eye, EyeOff, Loader2, AlertTriangle, Key, Trash2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { UpgradePrompt } from "@/components/premium/UpgradePrompt";
import { PlusBadge } from "@/components/premium/PlusBadge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function PrivacySettingsPage() {
    const router = useRouter();
    const { user, profile, signOut } = useAuth();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [incognitoMode, setIncognitoMode] = useState(false);
    const [showMe, setShowMe] = useState(true);
    const [verifiedOnly, setVerifiedOnly] = useState(true);

    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [deleteStep2Open, setDeleteStep2Open] = useState(false);

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) {
            toast({ title: "Campos requeridos", description: "Completa todos los campos.", variant: "destructive" });
            return;
        }
        if (newPassword.length < 6) {
            toast({ title: "Contraseña muy corta", description: "Mínimo 6 caracteres.", variant: "destructive" });
            return;
        }
        if (newPassword !== confirmPassword) {
            toast({ title: "Las contraseñas no coinciden", description: "Verifica la confirmación.", variant: "destructive" });
            return;
        }

        setChangingPassword(true);
        try {
            const supabase = createClient();
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user?.email || "",
                password: currentPassword,
            });
            if (signInError) {
                toast({ title: "Contraseña actual incorrecta", variant: "destructive" });
                setChangingPassword(false);
                return;
            }
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            toast({ title: "Contraseña actualizada", description: "Usa tu nueva contraseña en el próximo inicio de sesión." });
            setPasswordDialogOpen(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch {
            toast({ title: "Error", description: "No se pudo cambiar la contraseña.", variant: "destructive" });
        } finally {
            setChangingPassword(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== "ELIMINAR") {
            toast({ title: "Confirmación requerida", description: "Escribe ELIMINAR para confirmar.", variant: "destructive" });
            return;
        }
        setDeleting(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.rpc('delete_user_account', { user_id: user?.id });
            if (error) {
                const res = await fetch('/api/user/delete', { method: 'POST' });
                if (!res.ok) throw new Error('delete failed');
            }
            await signOut();
            router.push('/login');
            toast({ title: "Cuenta eliminada", description: "Sentimos verte ir." });
        } catch {
            toast({ title: "Error", description: "No se pudo eliminar la cuenta. Contacta a soporte.", variant: "destructive" });
            setDeleting(false);
        }
    };

    useEffect(() => {
        async function loadPreferences() {
            if (!user) return;

            try {
                const prefs = await preferencesService.getPreferences(user.id);
                setIncognitoMode(prefs.incognito);
                setShowMe(prefs.showMe);
                setVerifiedOnly(!!(prefs as { verifiedOnly?: boolean }).verifiedOnly);
            } catch (error) {
                console.error("Error loading preferences:", error);
            } finally {
                setLoading(false);
            }
        }

        loadPreferences();
    }, [user]);

    const handleToggleIncognito = async (value: boolean) => {
        if (!user) return;

        setSaving(true);
        try {
            await preferencesService.toggleIncognito(user.id);
            setIncognitoMode(value);

            toast({
                title: value ? "Modo Incógnito Activado" : "Modo Incógnito Desactivado",
                description: value
                    ? "Tu perfil no aparecerá en descubrir"
                    : "Tu perfil será visible en descubrir",
            });
        } catch (error) {
            console.error("Error toggling incognito:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo cambiar el modo incógnito",
            });
            setIncognitoMode(!value);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleShowMe = async (value: boolean) => {
        if (!user) return;

        setSaving(true);
        try {
            await preferencesService.toggleShowMe(user.id);
            setShowMe(value);

            toast({
                title: value ? "Perfil Visible" : "Perfil Oculto",
                description: value
                    ? "Aparecerás en la sección descubrir"
                    : "No aparecerás en descubrir",
            });
        } catch (error) {
            console.error("Error toggling show me:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo cambiar la visibilidad",
            });
            setShowMe(!value);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleVerifiedOnly = async (value: boolean) => {
        if (!user) return;

        setSaving(true);
        try {
            const result = await setVerifiedOnlyFilter(user.id, value);
            if (!result.success) throw new Error(result.error || 'toggle failed');
            setVerifiedOnly(value);

            toast({
                title: value ? "Solo Verificados" : "Todos los Perfiles",
                description: value
                    ? "Solo verás perfiles verificados en Descubrir"
                    : "Verás todos los perfiles en Descubrir",
            });
        } catch (error) {
            console.error("Error toggling verified only:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo cambiar la preferencia",
            });
            setVerifiedOnly(!value);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div>
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 pt-safe">
                    <Skeleton className="h-8 w-48" />
                </header>
                <main className="p-4 space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
                </main>
            </div>
        );
    }

    return (
        <div className="h-dvh overflow-y-auto">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 pt-safe">
                <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Volver">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-semibold md:text-2xl font-headline">
                    Privacidad y Seguridad
                </h1>
            </header>

            <main className="p-4 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Visibilidad del Perfil
                        </CardTitle>
                        <CardDescription>
                            Controla quién puede verte en Alora
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    <p className="font-medium">Modo Incógnito</p>
                                    <PlusBadge label="Plus" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Tu perfil no aparecerá en descubrir, solo tus matches actuales te verán
                                </p>
                            </div>
                            <Switch
                                checked={incognitoMode}
                                onCheckedChange={handleToggleIncognito}
                                disabled={saving || profile?.subscriptionStatus !== 'plus'}
                            />
                        </div>

                        {user && profile?.subscriptionStatus !== 'plus' && (
                            <UpgradePrompt trigger="incognito" />
                        )}

                        {user && profile?.subscriptionStatus === 'plus' && incognitoMode && (
                            <p className="text-xs text-muted-foreground italic px-1">
                                El Modo Incógnito está activo. "Mostrar mi perfil en Descubrir" está desactivado mientras dure.
                            </p>
                        )}

                        <div className={cn(
                            "flex items-center justify-between p-3 rounded-lg border",
                            profile?.subscriptionStatus === 'plus' && incognitoMode && "opacity-50 pointer-events-none"
                        )}>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                    <p className="font-medium">Mostrar mi perfil en Descubrir</p>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Aparecer en la sección de descubrir para que otros te encuentren
                                </p>
                            </div>
                            <Switch
                                checked={showMe}
                                onCheckedChange={handleToggleShowMe}
                                disabled={saving || (profile?.subscriptionStatus === 'plus' && incognitoMode)}
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                    <p className="font-medium">Solo mostrar perfiles verificados</p>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Solo ver perfiles con verificación de identidad
                                </p>
                            </div>
                            <Switch
                                checked={verifiedOnly}
                                onCheckedChange={handleToggleVerifiedOnly}
                                disabled={saving}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Gestionar Privacidad</CardTitle>
                        <CardDescription>
                            Administra tus bloqueos y perfiles ocultos
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Link href="/settings/privacy/blocked">
                            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
                                <div>
                                    <p className="font-medium">Usuarios Bloqueados</p>
                                    <p className="text-sm text-muted-foreground">
                                        Ver y gestionar usuarios que bloqueaste
                                    </p>
                                </div>
                                <ArrowLeft className="h-5 w-5 rotate-180 text-muted-foreground" />
                            </div>
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-destructive">Zona Peligrosa</CardTitle>
                        <CardDescription>
                            Acciones irreversibles
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-full justify-start">
                                    <Key className="h-4 w-4 mr-2" />
                                    Cambiar Contraseña
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Cambiar Contraseña</DialogTitle>
                                    <DialogDescription>Ingresa tu contraseña actual y una nueva.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="current-password">Contraseña Actual</Label>
                                        <Input id="current-password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} disabled={changingPassword} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new-password">Nueva Contraseña</Label>
                                        <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} disabled={changingPassword} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
                                        <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={changingPassword} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => { setPasswordDialogOpen(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }} disabled={changingPassword}>Cancelar</Button>
                                    <Button onClick={handleChangePassword} disabled={changingPassword}>
                                        {changingPassword ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Cambiando...</> : "Cambiar Contraseña"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="destructive" className="w-full">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar Cuenta
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-destructive">
                                        <AlertTriangle className="h-5 w-5" />
                                        Eliminar Cuenta
                                    </DialogTitle>
                                    <DialogDescription>
                                        Esta acción es irreversible. Se eliminarán tu perfil, fotos, mensajes y conexiones.
                                        No podrás recuperar tu cuenta.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="bg-destructive/10 p-4 rounded-lg text-sm text-destructive">
                                        <p className="font-medium">Lo que se eliminará:</p>
                                        <ul className="list-disc pl-4 mt-2 space-y-1 text-muted-foreground">
                                            <li>Perfil y fotos</li>
                                            <li>Mensajes y conversaciones</li>
                                            <li>Conexiones</li>
                                            <li>Preferencias y ajustes</li>
                                        </ul>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Escribe <span className="font-bold">ELIMINAR</span> para confirmar</Label>
                                        <Input value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder="ELIMINAR" disabled={deleting} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setDeleteConfirmText(""); }} disabled={deleting}>Cancelar</Button>
                                    <Button variant="destructive" onClick={() => { setDeleteDialogOpen(false); setDeleteStep2Open(true); }} disabled={deleting || deleteConfirmText !== "ELIMINAR"}>
                                        Continuar
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={deleteStep2Open} onOpenChange={setDeleteStep2Open}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-destructive">
                                        <AlertTriangle className="h-5 w-5" />
                                        ¿Estás absolutamente seguro?
                                    </DialogTitle>
                                    <DialogDescription>
                                        Esta es tu última oportunidad para cancelar. Una vez eliminada tu cuenta, no habrá forma de recuperar tus datos.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                    <div className="bg-destructive/10 p-4 rounded-lg text-sm text-destructive">
                                        <p className="font-medium">Se eliminarán permanentemente:</p>
                                        <ul className="list-disc pl-4 mt-2 space-y-1 text-muted-foreground">
                                            <li>Tu perfil y todas tus fotos</li>
                                            <li>Todos tus mensajes y conversaciones</li>
                                            <li>Tus matches y conexiones</li>
                                            <li>Tus preferencias, ajustes y racha</li>
                                        </ul>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setDeleteStep2Open(false)} disabled={deleting}>Cancelar</Button>
                                    <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleting}>
                                        {deleting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Eliminando...</> : "Sí, eliminar mi cuenta"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>

                {saving && (
                    <div className="fixed bottom-20 right-4 bg-background border rounded-lg p-3 shadow-lg flex items-center gap-2 z-40 pb-safe">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <p className="text-sm">Guardando cambios...</p>
                    </div>
                )}
            </main>
        </div>
    );
}
