'use client';

import { HeartScore } from '@/lib/domain/gamification';
import { claimDailyBonus } from '@/server/actions/heartscore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import { useState } from 'react';

export function HeartScoreDisplay({ initialScore }: { initialScore: HeartScore }) {
    const [scoreData, setScoreData] = useState(initialScore);
    const [claiming, setClaiming] = useState(false);

    const handleClaim = async () => {
        if (scoreData.dailyBonusClaimed) return;
        setClaiming(true);
        await claimDailyBonus(scoreData.userId);
        setScoreData({
            ...scoreData,
            score: scoreData.score + 5,
            dailyBonusClaimed: true,
            streak: scoreData.streak + 1
        });
        setClaiming(false);
    };

    return (
        <Card className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-none shadow-lg mb-6">
            <CardContent className="flex justify-between items-center p-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-full">
                        <Heart className="w-8 h-8 fill-current" />
                    </div>
                    <div>
                        <p className="text-sm font-medium opacity-90">HeartScore ❤️</p>
                        <h3 className="text-3xl font-bold">{scoreData.score} pts</h3>
                        <p className="text-xs opacity-75">🔥 Racha: {scoreData.streak} días</p>
                    </div>
                </div>

                <div className="text-right">
                    {!scoreData.dailyBonusClaimed ? (
                        <Button
                            onClick={handleClaim}
                            disabled={claiming}
                            variant="secondary"
                            className="text-pink-600 font-bold"
                        >
                            {claiming ? '...' : 'Reclamar +5 Bonus'}
                        </Button>
                    ) : (
                        <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">Bonus Reclamado ✅</span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
