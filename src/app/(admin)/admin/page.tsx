"use client";

import { useEffect, useState } from "react";
import { getAdminStats, toggleShadowBan, dismissReport } from "@/server/actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldAlert, CheckCircle, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const loadStats = async () => {
        setLoading(true);
        const data = await getAdminStats();
        setStats(data);
        setLoading(false);
    };

    useEffect(() => {
        loadStats();
    }, []);

    const handleShadowBan = async (userId: string, currentStatus: boolean) => {
        const res = await toggleShadowBan(userId, !currentStatus);
        if (res.success) {
            toast({ title: "Estado actualizado", description: `Shadow ban ${!currentStatus ? 'activado' : 'desactivado'}` });
            loadStats();
        }
    };

    const handleDismiss = async (reportId: string) => {
        const res = await dismissReport(reportId);
        if (res.success) {
            toast({ title: "Reporte descartado" });
            loadStats();
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-pink-500" /></div>;

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 bg-gray-50 min-h-screen">
            <header className="flex justify-between items-center">
                <h1 className="text-3xl font-black text-gray-900 italic">Alora <span className="text-pink-500">Control Plane</span></h1>
                <Badge variant="outline" className="text-xs uppercase tracking-widest font-bold">Admin v3.9.1</Badge>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-3xl border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Usuarios</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-black">{stats?.totalUsers || 0}</p>
                    </CardContent>
                </Card>
                {/* Add more summary cards if needed */}
            </div>

            <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Reports Section */}
                <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
                    <CardHeader className="bg-white border-b border-gray-100">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <ShieldAlert className="h-5 w-5 text-rose-500" />
                            Reportes Recientes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-gray-50">
                            {stats?.reports.map((report: any) => (
                                <div key={report.id} className="p-4 flex justify-between items-start hover:bg-gray-50 transition-colors">
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold">{report.reporter?.name || report.reporter?.email} ➡️ {report.reported?.name || report.reported?.email}</p>
                                        <p className="text-xs text-muted-foreground bg-gray-100 inline-block px-2 py-0.5 rounded-full">{report.reason}</p>
                                        {report.details && <p className="text-xs italic text-gray-500 mt-1">"{report.details}"</p>}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" className="rounded-full text-rose-500" onClick={() => handleShadowBan(report.reportedId, false)}>
                                            <Shield className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="rounded-full text-gray-400" onClick={() => handleDismiss(report.id)}>
                                            <CheckCircle className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {stats?.reports.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No hay reportes pendientes</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* Low Reputation Section */}
                <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
                    <CardHeader className="bg-white border-b border-gray-100">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Shield className="h-5 w-5 text-amber-500" />
                            Alerta Reputación Baja
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-gray-50">
                            {stats?.lowRepProfiles.map((p: any) => (
                                <div key={p.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${p.reputationScore < 20 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                                            {p.reputationScore}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{p.displayName || "Usuario"}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-tight">{p.user?.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {p.isShadowBanned && <Badge className="bg-gray-900 text-white text-[10px]">Shadow Banned</Badge>}
                                        <Button
                                            variant={p.isShadowBanned ? "outline" : "destructive"}
                                            size="sm"
                                            className="rounded-full text-[10px] h-7"
                                            onClick={() => handleShadowBan(p.userId, p.isShadowBanned)}
                                        >
                                            {p.isShadowBanned ? "Quitar Ban" : "Shadow Ban"}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {stats?.lowRepProfiles.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Todos los perfiles tienen buena reputación</p>}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
