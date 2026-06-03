import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
            <div className="text-center space-y-4">
                <h1 className="text-6xl font-bold text-indigo-600">404</h1>
                <h2 className="text-2xl font-semibold text-gray-800">Página no encontrada</h2>
                <p className="text-gray-500 max-w-md">La página que buscas no existe o ha sido movida.</p>
                <Link href="/discover" className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition">
                    Volver al inicio
                </Link>
            </div>
        </div>
    );
}
