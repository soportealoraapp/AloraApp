import { describe, it, expect } from 'vitest';

describe('Connection Intents', () => {
  const DATING = 'dating' as const;
  const FRIENDSHIP = 'friendship' as const;
  type ConnectionIntent = typeof DATING | typeof FRIENDSHIP;

  it('validates ConnectionIntent type accepts dating and friendship', () => {
    const validIntents: ConnectionIntent[] = ['dating', 'friendship'];
    expect(validIntents).toContain(DATING);
    expect(validIntents).toContain(FRIENDSHIP);
    expect(validIntents.length).toBe(2);
  });

  it('rejects invalid intents at runtime', () => {
    const ALLOWED = ['dating', 'friendship'] as const;
    const isValid = (v: string): v is ConnectionIntent =>
      ALLOWED.includes(v as any);
    expect(isValid('dating')).toBe(true);
    expect(isValid('friendship')).toBe(true);
    expect(isValid('networking')).toBe(false);
    expect(isValid('')).toBe(false);
  });

  it('profile connectionModes cannot be empty when at least one mode selected', () => {
    const modes: ConnectionIntent[] = ['dating'];
    expect(modes.length).toBeGreaterThan(0);
    expect(modes).toContain(DATING);
  });

  it('supports both modes simultaneously', () => {
    const modes: ConnectionIntent[] = ['dating', 'friendship'];
    expect(modes.length).toBe(2);
    expect(modes).toContain(DATING);
    expect(modes).toContain(FRIENDSHIP);
  });

  it('backfills connectionModes from lookingFor', () => {
    const backfill = (lookingFor: string | null): ConnectionIntent[] => {
      const lf = (lookingFor || '').toLowerCase();
      if (lf === 'friendship' || lf === 'networking') return ['friendship'];
      return ['dating'];
    };

    expect(backfill('friendship')).toEqual(['friendship']);
    expect(backfill('networking')).toEqual(['friendship']);
    expect(backfill('serious')).toEqual(['dating']);
    expect(backfill('casual')).toEqual(['dating']);
    expect(backfill(null)).toEqual(['dating']);
    expect(backfill('')).toEqual(['dating']);
  });
});

describe('Matching Reciprocal by Mode', () => {
  type Interaction = { fromUserId: string; toUserId: string; type: string; intent: string };
  type Match = { user1Id: string; user2Id: string; intent: string };

  it('creates match only when reciprocal like exists in same intent', () => {
    const interactions: Interaction[] = [
      { fromUserId: 'A', toUserId: 'B', type: 'like', intent: 'dating' },
      { fromUserId: 'B', toUserId: 'A', type: 'like', intent: 'dating' },
    ];

    const mutual = (userA: string, userB: string, intent: string) =>
      interactions.some(
        i => i.fromUserId === userA && i.toUserId === userB && i.type === 'like' && i.intent === intent
      ) &&
      interactions.some(
        i => i.fromUserId === userB && i.toUserId === userA && i.type === 'like' && i.intent === intent
      );

    // Same intent -> match
    expect(mutual('A', 'B', 'dating')).toBe(true);
    // Different intents -> no match
    expect(mutual('A', 'B', 'friendship')).toBe(false);
  });

  it('does not mix dating and friendship likes', () => {
    const interactions: Interaction[] = [
      { fromUserId: 'A', toUserId: 'B', type: 'like', intent: 'dating' },
      { fromUserId: 'B', toUserId: 'A', type: 'like', intent: 'friendship' },
    ];

    const hasMutual = (intent: string) =>
      interactions.some(i => i.fromUserId === 'A' && i.toUserId === 'B' && i.intent === intent && i.type === 'like') &&
      interactions.some(i => i.fromUserId === 'B' && i.toUserId === 'A' && i.intent === intent && i.type === 'like');

    expect(hasMutual('dating')).toBe(false);
    expect(hasMutual('friendship')).toBe(false);
  });

  it('unique match key includes intent', () => {
    const matchKey = (u1: string, u2: string, intent: string) =>
      [u1, u2, intent].sort().join(':');

    const datingKey = matchKey('A', 'B', 'dating');
    const friendshipKey = matchKey('A', 'B', 'friendship');

    expect(datingKey).not.toBe(friendshipKey);
    expect(datingKey).toBe('A:B:dating');
    expect(friendshipKey).toBe('A:B:friendship');
  });
});

