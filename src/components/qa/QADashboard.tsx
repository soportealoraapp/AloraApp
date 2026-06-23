'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    Smartphone,
    Monitor,
    Tablet,
    MessageSquare,
    ShieldCheck,
    Heart,
    Zap,
    Lock,
    ArrowRight,
    RefreshCw,
    Eye,
    Terminal,
    Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { GlowInput } from "@/components/ui/premium/GlowInput";
import { Input } from "@/components/ui/input";

// --- Types ---
interface QAEvent {
    id: string;
    name: string;
    details: any;
    timestamp: string;
}

// --- Dashboard Component ---
export default function QADashboard() {
    const [events, setEvents] = React.useState<QAEvent[]>([]);
    const [batteryLevel, setBatteryLevel] = React.useState(75);
    const [isA11yVisible, setIsA11yVisible] = React.useState(false);
    const [clickCount, setClickCount] = React.useState(0);
    const [isShaking, setIsShaking] = React.useState(false);

    const logEvent = (name: string, details: any = {}) => {
        const newEvent = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            details,
            timestamp: new Date().toLocaleTimeString()
        };
        setEvents(prev => [newEvent, ...prev].slice(0, 10));
    };

    const handleRapidClick = () => {
        setClickCount(prev => {
            const next = prev + 1;
            if (next >= 5) {
                setIsShaking(true);
                logEvent('RISK_FLAG_EXCESSIVE_CLICKS', { count: next });
                setTimeout(() => setIsShaking(false), 500);
                return 0;
            }
            logEvent('PREMIUM_GATE_CLICK', { count: next });
            return next;
        });
    };

    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            {/* Header */}
            <header className="border-b bg-background/80 backdrop-blur-md p-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-xl">
                        <Activity className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Alora QA Dashboard</h1>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Version 3.7.0 Premium Polish</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsA11yVisible(!isA11yVisible)} className={cn(isA11yVisible && "bg-primary/20 text-primary border-primary")}>
                        <Eye className="mr-2 h-4 w-4" /> A11y Audit
                    </Button>
                    <Button variant="default" size="sm" className="bg-primary shadow-lg hover:shadow-primary/20" onClick={() => {
                        const report = { timestamp: new Date().toISOString(), version: '3.7.0', status: 'audit-complete' };
                        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = `alora-qa-report-${Date.now()}.json`; a.click();
                        URL.revokeObjectURL(url);
                    }}>
                        <Download className="mr-2 h-4 w-4" /> Export Report
                    </Button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-6 space-y-8">
                    <Tabs defaultValue="onboarding" className="w-full">
                        <TabsList className="bg-muted border p-1 rounded-2xl h-12 mb-8 inline-flex">
                            <TabsTrigger value="onboarding" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all px-6">Onboarding</TabsTrigger>
                            <TabsTrigger value="premium" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all px-6">Premium Gate</TabsTrigger>
                            <TabsTrigger value="wellbeing" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all px-6">Wellbeing</TabsTrigger>
                            <TabsTrigger value="chat" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all px-6">AI Chat</TabsTrigger>
                        </TabsList>

                        {/* --- ONBOARDING TAB --- */}
                        <TabsContent value="onboarding" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="rounded-3xl border-none shadow-xl shadow-pink-100/50">
                                    <CardHeader>
                                        <CardTitle>Micro-Feedback & Interaction</CardTitle>
                                        <CardDescription>Verify input glow and button animations</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-2 relative">
                                            <label className="text-xs font-bold uppercase text-muted-foreground">GlowInput Test</label>
                                            <GlowInput>
                                                <Input placeholder="Escribe algo para ver el brillo..." className="rounded-xl border-pink-100" />
                                            </GlowInput>
                                            {isA11yVisible && <Badge className="absolute -top-2 -right-2 bg-blue-500">aria-label: OK</Badge>}
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="space-y-2 flex-1 relative">
                                                <label className="text-xs font-bold uppercase text-muted-foreground">Active Button</label>
                                                <Button
                                                    className="w-full rounded-xl hover:scale-105 active:scale-95 transition-transform"
                                                    onClick={() => logEvent('REGISTRATION_STEP_COMPLETED', { step: 1 })}
                                                >
                                                    Continuar <ArrowRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="space-y-2 flex-1">
                                                <label className="text-xs font-bold uppercase text-muted-foreground">Disabled State</label>
                                                <Button disabled className="w-full rounded-xl opacity-50 grayscale cursor-not-allowed">Bloqueado</Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="rounded-3xl border-none shadow-xl shadow-pink-100/50">
                                    <CardHeader>
                                        <CardTitle>Onboarding logic</CardTitle>
                                        <CardDescription>Funnel transition and verification skip</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="p-4 bg-muted rounded-2xl flex flex-col items-center gap-4 text-center border border-dashed border-primary/20">
                                            <ShieldCheck className="h-10 w-10 text-primary" />
                                            <div>
                                                <p className="font-bold">Verificación de Identidad</p>
                                                <p className="text-xs text-muted-foreground">Paso final opcional para usuarios no premium</p>
                                            </div>
                                            <button
                                                onClick={() => logEvent('REGISTRATION_STEP_COMPLETED', { step: 4, skipped: true })}
                                                className="text-sm text-primary underline decoration-dotted hover:text-primary/80 transition-colors"
                                            >
                                                Lo haré más tarde
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-center text-xs font-mono bg-black/5 p-3 rounded-xl">
                                            <span>funnel_v3.6.0_active</span>
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* --- PREMIUM TAB --- */}
                        <TabsContent value="premium" className="space-y-6">
                            <Card className="rounded-3xl border-none shadow-xl shadow-pink-100/50 max-w-2xl mx-auto overflow-hidden">
                                <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-8 flex flex-col items-center text-center gap-6 relative">
                                    <div className={cn(
                                        "w-full max-w-sm bg-card p-8 rounded-3xl shadow-2xl transition-all duration-500 border-2 border-dashed",
                                        isShaking ? "animate-shake border-red-500 shadow-red-100" : "border-primary/20 hover:border-primary/50"
                                    )}>
                                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Lock className="h-8 w-8 text-primary" />
                                        </div>
                                        <div className="grayscale opacity-50 blur-[2px] pointer-events-none mb-6">
                                            <p className="text-xs">Mock premium content</p>
                                        </div>
                                        <Button
                                            onClick={handleRapidClick}
                                            className="w-full rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                                        >
                                            <Zap className="mr-2 h-4 w-4" /> Desbloquear Premium
                                        </Button>
                                        {isShaking && (
                                            <p className="text-xs text-red-500 mt-2 font-bold animate-pulse">¡Demasiados intentos! (Spam Detected)</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-bold">PremiumFeatureGate Tester</h3>
                                        <p className="text-sm text-muted-foreground">Prueba la animación de "shake" haciendo click rápido.</p>
                                    </div>
                                </div>
                            </Card>
                        </TabsContent>

                        {/* --- WELLBEING TAB --- */}
                        <TabsContent value="wellbeing" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="rounded-3xl border-none shadow-xl shadow-pink-100/50">
                                    <CardHeader>
                                        <CardTitle>Social Battery Simulator</CardTitle>
                                        <CardDescription>Toggle levels to verify color transitions</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-8">
                                        <div className="flex justify-between gap-2">
                                            <Button variant="outline" size="sm" onClick={() => setBatteryLevel(10)} className="flex-1 rounded-xl border-red-200 text-red-600 hover:bg-red-50">Low (10%)</Button>
                                            <Button variant="outline" size="sm" onClick={() => setBatteryLevel(50)} className="flex-1 rounded-xl border-yellow-200 text-yellow-600 hover:bg-yellow-50">Mid (50%)</Button>
                                            <Button variant="outline" size="sm" onClick={() => setBatteryLevel(90)} className="flex-1 rounded-xl border-green-200 text-green-600 hover:bg-green-50">Full (90%)</Button>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <span className="text-2xl font-black">{batteryLevel}%</span>
                                                <Badge variant="secondary" className={cn(
                                                    "rounded-lg",
                                                    batteryLevel < 30 ? "bg-red-100 text-red-700" : batteryLevel < 70 ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                                                )}>
                                                    {batteryLevel < 30 ? "Recharge Necessary" : "Status Healthy"}
                                                </Badge>
                                            </div>
                                            <Progress
                                                value={batteryLevel}
                                                className={cn(
                                                    "h-4 rounded-full",
                                                    batteryLevel < 30 ? "bg-red-500" : batteryLevel < 70 ? "bg-yellow-500" : "bg-green-500"
                                                )}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="rounded-3xl border-none shadow-xl shadow-pink-100/50">
                                    <CardHeader>
                                        <CardTitle>Dashboard Interactions</CardTitle>
                                        <CardDescription>Hover-lift and tooltips validation</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <TooltipProvider>
                                            <div className="grid grid-cols-2 gap-4">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="p-4 bg-muted rounded-2xl cursor-help hover:-translate-y-2 transition-transform duration-300 shadow-sm hover:shadow-md border border-white">
                                                            <Heart className="h-6 w-6 text-primary mb-2" />
                                                            <p className="font-bold">Emotional</p>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Mental health interaction verified</TooltipContent>
                                                </Tooltip>

                                                <div
                                                    className="p-4 bg-muted rounded-2xl cursor-pointer hover:-translate-y-2 transition-transform duration-300 shadow-sm hover:shadow-md border border-white"
                                                    onClick={() => logEvent('WELLBEING_REFRESH')}
                                                >
                                                    <RefreshCw className="h-6 w-6 text-blue-500 mb-2" />
                                                    <p className="font-bold">Refresh Data</p>
                                                </div>
                                            </div>
                                        </TooltipProvider>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* --- CHAT TAB --- */}
                        <TabsContent value="chat" className="space-y-6">
                            <Card className="rounded-3xl border-none shadow-xl shadow-pink-100/50 overflow-hidden">
                                <div className="bg-card p-4 h-[400px] flex flex-col">
                                    <div className="flex-1 space-y-4 p-4 overflow-y-auto">
                                        <AnimatePresence>
                                            <motion.div
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="bg-muted p-3 py-2 rounded-2xl rounded-bl-sm max-w-[80%] text-sm"
                                            >
                                                ¡Hola! Soy tu AI Coach. ¿En qué puedo ayudarte hoy?
                                            </motion.div>

                                            <motion.div
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.5 }}
                                                className="bg-primary text-white p-3 py-2 rounded-2xl rounded-br-sm max-w-[80%] self-end ml-auto text-sm shadow-lg shadow-primary/20"
                                            >
                                                Quiero mejorar mis fotos de perfil.
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>
                                    <div className="border-t p-4 flex gap-2">
                                        <Input placeholder="Simular mensaje..." className="rounded-xl border-pink-50" />
                                        <Button
                                            className="rounded-xl bg-primary h-10 w-10 p-0"
                                            onClick={() => logEvent('AI_COACH_MESSAGE')}
                                        >
                                            <Zap className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="bg-muted/50 p-3 flex justify-between items-center px-6">
                                    <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                                        <span className="flex items-center gap-1"><Badge variant="outline" className="text-[11px] h-4">Virtualization</Badge> Enabled</span>
                                        <span className="flex items-center gap-1"><Badge variant="outline" className="text-[11px] h-4">History</Badge> 500+ Messages</span>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => logEvent('QA_SIMULATE_LOAD_MORE')}>
                                        Simulate Load More
                                    </Button>
                                </div>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {/* Device Simulators & Design System Checks */}
                    <section className="pt-8 border-t">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <h2 className="text-lg font-bold">Responsive & Design System</h2>
                                <p className="text-sm text-muted-foreground">Audit colors and breakpoint transitions</p>
                            </div>
                            <div className="flex gap-2">
                                <TooltipProvider>
                                    <Tooltip><TooltipTrigger asChild><Button variant="secondary" size="icon" className="rounded-xl"><Smartphone className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Mobile (375px)</TooltipContent></Tooltip>
                                    <Tooltip><TooltipTrigger asChild><Button variant="secondary" size="icon" className="rounded-xl"><Tablet className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Tablet (768px)</TooltipContent></Tooltip>
                                    <Tooltip><TooltipTrigger asChild><Button variant="secondary" size="icon" className="rounded-xl"><Monitor className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Desktop (1280px)</TooltipContent></Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-4">
                            <div className="bg-primary w-12 h-12 rounded-2xl shadow-lg ring-4 ring-primary/10" />
                                        <div className="bg-background border w-12 h-12 rounded-2xl" />
                            <div className="bg-muted w-12 h-12 rounded-2xl" />
                            <div className="bg-card border-4 border-primary/20 w-12 h-12 rounded-2xl" />
                        </div>
                    </section>
                </main>

                {/* Sidebar Log Panel */}
                <aside className="w-80 border-l bg-card flex flex-col">
                    <div className="p-4 border-b flex items-center justify-between">
                        <h2 className="font-bold flex items-center gap-2">
                            <Terminal className="h-4 w-4 text-primary" /> Event Explorer
                        </h2>
                        <Badge className="bg-green-500/10 text-green-600 border-green-200">Live</Badge>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono">
                        {events.length === 0 && (
                            <div className="text-center py-20 opacity-30 italic text-sm">
                                Waiting for interactions...
                            </div>
                        )}
                        {events.map(event => (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-3 bg-muted/50 rounded-xl text-xs border border-transparent hover:border-primary/20 transition-colors"
                            >
                                <div className="flex justify-between font-black text-primary uppercase mb-1">
                                    <span>{event.name}</span>
                                    <span className="opacity-50 font-normal">{event.timestamp}</span>
                                </div>
                                <pre className="text-muted-foreground break-all whitespace-pre-wrap">
                                    {JSON.stringify(event.details, null, 2)}
                                </pre>
                            </motion.div>
                        ))}
                    </div>
                    <div className="p-4 border-t bg-muted/20">
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest text-center">QA Automation Ready</p>
                    </div>
                </aside>
            </div>
        </div>
    );
}
