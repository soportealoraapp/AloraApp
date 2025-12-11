'use client';

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

const INTERESTS_LIST = [
    "Viajes", "Música", "Cine", "Libros", "Deporte",
    "Arte", "Cocina", "Tecnología", "Naturaleza", "Animales",
    "Fotografía", "Baile", "Moda", "Gaming", "Yoga"
];

export function StepInterests({ data, onUpdate, onNext, onPrev }: any) {
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
        onNext();
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center mb-2">Tus Intereses</h2>
            <p className="text-center text-muted-foreground mb-6">Selecciona hasta 10 cosas que te gusten</p>

            <div className="flex flex-wrap gap-2 justify-center">
                {INTERESTS_LIST.map(interest => (
                    <Badge
                        key={interest}
                        variant={selected.includes(interest) ? "default" : "outline"}
                        className={`cursor-pointer px-4 py-2 text-sm transition-all ${selected.includes(interest)
                                ? "bg-pink-500 hover:bg-pink-600 scale-105"
                                : "hover:bg-pink-50 border-pink-200"
                            }`}
                        onClick={() => toggleInterest(interest)}
                    >
                        {interest}
                    </Badge>
                ))}
            </div>

            <div className="flex gap-4 mt-8">
                <Button variant="outline" onClick={onPrev} className="w-1/3">Atrás</Button>
                <Button onClick={handleNext} className="w-2/3 bg-pink-500 hover:bg-pink-600" disabled={selected.length === 0}>
                    Siguiente
                </Button>
            </div>
        </div>
    );
}
