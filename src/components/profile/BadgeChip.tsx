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
};

const VALUE_EMOJIS: Record<string, string> = {
  'Honestidad': '🤝', 'Respeto': '🙏', 'Lealtad': '🛡️', 'Humor': '😄', 'Aventura': '🚀',
  'Familia': '👨‍👩‍👧‍👦', 'Crecimiento': '🌱', 'Independencia': '🦅', 'Creatividad': '💡', 'Empatía': '💕',
};

const MUSIC_EMOJIS: Record<string, string> = {
  'Pop': '🎤', 'Rock': '🎸', 'Jazz': '🎷', 'Clásica': '🎻', 'Electrónica': '🎧',
  'Hip-Hop': '🎙️', 'Reggaeton': '🕺', 'Salsa': '💃', 'Country': '🤠', 'Indie': '🎸',
  'R&B': '🎵', 'Folk': '🪕',
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
