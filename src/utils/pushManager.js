import { supabase } from './supabaseClient';

// The VAPID public key — must match exactly what's set in Vercel VAPID_PUBLIC_KEY env var
export const VAPID_PUBLIC_KEY = 'BEqRebAmxtntuKm65eaLXdpqBaW9rbSWhIvfQitsSuA-JUmf_ZAaAsBpk6FlN4QAcpxnsFfR3L-kwIZHwYaWjf4';

// Helper: convert VAPID base64 key to Uint8Array for pushManager.subscribe()
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

// Check full push support
export function isPushSupported() {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

// Detect iOS device
export function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

// Detect PWA standalone mode (required on iOS for push)
export function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

// Get the current push subscription from the service worker
export async function getPushSubscription() {
  if (!isPushSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (err) {
    console.error('[pushManager] getPushSubscription error:', err);
    return null;
  }
}

// Subscribe this device to push notifications and save to Supabase
export async function subscribeUserToPush() {
  if (!isPushSupported()) {
    throw new Error('Push notificaties worden niet ondersteund door deze browser.');
  }

  // 1. Request permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Toestemming voor notificaties geweigerd. Controleer uw iOS instellingen.');
  }

  // 2. Get service worker registration
  const registration = await navigator.serviceWorker.ready;

  // 3. Subscribe via PushManager
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  });

  // 4. Serialize the PushSubscription to a plain JSON object
  // CRITICAL: subscription.toJSON() gives us { endpoint, expirationTime, keys: { p256dh, auth } }
  // We must store this as a plain object — NOT the raw PushSubscription class instance
  const subscriptionJSON = subscription.toJSON();
  if (!subscriptionJSON.endpoint) {
    throw new Error('Ongeldig push-abonnement ontvangen. Probeer opnieuw.');
  }

  // 5. Save to Supabase
  if (supabase) {
    // Check for duplicate endpoint
    const { data: existing, error: selectErr } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('subscription->>endpoint', subscriptionJSON.endpoint);

    if (selectErr) {
      console.warn('[pushManager] Could not check for duplicate:', selectErr.message);
    }

    if (existing && existing.length > 0) {
      return subscription;
    }

    // Insert serialized subscription as plain JSON
    const { error: insertErr } = await supabase
      .from('push_subscriptions')
      .insert([{ subscription: subscriptionJSON }]);

    if (insertErr) {
      console.error('[pushManager] Insert error:', insertErr);
      throw new Error(`Kon abonnement niet opslaan: ${insertErr.message}`);
    }

  } else {
    console.warn('[pushManager] No Supabase client — subscription not saved.');
  }

  return subscription;
}

// Unsubscribe this device from push notifications
export async function unsubscribeUserFromPush() {
  if (!isPushSupported()) return false;

  try {
    const subscription = await getPushSubscription();
    if (!subscription) return false;

    const endpoint = subscription.endpoint;

    // Unsubscribe from browser push
    await subscription.unsubscribe();

    // Remove from Supabase
    if (supabase) {
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('subscription->>endpoint', endpoint);

      if (error) {
        console.error('[pushManager] Delete error:', error.message);
      }
    }

    return true;
  } catch (err) {
    console.error('[pushManager] Unsubscribe error:', err);
    throw err;
  }
}
