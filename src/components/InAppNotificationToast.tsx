import React, { useEffect, useState } from 'react';
import { notificationService } from '../services/notificationService';
import { BellRing, X } from 'lucide-react';

interface ToastItem {
  id: string;
  title: string;
  body: string;
  icon?: string;
}

export const InAppNotificationToast: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribe = notificationService.subscribeInApp((title, body, icon) => {
      const id = 'toast_' + Date.now();
      setToasts(prev => [...prev, { id, title, body, icon }]);

      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 6000);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-18 sm:bottom-5 right-3 sm:right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-2 sm:px-0">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="pointer-events-auto glass-modal text-black dark:text-white p-4 rounded-2xl shadow-xl border border-black/15 dark:border-white/20 flex items-start gap-3 transform transition-all duration-300 animate-in slide-in-from-bottom-3"
          role="alert"
        >
          <div className="w-9 h-9 rounded-xl glass-button flex items-center justify-center shrink-0 text-lg">
            {toast.icon ? toast.icon : <BellRing className="w-4 h-4 text-black dark:text-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-mono font-bold text-black dark:text-white truncate">{toast.title}</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5 line-clamp-2">{toast.body}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="min-h-[36px] min-w-[36px] flex items-center justify-center text-zinc-400 hover:text-black dark:hover:text-white p-1 rounded-lg transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
