'use client';

import { useEffect, useState } from 'react';
import { getCompatibilityScore } from '@/server/actions/compatibility/getCompatibilityScore';
import { CompatibilityScoreCard } from '@/components/compatibility/CompatibilityScoreCard';
import { SectionTitle } from '@/components/ui/custom/SectionTitle';

// Mock params for preview
export default function CompatibilityPage({ params }: { params: { candidateId: string } }) {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        // In real app, we get current userId from context/session
        const currentUserId = 'mock_current_user';
        getCompatibilityScore(currentUserId, params.candidateId).then(setData);
    }, [params.candidateId]);

    if (!data) return <div className="p-10 text-center">Calculando química...</div>;

    return (
        <div className="md:pl-60 p-6 space-y-6">
            <SectionTitle title="Análisis de Compatibilidad" subtitle="Entiende por qué conectan" />

            <div className="grid gap-6 md:grid-cols-2">
                <div>
                    <CompatibilityScoreCard score={data.score} explanation={data.explanation} />
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold mb-4">Desglose Detallado</h3>
                    <ul className="space-y-2">
                        {Object.entries(data.breakdown).map(([key, val]: any) => (
                            <li key={key} className="flex justify-between text-sm">
                                <span>{key}</span>
                                <span className={val > 0 ? 'text-green-600' : 'text-red-500'}>
                                    {val > 0 ? '+' : ''}{val}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
