'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Brain, Battery, Heart } from "lucide-react";

interface WellbeingStats {
    batteryLevel: number;
    recentEvents: any[];
}

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { trackEvent } from "@/lib/tracking/client";

import * as React from 'react';

function WellbeingDashboardComponent({ stats, onRefresh, userId }: { stats: WellbeingStats; onRefresh?: () => void; userId?: string }) {
    const getBatteryColor = (level: number) => {
        if (level > 70) return "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]";
        if (level > 30) return "bg-yellow-500";
        return "bg-red-500 animate-pulse";
    };

    const handleRefresh = () => {
        if (userId) trackEvent('WELLBEING_REFRESH', { userId });
        onRefresh?.();
    }

    return (
        <TooltipProvider>
            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                            Wellbeing Monitor
                            <Badge variant="outline" className="text-xs font-normal bg-background/50">Live</Badge>
                        </h2>
                        <p className="text-xs text-muted-foreground">Real-time emotional and social health tracking.</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleRefresh} className="hover:bg-muted/50 active:rotate-180 transition-transform duration-500">
                        <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="hover:border-primary/20 transition-colors hover:shadow-md cursor-default">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Tooltip>
                                <TooltipTrigger className="cursor-help">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-sm font-medium">Social Battery</CardTitle>
                                        <Battery className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>Energy available for social interactions.</TooltipContent>
                            </Tooltip>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tracking-tight">{stats.batteryLevel}%</div>
                            <Progress value={stats.batteryLevel} className={`mt-2 h-2 ${getBatteryColor(stats.batteryLevel)}`} />
                            <p className="text-xs text-muted-foreground mt-2 font-medium">
                                {stats.batteryLevel > 70 ? "⚡ Charged & Ready" : "⚠️ Needs Recharge"}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="hover:border-primary/20 transition-colors hover:shadow-md cursor-default">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Tooltip>
                                <TooltipTrigger className="cursor-help">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-sm font-medium">Emotional Clarity</CardTitle>
                                        <Heart className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>Stability of emotional sentiment in chats.</TooltipContent>
                            </Tooltip>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-sky-500">Stable</div>
                            <p className="text-xs text-muted-foreground mt-2">Consistent sentiment patterns.</p>
                        </CardContent>
                    </Card>

                    <Card className="hover:border-primary/20 transition-colors hover:shadow-md cursor-default">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Tooltip>
                                <TooltipTrigger className="cursor-help">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-sm font-medium">Mindset</CardTitle>
                                        <Brain className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>Growth vs Fixed mindset detection.</TooltipContent>
                            </Tooltip>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-500">Growth</div>
                            <p className="text-xs text-muted-foreground mt-2">+2 learning moments this week.</p>
                        </CardContent>
                    </Card>
                </div>

                {stats.batteryLevel < 30 && (
                    <Alert variant="destructive" className="border-red-500/50 bg-red-500/10 animate-pulse">
                        <Battery className="h-4 w-4" />
                        <AlertTitle>Recharge Recommended</AlertTitle>
                        <AlertDescription className="flex flex-col gap-2">
                            <span className="text-xs opacity-90">
                                You seem a bit drained. Alora recommends taking a break from swiping for 24 hours.
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-fit h-7 text-xs bg-transparent border-red-500/30 hover:bg-red-500/20"
                                onClick={() => userId && trackEvent('WELLBEING_ACTION_BREAK', { userId })}
                            >
                                Schedule a Break
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Recent Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.recentEvents.length === 0 && <p className="text-muted-foreground text-sm italic">No significant events tracked yet.</p>}
                            {stats.recentEvents.map(event => (
                                <div key={event.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0 hover:bg-muted/30 p-2 rounded-md transition-colors -mx-2">
                                    <div className="space-y-1">
                                        <p className="font-medium text-sm capitalize flex items-center gap-2">
                                            {event.type.replace('_', ' ')}
                                            {event.severity === 'high' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                    <Badge variant={event.severity === 'high' ? 'destructive' : 'secondary'} className="text-xs capitalize">
                                        {event.severity} Impact
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </TooltipProvider>
    );
    );
}

export const WellbeingDashboard = React.memo(WellbeingDashboardComponent);
