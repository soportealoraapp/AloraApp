'use client';

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { GlowInput } from "../ui/premium/GlowInput";

export function StepBasicInfo({ data, onUpdate, onNext }: any) {
    const [localData, setLocalData] = useState(data);

    const handleChange = (field: string, value: any) => {
        setLocalData({ ...localData, [field]: value });
    };

    const handleNext = () => {
        onUpdate(localData);
        onNext();
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center mb-6">Cuéntanos sobre ti</h2>

            <div className="space-y-4">
                <div>
                    <Label>Nombre</Label>
                    <GlowInput
                        value={localData.displayName || ''}
                        onChange={(e) => handleChange('displayName', e.target.value)}
                        placeholder="Tu nombre"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Edad</Label>
                        <GlowInput
                            type="number"
                            value={localData.age || ''}
                            onChange={(e) => handleChange('age', parseInt(e.target.value))}
                        />
                    </div>
                    <div>
                        <Label>Género</Label>
                        <Select onValueChange={(v) => handleChange('gender', v)} defaultValue={localData.gender}>
                            <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="woman">Mujer</SelectItem>
                                <SelectItem value="man">Hombre</SelectItem>
                                <SelectItem value="non-binary">No binario</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div>
                    <Label>Busco...</Label>
                    <Select onValueChange={(v) => handleChange('seeking', v)} defaultValue={localData.seeking}>
                        <SelectTrigger><SelectValue placeholder="Interés" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="men">Hombres</SelectItem>
                            <SelectItem value="women">Mujeres</SelectItem>
                            <SelectItem value="all">Todos</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Button onClick={handleNext} className="w-full bg-pink-500 hover:bg-pink-600 mt-8">
                Continuar
            </Button>
        </div>
    );
}
