'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Send } from 'lucide-react';
import { HeartArrow } from '@/components/ui/custom/HeartArrow';
import { SafeImage } from '@/components/ui/safe-image';
import Link from 'next/link';
import { ConnectionIntent } from '@/lib/domain/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SentLike {
  id: string;
  targetUserId: string;
  displayName: string;
  photos: string[];
  age: number | null;
  city: string | null;
  isVerified: boolean;
  type: string;
  intent: string;
  sentAt: string;
}

interface LikesSentSectionProps {
  intent?: ConnectionIntent;
}

export const LikesSentSection = React.memo(function LikesSentSection({ intent = 'dating' }: LikesSentSectionProps) {
  const [sentLikes, setSentLikes] = useState<SentLike[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/match/likes-sent?intent=${intent}&limit=12`)
      .then(r => r.json())
      .then(data => { setSentLikes(data.likes || []); })
      .catch(() => { setSentLikes([]); })
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
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-[3/4] bg-muted-foreground/10 rounded-2xl animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sentLikes.length === 0) return null;

  return (
    <Card className="rounded-2xl border-dashed border-2 border-muted-foreground/20 bg-muted/10">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <Send className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-lg">Likes Enviados</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-muted-foreground cursor-help text-sm">?</span>
              </TooltipTrigger>
              <TooltipContent side="top"><p className="text-xs max-w-[200px]">Likes y Flechados que enviaste. Recibirás un match si te dan like de vuelta.</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Esperando respuesta de estas personas</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {sentLikes.map((like) => (
            <Link key={like.id} href={`/profile/${like.targetUserId}?source=likes-sent`} className="block">
              <Card className="rounded-2xl overflow-hidden shadow-sm border group">
                <div className="aspect-[3/4] relative">
                  <SafeImage
                    src={like.photos?.[0] || '/placeholder.svg'}
                    alt={like.displayName || ''}
                    fill
                    sizes="(max-width: 640px) 33vw, 25vw"
                    className="object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  {like.type === 'superlike' && (
                    <div className="absolute top-2 right-2 bg-amber-500/90 backdrop-blur-sm text-white rounded-full p-1 shadow-sm">
                      <HeartArrow className="h-3 w-3" />
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="text-white text-xs font-bold leading-tight truncate">
                      {like.displayName}{like.age ? `, ${like.age}` : ''}
                    </div>
                    {like.city && (
                      <div className="text-white/70 text-[10px] truncate">{like.city}</div>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
