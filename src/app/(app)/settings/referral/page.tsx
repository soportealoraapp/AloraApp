'use client';

import { useState } from 'react';
import { generateReferralLink } from '@/server/actions/referral';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Copy } from 'lucide-react';

export default function ReferralPage() {
    const { user } = useAuth();
    const [link, setLink] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!user) return;
        setLoading(true);
        const url = await generateReferralLink(user.uid);
        setLink(url);
        setLoading(false);
    };

    return (
        <div className="md:pl-60 p-6 bg-gray-50 min-h-screen flex items-center justify-center">
            <Card className="max-w-md w-full text-center p-6 border-pink-100 shadow-xl">
                <CardContent className="space-y-6 pt-6">
                    <h2 className="text-2xl font-bold text-gray-800">Invita Energía Positiva ✨</h2>
                    <p className="text-gray-600">
                        Si tu energía social es alta, puedes invitar a alguien especial a unirse.
                    </p>

                    {!link ? (
                        <Button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="bg-gradient-to-r from-pink-500 to-purple-500 w-full"
                        >
                            {loading ? 'Verificando Energía...' : 'Crear Enlace Mágico'}
                        </Button>
                    ) : (
                        <div className="space-y-2">
                            <div className="bg-gray-100 p-3 rounded-lg text-xs break-all text-gray-600 font-mono">
                                {link}
                            </div>
                            <Button
                                variant="outline"
                                className="w-full gap-2"
                                onClick={() => navigator.clipboard.writeText(link)}
                            >
                                <Copy className="w-4 h-4" /> Copiar Enlace
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
