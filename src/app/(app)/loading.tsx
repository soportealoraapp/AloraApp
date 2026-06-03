import { Loader2 } from 'lucide-react';

export default function Loading() {
    return (
        <div className="md:pl-60 min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <p className="text-sm text-gray-500">Cargando...</p>
            </div>
        </div>
    );
}
