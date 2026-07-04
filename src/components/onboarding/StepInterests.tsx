'use client';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { trackEvent } from "@/lib/tracking/client";
import { motion } from "framer-motion";
import { UserProfile } from "@/lib/domain/types";
import { INTEREST_CATEGORIES, VALUES, MUSIC_GENRES, MAX_INTERESTS } from "@/lib/constants/preferences";
import { BadgeChipList, getEmoji } from "@/components/profile/BadgeChip";

interface StepInterestsProps {
    userId?: string;
    data: Partial<UserProfile>;
    onUpdate: (data: Partial<UserProfile>) => void;
    onNext: () => void;
    onPrev: () => void;
}

export function StepInterests({ data, onUpdate, onNext, onPrev, userId }: StepInterestsProps) {
    const [selectedInterests, setSelectedInterests] = useState<string[]>(data.interests || []);
    const [selectedValues, setSelectedValues] = useState<string[]>(data.values || []);
    const [selectedMusic, setSelectedMusic] = useState<string[]>(data.musicGenres || []);

    const toggleInterest = (interest: string) => {
        if (selectedInterests.includes(interest)) {
            setSelectedInterests(selectedInterests.filter(i => i !== interest));
        } else {
            if (selectedInterests.length < MAX_INTERESTS) {
                setSelectedInterests([...selectedInterests, interest]);
            }
        }
    };

    const toggleValue = (value: string) => {
        if (selectedValues.includes(value)) {
            setSelectedValues(selectedValues.filter(v => v !== value));
        } else {
            if (selectedValues.length < 5) {
                setSelectedValues([...selectedValues, value]);
            }
        }
    };

    const toggleMusic = (genre: string) => {
        if (selectedMusic.includes(genre)) {
            setSelectedMusic(selectedMusic.filter(g => g !== genre));
        } else {
            if (selectedMusic.length < 5) {
                setSelectedMusic([...selectedMusic, genre]);
            }
        }
    };

    const handleNext = () => {
        onUpdate({ interests: selectedInterests, values: selectedValues, musicGenres: selectedMusic });
        trackEvent('REGISTRATION_STEP_COMPLETED', { step: 'interests', userId });
        onNext();
    };

    const hasSelections = selectedInterests.length > 0 || selectedValues.length > 0 || selectedMusic.length > 0;

    return (
        <div className="space-y-6 flex-1 flex flex-col">
            <div className="space-y-1 text-center">
                <h2 className="text-2xl font-bold text-foreground">¿Qué te hace vibrar?</h2>
                <p className="text-sm text-muted-foreground">
                    Cuéntanos tus gustos, valores y música — así encontramos personas afines
                </p>
                <p className="text-xs text-primary/80 mt-1">
                    Tus selecciones alimentan nuestro sistema de compatibilidad para encontrar mejores matches
                </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6">
                <div className="space-y-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Intereses (hasta {MAX_INTERESTS})
                    </p>
                    {INTEREST_CATEGORIES.map((category, catIdx) => (
                        <motion.div
                            key={category.name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: catIdx * 0.05 }}
                        >
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                                {category.name}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {category.items.map((item) => {
                                    const isSelected = selectedInterests.includes(item);
                                    return (
                                        <button
                                            key={item}
                                            onClick={() => toggleInterest(item)}
                                            aria-pressed={selectedInterests.includes(item)}
                                            className={`px-4 py-2 text-sm rounded-full border transition-all duration-200 ${
                                                isSelected
                                                    ? 'bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]'
                                                    : 'bg-background text-muted-foreground border-muted hover:border-primary/30 hover:text-foreground'
                                            }`}
                                        >
                                            {getEmoji(item, 'interest')} {item}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ))}
                    <div className="flex items-center gap-1">
                        <div className="flex gap-1">
                            {Array.from({ length: MAX_INTERESTS }, (_, i) => i + 1).map(i => {
                                const total = selectedInterests.length;
                                const pct = total / MAX_INTERESTS;
                                const dotColor = i <= total
                                    ? pct >= 0.9 ? 'bg-red-500' : pct >= 0.7 ? 'bg-amber-500' : 'bg-primary'
                                    : 'bg-muted';
                                return (
                                    <div
                                        key={i}
                                        className={`h-1.5 w-1.5 rounded-full transition-colors ${dotColor}`}
                                    />
                                );
                            })}
                        </div>
                        <span className={`text-xs ml-2 ${(selectedInterests.length / MAX_INTERESTS) >= 0.9 ? 'text-red-500 font-medium' : (selectedInterests.length / MAX_INTERESTS) >= 0.7 ? 'text-amber-500 dark:text-amber-400 font-medium' : 'text-muted-foreground'}`}>
                            {selectedInterests.length}/{MAX_INTERESTS}
                        </span>
                    </div>
                    {selectedInterests.length > 0 && <BadgeChipList items={selectedInterests} type="interest" className="mt-2" />}
                </div>

                <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Valores (hasta 5)
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {VALUES.map((value) => {
                            const isSelected = selectedValues.includes(value);
                            return (
                                <button
                                    key={value}
                                    onClick={() => toggleValue(value)}
                                    aria-pressed={selectedValues.includes(value)}
                                    className={`px-4 py-2 text-sm rounded-full border transition-all duration-200 ${
                                        isSelected
                                            ? 'bg-primary text-primary-foreground border-primary shadow-md'
                                            : 'bg-background text-muted-foreground border-muted hover:border-primary/30 hover:text-foreground'
                                    }`}
                                >
                                    {getEmoji(value, 'value')} {value}
                                </button>
                            );
                        })}
                    </div>
                    {selectedValues.length > 0 && <BadgeChipList items={selectedValues} type="value" className="mt-2" />}
                </div>

                <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Música (hasta 5)
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {MUSIC_GENRES.map((genre) => {
                            const isSelected = selectedMusic.includes(genre);
                            return (
                                <button
                                    key={genre}
                                    onClick={() => toggleMusic(genre)}
                                    aria-pressed={selectedMusic.includes(genre)}
                                    className={`px-4 py-2 text-sm rounded-full border transition-all duration-200 ${
                                        isSelected
                                            ? 'bg-primary text-primary-foreground border-primary shadow-md'
                                            : 'bg-background text-muted-foreground border-muted hover:border-primary/30 hover:text-foreground'
                                    }`}
                                >
                                    {getEmoji(genre, 'music')} {genre}
                                </button>
                            );
                        })}
                    </div>
                    {selectedMusic.length > 0 && <BadgeChipList items={selectedMusic} type="music" className="mt-2" />}
                </div>
            </div>

            <div className="pt-4">
                <div className="flex gap-4">
                    <Button variant="outline" onClick={onPrev} className="w-1/3 rounded-2xl">
                        Atrás
                    </Button>
                    <Button
                        onClick={handleNext}
                        className="w-2/3 rounded-2xl shadow-md"
                    >
                        {hasSelections ? `¡${selectedInterests.length + selectedValues.length + selectedMusic.length} selecciones! Continuar` : 'Saltar por ahora'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
