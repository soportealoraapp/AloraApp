import Link from 'next/link';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8 space-y-6">
                <h1 className="text-3xl font-bold text-gray-900">Términos y Condiciones</h1>
                <p className="text-sm text-gray-500">Última actualización: 3 de junio de 2026</p>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">1. Aceptación de los Términos</h2>
                    <p className="text-gray-700">Al utilizar Alora, aceptas estos términos en su totalidad. Si no estás de acuerdo, no uses la aplicación.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">2. Elegibilidad</h2>
                    <p className="text-gray-700">Debes tener al menos 18 años para usar Alora. Proporcionar información falsa está prohibido.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">3. Conducta del Usuario</h2>
                    <p className="text-gray-700">No puedes acosar, abusar, o enviar contenido inapropiado a otros usuarios. El incumplimiento resultará en la suspensión permanente de tu cuenta.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">4. Suscripciones y Pagos</h2>
                    <p className="text-gray-700">Alora+ es una suscripción mensual renovable. Puedes cancelar en cualquier momento. No se realizan reembolsos por días no utilizados del período de facturación actual.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">5. Privacidad</h2>
                    <p className="text-gray-700">Revisa nuestra <Link href="/privacy" className="text-indigo-600 underline">Política de Privacidad</Link> para entender cómo manejamos tus datos.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">6. Limitación de Responsabilidad</h2>
                    <p className="text-gray-700">Alora no se hace responsable por daños derivados del uso de la plataforma. Las interacciones entre usuarios son responsabilidad exclusiva de los mismos.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">7. Terminación</h2>
                    <p className="text-gray-700">Podemos suspender o terminar tu cuenta si violas estos términos. Puedes eliminar tu cuenta en cualquier momento desde Configuración &gt; Privacidad.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">8. Contacto</h2>
                    <p className="text-gray-700">Para preguntas sobre estos términos, contáctanos en <a href="mailto:soporte.alora.app@gmail.com" className="text-indigo-600 underline">soporte.alora.app@gmail.com</a>.</p>
                </section>

                <div className="pt-4 border-t">
                    <Link href="/" className="text-indigo-600 hover:text-indigo-800 underline">Volver al inicio</Link>
                </div>
            </div>
        </div>
    );
}
