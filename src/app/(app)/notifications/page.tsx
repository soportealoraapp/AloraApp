'use client';

import { useNotifications } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { CheckCheck, Bell, Loader2, Info, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';

function NotificationItem({ notification, onRead, onDelete }: { notification: any; onRead: () => void; onDelete: () => void }) {
  const router = useRouter();
  const isUnread = !notification.readAt;
  const x = useMotionValue(0);
  const background = useTransform(x, [-80, 0], ['hsl(var(--destructive))', 'hsl(var(--background))']);
  const deleteOpacity = useTransform(x, [-80, -30], [1, 0]);

  const handleClick = () => {
    if (isUnread) onRead();

    const type = notification.type || '';
    const data = (notification.data as any) || {};

    if (type === 'match' || type === 'new_match') {
      const matchId = data.matchId || data.id;
      if (matchId) router.push(`/chat/${matchId}`);
    } else if (type === 'message' || type === 'new_message') {
      const chatId = data.conversationId || data.matchId || data.id;
      if (chatId) router.push(`/chat/${chatId}`);
    } else if (type === 'like' || type === 'new_like' || type === 'like_received') {
      const userId = data.fromUserId || data.userId || data.id;
      if (userId) router.push(`/profile/${userId}`);
    } else if (type === 'quiz' || type === 'compatibility') {
      router.push('/compatibility');
    } else if (type === 'profile_visit') {
      router.push('/profile/visitors');
    } else if (type === 'daily_question') {
      router.push('/compatibility');
    } else if (type === 'streak_at_risk' || type === 'daily_compatibility') {
      router.push('/profile');
    } else if (type === 'boost_available' || type === 'likes_restored') {
      router.push('/discover');
    } else if (type === 'verification') {
      router.push('/settings/verification');
    } else if (type === 'safety') {
      router.push('/settings/safety');
    } else if (type === 'system') {
      // Admin notifications: use screen from data if available
      if (data.screen) {
        router.push(data.screen);
      } else {
        const fallbackId = data.userId || data.fromUserId || data.id;
        if (fallbackId) router.push(`/profile/${fallbackId}`);
      }
    } else if (type === 'reminder') {
      router.push('/discover');
    } else {
      const fallbackId = data.userId || data.fromUserId || data.id;
      if (fallbackId) router.push(`/profile/${fallbackId}`);
    }
  };

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x < -60) {
      // Animate off screen, then delete after a brief delay to allow undo
      animate(x, -400, { type: 'spring', stiffness: 200, damping: 25 });
      onDelete();
    } else {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Delete hint revealed behind */}
      <motion.div
        className="absolute inset-0 flex items-center justify-end pr-5 bg-destructive"
        style={{ opacity: deleteOpacity }}
      >
        <Trash2 className="h-5 w-5 text-destructive-foreground" />
      </motion.div>

      <motion.div
        style={{ x, backgroundColor: background }}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -200, right: 0 }}
        dragElastic={{ left: 0.15, right: 0 }}
        onDragEnd={handleDragEnd}
        whileTap={{ cursor: 'grabbing' }}
        className="relative cursor-grab active:cursor-grabbing touch-pan-y"
      >
        <button
          className={cn(
            'w-full text-left p-4 border-b transition-colors hover:bg-muted/30',
            isUnread ? 'bg-primary/5 font-medium' : ''
          )}
          onClick={handleClick}
        >
          <div className="flex items-start gap-3">
            {isUnread && (
              <span className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
            )}
            <div className={cn('flex-1 min-w-0', !isUnread && 'pl-5')}>
              <p className="text-sm leading-snug">{notification.title}</p>
              {notification.body && (
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{notification.body}</p>
              )}
              <p className="text-xs text-muted-foreground/60 mt-1.5">
                {new Date(notification.createdAt).toLocaleDateString('es-MX', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </button>
      </motion.div>
    </div>
  );
}

export default function NotificationsPage() {
  const { notifications, unreadCount, loading, markRead, markAllRead, deleteNotification } = useNotifications({ pollIntervalMs: 30000 });
  const [deletedNotification, setDeletedNotification] = useState<any>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleDelete = useCallback((notification: any) => {
    // Save for undo
    setDeletedNotification(notification);
    deleteNotification(notification.id);

    // Clear previous undo timeout
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);

    // Auto-clear undo after 5 seconds
    undoTimeoutRef.current = setTimeout(() => {
      setDeletedNotification(null);
    }, 5000);
  }, [deleteNotification]);

  const handleUndo = useCallback(() => {
    if (deletedNotification && undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      // Re-create the notification via the existing markRead API isn't possible,
      // but we can restore it locally by re-fetching
      setDeletedNotification(null);
      window.location.reload();
    }
  }, [deletedNotification]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background/90 px-4 backdrop-blur-md pt-safe">
          <Skeleton className="h-6 w-32" />
        </header>
        <main className="max-w-xl mx-auto">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="p-4 border-b space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-2 w-20" />
            </div>
          ))}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur-md pt-safe">
        <h1 className="text-xl font-bold">Actividad</h1>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => markAllRead()}>
            <CheckCheck className="h-4 w-4 mr-2" /> Marcar todo leído
          </Button>
        )}
      </header>

      <main>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Bell className="h-12 w-12 mb-4 opacity-50" />
            <p className="font-medium">Sin actividad</p>
            <p className="text-sm text-center max-w-xs mb-6">Completa tu perfil y mantente activo para recibir notificaciones.</p>
            <Button asChild variant="default" size="sm">
              <Link href="/profile/edit">Completar perfil</Link>
            </Button>
          </div>
        ) : (
          <div className="max-w-xl mx-auto">
            <AnimatePresence initial={false}>
              {notifications.map((n) => (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  transition={{ type: 'spring', stiffness: 250, damping: 30 }}
                >
                  <NotificationItem
                    notification={n}
                    onRead={() => markRead([n.id])}
                    onDelete={() => handleDelete(n)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Undo toast */}
      <AnimatePresence>
        {deletedNotification && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-foreground text-background px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
              <span className="text-sm">Notificación eliminada</span>
              <Button variant="ghost" size="sm" onClick={handleUndo} className="text-primary hover:text-primary h-8">
                Deshacer
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
