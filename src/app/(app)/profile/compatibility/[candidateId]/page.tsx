'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getCompatibilityScore } from '@/server/actions/compatibility/getCompatibilityScore';
import { CompatibilityScoreCard } from '@/components/compatibility/CompatibilityScoreCard';
import { SectionTitle } from '@/components/ui/custom/SectionTitle';
import { useAuth } from '@/contexts/AuthContext';

export default function CompatibilityPage() {
    const params = useParams<{ candidateId: string }>();
    const { user } = useAuth();
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        if (!user?.id || !params.candidateId) return;
        getCompatibilityScore(user.id, params.candidateId).then(setData);
    }, [user?.id, params.candidateId]);

    if (!user) return <div className="p-10 text-center">Inicia sesión para ver compatibilidad</div>;
    if (!data) return <div className="p-10 text-center">Calculando química...</div>;

    const dimensionLabels: Record<string, string> = {
        values: 'Valores',
        relationshipGoals: 'Objetivos',
        personality: 'Personalidad',
        quizzes: 'Quizzes',
        interests: 'Intereses',
        lifestyle: 'Estilo de vida',
    };

    return (
        <div className="md:pl-60 p-6 space-y-6">
            <SectionTitle title="Análisis de Compatibilidad" subtitle="Entiende por qué conectan" />

            <div className="grid gap-6 md:grid-cols-2">
                <div>
                    <CompatibilityScoreCard
                        score={data.score}
                        explanation={data.explanation}
                        dimensions={data.breakdown}
                    />
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold mb-4">Desglose por Dimensión</h3>
                    <ul className="space-y-3">
                        {Object.entries(data.breakdown).map(([key, val]: any) => (
                            <li key={key} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">{dimensionLabels[key] || key}</span>
                                    <span className="font-bold">{val}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${val >= 70 ? 'bg-green-500' : val >= 40 ? 'bg-yellow-500' : 'bg-red-400'}`}
                                        style={{ width: `${val}%` }}
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
