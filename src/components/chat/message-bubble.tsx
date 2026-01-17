import { cn } from '@/lib/utils';
import { AlertCircle, Loader2, Check, CheckCheck } from 'lucide-react';
import { Message } from '@/lib/domain/types';
import { Card } from '@/components/ui/card';

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
}

import { motion } from 'framer-motion';

export function MessageBubble({ message, isMe }: MessageBubbleProps) {
  const isPending = message.status === 'pending';
  const isFlagged = message.status === 'flagged';

  return (
    <motion.div
      initial={{ opacity: 0, x: isMe ? 20 : -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      className={cn('flex flex-col gap-1 w-full', isMe ? 'items-end' : 'items-start')}
    >
      <Card
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2 relative shadow-sm',
          isMe
            ? 'rounded-br-sm bg-primary text-primary-foreground'
            : 'rounded-bl-sm bg-secondary text-secondary-foreground',
          isFlagged && 'opacity-50 grayscale'
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {isFlagged && !isMe ? "Mensaje oculto por moderación" : message.content}
        </p>

        <div className="flex items-center justify-end gap-1 mt-1">
          <span className={cn(
            "text-[10px]",
            isMe ? "text-primary-foreground/70" : "text-muted-foreground"
          )}>
            {message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }) : ""}
          </span>

          {isMe && (
            <div className="flex items-center">
              {isPending ? (
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
              ) : message.readAt ? (
                <CheckCheck className="h-3 w-3 text-primary-foreground" />
              ) : (
                <Check className="h-3 w-3 opacity-70" />
              )}
            </div>
          )}
        </div>
      </Card>

      {isFlagged && isMe && (
        <div className="flex items-center gap-1 text-[10px] text-destructive px-1">
          <AlertCircle className="h-3 w-3" />
          <span>No enviado. Contenido inapropiado.</span>
        </div>
      )}
    </motion.div>
  );
}
