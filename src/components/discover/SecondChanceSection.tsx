'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, RotateCcw, UserX } from 'lucide-react';
import Image from 'next/image';
import { useSendLike } from '@/hooks/use-send-like';
import { useToast } from '@/hooks/use-toast';
import { ConnectionIntent } from '@/lib/domain/types';

interface SecondChanceSectionProps {
  intent?: ConnectionIntent;
}

export const SecondChanceSection = React.memo(function SecondChanceSection({ intent = 'dating' }: SecondChanceSectionProps) {
  const [passedProfiles, setPassedProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { sendLike } = useSendLike();
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/match/passed?intent=${intent}`)
      .then(r => r.json())
      .then(data => { setPassedProfiles(data.profiles || []); })
      .catch(() => { setPassedProfiles([]); })
      .finally(() => setLoading(false));
  }, [intent]);

  if (loading) {
    return (
      <Card className="rounded-2xl border-dashed border-2 border-muted-foreground/20 bg-muted/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-5 w-5 bg-muted-foreground/20 rounded-full animate-pulse" />
            <div className="h-5 w-40 bg-muted-foreground/20 rounded animate-pulse" />
          </div>
          <div className="h-4 w-64 bg-muted-foreground/20 rounded animate-pulse mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-[3/4] bg-muted-foreground/10 rounded-2xl animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (passedProfiles.length === 0) return null;

  const handleLike = async (profileId: string, intent: ConnectionIntent = 'dating') => {
    try {
      const result = await sendLike(profileId, 'like', intent, false);
      if (result?.matched) {
        toast({ title: '¡Match!', description: '¡Ahora pueden chatear!', duration: 5000 });
      } else {
        toast({ title: '¡Me gusta enviado!' });
      }
      setPassedProfiles(prev => prev.filter(p => p.id !== profileId));
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleDefinitivePass = async (profileId: string) => {
    setPassedProfiles(prev => prev.filter(p => p.id !== profileId));
    toast({ title: 'Descartado definitivamente' });
    await fetch('/api/match/passed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId })
    }).catch(() => {
      toast({ title: 'Error al descartar', variant: 'destructive' });
    });
  };

  return (
    <Card className="rounded-2xl border-dashed border-2 border-muted-foreground/20 bg-muted/10">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <RotateCcw className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-lg">Segunda Oportunidad</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Personas que pasaste. ¿Seguro que no te interesan?</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {passedProfiles.map((profile) => (
            <Card key={profile.id} className="rounded-2xl overflow-hidden shadow-sm border">
              <div className="aspect-[3/4] relative">
                <Image
                  src={profile.photos?.[0] || '/placeholder.svg'}
                  alt={profile.displayName || ''}
                  fill
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-2 left-2 text-white text-xs font-bold">
                  {profile.displayName}, {profile.age}
                </div>
              </div>
              <div className="flex gap-1 p-1.5">
                <Button size="sm" variant="ghost" className="flex-1 h-11" onClick={() => handleLike(profile.id, (profile.intent as ConnectionIntent) || 'dating')} aria-label="Dar like">
                  <Heart className="h-4 w-4 text-primary" />
                </Button>
                <Button size="sm" variant="ghost" className="flex-1 h-11" onClick={() => handleDefinitivePass(profile.id)} aria-label="Rechazar">
                  <UserX className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
