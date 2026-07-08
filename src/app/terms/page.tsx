"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';

export default function TermsPage() {
    const router = useRouter();
    const goBack = () => { if (window.history.length > 1) router.back(); else router.push('/'); };

    return (
        <div className="app-page-shell">
            <PageHeader title="Términos y Condiciones" onBack={goBack} />

            <main className="app-page-content-wide">
                <p className="text-sm text-muted-foreground">Última actualización: 3 de junio de 2026</p>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">1. Aceptación de los Términos</h2>
                    <p className="text-muted-foreground">Al utilizar Alora, aceptas estos términos en su totalidad. Si no estás de acuerdo, no uses la aplicación.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">2. Elegibilidad</h2>
                    <p className="text-muted-foreground">Debes tener al menos 18 años para usar Alora. Proporcionar información falsa está prohibido.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">3. Conducta del Usuario</h2>
                    <p className="text-muted-foreground">No puedes acosar, abusar, o enviar contenido inapropiado a otros usuarios. El incumplimiento resultará en la suspensión permanente de tu cuenta.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">4. Suscripciones y Pagos</h2>
                    <p className="text-muted-foreground">Alora+ es una suscripción mensual renovable. Puedes cancelar en cualquier momento. No se realizan reembolsos por días no utilizados del período de facturación actual.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">5. Privacidad</h2>
                    <p className="text-muted-foreground">Revisa nuestra <Link href="/privacy" className="text-primary underline">Política de Privacidad</Link> para entender cómo manejamos tus datos.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">6. Limitación de Responsabilidad</h2>
                    <p className="text-muted-foreground">Alora no se hace responsable por daños derivados del uso de la plataforma. Las interacciones entre usuarios son responsabilidad exclusiva de los mismos.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">7. Terminación</h2>
                    <p className="text-muted-foreground">Podemos suspender o terminar tu cuenta si violas estos términos. Puedes eliminar tu cuenta en cualquier momento desde Configuración &gt; Privacidad.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">8. Contacto</h2>
                    <p className="text-muted-foreground">Para preguntas sobre estos términos, contáctanos en <a href="mailto:soporte.alora.app@gmail.com" className="text-primary underline">soporte.alora.app@gmail.com</a>.</p>
                </section>

                <div className="pt-4 border-t flex items-center gap-4">
                    <Link href="/privacy" className="text-primary hover:underline text-sm">Política de Privacidad</Link>
                </div>
            </main>
        </div>
    );
}
