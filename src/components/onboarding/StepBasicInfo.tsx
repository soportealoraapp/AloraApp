'use client';

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useMemo } from "react";
import { trackEvent } from "@/lib/tracking/client";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const BIO_EXAMPLES = [
    "Una amante del café y los atardeceres...",
    "Buscando a alguien que baile conmigo bajo la lluvia",
    "Soy de esas personas que se pierden en librerías",
];

export function StepBasicInfo({ data, onUpdate, onNext, userId }: any) {
    const [localData, setLocalData] = useState(data);
    const [bioExample] = useState(BIO_EXAMPLES[Math.floor(Math.random() * BIO_EXAMPLES.length)]);

    // Sync from parent data when it loads (e.g. profile fetched) but don't overwrite user input
    useEffect(() => {
        if (data && Object.keys(data).length > 0 && Object.keys(localData).length === 0) {
            setLocalData(data);
        }
    }, [data]);

    const handleChange = (field: string, value: any) => {
        setLocalData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleNext = () => {
        onUpdate(localData);
        trackEvent('REGISTRATION_STEP_COMPLETED', { step: 1, userId });
        onNext();
    };

    const isValid = useMemo(() =>
        Boolean(localData.displayName?.trim()) &&
        Boolean(localData.age) &&
        Boolean(localData.gender),
        [localData.displayName, localData.age, localData.gender]
    );

    return (
        <div className="space-y-6 flex-1 flex flex-col">
            <div className="space-y-1 text-center">
                <h2 className="text-2xl font-bold text-foreground">Cuéntanos sobre ti</h2>
                <p className="text-sm text-muted-foreground">
                    Lo básico para que puedan conocerte
                </p>
            </div>

            <div className="space-y-5 flex-1">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-2"
                >
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        ¿Cómo te llamas?
                    </Label>
                    <Input
                        placeholder="Tu nombre"
                        value={localData.displayName || ''}
                        onChange={(e) => handleChange('displayName', e.target.value)}
                        className="rounded-2xl h-12 border-muted focus-visible:ring-primary/20 bg-background/50"
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-2 gap-4"
                >
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Edad</Label>
                        <Input
                            type="number"
                            min={18}
                            max={120}
                            placeholder="24"
                            value={localData.age ?? ''}
                            onChange={(e) => {
                                const v = parseInt(e.target.value);
                                handleChange('age', isNaN(v) ? undefined : v);
                            }}
                            className="rounded-2xl h-12 border-muted focus-visible:ring-primary/20 bg-background/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Género</Label>
                        <Select
                            value={localData.gender || ''}
                            onValueChange={(value) => handleChange('gender', value)}
                        >
                            <SelectTrigger className="h-12 rounded-2xl border-muted bg-background/50">
                                <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="woman">Mujer</SelectItem>
                                <SelectItem value="man">Hombre</SelectItem>
                                <SelectItem value="non-binary">No binario</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-2"
                >
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-muted-foreground" />
                        Tu esencia
                    </Label>
                    <Textarea
                        placeholder={bioExample}
                        value={localData.bio || ''}
                        onChange={(e) => handleChange('bio', e.target.value)}
                        className="min-h-[100px] rounded-2xl resize-none"
                        maxLength={500}
                    />
                    <p className="text-[10px] text-right text-muted-foreground">
                        {(localData.bio || '').length}/500
                    </p>
                </motion.div>
            </div>

            <div className="pt-4">
                <Button
                    onClick={handleNext}
                    className="w-full h-12 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                    disabled={!isValid}
                >
                    {isValid ? 'Sigue, vamos bien ✨' : 'Completa los campos para continuar'}
                </Button>
                {!isValid && (
                    <p className="text-xs text-amber-600 text-center mt-2">
                        Nombre, edad y género son necesarios para encontrar tu mejor match
                    </p>
                )}
            </div>
        </div>
    );
}
