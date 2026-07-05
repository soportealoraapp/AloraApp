'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';

export default function ContactPage() {
    const router = useRouter();

    return (
        <div className="min-h-dvh bg-gradient-to-br from-background to-muted/30">
            <PageHeader title="Contacto" onBack={() => { if (window.history.length > 1) router.back(); else router.push('/'); }} />

            <main className="max-w-lg mx-auto p-6 space-y-6">
                <Card className="rounded-3xl">
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-primary/10 dark:bg-primary/20">
                                <Mail className="h-6 w-6 text-primary dark:text-primary" aria-hidden="true" />
                            </div>
                            <div>
                                <h2 className="font-bold text-lg">Soporte de Alora</h2>
                                <p className="text-sm text-muted-foreground">Estamos aquí para ayudarte</p>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <p className="text-sm text-muted-foreground">
                                Si tienes preguntas, sugerencias o necesitas ayuda, escríbenos a:
                            </p>
                            <a
                                href="mailto:soporte.alora.app@gmail.com"
                                className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
                            >
                                soporte.alora.app@gmail.com
                            </a>
                        </div>

                        <div className="space-y-2 pt-2">
                            <h3 className="font-bold text-sm">¿Qué podemos ayudarte con?</h3>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Problemas con tu cuenta o perfil</li>
                                <li>• Reportes de comportamiento inapropiado</li>
                                <li>• Dudas sobre tu suscripción</li>
                                <li>• Sugerencias de mejora</li>
                                <li>• Problemas técnicos</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex gap-3">
                    <Button variant="outline" asChild className="flex-1">
                        <Link href="/support">Centro de Ayuda</Link>
                    </Button>
                </div>
            </main>
        </div>
    );
}
