'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { icebreakerEngine } from '@/ai/chat/icebreaker-engine';
import { Sparkles, X } from 'lucide-react';
import { UserProfile } from '@/lib/domain/types';
// Note: In real usage UserProfile needs to be passed in or fetched

export function ChatSuggestions({ onSelect, userA, userB }: { onSelect: (text: string) => void, userA: any, userB: any }) {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Mock loading icebreakers on mount
        const loaded = icebreakerEngine.generateIcebreakers(userA, userB);
        setSuggestions(loaded);
    }, [userA, userB]);

    if (!visible) {
        return (
            <div className="px-4 py-2">
                <Button variant="ghost" size="sm" className="text-pink-500 text-xs gap-1" onClick={() => setVisible(true)}>
                    <Sparkles size={12} /> Sugerencias IA
                </Button>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-t-xl border-t border-pink-100 shadow-inner relative">
            <button onClick={() => setVisible(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
                <X size={14} />
            </button>
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Rompehielos Sugeridos</h4>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {suggestions.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => onSelect(s)}
                        className="flex-shrink-0 bg-white border border-pink-200 rounded-lg p-3 text-sm text-gray-700 hover:bg-pink-50 transition-colors max-w-[200px] text-left shadow-sm"
                    >
                        {s}
                    </button>
                ))}
            </div>
        </div>
    );
}