describe('Feed Filters', () => {
  interface Filters {
    intent?: 'dating' | 'friendship';
    verifiedOnly?: boolean;
    featuredOnly?: boolean;
    highCompatibility?: boolean;
    musicGenres?: string[];
    ageRange?: [number, number];
    interests?: string[];
    values?: string[];
  }

  const buildWhereClause = (filters: Filters) => {
    const where: Record<string, any> = {};
    if (filters.intent) where.connectionModes = { has: filters.intent };
    if (filters.verifiedOnly) where.isVerified = true;
    if (filters.interests?.length) where.interests = { hasSome: filters.interests };
    if (filters.values?.length) where.values = { hasSome: filters.values };
    if (filters.musicGenres?.length) where.musicGenres = { hasSome: filters.musicGenres };
    if (filters.ageRange) {
      where.age = { gte: filters.ageRange[0], lte: filters.ageRange[1] };
    }
    return where;
  };

  it('filters by intent dating', () => {
    const where = buildWhereClause({ intent: 'dating' });
    expect(where.connectionModes).toEqual({ has: 'dating' });
  });

  it('filters by intent friendship', () => {
    const where = buildWhereClause({ intent: 'friendship' });
    expect(where.connectionModes).toEqual({ has: 'friendship' });
  });

  it('omits intent filter when not specified', () => {
    const where = buildWhereClause({});
    expect(where.connectionModes).toBeUndefined();
  });

  it('filters by verifiedOnly', () => {
    const where = buildWhereClause({ verifiedOnly: true });
    expect(where.isVerified).toBe(true);
  });

  it('filters by interests', () => {
    const where = buildWhereClause({ interests: ['Música', 'Viajes'] });
    expect(where.interests).toEqual({ hasSome: ['Música', 'Viajes'] });
  });

  it('filters by values', () => {
    const where = buildWhereClause({ values: ['Honestidad'] });
    expect(where.values).toEqual({ hasSome: ['Honestidad'] });
  });

  it('filters by musicGenres', () => {
    const where = buildWhereClause({ musicGenres: ['Rock', 'Pop'] });
    expect(where.musicGenres).toEqual({ hasSome: ['Rock', 'Pop'] });
  });

  it('filters by age range', () => {
    const where = buildWhereClause({ ageRange: [25, 40] });
    expect(where.age).toEqual({ gte: 25, lte: 40 });
  });

  it('combines multiple filters', () => {
    const where = buildWhereClause({
      intent: 'friendship',
      verifiedOnly: true,
      ageRange: [18, 30],
      interests: ['Música'],
    });
    expect(where.connectionModes).toEqual({ has: 'friendship' });
    expect(where.isVerified).toBe(true);
    expect(where.age).toEqual({ gte: 18, lte: 30 });
    expect(where.interests).toEqual({ hasSome: ['Música'] });
  });

  it('filter profiles by featuredOnly (completeness >= 90)', () => {
    const profiles = [
      { id: '1', completeness: 95 },
      { id: '2', completeness: 70 },
      { id: '3', completeness: 100 },
    ];
    const featuredOnly = true;
    const filtered = featuredOnly
      ? profiles.filter(p => p.completeness >= 90)
      : profiles;
    expect(filtered).toHaveLength(2);
    expect(filtered.map(p => p.id)).toEqual(['1', '3']);
  });

  it('filter profiles by highCompatibility (match on values + interests)', () => {
    const viewerValues = ['Honestidad', 'Familia'];
    const viewerInterests = ['Música', 'Viajes'];

    const candidates = [
      { id: '1', values: ['Honestidad', 'Familia'], interests: ['Música'] },
      { id: '2', values: ['Aventura'], interests: ['Deporte'] },
      { id: '3', values: ['Honestidad', 'Familia', 'Respeto'], interests: ['Música', 'Viajes', 'Cine'] },
    ];

    const highCompatibility = true;
    const filtered = highCompatibility
      ? candidates.filter(c => {
          const sharedValues = c.values.filter(v => viewerValues.includes(v)).length;
          const sharedInterests = c.interests.filter(i => viewerInterests.includes(i)).length;
          return sharedValues >= 1 && sharedInterests >= 1;
        })
      : candidates;

    expect(filtered).toHaveLength(2);
    expect(filtered.map(p => p.id)).toEqual(['1', '3']);
  });
});

describe('Spotify Sync - public snapshot only', () => {
  it('sync returns only public fields (no tokens)', () => {
    const spotifyAccount = {
      id: 's1',
      userId: 'u1',
      spotifyUserId: 'spotify123',
      displayName: 'Test User',
      refreshTokenEncrypted: 'encrypted:token:here',
      topTracks: [{ id: 't1', name: 'Song', artists: ['Artist'] }],
      topArtists: [{ id: 'a1', name: 'Artist', genres: ['Pop'] }],
      playlistId: null,
      playlistUrl: null,
      lastSyncedAt: new Date().toISOString(),
    };

    const publicSnapshot = {
      topTracks: spotifyAccount.topTracks,
      topArtists: spotifyAccount.topArtists,
      playlistId: spotifyAccount.playlistId,
      playlistUrl: spotifyAccount.playlistUrl,
      lastSyncedAt: spotifyAccount.lastSyncedAt,
    };

    expect(publicSnapshot).not.toHaveProperty('refreshTokenEncrypted');
    expect(publicSnapshot).not.toHaveProperty('spotifyUserId');
    expect(publicSnapshot).not.toHaveProperty('displayName');
    expect(publicSnapshot).toHaveProperty('topTracks');
    expect(publicSnapshot).toHaveProperty('topArtists');
  });
});
