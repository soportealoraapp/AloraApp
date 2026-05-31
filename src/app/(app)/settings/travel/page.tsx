'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Globe, MapPin, Loader2, ArrowLeft, Plane } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { CityAutocomplete } from '@/components/ui/city-autocomplete';
import type { LocationResult } from '@/lib/location';
import { useAuth } from '@/contexts/AuthContext';
import { PaywallModal } from '@/components/premium/PaywallModal';

export default function TravelModePage() {
    const { profile, refreshProfile } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const [enabled, setEnabled] = useState(false);
    const [city, setCity] = useState('');
    const [countryCode, setCountryCode] = useState('');
    const [startedAt, setStartedAt] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);

    const isPlus = profile?.subscriptionStatus === 'plus';

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/travel');
            const data = await res.json();
            setEnabled(data.enabled || false);
            setCity(data.city || '');
            setCountryCode(data.countryCode || '');
            setStartedAt(data.startedAt || null);
        } catch (error) {
            console.error('Error fetching travel status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (checked: boolean) => {
        if (checked && !isPlus) {
            setShowPaywall(true);
            return;
        }

        if (checked && !city) {
            toast({ title: 'Selecciona una ciudad', description: 'Elige una ciudad para explorar', variant: 'destructive' });
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/travel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: checked, cityId: undefined })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error updating travel mode');
            }

            setEnabled(checked);
            toast({
                title: checked ? 'Modo viaje activado' : 'Modo viaje desactivado',
                description: checked ? `Ahora explorando: ${city}` : 'Volviendo a tu ubicación real'
            });
            await refreshProfile();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleCitySelect = async (location: LocationResult) => {
        setCity(location.city.name);
        setCountryCode(location.city.countryCode);

        if (enabled) {
            setSaving(true);
            try {
                const res = await fetch('/api/travel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ enabled: true, cityId: location.city.id })
                });

                if (!res.ok) throw new Error('Error updating city');

                toast({ title: 'Ciudad actualizada', description: `Ahora explorando: ${location.city.name}` });
                await refreshProfile();
            } catch (error: any) {
                toast({ title: 'Error', description: error.message, variant: 'destructive' });
            } finally {
                setSaving(false);
            }
        }
    };

    if (loading) {
        return (
            <div className="md:pl-60 p-6 flex justify-center py-20">
                <Loader2 className="animate-spin text-pink-500 h-8 w-8" />
            </div>
        );
    }

    return (
        <div className="md:pl-60 p-6 space-y-6 bg-gray-50 min-h-screen">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Modo Viaje</h1>
                    <p className="text-sm text-muted-foreground">Explora personas en otra ciudad</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-xl">
                                <Plane className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Activar Modo Viaje</CardTitle>
                                <CardDescription>
                                    Aparecerás en la ciudad que elijas
                                </CardDescription>
                            </div>
                        </div>
                        <Switch
                            checked={enabled}
                            onCheckedChange={handleToggle}
                            disabled={saving}
                        />
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {enabled && (
                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl">
                            <MapPin className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">
                                Explorando: {city}, {countryCode}
                            </span>
                            {startedAt && (
                                <Badge variant="secondary" className="ml-auto text-xs">
                                    Desde {new Date(startedAt).toLocaleDateString('es-MX')}
                                </Badge>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Ciudad destino</label>
                        <CityAutocomplete
                            value={city}
                            onSelect={handleCitySelect}
                            placeholder="Buscar ciudad..."
                        />
                    </div>

                    {!isPlus && (
                        <div className="p-4 bg-gradient-to-r from-pink-50 to-orange-50 rounded-xl border border-pink-100">
                            <p className="text-sm text-gray-700">
                                <strong>Alora Plus</strong> — El modo viaje es un beneficio exclusivo para suscriptores Plus.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <h3 className="font-semibold mb-3">¿Cómo funciona?</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <Globe className="h-4 w-4 mt-0.5 shrink-0" />
                            Tu perfil aparecerá en la ciudad que elijas
                        </li>
                        <li className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                            Descubrirás personas de esa ciudad
                        </li>
                        <li className="flex items-start gap-2">
                            <Plane className="h-4 w-4 mt-0.5 shrink-0" />
                            Podrás recibir likes de esa ciudad
                        </li>
                    </ul>
                </CardContent>
            </Card>

            <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
        </div>
    );
}
