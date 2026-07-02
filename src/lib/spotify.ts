import crypto from 'crypto';

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

const SCOPES = ['user-top-read'].join(' ');

function getClientId(): string {
  return process.env.SPOTIFY_CLIENT_ID || '';
}

function getClientSecret(): string {
  return process.env.SPOTIFY_CLIENT_SECRET || '';
}

function getRedirectUri(): string {
  return process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/api/spotify/callback';
}

function getEncryptionKey(): Buffer {
  const key = process.env.MEMORY_ENCRYPTION_KEY;
  if (!key) throw new Error('MEMORY_ENCRYPTION_KEY is required for Spotify token encryption');
  return crypto.scryptSync(key, 'spotify-salt', 32);
}

export function encryptToken(token: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptToken(encryptedToken: string): string {
  const key = getEncryptionKey();
  const [ivHex, authTagHex, encrypted] = encryptedToken.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function generateAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: getClientId(),
    response_type: 'code',
    redirect_uri: getRedirectUri(),
    state,
    scope: SCOPES,
    show_dialog: 'false',
  });
  return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const basic = Buffer.from(`${getClientId()}:${getClientSecret()}`).toString('base64');

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      redirect_uri: getRedirectUri(),
      grant_type: 'authorization_code',
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Spotify token exchange failed: ${res.status} ${error}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
  newRefreshToken?: string;
}> {
  const basic = Buffer.from(`${getClientId()}:${getClientSecret()}`).toString('base64');

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Spotify token refresh failed: ${res.status} ${error}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
    // Spotify may rotate the refresh token — return it if present
    newRefreshToken: data.refresh_token || undefined,
  };
}

export async function getSpotifyProfile(accessToken: string): Promise<{
  id: string;
  displayName: string;
}> {
  const res = await fetch(`${SPOTIFY_API_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error('Failed to fetch Spotify profile');

  const data = await res.json();
  return {
    id: data.id,
    displayName: data.display_name || data.id,
  };
}

export async function getTopTracks(
  accessToken: string,
  limit: number = 10
): Promise<SpotifyApiTrack[]> {
  const res = await fetch(
    `${SPOTIFY_API_BASE}/me/top/tracks?time_range=medium_term&limit=${limit}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) throw new Error('Failed to fetch top tracks');

  const data = await res.json();
  return (data.items || []).map(mapTrack);
}

export async function getTopArtists(
  accessToken: string,
  limit: number = 10
): Promise<SpotifyApiArtist[]> {
  const res = await fetch(
    `${SPOTIFY_API_BASE}/me/top/artists?time_range=medium_term&limit=${limit}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) throw new Error('Failed to fetch top artists');

  const data = await res.json();
  return (data.items || []).map(mapArtist);
}

interface SpotifyTrackItem {
  id: string;
  name: string;
  artists: { name: string }[];
  uri?: string;
  external_urls?: { spotify?: string };
  album?: { images?: { url?: string }[] };
}

interface SpotifyArtistItem {
  id: string;
  name: string;
  genres?: string[];
  external_urls?: { spotify?: string };
  images?: { url?: string }[];
}

export interface SpotifyApiTrack {
  id: string;
  name: string;
  artists: string[];
  uri?: string;
  externalUrl?: string;
  imageUrl?: string | null;
}

export interface SpotifyApiArtist {
  id: string;
  name: string;
  genres?: string[];
  externalUrl?: string;
  imageUrl?: string | null;
}

function mapTrack(item: SpotifyTrackItem): SpotifyApiTrack {
  return {
    id: item.id,
    name: item.name,
    artists: (item.artists || []).map(a => a.name),
    uri: item.uri,
    externalUrl: item.external_urls?.spotify,
    imageUrl: item.album?.images?.[0]?.url || null,
  };
}

function mapArtist(item: SpotifyArtistItem): SpotifyApiArtist {
  return {
    id: item.id,
    name: item.name,
    genres: item.genres,
    externalUrl: item.external_urls?.spotify,
    imageUrl: item.images?.[0]?.url || null,
  };
}
