import { supabase } from './supabaseClient';

export const VAPID_PUBLIC_KEY = 'BEqRebAmxtntuKm65eaLXdpqBaW9rbSWhIvfQitsSuA-JUmf_ZAaAsBpk6FlN4QAcpxnsFfR3L-kwIZHwYaWjf4';

// Helper to convert VAPID public key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Check if push notifications are supported by browser
export function isPushSupported() {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

// Detect if running on iOS (iPhone / iPad)
export function isIOS() {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}

// Detect if the app is currently running in standalone PWA mode (installed)
export function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

// Get the current push subscription
export async function getPushSubscription() {
  if (!isPushSupported()) return null;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (err) {
    console.error('Fout bij ophalen push-abonnement:', err);
    return null;
  }
}

// Subscribe the user to push notifications
export async function subscribeUserToPush() {
  if (!isPushSupported()) {
    throw new Error('Push-notificaties worden niet ondersteund door deze browser.');
  }

  // 1. Request Notification permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Toestemming voor notificaties is geweigerd.');
  }

  // 2. Await SW ready
  const registration = await navigator.serviceWorker.ready;

  // 3. Subscribe to push manager
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  });

  // 4. Save to Supabase
  if (supabase) {
    // Check if subscription endpoint already exists to avoid duplicates
    const { data, error: selectError } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('subscription->>endpoint', subscription.endpoint);

    if (selectError) {
      console.error('Fout bij controleren bestaand abonnement:', selectError);
    }

    if (data && data.length > 0) {
      console.log('Push-abonnement bestaat al in de database.');
      return subscription;
    }

    // Insert new subscription
    const { error: insertError } = await supabase
      .from('push_subscriptions')
      .insert({ subscription });

    if (insertError) {
      console.error('Fout bij opslaan abonnement in Supabase:', insertError);
      throw insertError;
    }
  } else {
    console.warn('Supabase is niet geconfigureerd. Abonnement kon niet worden opgeslagen.');
  }

  return subscription;
}

// Unsubscribe the user from push notifications
export async function unsubscribeUserFromPush() {
  if (!isPushSupported()) return false;

  try {
    const subscription = await getPushSubscription();
    if (!subscription) return false;

    // 1. Unsubscribe client
    await subscription.unsubscribe();

    // 2. Delete from Supabase
    if (supabase) {
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('subscription->>endpoint', subscription.endpoint);

      if (error) {
        console.error('Fout bij verwijderen abonnement uit Supabase:', error);
      }
    }
    return true;
  } catch (err) {
    console.error('Fout bij uitschrijven push-notificaties:', err);
    throw err;
  }
}
