'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/lib/domain/gamification';
import { getUserBadges, BADGE_DEFINITIONS } from '@/server/actions/badges';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionTitle } from '@/components/ui/custom/SectionTitle';

export default function BadgesPage() {
    const { user } = useAuth();
    const [badges, setBadges] = useState<Badge[]>([]);

    useEffect(() => {
        if (!user) return;
        getUserBadges(user.id).then(setBadges);
    }, [user]);

    // Use full list if getUserBadges only returning unlocked, but for now we assume it wraps unlock state
    // Actually BADGE_DEFINITIONS is server side, so let's rely on what server returns
    // Or merge here if needed. The server action logic I wrote returns ALL badges with status.

    return (
        <div className="md:pl-60 p-6 space-y-6 bg-pink-50/30 min-h-screen">
            <SectionTitle title="Aura Badges ✨" subtitle="Reconocimientos por tus conexiones sanas" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {badges.map(badge => (
                    <Card key={badge.key} className={`text-center transition-all ${!badge.unlockedAt ? 'opacity-50 grayscale' : 'border-pink-500 shadow-md'}`}>
                        <CardContent className="pt-6 flex flex-col items-center gap-2">
                            <div className="text-4xl mb-2">{badge.icon}</div>
                            <h4 className="font-bold text-gray-800">{badge.name}</h4>
                            <p className="text-xs text-gray-500">{badge.description}</p>
                            {badge.unlockedAt ? (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full mt-2">Desbloqueado</span>
                            ) : (
                                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full mt-2">Bloqueado</span>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
