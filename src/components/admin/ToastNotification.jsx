import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ToastNotification({ toast, message, onClose }) {
  const notification = toast || (message ? { message, type: 'success' } : null);

  return (
    <AnimatePresence>
      {notification?.message && (
        <ToastContent key="toast" notification={notification} onClose={onClose} />
      )}
    </AnimatePresence>
  );
}

function ToastContent({ notification, onClose }) {
  const type = notification.type || 'success';
  const Icon = type === 'error' ? AlertCircle : type === 'info' || type === 'loading' ? Info : CheckCircle2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`admin-toast admin-toast--${type}`}
      style={{ animation: 'none' }} // overrides the css animation
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <Icon className="admin-toast__icon" aria-hidden="true" />
      <p>{notification.message}</p>
      <button type="button" onClick={onClose} aria-label="Melding sluiten"><X aria-hidden="true" /></button>
    </motion.div>
  );
}
