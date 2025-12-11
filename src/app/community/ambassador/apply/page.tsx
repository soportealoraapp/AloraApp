'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

export default function ApplicationPage() {
    return (
        <div className="md:pl-60 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 min-h-screen flex items-center justify-center">
            <Card className="max-w-md w-full p-8">
                <h1 className="text-2xl font-bold mb-4">Conviértete en Embajador</h1>
                <p className="text-gray-500 mb-6 font-light">Lidera la comunidad Alora en tu ciudad. Organiza eventos éticos y seguros.</p>

                <form className="space-y-4">
                    <Input placeholder="Tu Ciudad / Región" />
                    <Textarea placeholder="¿Por qué quieres ser embajador? (Cuéntanos tu visión de comunidad)" />
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700">Enviar Aplicación</Button>
                </form>
            </Card>
        </div>
    );
}
