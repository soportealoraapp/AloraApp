'use client';

import { useNotifications } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { CheckCheck, Bell, Loader2, Trash2, Heart, MessageSquare, Sparkles, Award, ShieldAlert, Calendar, RefreshCcw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useCallback, useRef, memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { BRAND_VOICE } from '@/lib/constants/brand-voice';

function NotificationItemInner({ notification, onRead, onDelete }: { notification: any; onRead: () => void; onDelete: () => void }) {
  const router = useRouter();
  const isUnread = !notification.readAt;
  const type = notification.type || '';
  const x = useMotionValue(0);
  const background = useTransform(x, [-80, 0], ['hsl(var(--destructive))', 'hsl(var(--background))']);
  const deleteOpacity = useTransform(x, [-80, -30], [1, 0]);

  // Determine icon and color based on notification type
  const getNotificationIconDetails = () => {
    switch (type) {
      case 'match':
      case 'new_match':
        return {
          icon: Heart,
          color: 'text-primary',
          bg: 'bg-primary/10 border-primary/20',
        };
      case 'message':
      case 'new_message':
        return {
          icon: MessageSquare,
          color: 'text-blue-500',
          bg: 'bg-blue-500/10 border-blue-500/20',
        };
      case 'like':
      case 'new_like':
      case 'like_received':
        return {
          icon: Sparkles,
          color: 'text-amber-500',
          bg: 'bg-amber-500/10 border-amber-500/20',
        };
      case 'quiz':
      case 'compatibility':
      case 'daily_compatibility':
        return {
          icon: Award,
          color: 'text-purple-500',
          bg: 'bg-purple-500/10 border-purple-500/20',
        };
      case 'verification':
      case 'safety':
        return {
          icon: ShieldAlert,
          color: 'text-emerald-500',
          bg: 'bg-emerald-500/10 border-emerald-500/20',
        };
      case 'daily_question':
      case 'streak_at_risk':
      case 'reminder':
        return {
          icon: Calendar,
          color: 'text-pink-500',
          bg: 'bg-pink-500/10 border-pink-500/20',
        };
      default:
        return {
          icon: Bell,
          color: 'text-muted-foreground',
          bg: 'bg-muted/10 border-muted/20',
        };
    }
  };

  const { icon: TypeIcon, color: iconColor, bg: iconBg } = getNotificationIconDetails();

  const handleClick = () => {
    if (isUnread) onRead();

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
    } else if (type === 'streak_at_risk') {
      router.push('/discover');
    } else if (type === 'daily_compatibility') {
      router.push('/compatibility');
    } else if (type === 'boost_available' || type === 'likes_restored' || type === 'eleven_eleven' || type === 'promotion') {
      router.push('/discover');
    } else if (type === 'verification') {
      router.push('/settings/verification');
    } else if (type === 'safety') {
      router.push('/settings/safety');
    } else if (type === 'system') {
      const ALLOWED_SCREENS = ['/discover', '/compatibility', '/settings', '/admin', '/profile'];
      if (data.screen && typeof data.screen === 'string' && data.screen.startsWith('/') && !data.screen.startsWith('//') && ALLOWED_SCREENS.some(s => data.screen === s || data.screen.startsWith(s + '/'))) {
        router.push(data.screen);
      } else {
        const fallbackId = data.userId || data.fromUserId || data.id;
        if (fallbackId) router.push(`/profile/${fallbackId}`);
      }
    } else if (type === 'reminder') {
      router.push('/discover');
    } else if (type === 'match_undone') {
      router.push('/discover');
    } else {
      const fallbackId = data.userId || data.fromUserId || data.id;
      if (fallbackId) router.push(`/profile/${fallbackId}`);
    }
  };

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x < -60) {
      animate(x, -400, { type: 'spring', stiffness: 200, damping: 25 });
      onDelete();
    } else {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
    }
  };

  return (
    <div className="relative overflow-hidden border-b border-border/40">
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
            'w-full text-left p-4 transition-colors hover:bg-secondary/40 flex items-start gap-4',
            isUnread ? 'bg-primary/[0.03] dark:bg-primary/[0.02]' : ''
          )}
          onClick={handleClick}
          aria-label={`Notificación: ${notification.text || type}${isUnread ? ' (sin leer)' : ''}`}
        >
          {/* Unread Indicator Glow Dot */}
          <div className="flex-shrink-0 pt-1.5 w-2 flex justify-center">
            {isUnread && (
              <span className="h-2 w-2 rounded-full bg-primary badge-glow animate-pulse" />
            )}
          </div>

          {/* Icon Bubble */}
          <div className={cn("p-2.5 rounded-2xl border flex items-center justify-center flex-shrink-0 transition-transform duration-200 hover:scale-105", iconBg)}>
            <TypeIcon className={cn("h-5 w-5", iconColor)} />
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 space-y-1">
            <p className={cn("text-sm leading-snug text-foreground", isUnread ? "font-semibold" : "font-normal")}>
              {notification.title}
            </p>
            {notification.body && (
              <p className="text-xs text-muted-foreground/90 leading-relaxed font-normal">
                {notification.body}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground/60 font-medium">
              {new Date(notification.createdAt).toLocaleDateString('es-MX', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
        </button>
      </motion.div>
    </div>
  );
}

export default function NotificationsPage() {
  const { notifications, unreadCount, loading, loadingMore, hasMore, error, markRead, markAllRead, deleteNotification, undoDelete, refresh, loadMore } = useNotifications({ pollIntervalMs: 30000 });
  const [deletedNotification, setDeletedNotification] = useState<any>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startYRef.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (startYRef.current === 0) return;
    const diff = e.touches[0].clientY - startYRef.current;
    if (diff > 0) setPullDistance(Math.min(diff * 0.4, 80));
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > 50) {
      setIsRefreshing(true);
      await refresh();
      setIsRefreshing(false);
    }
    setPullDistance(0);
    startYRef.current = 0;
  }, [pullDistance, refresh]);

  const handleDelete = useCallback((notification: any) => {
    setDeletedNotification(notification);
    deleteNotification(notification.id);

    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);

    undoTimeoutRef.current = setTimeout(() => {
      setDeletedNotification(null);
    }, 5000);
  }, [deleteNotification]);

  const handleUndo = useCallback(() => {
    if (deletedNotification && undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoDelete(deletedNotification.id);
      refresh();
      setDeletedNotification(null);
    }
  }, [deletedNotification, undoDelete, refresh]);

  if (loading) {
    return (
      <div className="app-page-shell">
        <header className="app-page-header justify-between">
          <Skeleton className="h-6 w-32" />
        </header>
        <main className="app-page-content-narrow">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex gap-4 items-center">
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </main>
      </div>
    );
  }

  const NotificationItem = memo(NotificationItemInner);

  return (
    <div
      ref={containerRef}
      className="app-page-shell"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {(pullDistance > 0 || isRefreshing) && (
        <div className="flex items-center justify-center py-2 transition-all" style={{ height: isRefreshing ? 40 : pullDistance }}>
          <Loader2 className={`h-5 w-5 text-primary ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: isRefreshing ? undefined : `rotate(${pullDistance * 3}deg)` }} />
        </div>
      )}
      
      {/* Header */}
      <header className="app-page-header justify-between"
        style={{ borderBottomColor: 'hsl(var(--border) / 0.5)' }}
      >
        <div>
          <h1 className="text-xl font-headline font-bold text-gradient">Actividad</h1>
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => markAllRead()} className="text-xs hover:bg-secondary rounded-xl text-primary font-bold h-9">
            <CheckCheck className="h-4 w-4 mr-1.5" /> Marcar leído
          </Button>
        )}
      </header>

      <main className="app-page-content-narrow !space-y-0 !px-0 !py-0">
        {error && notifications.length === 0 && (
          <Alert variant="destructive" className="mx-4 mt-4 rounded-2xl">
            <AlertDescription className="flex items-center justify-between">
              <span>Error al cargar las notificaciones. Intenta de nuevo.</span>
              <Button variant="outline" size="sm" onClick={() => refresh()}>Reintentar</Button>
            </AlertDescription>
          </Alert>
        )}
        
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-8 text-center text-muted-foreground">
            <div className="h-20 w-20 rounded-full bg-secondary/50 flex items-center justify-center mb-6">
              <Bell className="h-10 w-10 text-muted-foreground/60 animate-bounce" style={{ animationDuration: '3s' }} />
            </div>
            <p className="font-headline text-lg font-bold text-foreground mb-1">
              {BRAND_VOICE.states.noActivity.title}
            </p>
            <p className="text-sm text-muted-foreground/80 max-w-xs mb-8">
              {BRAND_VOICE.states.noActivity.subtitle}
            </p>
            <Button asChild variant="default" size="default" className="rounded-full px-8 h-12 font-bold shadow-glow">
              <Link href="/profile/edit">Completar perfil</Link>
            </Button>
          </div>
        ) : (
          <div>
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
            {hasMore && notifications.length > 0 && (
              <div className="flex justify-center py-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="rounded-full text-muted-foreground font-semibold px-5 border-border/60"
                >
                  {loadingMore ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Cargando...</>
                  ) : (
                    'Cargar más notificaciones'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Undo toast */}
      <AnimatePresence>
        {deletedNotification && (
          <motion.div
            initial={{ y: 100, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 100, opacity: 0, x: '-50%' }}
            className="fixed bottom-20 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xs"
          >
            <div className="bg-foreground text-background px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 border border-background/10">
              <span className="text-sm font-semibold">Notificación eliminada</span>
              <Button variant="ghost" size="sm" onClick={handleUndo} className="text-primary hover:text-primary/80 font-bold h-9 hover:bg-transparent min-h-0 px-2" aria-label="Deshacer eliminación de notificación">
                Deshacer
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
