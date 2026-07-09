export const INTERESTS = [
  'Música', 'Cine', 'Libros', 'Arte', 'Fotografía', 'Teatro', 'Museos', 'Baile',
  'Viajes', 'Cocina', 'Moda', 'Yoga', 'Meditación', 'Jardinería', 'Mascotas', 'Fitness',
  'Deporte', 'Naturaleza', 'Senderismo', 'Buceo', 'Escalada', 'Ciclismo', 'Correr', 'Surf',
  'Gaming', 'Series', 'Anime', 'Comedia', 'Podcasts', 'Tecnología', 'Astronomía', 'Cócteles',
  'Gastronomía', 'Camping', 'Pesca', 'Ajedrez', 'Pintura', 'Cerámica', 'Pilates', 'CrossFit',
  'Natación', 'Tenis', 'Boxeo', 'Escritura', 'Poesía', 'Canto', 'Instrumentos', 'Voluntariado',
  'Emprendimiento', 'Idiomas', 'Repostería', 'Café', 'Tatuajes', 'Juegos de Mesa', 'Kayak', 'Vela',
  'Paracaidismo', 'Artes Marciales', 'Patinaje', 'Esquí', 'Go Kart', 'Paintball', 'Escape Rooms',
  'Coleccionismo', 'Antigüedades', 'Aromaterapia', 'Cuidado Personal', 'Moda Sostenible'
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
  },
  {
    name: 'Deportes',
    items: ['Natación', 'Tenis', 'Boxeo', 'Pilates', 'CrossFit', 'Artes Marciales', 'Patinaje', 'Esquí'] as const
  },
  {
    name: 'Creatividad',
    items: ['Pintura', 'Cerámica', 'Escritura', 'Poesía', 'Canto', 'Instrumentos', 'Fotografía', 'Tatuajes'] as const
  },
  {
    name: 'Bienestar',
    items: ['Yoga', 'Meditación', 'Aromaterapia', 'Cuidado Personal', 'Jardinería', 'Voluntariado', 'Emprendimiento', 'Idiomas'] as const
  },
  {
    name: 'Social',
    items: ['Gastronomía', 'Cócteles', 'Café', 'Repostería', 'Camping', 'Pesca', 'Juegos de Mesa', 'Escape Rooms'] as const
  }
] as const;

export const VALUES = [
  'Honestidad', 'Respeto', 'Lealtad', 'Humor', 'Aventura',
  'Familia', 'Crecimiento', 'Independencia', 'Creatividad', 'Empatía',
  'Disciplina', 'Paciencia', 'Tolerancia', 'Generosidad', 'Gratitud',
  'Compromiso', 'Responsabilidad', 'Libertad', 'Equilibrio', 'Espontaneidad',
  'Ambición', 'Originalidad', 'Sabiduría', 'Coraje', 'Fe',
  'Tradición', 'Sostenibilidad', 'Solidaridad', 'Perseverancia', 'Alegría'
] as const;

export const MUSIC_GENRES = [
  'Pop', 'Rock', 'Jazz', 'Clásica', 'Electrónica', 'Hip-Hop',
  'Reggaeton', 'Salsa', 'Country', 'Indie', 'R&B', 'Folk',
  'Metal', 'Punk', 'Ska', 'Reggae', 'Blues', 'Soul', 'Funk', 'Disco',
  'Techno', 'House', 'Trance', 'Drum and Bass', 'Dubstep', 'Ambient',
  'Bossa Nova', 'Cumbia', 'Banda', 'Norteño', 'Mariachi', 'Ranchera',
  'Bolero', 'Balada', 'Tropical', 'Merengue', 'Bachata', 'Flamenco',
  'K-pop', 'J-pop', 'Rap', 'Trap', 'Corridos', 'Corridos Tumbados',
  'Música Mexicana', 'New Age', 'Gospel', 'Afrobeat', 'Garage Rock', 'Shoegaze'
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

export const AGE_GATE_KEY = 'alora_age_gate';
export const FREE_DAILY_LIKES_LIMIT = 11;
