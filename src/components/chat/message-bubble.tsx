import { cn } from '@/lib/utils';
import { AlertCircle, Loader2, Check, CheckCheck } from 'lucide-react';
import { Message } from '@/lib/domain/types';
import { Card } from '@/components/ui/card';

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
}

import { motion } from 'framer-motion';

function formatTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'ahora';
  if (diffMins < 60) return `hace ${diffMins} min`;

  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ message, isMe }: MessageBubbleProps) {
  const isPending = message.status === 'pending';
  const isFlagged = message.status === 'flagged';
  const isRead = !!message.readAt;
  const isDelivered = message.status === 'delivered' || message.status === 'sent';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className={cn('flex flex-col gap-1 w-full', isMe ? 'items-end' : 'items-start')}
    >
      <Card
        className={cn(
          'max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-2.5 relative shadow-sm',
          isMe
            ? 'rounded-br-sm bg-primary text-primary-foreground'
            : 'rounded-bl-sm bg-secondary text-secondary-foreground',
          isFlagged && 'opacity-50 grayscale'
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {isFlagged && !isMe ? 'Mensaje oculto por moderación' : message.content}
        </p>

        <div className="flex items-center justify-end gap-1.5 mt-1">
          <span className={cn(
            'text-[10px] leading-none',
            isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'
          )}>
            {formatTime(message.createdAt)}
          </span>

          {isMe && (
            <div className="flex items-center">
              {isPending ? (
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
              ) : isRead ? (
                <CheckCheck className="h-3 w-3 text-blue-300" />
              ) : (
                <Check className={cn('h-3 w-3', isDelivered ? 'text-primary-foreground/70' : 'opacity-40')} />
              )}
            </div>
          )}
        </div>
      </Card>

      {isFlagged && isMe && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1 text-[10px] text-destructive px-1"
        >
          <AlertCircle className="h-3 w-3" />
          <span>No enviado. Contenido inapropiado.</span>
        </motion.div>
      )}
    </motion.div>
  );
}
