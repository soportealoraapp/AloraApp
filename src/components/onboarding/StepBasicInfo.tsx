'use client';

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { trackEvent } from "@/lib/tracking/client";
import { Heart, Handshake } from "lucide-react";
import { motion } from "framer-motion";
import { UserProfile, ConnectionIntent } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { CITIES } from "@/lib/location/data/cities";

interface StepBasicInfoProps {
    userId?: string;
    data: Partial<UserProfile>;
    onUpdate: (data: Partial<UserProfile>) => void;
    onNext: () => void;
    onPrev?: () => void;
}

export function StepBasicInfo({ data, onUpdate, onNext, userId, onPrev }: StepBasicInfoProps) {
    const [localData, setLocalData] = useState<Partial<UserProfile>>(data);
    const [citySearch, setCitySearch] = useState('');
    const [debouncedCitySearch, setDebouncedCitySearch] = useState('');
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [citySelectedFromDropdown, setCitySelectedFromDropdown] = useState(Boolean(data?.city));
    const cityDropdownRef = useRef<HTMLDivElement>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const initializedRef = useRef(false);

    const selectedModes: ConnectionIntent[] = (localData.connectionModes || ['dating']) as ConnectionIntent[];

    useEffect(() => {
        if (!initializedRef.current && data && Object.keys(data).length > 0) {
            initializedRef.current = true;
            setLocalData({ ...data, lookingFor: data.lookingFor || (data.connectionModes?.includes('dating') ? 'serious' : 'friendship') });
        }
    }, [data]);

    const handleChange = (field: keyof UserProfile, value: unknown) => {
        setLocalData((prev) => ({ ...prev, [field]: value }));
    };

    const toggleMode = (mode: ConnectionIntent) => {
        const current = selectedModes;
        let next: ConnectionIntent[];
        if (current.includes(mode) && current.length > 1) {
            next = current.filter(m => m !== mode);
        } else if (!current.includes(mode)) {
            next = [...current, mode];
        } else {
            next = current;
        }
        handleChange('connectionModes', next);
        if (next.length === 1) {
            handleChange('lookingFor', next[0] === 'dating' ? 'serious' : 'friendship');
        } else if (next.length > 1) {
            handleChange('lookingFor', 'serious');
        }
    };

    const handleNext = () => {
        onUpdate(localData);
        trackEvent('REGISTRATION_STEP_COMPLETED', { step: 'basic_info', userId });
        onNext();
    };

    const isValid = useMemo(() =>
        Boolean(localData.displayName?.trim()) &&
        Boolean(localData.age && localData.age >= 18 && localData.age <= 120) &&
        Boolean(localData.gender) &&
        Boolean(localData.city?.trim()) &&
        citySelectedFromDropdown &&
        selectedModes.length > 0,
        [localData.displayName, localData.age, localData.gender, localData.city, selectedModes, citySelectedFromDropdown]
    );

    const filteredCities = useMemo(() => {
        if (!debouncedCitySearch.trim()) return CITIES.slice(0, 8);
        const query = debouncedCitySearch.toLowerCase();
        return CITIES.filter(c => c.name.toLowerCase().includes(query)).slice(0, 8);
    }, [debouncedCitySearch]);

    // Debounce city search
    useEffect(() => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            setDebouncedCitySearch(citySearch);
        }, 300);
        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, [citySearch]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target as Node)) {
                setShowCityDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                        maxLength={50}
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
                            placeholder="24"
                            value={localData.age ?? ''}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === '') {
                                    handleChange('age', undefined);
                                    return;
                                }
                                const v = parseInt(val);
                                handleChange('age', isNaN(v) ? undefined : v);
                            }}
                            className="rounded-2xl h-12 border-muted focus-visible:ring-primary/20 bg-background/50"
                        />
                        {localData.age !== undefined && (localData.age < 18 || localData.age > 120) && (
                            <p className="text-[10px] text-destructive mt-1 ml-2">Debes ser mayor de 18 años</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Género</Label>
                        <Select
                            value={localData.gender || undefined}
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
                    transition={{ delay: 0.25 }}
                    className="space-y-2"
                >
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Busco
                    </Label>
                    <div className="grid grid-cols-2 gap-2" role="group" aria-label="Tipo de conexión">
                        <button
                            type="button"
                            onClick={() => toggleMode('dating')}
                            aria-pressed={selectedModes.includes('dating')}
                            className={cn(
                                'flex items-center justify-center gap-2 rounded-2xl border-2 p-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                                selectedModes.includes('dating')
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-muted text-muted-foreground hover:border-primary/30'
                            )}
                        >
                            <Heart className={cn('h-4 w-4', selectedModes.includes('dating') && 'fill-current')} />
                            Citas
                        </button>
                        <button
                            type="button"
                            onClick={() => toggleMode('friendship')}
                            aria-pressed={selectedModes.includes('friendship')}
                            className={cn(
                                'flex items-center justify-center gap-2 rounded-2xl border-2 p-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                                selectedModes.includes('friendship')
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-muted text-muted-foreground hover:border-primary/30'
                            )}
                        >
                            <Handshake className="h-4 w-4" />
                            Amistad
                        </button>
                    </div>
                    {selectedModes.length === 2 && (
                        <p className="text-xs text-muted-foreground text-center">Buscas ambos: citas y amistad</p>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="space-y-2"
                    ref={cityDropdownRef}
                >
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Ciudad
                    </Label>
                    <div className="relative">
                        <Input
                            placeholder="Busca tu ciudad"
                            value={localData.city || citySearch}
                            onChange={(e) => {
                                setCitySearch(e.target.value);
                                setShowCityDropdown(true);
                                setCitySelectedFromDropdown(false);
                                handleChange('city', e.target.value);
                            }}
                            onFocus={() => setShowCityDropdown(true)}
                            className="rounded-2xl h-12 border-muted focus-visible:ring-primary/20 bg-background/50"
                        />
                        {showCityDropdown && filteredCities.length > 0 && (
                            <div className="absolute z-50 mt-1 w-full rounded-xl border bg-background shadow-lg max-h-48 overflow-y-auto">
                                {filteredCities.map((city) => (
                                    <button
                                        key={city.id}
                                        type="button"
                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors first:rounded-t-xl last:rounded-b-xl"
                                        onClick={() => {
                                            handleChange('city', city.name);
                                            setCitySearch('');
                                            setShowCityDropdown(false);
                                            setCitySelectedFromDropdown(true);
                                        }}
                                    >
                                        {city.name}, {city.countryCode === 'MX' ? 'México' : city.countryCode}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
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
                    <p className="text-xs text-amber-600 dark:text-amber-400 text-center mt-2">
                        Nombre, edad, género y ciudad son necesarios para encontrar tu mejor match
                    </p>
                )}
            </div>
        </div>
    );
}
