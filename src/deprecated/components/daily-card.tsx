'use client';

import { emotionCompanion } from '@/ai/emotion/companion';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Moon } from 'lucide-react';

export function AloraRitualCard() {
    const [phrase, setPhrase] = useState('');

    useEffect(() => {
        emotionCompanion.getDailyPhrase().then(setPhrase);
    }, []);

    return (
        <Card className="border-none bg-indigo-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-20"><Moon size={48} /></div>
            <CardContent className="p-6 relative z-10">
                <div className="flex items-center gap-2 mb-2 text-indigo-300 text-xs uppercase tracking-widest font-bold">
                    <Sparkles size={12} />
                    Ritual Diario
                </div>
                <p className="text-lg font-serif italic text-indigo-100 leading-relaxed">
                    "{phrase}"
                </p>
            </CardContent>
        </Card>
    );
}
