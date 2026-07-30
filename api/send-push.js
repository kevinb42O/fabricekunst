import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase using environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xbqgyijkwwvdooohygcn.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

// VAPID credentials for Web Push
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BEqRebAmxtntuKm65eaLXdpqBaW9rbSWhIvfQitsSuA-JUmf_ZAaAsBpk6FlN4QAcpxnsFfR3L-kwIZHwYaWjf4';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '16Ztua0romLyPJm4GYH-J7N2KRi4vEcBRbF1-BKS0RY';

webpush.setVapidDetails(
  'mailto:kevin@webaanzee.be',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabase) {
    console.error('Supabase client failed to initialize: missing URL or Anon Key.');
    return res.status(500).json({ error: 'Supabase client is not configured on the backend.' });
  }

  const { title, body, url } = req.body || {};

  try {
    // 1. Retrieve all active push subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (error) {
      console.error('Failed to query push_subscriptions table:', error);
      return res.status(500).json({ error: 'Database select error', details: error.message });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(200).json({ success: true, count: 0, message: 'No registered push subscriptions found.' });
    }

    const payload = JSON.stringify({
      title: title || 'Nieuw bericht!',
      body: body || 'U heeft een nieuwe aanvraag ontvangen.',
      url: url || '/admin#inquiries'
    });

    // 2. Broadcast push notifications to all endpoints in parallel
    const results = await Promise.all(
      subscriptions.map(async (subRecord) => {
        try {
          await webpush.sendNotification(subRecord.subscription, payload);
          return { id: subRecord.id, status: 'sent' };
        } catch (err) {
          // If subscription is expired or invalid (statusCode 410 or 404), remove it from DB to keep it clean
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(`Push endpoint is gone (status ${err.statusCode}). Deleting expired subscription ID: ${subRecord.id}`);
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', subRecord.id);
            return { id: subRecord.id, status: 'deleted_expired' };
          }
          console.error(`Error sending push notification to subscription ID ${subRecord.id}:`, err);
          return { id: subRecord.id, status: 'failed', error: err.message };
        }
      })
    );

    return res.status(200).json({
      success: true,
      count: subscriptions.length,
      results
    });
  } catch (error) {
    console.error('Uncaught serverless function exception:', error);
    return res.status(500).json({ error: 'Serverless function exception occurred', message: error.message });
  }
}
