'use client';

import { Mission } from '@/lib/domain/gamification';
import { CheckCircle, Circle } from 'lucide-react';

export function DailyMissions({ missions }: { missions: Mission[] }) {
    if (!missions || missions.length === 0) return null;

    return (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Misiones Diarias 🎯</h4>
            <ul className="space-y-3">
                {missions.map(m => (
                    <li key={m.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            {m.completed ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-gray-300" />}
                            <span className={m.completed ? 'text-gray-400 line-through' : 'text-gray-700'}>{m.title}</span>
                        </div>
                        <span className="text-xs font-bold text-pink-500">+{m.rewardPoints} pts</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
