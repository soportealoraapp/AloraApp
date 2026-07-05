import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, Loader2, Check, CheckCheck, Expand, X } from 'lucide-react';
import { Message } from '@/lib/domain/types';
import { Card } from '@/components/ui/card';
import { MessageReactions } from './MessageReactions';

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  currentUserId?: string;
  onReact?: (messageId: string, emoji: string) => void;
  onRetry?: (message: Message) => void;
}

import { motion, AnimatePresence } from 'framer-motion';
import { SafeImage } from '@/components/ui/safe-image';

function formatTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'ahora';
  if (diffMins < 60) return `hace ${diffMins} min`;

  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const MemoizedMessageBubble = React.memo(function MessageBubble({ message, isMe, currentUserId, onReact, onRetry }: MessageBubbleProps) {
  const isPending = message.status === 'pending';
  const isFlagged = message.status === 'flagged';
  const isFailed = message.status === 'failed';
  const isRead = !!message.readAt;
  const isDelivered = message.status === 'delivered' || message.status === 'sent';
  const isImage = message.type === 'image';
  const [showImagePreview, setShowImagePreview] = useState(false);

  useEffect(() => {
    if (!showImagePreview) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowImagePreview(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showImagePreview]);

  const handleReact = useCallback((emoji: string) => {
    if (onReact && currentUserId) {
      onReact(message.id, emoji);
    }
  }, [onReact, currentUserId, message.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className={cn('flex flex-col gap-1 w-full', isMe ? 'items-end' : 'items-start')}
    >
      {isImage ? (
        <div className={cn('max-w-[80%] md:max-w-[70%]', isMe ? 'ml-auto' : 'mr-auto')}>
          <div
            className={cn(
              'relative rounded-2xl overflow-hidden cursor-pointer group',
              isMe ? 'rounded-br-sm' : 'rounded-bl-sm',
              isFlagged && 'opacity-50 grayscale'
            )}
            onClick={() => !isFlagged && setShowImagePreview(true)}
            onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !isFlagged) { e.preventDefault(); setShowImagePreview(true); } }}
            role="button"
            tabIndex={0}
            aria-label="Ver imagen ampliada"
          >
            <div className="relative w-[280px] h-[280px] md:w-[320px] md:h-[320px] bg-muted">
              <SafeImage
                src={message.content}
                alt="Imagen compartida"
                fill
                sizes="(max-width: 768px) 80vw, 320px"
                className="object-contain rounded-xl transition-transform group-hover:scale-[1.02]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <Expand className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className={cn(
              'flex items-center justify-end gap-1.5 px-3 py-1',
              isMe ? 'bg-primary' : 'bg-secondary'
            )}>
              <span className={cn(
                'text-xs leading-none',
                isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'
              )}>
                {formatTime(message.createdAt)}
              </span>
              {isMe && (
                isPending ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> :
                isFailed ? (
                  <button
                    onClick={() => onRetry?.(message)}
                    className="h-3 w-3 text-destructive hover:text-destructive/80 transition-colors cursor-pointer"
                    title="Toca para reenviar"
                    aria-label="Reenviar mensaje"
                  >
                    <AlertCircle className="h-3 w-3" />
                  </button>
                ) :
                isRead ? <CheckCheck className="h-3 w-3 text-blue-300" /> :
                <Check className={cn('h-3 w-3', isDelivered ? 'text-primary-foreground/70' : 'opacity-40')} />
              )}
            </div>
          </div>

          {currentUserId && (
            <MessageReactions
              reactions={message.reactions || {}}
              currentUserId={currentUserId}
              onReact={handleReact}
              isMe={isMe}
            />
          )}

          {isFlagged && isMe && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1 text-xs text-destructive px-1 mt-1"
            >
              <AlertCircle className="h-3 w-3" />
              <span>Imagen bloqueada por moderación</span>
            </motion.div>
          )}
        </div>
      ) : (
        <div className={cn('max-w-[80%] md:max-w-[70%]', isMe ? 'ml-auto' : 'mr-auto')}>
          <Card
            className={cn(
              'rounded-2xl px-4 py-2.5 relative shadow-sm',
              isMe
                ? 'rounded-br-sm bg-primary text-primary-foreground'
                : 'rounded-bl-sm bg-secondary text-secondary-foreground',
              isFlagged && 'opacity-50 grayscale',
              isFailed && 'opacity-50 border border-destructive/50'
            )}
          >
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
              {isFailed && isMe ? 'Error al enviar' : isFlagged && !isMe ? 'Mensaje oculto por moderación' : (typeof message.content === 'string' ? message.content : JSON.stringify(message.content))}
            </p>

            <div className="flex items-center justify-end gap-1.5 mt-1">
              <span className={cn(
                'text-xs leading-none',
                isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'
              )}>
                {formatTime(message.createdAt)}
              </span>

              {isMe && (
                <div className="flex items-center" aria-live="polite">
                  {isPending ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  ) : isFailed ? (
                    <button
                      onClick={() => onRetry?.(message)}
                      className="h-3 w-3 text-destructive hover:text-destructive/80 transition-colors cursor-pointer"
                      title="Toca para reenviar"
                      aria-label="Reenviar mensaje"
                    >
                      <AlertCircle className="h-3 w-3" />
                    </button>
                  ) : isRead ? (
                    <CheckCheck className="h-3 w-3 text-blue-300" />
                  ) : (
                    <Check className={cn('h-3 w-3', isDelivered ? 'text-primary-foreground/70' : 'opacity-40')} />
                  )}
                </div>
              )}
            </div>
          </Card>

          {currentUserId && (
            <MessageReactions
              reactions={message.reactions || {}}
              currentUserId={currentUserId}
              onReact={handleReact}
              isMe={isMe}
            />
          )}
        </div>
      )}

      {/* Image fullscreen preview modal */}
      <AnimatePresence>
        {showImagePreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setShowImagePreview(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Imagen ampliada"
          >
            <button
              onClick={() => setShowImagePreview(false)}
              className="absolute top-4 right-4 z-50 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-colors"
              aria-label="Cerrar imagen"
            >
              <X className="h-6 w-6 text-white" />
            </button>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-full max-h-full"
              onClick={e => e.stopPropagation()}
            >
              <SafeImage
                src={message.content}
                alt="Imagen ampliada"
                width={800}
                height={800}
                className="object-contain max-h-[80vh] rounded-xl"
                loading="lazy"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export { MemoizedMessageBubble as MessageBubble };
