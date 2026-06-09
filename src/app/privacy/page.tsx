import { BackToHome } from '@/components/nav/BackToHome';
import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-3xl mx-auto bg-card rounded-2xl shadow-sm border p-8 space-y-6">
                <h1 className="text-3xl font-bold text-foreground">Política de Privacidad</h1>
                <p className="text-sm text-muted-foreground">Última actualización: 3 de junio de 2026</p>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">1. Información que Recopilamos</h2>
                    <p className="text-muted-foreground">Recopilamos la información que nos proporcionas: nombre, edad, género, fotos, preferencias, y mensajes. También recopilamos datos de uso como actividad en la app e interacciones.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">2. Cómo Usamos tu Información</h2>
                    <p className="text-muted-foreground">Usamos tu información para operar la plataforma, mostrar perfiles compatibles, procesar pagos, y mejorar la experiencia. Los icebreakers se generan usando Gemini (Google AI) basados en tus intereses y perfil.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">3. Compartición de Datos</h2>
                    <p className="text-muted-foreground">No vendemos tus datos. Compartimos información limitada con proveedores de servicios (pagos, hosting, AI de icebreakers) necesarios para operar la app.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">4. Tus Derechos</h2>
                    <p className="text-muted-foreground">Puedes acceder, modificar o eliminar tus datos en cualquier momento desde Configuración. Puedes solicitar la exportación de tus datos contactando a soporte.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">5. Cookies</h2>
                    <p className="text-muted-foreground">Usamos cookies esenciales para el funcionamiento de la autenticación y preferencias. No usamos cookies de rastreo de terceros.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">6. Seguridad</h2>
                    <p className="text-muted-foreground">Implementamos medidas de seguridad como cifrado en tránsito, autenticación segura y monitoreo de actividad sospechosa para proteger tus datos.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">7. Retención de Datos</h2>
                    <p className="text-muted-foreground">Conservamos tus datos mientras tu cuenta esté activa. Al eliminar tu cuenta, tus datos se eliminan en un plazo de 30 días.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">8. Contacto</h2>
                    <p className="text-muted-foreground">Para preguntas sobre privacidad: <a href="mailto:soporte.alora.app@gmail.com" className="text-primary underline">soporte.alora.app@gmail.com</a></p>
                </section>

                <div className="pt-4 border-t space-x-4">
                    <BackToHome />
                    <Link href="/terms" className="text-primary hover:underline">Ver Términos y Condiciones</Link>
                </div>
            </div>
        </div>
    );
}
