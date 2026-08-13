import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export default function ToastNotification({ toast, message, onClose }) {
  const notification = toast || (message ? { message, type: 'success' } : null);
  if (!notification?.message) return null;

  const type = notification.type || 'success';
  const Icon = type === 'error' ? AlertCircle : type === 'info' || type === 'loading' ? Info : CheckCircle2;

  return (
    <div className={`admin-toast admin-toast--${type}`} role={type === 'error' ? 'alert' : 'status'} aria-live={type === 'error' ? 'assertive' : 'polite'}>
      <Icon className="admin-toast__icon" aria-hidden="true" />
      <p>{notification.message}</p>
      <button type="button" onClick={onClose} aria-label="Melding sluiten"><X aria-hidden="true" /></button>
    </div>
  );
}
