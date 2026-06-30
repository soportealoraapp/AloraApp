'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Loader2, FileText } from 'lucide-react';
import { SectionTitle } from '@/components/ui/custom/SectionTitle';

interface GoNoGoData {
    verdict: string;
    score: number;
    criteria: { name: string; value: string; threshold: string; passed: boolean }[];
    summary: string;
    recommendations: string[];
}

export default function GoNoGoPage() {
    const [data, setData] = useState<GoNoGoData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/go-no-go')
            .then(r => r.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="md:pl-60 p-6 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!data) {
        return <div className="md:pl-60 p-6">No se pudieron generar los datos</div>;
    }

    const verdictConfig = {
        GO: { color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', icon: CheckCircle, label: 'LISTO PARA BETA PÚBLICA' },
        'NO-GO': { color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', icon: XCircle, label: 'NO LISTO' },
        CONDITIONAL: { color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400', icon: AlertTriangle, label: 'CONDICIONAL' },
    };

    const config = verdictConfig[data.verdict as keyof typeof verdictConfig] || verdictConfig['NO-GO'];
    const Icon = config.icon;

    return (
        <div className="md:pl-60 p-6 space-y-6">
            <SectionTitle title="Go / No-Go Report" subtitle="Evaluación automática de readiness para beta pública" />

            <Card className={`${config.color} border-none`}>
                <CardContent className="p-6 flex items-center gap-4">
                    <Icon className="h-12 w-12" />
                    <div>
                        <h2 className="text-2xl font-bold">{config.label}</h2>
                        <p className="text-sm opacity-75">Score: {data.score}/100</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" /> Criterios de Evaluación
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {data.criteria.map((c) => (
                            <div key={c.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <div className="flex items-center gap-3">
                                    {c.passed ? (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-red-500" />
                                    )}
                                    <div>
                                        <p className="font-medium text-sm">{c.name}</p>
                                        <p className="text-xs text-muted-foreground">Umbral: {c.threshold}</p>
                                    </div>
                                </div>
                                <Badge variant={c.passed ? 'default' : 'destructive'}>
                                    {c.value}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Resumen</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm">{data.summary}</p>
                </CardContent>
            </Card>

            {data.recommendations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-orange-600">Recomendaciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {data.recommendations.map((r, i) => (
                                <li key={i} className="text-sm flex items-start gap-2">
                                    <span className="text-orange-500">→</span> {r}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
