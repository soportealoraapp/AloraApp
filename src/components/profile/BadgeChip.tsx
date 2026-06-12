import { badgeVariants } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const INTEREST_EMOJIS: Record<string, string> = {
  'Música': '🎵', 'Cine': '🎬', 'Libros': '📚', 'Arte': '🎨', 'Fotografía': '📸',
  'Teatro': '🎭', 'Museos': '🏛️', 'Baile': '💃', 'Viajes': '✈️', 'Cocina': '🍳',
  'Moda': '👗', 'Yoga': '🧘', 'Meditación': '🧠', 'Jardinería': '🌱', 'Mascotas': '🐾',
  'Fitness': '💪', 'Deporte': '⚽', 'Naturaleza': '🌿', 'Senderismo': '🥾', 'Buceo': '🤿',
  'Escalada': '🧗', 'Ciclismo': '🚴', 'Correr': '🏃', 'Surf': '🏄',
  'Gaming': '🎮', 'Series': '📺', 'Anime': '🇯🇵', 'Comedia': '😂', 'Podcasts': '🎙️',
  'Tecnología': '💻', 'Astronomía': '🔭', 'Cócteles': '🍸',
  'Gastronomía': '🍽️', 'Camping': '⛺', 'Pesca': '🎣', 'Ajedrez': '♟️', 'Pintura': '🖌️',
  'Cerámica': '🏺', 'Pilates': '🧘', 'CrossFit': '🏋️', 'Natación': '🏊', 'Tenis': '🎾',
  'Boxeo': '🥊', 'Escritura': '✍️', 'Poesía': '📜', 'Canto': '🎤', 'Instrumentos': '🎸',
  'Voluntariado': '🤝', 'Emprendimiento': '🚀', 'Idiomas': '🌐', 'Repostería': '🧁',
  'Café': '☕', 'Tatuajes': '💉', 'Juegos de Mesa': '🎲', 'Kayak': '🛶', 'Vela': '⛵',
  'Paracaidismo': '🪂', 'Artes Marciales': '🥋', 'Patinaje': '🛼', 'Esquí': '⛷️',
  'Go Kart': '🏎️', 'Paintball': '🔫', 'Escape Rooms': '🔑', 'Coleccionismo': '📦',
  'Antigüedades': '🕰️', 'Aromaterapia': '🕯️', 'Cuidado Personal': '✨', 'Moda Sostenible': '♻️'
};

const VALUE_EMOJIS: Record<string, string> = {
  'Honestidad': '🤝', 'Respeto': '🙏', 'Lealtad': '🛡️', 'Humor': '😄', 'Aventura': '🚀',
  'Familia': '👨‍👩‍👧‍👦', 'Crecimiento': '🌱', 'Independencia': '🦅', 'Creatividad': '💡', 'Empatía': '💕',
  'Disciplina': '⭐', 'Paciencia': '⏳', 'Tolerancia': '🌍', 'Generosidad': '🎁', 'Gratitud': '🙏',
  'Compromiso': '💍', 'Responsabilidad': '✅', 'Libertad': '🕊️', 'Equilibrio': '⚖️', 'Espontaneidad': '⚡',
  'Ambición': '🎯', 'Originalidad': '🦄', 'Sabiduría': '📖', 'Coraje': '🦁', 'Fe': '⛪',
  'Tradición': '🏺', 'Sostenibilidad': '🌿', 'Solidaridad': '✊', 'Perseverancia': '🏔️', 'Alegría': '☀️'
};

const MUSIC_EMOJIS: Record<string, string> = {
  'Pop': '🎤', 'Rock': '🎸', 'Jazz': '🎷', 'Clásica': '🎻', 'Electrónica': '🎧',
  'Hip-Hop': '🎙️', 'Reggaeton': '🕺', 'Salsa': '💃', 'Country': '🤠', 'Indie': '🎸',
  'R&B': '🎵', 'Folk': '🪕', 'Metal': '🤘', 'Punk': '⚡', 'Ska': '🏁', 'Reggae': '🇯🇲',
  'Blues': '🎷', 'Soul': '🎹', 'Funk': '🎸', 'Disco': '🪩', 'Techno': '🎹', 'House': '🏠',
  'Trance': '🌀', 'Drum and Bass': '🥁', 'Dubstep': '🔊', 'Ambient': '🌊', 'Bossa Nova': '🎸',
  'Cumbia': '🪗', 'Banda': '🎺', 'Norteño': '🪗', 'Mariachi': '🎻', 'Ranchera': '🤠',
  'Bolero': '🌹', 'Balada': '💌', 'Tropical': '🌴', 'Merengue': '💃', 'Bachata': '🕺',
  'Flamenco': '💃', 'K-pop': '🇰🇷', 'J-pop': '🇯🇵', 'Rap': '🎤', 'Trap': '🔥',
  'Corridos': '🎸', 'Corridos Tumbados': '🔥', 'Música Mexicana': '🇲🇽', 'New Age': '🧘',
  'Gospel': '🙌', 'Afrobeat': '🌍', 'Garage Rock': '🚗', 'Shoegaze': '👟'
};

export type BadgeType = 'interest' | 'value' | 'music';

export function getEmoji(label: string, type: BadgeType): string {
  if (type === 'interest') return INTEREST_EMOJIS[label] || '✨';
  if (type === 'value') return VALUE_EMOJIS[label] || '⭐';
  return MUSIC_EMOJIS[label] || '🎵';
}

interface BadgeChipProps {
  label: string;
  type: BadgeType;
  variant?: 'default' | 'secondary' | 'outline';
  className?: string;
  onClick?: () => void;
}

export function BadgeChip({ label, type, variant, className, onClick }: BadgeChipProps) {
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      className={cn(
        badgeVariants({ variant: variant ?? (type === 'value' ? 'outline' : 'secondary') }),
        'rounded-full text-sm py-1 gap-1 inline-flex items-center',
        onClick && 'cursor-pointer hover:opacity-80',
        className
      )}
    >
      <span className="text-xs">{getEmoji(label, type)}</span>
      {label}
    </Tag>
  );
}

export function BadgeChipList({ items, type, className }: { items: string[]; type: BadgeType; className?: string }) {
  if (!items || items.length === 0) return null;
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {items.map(item => (
        <BadgeChip key={item} label={item} type={type} />
      ))}
    </div>
  );
}
