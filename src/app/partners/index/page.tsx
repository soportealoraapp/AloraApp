'use client';

import { useEffect, useState } from 'react';
import { listPartners, Partner } from '@/server/actions/partners/actions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MapPin, Coffee, Book, Building } from 'lucide-react';
import { SectionTitle } from '@/components/ui/custom/SectionTitle';

export default function PartnersDirectory() {
    const [partners, setPartners] = useState<Partner[]>([]);

    useEffect(() => {
        listPartners().then(setPartners);
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'cafe': return <Coffee />;
            case 'bookstore': return <Book />;
            default: return <Building />;
        }
    };

    return (
        <div className="md:pl-60 p-6 space-y-6">
            <SectionTitle title="Alora Partners 🤝" subtitle="Espacios seguros verificados para tus encuentros" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {partners.map(p => (
                    <Card key={p.id}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-lg font-medium">{p.name}</CardTitle>
                            <div className="text-gray-400">{getIcon(p.type)}</div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-start gap-2 text-sm text-gray-500 mb-4">
                                <MapPin size={16} className="mt-1 flex-shrink-0" />
                                {p.address}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {p.perks.map((perk, i) => (
                                    <span key={i} className="bg-emerald-50 text-emerald-700 text-xs px-2 py-1 rounded-full border border-emerald-100">
                                        ✨ {perk}
                                    </span>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
