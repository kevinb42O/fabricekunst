import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[send-push] Missing Supabase env vars:', {
    url: !!supabaseUrl,
    key: !!supabaseKey
  });
}

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// VAPID credentials
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:kevin@webaanzee.be';

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('[send-push] Missing VAPID env vars:', {
    pub: !!VAPID_PUBLIC_KEY,
    priv: !!VAPID_PRIVATE_KEY
  });
}

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Allow GET requests to serve as a status / health-check endpoint
  if (req.method === 'GET') {
    let subCount = null;
    let dbError = null;

    if (supabase) {
      const { count, error } = await supabase
        .from('push_subscriptions')
        .select('*', { count: 'exact', head: true });
      if (error) {
        dbError = error.message;
      } else {
        subCount = count;
      }
    }

    return res.status(200).json({
      status: 'API is active and operational',
      supabaseConfigured: !!supabase,
      vapidConfigured: !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY),
      activeSubscriptionsCount: subCount,
      dbError: dbError,
      supabaseUrl: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : null,
      vapidSubject: VAPID_SUBJECT,
      instruction: 'To send a push notification, send an HTTP POST request with JSON body { title, body, url }'
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Debug endpoint — POST with { debug: true } to check config
  if (req.body?.debug) {
    return res.status(200).json({
      supabaseConfigured: !!supabase,
      vapidConfigured: !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY),
      supabaseUrl: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : null,
      vapidSubject: VAPID_SUBJECT
    });
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel environment variables.' });
  }

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return res.status(500).json({ error: 'VAPID keys not configured. Check VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in Vercel environment variables.' });
  }

  const { title, body, url } = req.body || {};

  try {
    // Fetch all subscriptions
    const { data: rows, error } = await supabase
      .from('push_subscriptions')
      .select('id, subscription');

    if (error) {
      console.error('[send-push] DB select error:', error);
      return res.status(500).json({ error: 'DB error', details: error.message });
    }

    if (!rows || rows.length === 0) {
      console.log('[send-push] No subscriptions found in DB.');
      return res.status(200).json({ success: true, count: 0, message: 'No subscriptions registered.' });
    }

    console.log(`[send-push] Found ${rows.length} subscription(s). Sending...`);

    const payload = JSON.stringify({
      title: title || 'Nieuwe aanvraag!',
      body: body || 'U heeft een nieuwe aanvraag ontvangen bij Atelier Rembrandt.',
      url: url || '/admin'
    });

    const results = await Promise.all(
      rows.map(async (row) => {
        // The subscription field may be the object directly, or nested in a 'subscription' key
        let pushSub = row.subscription;
        
        // Handle case where subscription is double-nested
        if (pushSub && typeof pushSub === 'object' && pushSub.subscription) {
          pushSub = pushSub.subscription;
        }

        if (!pushSub || !pushSub.endpoint) {
          console.warn(`[send-push] Row ${row.id} has invalid subscription format:`, JSON.stringify(pushSub).substring(0, 100));
          return { id: row.id, status: 'invalid_format' };
        }

        try {
          await webpush.sendNotification(pushSub, payload);
          console.log(`[send-push] Sent to ${row.id}`);
          return { id: row.id, status: 'sent' };
        } catch (err) {
          console.error(`[send-push] Error sending to ${row.id}:`, err.statusCode, err.message);
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase.from('push_subscriptions').delete().eq('id', row.id);
            return { id: row.id, status: 'expired_deleted' };
          }
          return { id: row.id, status: 'failed', error: err.message, code: err.statusCode };
        }
      })
    );

    return res.status(200).json({ success: true, count: rows.length, results });
  } catch (err) {
    console.error('[send-push] Fatal error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
