'use client';

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { trackEvent } from "@/lib/tracking/client";
import { motion } from "framer-motion";

const INTERESTS_LIST = [
    "Viajes", "Música", "Cine", "Libros", "Deporte",
    "Arte", "Cocina", "Tecnología", "Naturaleza", "Animales",
    "Fotografía", "Baile", "Moda", "Gaming", "Yoga"
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
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center mb-2 dark:text-white">Tus Intereses</h2>
            <p className="text-center text-muted-foreground dark:text-gray-400 mb-6 font-medium">Selecciona hasta 10 cosas que te gusten</p>

            <div className="flex flex-wrap gap-2 justify-center">
                {INTERESTS_LIST.map((interest, idx) => (
                    <motion.div
                        key={interest}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 180, damping: 35, delay: idx * 0.03 }}
                    >
                        <Badge
                            variant={selected.includes(interest) ? "default" : "outline"}
                            className={`cursor-pointer px-4 py-2 text-sm transition-all duration-300 ${selected.includes(interest)
                                ? "bg-primary hover:bg-primary/90 scale-[1.02] text-primary-foreground shadow-md"
                                : "hover:bg-accent hover:text-accent-foreground border-input dark:border-pink-900/40 dark:text-gray-200"
                                }`}
                            onClick={() => toggleInterest(interest)}
                        >
                            {interest}
                        </Badge>
                    </motion.div>
                ))}
            </div>

            <div className="flex gap-4 mt-8">
                <Button variant="outline" onClick={onPrev} className="w-1/3 hover:bg-muted active:scale-[0.98] transition-all border-border">Atrás</Button>
                <Button
                    onClick={handleNext}
                    className="w-2/3 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-md shadow-pink-100 dark:shadow-pink-950/10"
                >
                    {selected.length === 0 ? "Saltar" : "Continuar"}
                </Button>
            </div>
        </div>
    );
}
