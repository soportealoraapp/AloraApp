'use client';

import { useRef } from 'react';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';

export function SocialEnergyShareable({ energy, name }: { energy: number; name: string }) {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleShare = async () => {
        if (!cardRef.current) return;
        const canvas = await html2canvas(cardRef.current);
        const image = canvas.toDataURL("image/png");

        const link = document.createElement('a');
        link.href = image;
        link.download = `alora-energy-${Date.now()}.png`;
        link.click();
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div
                ref={cardRef}
                className="w-[300px] h-[400px] bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-col items-center justify-center text-white p-8 rounded-2xl shadow-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
                <div className="z-10 text-center space-y-4">
                    <p className="tracking-widest text-xs uppercase opacity-80">Alora Social Energy</p>
                    <div className="text-8xl font-black">{energy}</div>
                    <div className="h-2 w-20 bg-white/30 rounded-full mx-auto"></div>
                    <h3 className="font-bold text-xl">{name}</h3>
                    <p className="text-sm opacity-80 italic">"Una presencia que ilumina."</p>
                </div>
                <div className="absolute bottom-4 opacity-50 text-xs">alora.app</div>
            </div>

            <Button onClick={handleShare} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Share2 className="w-4 h-4" />
                Compartir en Story
            </Button>
        </div>
    );
}
