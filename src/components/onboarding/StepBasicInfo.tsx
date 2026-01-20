'use client';

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { GlowInput } from "../ui/premium/GlowInput";
import { trackEvent } from "@/lib/tracking/client";

export function StepBasicInfo({ data, onUpdate, onNext, userId }: any) {
    const [localData, setLocalData] = useState(data);

    const handleChange = (field: string, value: any) => {
        setLocalData({ ...localData, [field]: value });
    };

    const handleNext = () => {
        onUpdate(localData);
        trackEvent('REGISTRATION_STEP_COMPLETED', { step: 1, userId });
        onNext();
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center mb-6">Cuéntanos sobre ti</h2>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="displayName" className="dark:text-pink-300">Nombre</Label>
                    <GlowInput>
                        <Input
                            id="displayName"
                            value={localData.displayName || ''}
                            onChange={(e) => handleChange('displayName', e.target.value)}
                            placeholder="Tu nombre"
                            className="bg-card rounded-xl h-12"
                            aria-label="Nombre completo"
                        />
                    </GlowInput>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="age" className="dark:text-pink-300">Edad</Label>
                        <GlowInput>
                            <Input
                                id="age"
                                type="number"
                                value={localData.age || ''}
                                onChange={(e) => handleChange('age', parseInt(e.target.value))}
                                className="bg-card rounded-xl h-12"
                                aria-label="Edad"
                            />
                        </GlowInput>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="gender" className="dark:text-pink-300">Género</Label>
                        <GlowInput>
                            <Select onValueChange={(v) => handleChange('gender', v)} defaultValue={localData.gender}>
                                <SelectTrigger id="gender" className="bg-card rounded-xl h-12">
                                    <SelectValue placeholder="Selecciona" />
                                </SelectTrigger>
                                <SelectContent className="dark:bg-card">
                                    <SelectItem value="woman">Mujer</SelectItem>
                                    <SelectItem value="man">Hombre</SelectItem>
                                    <SelectItem value="non-binary">No binario</SelectItem>
                                </SelectContent>
                            </Select>
                        </GlowInput>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="seeking" className="dark:text-pink-300">Busco...</Label>
                    <GlowInput>
                        <Select onValueChange={(v) => handleChange('seeking', v)} defaultValue={localData.seeking}>
                            <SelectTrigger id="seeking" className="bg-card rounded-xl h-12">
                                <SelectValue placeholder="Interés" />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-card">
                                <SelectItem value="men">Hombres</SelectItem>
                                <SelectItem value="women">Mujeres</SelectItem>
                                <SelectItem value="all">Todos</SelectItem>
                            </SelectContent>
                        </Select>
                    </GlowInput>
                </div>
            </div>

            <Button
                onClick={handleNext}
                className="w-full mt-8 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-md shadow-pink-100 dark:shadow-pink-950/10"
                disabled={!localData.displayName || !localData.age || !localData.gender}
            >
                Continuar
            </Button>
            {!localData.displayName || !localData.age || !localData.gender ? (
                <p className="text-[10px] text-center text-muted-foreground mt-4 px-2">
                    * Estos campos son necesarios para crear tu cuenta básica.
                </p>
            ) : null}
        </div>
    );
}
