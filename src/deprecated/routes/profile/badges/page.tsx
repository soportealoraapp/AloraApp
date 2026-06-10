/**
 * @deprecated Moved to deprecated route tree in V3.4.
 */
'use client';

import { useEffect, useState } from 'react';
import { getUserBadges } from '@/server/actions/badges';
import { BADGE_DEFINITIONS, BadgeKey } from '@/lib/domain/gamification';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { SectionTitle } from '@/components/ui/custom/SectionTitle';
import { Gift } from 'lucide-react';

interface UserBadge {
    key: BadgeKey;
    unlockedAt: Date | null;
}

export default function BadgesPage() {
    const { user } = useAuth();
    const [userBadges, setUserBadges] = useState<UserBadge[]>([]);

    useEffect(() => {
        if (!user) return;
        getUserBadges(user.id).then(setUserBadges);
    }, [user]);

    const badgeKeys = Object.keys(BADGE_DEFINITIONS) as BadgeKey[];

    return (
        <div className="md:pl-60 p-6 space-y-6 bg-background min-h-screen">
            <SectionTitle title="Aura Badges ✨" subtitle="Reconocimientos por tus conexiones sanas" />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {badgeKeys.map(key => {
                    const def = BADGE_DEFINITIONS[key];
                    const userBadge = userBadges.find(b => b.key === key);
                    const isUnlocked = !!userBadge?.unlockedAt;

                    return (
                        <Card key={key} className={`text-center transition-all ${!isUnlocked ? 'opacity-50 grayscale' : 'border-primary/20 shadow-md'}`}>
                            <CardContent className="pt-6 flex flex-col items-center gap-2">
                                <div className="text-4xl mb-2">{def.icon}</div>
                                <h4 className="font-bold text-foreground text-sm">{def.name}</h4>
                                <p className="text-xs text-muted-foreground leading-tight">{def.description}</p>
                                {def.reward && (
                                    <div className="flex items-center gap-1 mt-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                                        <Gift className="h-3 w-3" />
                                        {def.reward.description}
                                    </div>
                                )}
                                {isUnlocked ? (
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full mt-1">Desbloqueado</span>
                                ) : (
                                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full mt-1">Bloqueado</span>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

