'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { socialEnergyAI } from '@/ai/social/social-energy';
import { getStarsReceived } from '@/server/actions/stars';
import { SocialEnergyShareable } from '@/components/shareables/SocialEnergyCard';
import { SectionTitle } from '@/components/ui/custom/SectionTitle';

export default function WarmthPage() {
    const { user, profile } = useAuth();
    const [energy, setEnergy] = useState<number>(0);
    const [stars, setStars] = useState<number>(0);

    useEffect(() => {
        if (!user) return;
        socialEnergyAI.calculateSocialEnergy(user.uid).then(setEnergy);
        getStarsReceived(user.uid).then(setStars);
    }, [user]);

    if (!profile) return <div>Cargando...</div>;

    return (
        <div className="md:pl-60 p-6 space-y-8 bg-indigo-50 min-h-screen">
            <SectionTitle title="Social Warmth 🔥" subtitle="Tu impacto positivo en la comunidad" />

            <div className="grid md:grid-cols-2 gap-8 items-center justify-center">
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm">
                        <h3 className="text-gray-500 font-medium mb-1">Alora Stars Recibidas</h3>
                        <div className="text-4xl font-bold flex items-center gap-2">
                            {stars} <span className="text-yellow-400 text-2xl">⭐</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">Personas que sintieron una conexión especial contigo.</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm">
                        <h3 className="text-gray-500 font-medium mb-1">Impacto Comunitario</h3>
                        <p className="text-gray-700">Tu energía contribuye a un espacio seguro y amable.</p>
                    </div>
                </div>

                <div className="flex justify-center">
                    <SocialEnergyShareable energy={energy} name={profile.name || "Usuario"} />
                </div>
            </div>
        </div>
    );
}
