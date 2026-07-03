import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-dvh flex items-center justify-center bg-background">
            <div className="text-center space-y-4">
                <h1 className="text-6xl font-bold text-primary">404</h1>
                <h2 className="text-2xl font-semibold text-foreground">Página no encontrada</h2>
                <p className="text-muted-foreground max-w-md">La página que buscas no existe o ha sido movida.</p>
                <Link href="/" className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition">
                    Volver al inicio
                </Link>
            </div>
        </div>
    );
}
