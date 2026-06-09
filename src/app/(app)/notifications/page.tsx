'use client';

import { useNotifications } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { CheckCheck, Bell, Loader2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function NotificationItem({ notification, onRead }: { notification: any; onRead: () => void }) {
  const isUnread = !notification.readAt;

  return (
    <button
      className={cn(
        'w-full text-left p-4 border-b transition-colors hover:bg-muted/30',
        isUnread ? 'bg-primary/5 font-medium' : ''
      )}
      onClick={() => { if (isUnread) onRead(); }}
    >
      <p className="text-sm">{notification.title}</p>
      {notification.body && (
        <p className="text-xs text-muted-foreground mt-1">{notification.body}</p>
      )}
      <p className="text-[10px] text-muted-foreground/60 mt-1">
        {new Date(notification.createdAt).toLocaleDateString('es-MX', {
          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        })}
      </p>
    </button>
  );
}

export default function NotificationsPage() {
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications({ pollIntervalMs: 30000 });

  if (loading) {
    return (
      <div className="md:pl-60 min-h-screen">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background/90 px-4 backdrop-blur-md">
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
    <div className="md:pl-60 min-h-screen">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur-md">
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
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onRead={() => markRead([n.id])}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
