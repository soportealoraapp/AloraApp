'use client';

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { trackEvent } from "@/lib/tracking/client";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const INTEREST_CATEGORIES = [
    {
        label: 'Arte y Cultura',
        items: ['Música', 'Cine', 'Libros', 'Arte', 'Fotografía', 'Teatro', 'Museos', 'Baile'],
    },
    {
        label: 'Estilo de Vida',
        items: ['Viajes', 'Cocina', 'Moda', 'Yoga', 'Meditación', 'Jardinería', 'Mascotas', 'Fitness'],
    },
    {
        label: 'Aventura',
        items: ['Deporte', 'Naturaleza', 'Senderismo', 'Buceo', 'Escalada', 'Ciclismo', 'Correr', 'Surf'],
    },
    {
        label: 'Entretenimiento',
        items: ['Gaming', 'Series', 'Anime', 'Comedia', 'Podcasts', 'Tecnología', 'Astronomía', 'Cócteles'],
    },
];

export function StepInterests({ data, onUpdate, onNext, onPrev, userId }: any) {
    const [selected, setSelected] = useState<string[]>(data.interests || []);

    const toggleInterest = (interest: string) => {
        if (selected.includes(interest)) {
            setSelected(selected.filter(i => i !== interest));
        } else {
            if (selected.length < 10) {
                setSelected([...selected, interest]);
            }
        }
    };

    const handleNext = () => {
        onUpdate({ interests: selected });
        trackEvent('REGISTRATION_STEP_COMPLETED', { step: 2, userId });
        onNext();
    };

    return (
        <div className="space-y-6 flex-1 flex flex-col">
            <div className="space-y-1 text-center">
                <h2 className="text-2xl font-bold text-gray-900">¿Qué te hace vibrar?</h2>
                <p className="text-sm text-muted-foreground">
                    Elige hasta 10 cosas que te gusten — así encontramos personas afines
                </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
                {INTEREST_CATEGORIES.map((category, catIdx) => (
                    <motion.div
                        key={category.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: catIdx * 0.08 }}
                    >
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                            {category.label}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {category.items.map((item) => {
                                const isSelected = selected.includes(item);
                                return (
                                    <button
                                        key={item}
                                        onClick={() => toggleInterest(item)}
                                        className={`px-4 py-2 text-sm rounded-full border transition-all duration-200 ${
                                            isSelected
                                                ? 'bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]'
                                                : 'bg-background text-muted-foreground border-muted hover:border-primary/30 hover:text-foreground'
                                        }`}
                                    >
                                        {item}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="pt-4 space-y-3">
                <div className="flex items-center justify-center gap-2">
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                            <div
                                key={i}
                                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                                    i <= selected.length ? 'bg-primary' : 'bg-muted'
                                }`}
                            />
                        ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{selected.length}/10</span>
                </div>

                <div className="flex gap-4">
                    <Button variant="outline" onClick={onPrev} className="w-1/3 rounded-2xl">
                        Atrás
                    </Button>
                    <Button
                        onClick={handleNext}
                        className="w-2/3 rounded-2xl shadow-md"
                    >
                        {selected.length === 0 ? 'Saltar por ahora' : `¡${selected.length} intereses! Continuar`}
                    </Button>
                </div>
            </div>
        </div>
    );
}
