'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Lock, Eye, UserX, CheckCircle, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SectionTitle } from '@/components/ui/custom/SectionTitle';

const safetyFeatures = [
    {
        icon: Shield,
        title: 'Verificación de identidad',
        description: 'Verifica tu identidad con un selfie. Los usuarios verificados generan más confianza.',
        color: 'text-blue-500 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-950/50',
    },
    {
        icon: Lock,
        title: 'Modo incógnito',
        description: 'Activa el modo incógnito para controlar quién puede verte. Tu perfil no aparecerá en descubrir.',
        color: 'text-purple-500 dark:text-purple-400',
        bg: 'bg-purple-50 dark:bg-purple-950/50',
    },
    {
        icon: Eye,
        title: 'Control de visibilidad',
        description: 'Decide si quieres aparecer en descubrir o no. Tú tienes el control total.',
        color: 'text-green-500 dark:text-green-400',
        bg: 'bg-green-50 dark:bg-green-950/50',
    },
    {
        icon: UserX,
        title: 'Bloqueo y reporte',
        description: 'Puedes bloquear y reportar a cualquier usuario. Los reportes son anónimos y tomados en serio.',
        color: 'text-red-500 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-950/50',
    },
];

export default function FemaleSafetyOnboarding() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950 dark:to-purple-950 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <Shield className="h-10 w-10 text-pink-500 dark:text-pink-400 mx-auto mb-2" />
                    <CardTitle className="text-xl">Tu seguridad es nuestra prioridad</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Antes de comenzar, queremos que sepas que tienes control total sobre tu experiencia.
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    {safetyFeatures.map((feature) => (
                        <div key={feature.title} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                            <div className={`w-10 h-10 rounded-lg ${feature.bg} flex items-center justify-center flex-shrink-0`}>
                                <feature.icon className={`h-5 w-5 ${feature.color}`} />
                            </div>
                            <div>
                                <h4 className="font-medium text-sm">{feature.title}</h4>
                                <p className="text-xs text-muted-foreground">{feature.description}</p>
                            </div>
                        </div>
                    ))}

                    <div className="p-3 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <p className="text-sm text-green-700 dark:text-green-300 font-medium">Estas protegida</p>
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            Nuestro sistema detecta comportamientos sospechosos y permite reportarlos al instante.
                        </p>
                    </div>

                    <Button
                        className="w-full"
                        onClick={() => router.push('/discover')}
                    >
                        Continuar <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
