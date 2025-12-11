'use client';

import { Card } from '@/components/ui/card';
import { Star, ShieldCheck, Heart } from 'lucide-react';

export function ImpactShareable({ stats, name }: { stats: { stars: number, events: number, score: number }, name: string }) {
    return (
        <Card className="w-80 h-[450px] bg-gradient-to-br from-emerald-500 to-teal-700 p-6 flex flex-col items-center justify-between text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10"><ShieldCheck size={120} /></div>

            <div className="z-10 text-center mt-8">
                <div className="border-4 border-white/30 w-24 h-24 rounded-full mx-auto bg-white/10 mb-4"></div>
                <h2 className="font-bold text-2xl">{name}</h2>
                <p className="uppercase tracking-widest text-xs opacity-80">Alora Community Guide</p>
            </div>

            <div className="z-10 w-full space-y-4">
                <div className="bg-white/10 rounded-lg p-3 flex justify-between items-center">
                    <span className="flex items-center gap-2 text-sm"><Star size={16} /> Estrellas</span>
                    <span className="font-bold text-lg">{stats.stars}</span>
                </div>
                <div className="bg-white/10 rounded-lg p-3 flex justify-between items-center">
                    <span className="flex items-center gap-2 text-sm"><ShieldCheck size={16} /> Eventos</span>
                    <span className="font-bold text-lg">{stats.events}</span>
                </div>
                <div className="bg-white/10 rounded-lg p-3 flex justify-between items-center">
                    <span className="flex items-center gap-2 text-sm"><Heart size={16} /> HeartScore</span>
                    <span className="font-bold text-lg">{stats.score}</span>
                </div>
            </div>

            <div className="z-10 text-xs opacity-60">
                Alora Impact ✨
            </div>
        </Card>
    );
}
