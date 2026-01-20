'use client';

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
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
        <div className="space-y-8 flex-1 flex flex-col">
            <div className="space-y-2 text-center">
                <h2 className="text-2xl font-headline font-black text-gray-900 dark:text-white">Cuéntanos sobre ti</h2>
                <p className="text-sm text-muted-foreground font-medium">Información básica para tu perfil premium</p>
            </div>

            <div className="space-y-6 flex-1">
                <div className="space-y-2">
                    <Label htmlFor="displayName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                        ¿Cómo te llamas?
                    </Label>
                    <Input
                        id="displayName"
                        placeholder="Nombre completo"
                        value={localData.displayName || ''}
                        onChange={(e) => handleChange('displayName', e.target.value)}
                        className="rounded-2xl h-12 border-pink-100 dark:border-pink-900/30 focus-visible:ring-pink-500/20 bg-background/50"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="age" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Edad</Label>
                        <Input
                            id="age"
                            type="number"
                            placeholder="24"
                            value={localData.age || ''}
                            onChange={(e) => handleChange('age', parseInt(e.target.value))}
                            className="rounded-2xl h-12 border-pink-100 dark:border-pink-900/30 bg-background/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="gender" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Género</Label>
                        <select
                            id="gender"
                            value={localData.gender || ''}
                            onChange={(e) => handleChange('gender', e.target.value)}
                            className="w-full flex h-12 rounded-2xl border border-pink-100 dark:border-pink-900/30 bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/20"
                        >
                            <option value="">Seleccionar</option>
                            <option value="female">Mujer</option>
                            <option value="male">Hombre</option>
                            <option value="non-binary">No binario</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="bio" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tu esencia (Bio)</Label>
                    <textarea
                        id="bio"
                        placeholder="Comparte algo único sobre ti..."
                        value={localData.bio || ''}
                        onChange={(e) => handleChange('bio', e.target.value)}
                        className="w-full flex min-h-[120px] rounded-2xl border border-pink-100 dark:border-pink-900/30 bg-background/50 px-3 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/20 resize-none"
                    />
                </div>
            </div>

            <div className="pt-6">
                <Button
                    onClick={handleNext}
                    className="w-full h-12 rounded-2xl font-bold shadow-lg shadow-pink-500/10 hover:shadow-pink-500/20 transition-all active:scale-[0.98]"
                    disabled={!localData.displayName || !localData.age || !localData.gender}
                >
                    Continuar
                </Button>
                {!localData.displayName || !localData.age || !localData.gender ? (
                    <p className="text-[10px] text-center text-muted-foreground mt-3 font-medium">
                        * Estos campos son obligatorios para tu seguridad
                    </p>
                ) : null}
            </div>
        </div>
    );
}
