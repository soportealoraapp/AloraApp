'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Zap } from 'lucide-react';

export function FlowBoost({ active }: { active: boolean }) {
    if (!active) return null;

    return (
        <div className="absolute top-20 right-4 z-50 animate-in slide-in-from-right fade-in duration-500">
            <Card className="w-64 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-xl">
                <CardContent className="p-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-20"><Zap size={48} /></div>
                    <h4 className="font-bold flex items-center gap-2 text-sm mb-1">
                        <Zap size={14} className="text-yellow-300" /> High Energy Flow!
                    </h4>
                    <p className="text-xs opacity-90 leading-relaxed">
                        ¡La energía está fluyendo increíblemente! ✨
                        <br />
                        ¿Se animan a un tema más profundo para conectar de verdad?
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
