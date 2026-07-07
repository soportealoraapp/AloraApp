'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music, ExternalLink, Headphones, Disc3, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { SafeImage } from '@/components/ui/safe-image';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface Track {
  id: string;
  name: string;
  artists: string[];
  uri?: string;
  externalUrl?: string;
  imageUrl?: string | null;
}

interface Artist {
  id: string;
  name: string;
  genres?: string[];
  externalUrl?: string;
  imageUrl?: string | null;
}

interface SpotifyData {
  topTracks: Track[];
  topArtists: Artist[];
  lastSyncedAt?: string | Date | null;
}

interface SpotifySectionProps {
  spotify: SpotifyData | null | undefined;
  isOwn?: boolean;
}

export function SpotifySection({ spotify, isOwn }: SpotifySectionProps) {
    const router = useRouter();
    const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(spotify === undefined);

  useEffect(() => {
    if (spotify !== undefined) setLoading(false);
  }, [spotify]);

  if (loading) {
    return (
      <Card className="rounded-3xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-5 w-5 bg-muted-foreground/20 rounded animate-pulse" />
            <div className="h-5 w-24 bg-muted-foreground/20 rounded animate-pulse" />
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-8 w-24 bg-muted-foreground/10 rounded-full animate-pulse" />
            ))}
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted-foreground/10 rounded-lg animate-pulse" />
                <div className="flex-1 h-4 bg-muted-foreground/10 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!spotify || (!spotify.topTracks?.length && !spotify.topArtists?.length)) {
    if (!isOwn) return null;
    // spotify is null = never connected. spotify exists but empty = connected but sync failed.
    const isConnected = spotify !== null && spotify !== undefined;
    return (
      <Card className="rounded-3xl">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-full">
              <Music className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">
                {isConnected ? 'Sincroniza tu Spotify' : 'Conecta tu Spotify'}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {isConnected
                  ? 'Tus datos de Spotify están conectados pero no se pudieron cargar. Sincroniza de nuevo.'
                  : 'Muestra tus artistas y canciones favoritas en tu perfil'}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (isConnected) {
                    setSyncing(true);
                    fetch('/api/spotify/sync', { method: 'POST' })
                      .then(() => router.refresh())
                      .catch(() => setSyncing(false));
                  } else {
                    window.location.href = '/api/spotify/connect';
                  }
                }}
                disabled={syncing}
              >
                {syncing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Music className="h-4 w-4 mr-2" />}
                {isConnected ? 'Sincronizar' : 'Conectar Spotify'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Music className="h-5 w-5 text-green-500" />
          <h3 className="font-semibold text-lg">Spotify</h3>
          {spotify.lastSyncedAt && (
            <span className="text-xs text-muted-foreground ml-auto">
              Sincronizado {new Date(spotify.lastSyncedAt).toLocaleDateString()}
            </span>
          )}
          {isOwn && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={async () => {
                setSyncing(true);
                try {
                  const res = await fetch('/api/spotify/sync', { method: 'POST' });
                  if (res.ok) {
                    router.refresh();
                  } else {
                    toast({ title: 'Error al sincronizar', variant: 'destructive' });
                  }
                } catch {
                  toast({ title: 'Error al sincronizar', variant: 'destructive' });
                }
                setSyncing(false);
              }}
              disabled={syncing}
              aria-label="Sincronizar Spotify"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>

        {spotify.topArtists?.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Headphones className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Artistas favoritos
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {spotify.topArtists.slice(0, 5).map((artist) => (
                <a
                  key={artist.id}
                  href={artist.externalUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-muted/50 rounded-full px-3 py-1.5 text-sm hover:bg-muted transition-colors"
                >
                  {artist.imageUrl && (
                    <SafeImage
                      src={artist.imageUrl}
                      alt={artist.name}
                      width={20}
                      height={20}
                      className="rounded-full"
                      loading="lazy"
                    />
                  )}
                  <span>{artist.name}</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>
        )}

        {spotify.topTracks?.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Disc3 className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Canciones favoritas
              </h4>
            </div>
            <div className="space-y-1">
              {spotify.topTracks.slice(0, 5).map((track, i) => (
                <a
                  key={track.id}
                  href={track.externalUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors group"
                >
                  {track.imageUrl && (
                    <SafeImage
                      src={track.imageUrl}
                      alt={track.name}
                      width={40}
                      height={40}
                      className="rounded-lg object-cover"
                      loading="lazy"
                    />
                  )}
                  {!track.imageUrl && (
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      {i + 1}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{track.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{track.artists?.join(', ')}</p>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
