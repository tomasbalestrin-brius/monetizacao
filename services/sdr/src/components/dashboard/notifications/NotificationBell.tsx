import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead, type Notification } from '@/hooks/useNotifications';

const typeIcons: Record<string, string> = {
  appointment: '📅',
  lead: '👤',
  info: 'ℹ️',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { data: notifications } = useNotifications();
  const unreadCount = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors"
      >
        <Bell size={20} className="text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute right-0 top-12 w-80 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between p-3 border-b border-border">
            <h3 className="font-semibold text-sm">Notificacoes</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead.mutate()}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <CheckCheck size={14} />
                  Marcar todas
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Notifications list */}
          <div className="max-h-[400px] overflow-y-auto">
            {(!notifications || notifications.length === 0) && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Nenhuma notificacao
              </div>
            )}
            {notifications?.map((notif) => (
              <NotificationItem
                key={notif.id}
                notification={notif}
                onMarkRead={() => markAsRead.mutate(notif.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({ notification, onMarkRead }: { notification: Notification; onMarkRead: () => void }) {
  return (
    <div
      className={`flex items-start gap-3 p-3 border-b border-border last:border-0 transition-colors ${
        notification.read ? 'opacity-60' : 'bg-primary/5'
      }`}
    >
      <span className="text-lg mt-0.5">{typeIcons[notification.type] ?? '📌'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{notification.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(notification.created_at)}</p>
      </div>
      {!notification.read && (
        <button onClick={onMarkRead} className="text-primary hover:text-primary/80 mt-1 shrink-0">
          <Check size={14} />
        </button>
      )}
    </div>
  );
}
