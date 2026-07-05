'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight, Shield, User, CreditCard, MessageCircle, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

const faqSections = [
    {
        icon: User,
        title: 'Cuenta y Perfil',
        items: [
            { q: '¿Cómo creo mi cuenta?', a: 'Puedes registrarte con tu correo electrónico o con Google desde la pantalla de inicio.' },
            { q: '¿Cómo verifico mi identidad?', a: 'Ve a Configuración > Verificación y sube un selfie. Nuestro equipo lo revisará en 24-48 horas.' },
            { q: '¿Cómo elimino mi cuenta?', a: 'Ve a Configuración > Privacidad > Zona de Peligro > Eliminar cuenta.' },
        ]
    },
    {
        icon: Shield,
        title: 'Seguridad',
        items: [
            { q: '¿Cómo bloqueo a alguien?', a: 'En el chat, toca los tres puntos y selecciona "Bloquear". También puedes bloquear desde el perfil de usuario.' },
            { q: '¿Cómo reporto a alguien?', a: 'En el chat o perfil, selecciona "Reportar" y elige el motivo. Todos los reportes son revisados por nuestro equipo.' },
            { q: '¿Qué es el modo incógnito?', a: 'Un beneficio de Alora+ que oculta tu perfil del Discover para que solo tú decidas a quién mostrar tu perfil.' },
        ]
    },
    {
        icon: CreditCard,
        title: 'Suscripción y Pagos',
        items: [
            { q: '¿Qué es Alora+?', a: 'Nuestro plan premium que incluye likes ilimitados, prioridad en Discover, boost semanal, rewind y modo viaje. Precio: $99 MXN/mes.' },
            { q: '¿Cómo cancelo mi suscripción?', a: 'Ve a Configuración > Suscripción y sigue las instrucciones para cancelar.' },
            { q: '¿Puedo pedir reembolso?', a: 'Las suscripciones no son reembolsables por meses parciales. Contáctanos si tienes un problema específico.' },
        ]
    },
    {
        icon: MessageCircle,
        title: 'Chat y Matches',
        items: [
            { q: '¿Por qué no puedo enviar el primer mensaje?', a: 'En conexiones entre hombres y mujeres, ella da el primer paso. Esto es parte de nuestro compromiso de seguridad.' },
            { q: '¿Cómo funciona el sistema de likes?', a: 'Los usuarios gratuitos tienen 50 likes diarios. Alora+ ofrece likes ilimitados.' },
            { q: '¿Qué son los icebreakers?', a: 'Sugerencias de conversación generadas por IA basadas en tus intereses y los de tu match.' },
        ]
    },
    {
        icon: Settings,
        title: 'Configuración',
        items: [
            { q: '¿Cómo cambio mis preferencias de descubrimiento?', a: 'En la pantalla de Discover, toca el icono de filtros para ajustar edad, distancia, intereses y más.' },
            { q: '¿Cómo activo el modo viaje?', a: 'Ve a Configuración > Modo Viaje (requiere Alora+).' },
            { q: '¿Cómo configuro mis notificaciones?', a: 'Ve a Configuración > Notificaciones para personalizar qué alertas recibir.' },
        ]
    },
];

export default function SupportPage() {
    const router = useRouter();
    const [openItems, setOpenItems] = useState<string[]>([]);

    const toggleItem = (id: string) => {
        setOpenItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <div className="min-h-dvh flex flex-col overflow-y-auto bg-gradient-to-br from-background to-muted/30">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md pt-safe">
                <Button variant="ghost" size="icon" onClick={() => { if (window.history.length > 1) router.back(); else router.push('/'); }} aria-label="Volver">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-bold">Centro de Ayuda</h1>
            </header>

            <main className="max-w-lg mx-auto p-6 space-y-6">
                {faqSections.map((section) => {
                    const Icon = section.icon;
                    return (
                        <Card key={section.title} className="rounded-3xl">
                            <CardContent className="p-4 space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                                    <h2 className="font-bold text-sm">{section.title}</h2>
                                </div>
                                {section.items.map((item, idx) => {
                                    const itemId = `${section.title}-${idx}`;
                                    const isOpen = openItems.includes(itemId);
                                    return (
                                        <Collapsible key={itemId} open={isOpen} onOpenChange={() => toggleItem(itemId)}>
                                            <CollapsibleTrigger className="w-full flex items-center justify-between py-2 text-left text-sm hover:text-primary transition-colors">
                                                <span className="font-medium">{item.q}</span>
                                                <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-90' : ''}`} aria-hidden="true" />
                                            </CollapsibleTrigger>
                                            <CollapsibleContent className="pb-2">
                                                <p className="text-sm text-muted-foreground pl-0">{item.a}</p>
                                            </CollapsibleContent>
                                        </Collapsible>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    );
                })}

                <Card className="rounded-3xl border-primary/20">
                    <CardContent className="p-4 text-center space-y-2">
                        <p className="text-sm text-muted-foreground">¿No encontraste lo que buscas?</p>
                        <Button variant="outline" asChild>
                            <Link href="/contact">Contactar Soporte</Link>
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
