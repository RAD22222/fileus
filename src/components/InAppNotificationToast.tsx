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
    <div
      className="fixed left-3 right-3 bottom-[6.25rem] md:bottom-5 md:left-auto md:right-5 z-40 flex flex-col gap-2 md:w-96 pointer-events-none"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map(toast => (
        <div key={toast.id} className="md-snackbar pointer-events-auto" role="alert">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-lg"
            style={{ background: 'rgba(255,255,255,0.12)' }}
            aria-hidden="true"
          >
            {toast.icon ? toast.icon : <BellRing className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="md-title-small truncate">{toast.title}</h4>
            <p className="md-body-small mt-0.5 line-clamp-2" style={{ opacity: 0.8 }}>
              {toast.body}
            </p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="md-icon-button md-ripple"
            style={{ color: 'inherit' }}
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
