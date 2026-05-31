export const INTERESTS = [
  'Música', 'Cine', 'Libros', 'Arte', 'Fotografía', 'Teatro', 'Museos', 'Baile',
  'Viajes', 'Cocina', 'Moda', 'Yoga', 'Meditación', 'Jardinería', 'Mascotas', 'Fitness',
  'Deporte', 'Naturaleza', 'Senderismo', 'Buceo', 'Escalada', 'Ciclismo', 'Correr', 'Surf',
  'Gaming', 'Series', 'Anime', 'Comedia', 'Podcasts', 'Tecnología', 'Astronomía', 'Cócteles'
] as const;

export const INTEREST_CATEGORIES = [
  {
    name: 'Arte y Cultura',
    items: ['Música', 'Cine', 'Libros', 'Arte', 'Fotografía', 'Teatro', 'Museos', 'Baile'] as const
  },
  {
    name: 'Estilo de Vida',
    items: ['Viajes', 'Cocina', 'Moda', 'Yoga', 'Meditación', 'Jardinería', 'Mascotas', 'Fitness'] as const
  },
  {
    name: 'Aventura',
    items: ['Deporte', 'Naturaleza', 'Senderismo', 'Buceo', 'Escalada', 'Ciclismo', 'Correr', 'Surf'] as const
  },
  {
    name: 'Entretenimiento',
    items: ['Gaming', 'Series', 'Anime', 'Comedia', 'Podcasts', 'Tecnología', 'Astronomía', 'Cócteles'] as const
  }
] as const;

export const VALUES = [
  'Honestidad', 'Respeto', 'Lealtad', 'Humor', 'Aventura',
  'Familia', 'Crecimiento', 'Independencia', 'Creatividad', 'Empatía'
] as const;

export const MUSIC_GENRES = [
  'Pop', 'Rock', 'Jazz', 'Clásica', 'Electrónica', 'Hip-Hop',
  'Reggaeton', 'Salsa', 'Country', 'Indie', 'R&B', 'Folk'
] as const;

export const LIFESTYLE_OPTIONS = {
  smoking: ['No fumo', 'Ocasionalmente', 'Sí, fumo'] as const,
  drinking: ['No bebo', 'Socialmente', 'Regularmente'] as const,
  children: ['Quiero hijos', 'Tengo hijos', 'No quiero hijos', 'Abierto/a'] as const,
  education: ['Secundaria', 'Preparatoria', 'Universidad', 'Maestría', 'Doctorado'] as const,
  religion: ['Cristiano', 'Católico', 'Ateo', 'Agnóstico', 'Otro'] as const
} as const;

export const MAX_INTERESTS = 10;
export const MAX_VALUES = 5;
export const MAX_MUSIC_GENRES = 5;
