'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Share2 } from 'lucide-react';

// This would normally take matchId as a param
export default function MatchStoryPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black p-6">
            <Card className="w-full max-w-sm aspect-[9/16] bg-gradient-to-b from-pink-500 via-purple-500 to-indigo-500 rounded-3xl p-8 flex flex-col items-center justify-center text-white relative overflow-hidden shadow-2xl border-none">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20"></div>

                <div className="z-10 text-center space-y-6">
                    <div className="flex justify-center -space-x-4">
                        <div className="w-20 h-20 rounded-full bg-gray-300 border-4 border-transparent bg-clip-padding"></div>
                        <div className="w-20 h-20 rounded-full bg-gray-300 border-4 border-transparent bg-clip-padding"></div>
                    </div>

                    <div>
                        <h1 className="text-5xl font-black">92%</h1>
                        <p className="uppercasetracking-widest text-sm opacity-90">Compatibilidad</p>
                    </div>

                    <div className="space-y-2 text-sm opacity-90">
                        <p>✨ Alta Sincronía Emocional</p>
                        <p>🔥 Energía Similar</p>
                        <p>🌙 Intereses Compartidos</p>
                    </div>

                    <div className="pt-8">
                        <p className="font-serif italic text-xl">"Una conexión escrita en las estrellas."</p>
                    </div>
                </div>

                <div className="absolute bottom-8 flex gap-2 opacity-60 text-xs">
                    <span>Alora Match Stories</span>
                </div>
            </Card>

            <div className="mt-8 flex gap-4">
                <Button variant="secondary" className="gap-2">
                    <Share2 className="w-4 h-4" /> Compartir en Instagram
                </Button>
            </div>
        </div>
    );
}
