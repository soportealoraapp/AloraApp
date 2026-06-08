'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music, ExternalLink, Headphones, Disc3, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

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
  playlistId?: string | null;
  playlistUrl?: string | null;
  lastSyncedAt?: string | null;
}

interface SpotifySectionProps {
  spotify: SpotifyData | null | undefined;
  isOwn?: boolean;
}

export function SpotifySection({ spotify, isOwn }: SpotifySectionProps) {
  const [showEmbed, setShowEmbed] = useState(false);
  const [syncing, setSyncing] = useState(false);

  if (!spotify || (!spotify.topTracks?.length && !spotify.topArtists?.length)) {
    if (!isOwn) return null;
    return (
      <Card className="rounded-3xl">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-full">
              <Music className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Conecta tu Spotify</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Muestra tus artistas y canciones favoritas en tu perfil
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.href = '/api/spotify/connect'}
              >
                <Music className="h-4 w-4 mr-2" /> Conectar Spotify
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
            <span className="text-[10px] text-muted-foreground ml-auto">
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
                    window.location.reload();
                  }
                } catch {}
                setSyncing(false);
              }}
              disabled={syncing}
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
                    <Image
                      src={artist.imageUrl}
                      alt={artist.name}
                      width={20}
                      height={20}
                      className="rounded-full"
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
                    <Image
                      src={track.imageUrl}
                      alt={track.name}
                      width={40}
                      height={40}
                      className="rounded-lg object-cover"
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

        {spotify.playlistUrl && !showEmbed && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full text-xs"
            onClick={() => setShowEmbed(true)}
          >
            Mostrar playlist
          </Button>
        )}

        {spotify.playlistId && showEmbed && (
          <div className="mt-3">
            <iframe
              src={`https://open.spotify.com/embed/playlist/${spotify.playlistId}`}
              width="100%"
              height="152"
              allow="encrypted-media"
              className="rounded-xl"
            />
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs mt-1"
              onClick={() => setShowEmbed(false)}
            >
              Ocultar playlist
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
