import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseSecretKey
  ? createClient(supabaseUrl, supabaseSecretKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@atelierrembrandt.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

const json = (res, status, payload) => {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(payload);
};

const getBearerToken = (req) => {
  const authorization = req.headers.authorization || '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : null;
};

const requireAdmin = async (req) => {
  const accessToken = getBearerToken(req);
  if (!accessToken) return null;

  const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
  if (authError || !authData.user) return null;

  const { data: profile, error: profileError } = await supabase
    .from('admin_profiles')
    .select('user_id')
    .eq('user_id', authData.user.id)
    .eq('active', true)
    .in('role', ['admin', 'developer'])
    .maybeSingle();

  return profileError || !profile ? null : authData.user;
};

const claimInquiry = async (inquiryId) => {
  if (typeof inquiryId !== 'string' || !/^inq-[0-9a-f-]{36}$/i.test(inquiryId)) return null;

  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('inquiries')
    .update({ notification_sent_at: new Date().toISOString() })
    .eq('id', inquiryId)
    .is('notification_sent_at', null)
    .gte('created_at', tenMinutesAgo)
    .select('id, item_title, item_ref, type')
    .maybeSingle();

  if (error) console.error('[send-push] Inquiry claim failed:', error.message);
  return error ? null : data;
};

const sendToSubscribers = async (payload) => {
  const { data: rows, error } = await supabase
    .from('push_subscriptions')
    .select('id, subscription');

  if (error) throw new Error(`Subscription lookup failed: ${error.message}`);
  if (!rows?.length) return { sent: 0, failed: 0 };

  const results = await Promise.all(rows.map(async (row) => {
    let subscription = row.subscription;
    if (subscription?.subscription) subscription = subscription.subscription;
    if (!subscription?.endpoint) return 'failed';

    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      return 'sent';
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        const { error: deleteError } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('id', row.id);
        if (deleteError) console.error('[send-push] Expired subscription cleanup failed:', deleteError.message);
      } else {
        console.error('[send-push] Delivery failed:', error.statusCode || 'unknown');
      }
      return 'failed';
    }
  }));

  return {
    sent: results.filter((result) => result === 'sent').length,
    failed: results.filter((result) => result === 'failed').length
  };
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(204).end();
  }

  if (req.method === 'GET') return json(res, 200, { status: 'ok' });

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return json(res, 405, { error: 'Method not allowed' });
  }

  if (!supabase || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.error('[send-push] Required server configuration is missing.');
    return json(res, 503, { error: 'Notificatiedienst is tijdelijk niet beschikbaar.' });
  }

  try {
    let payload;

    if (req.body?.test === true) {
      const admin = await requireAdmin(req);
      if (!admin) return json(res, 401, { error: 'Beheerderssessie vereist.' });

      payload = {
        title: 'Atelier Rembrandt',
        body: 'Testmelding geslaagd. Dit apparaat ontvangt beheerupdates.',
        url: '/admin'
      };
    } else {
      const inquiry = await claimInquiry(req.body?.inquiryId);
      if (!inquiry) {
        return json(res, 202, { success: true, accepted: false });
      }

      const subject = inquiry.item_title || inquiry.item_ref || 'de collectie';
      payload = {
        title: 'Nieuwe aanvraag',
        body: `Er is een nieuwe aanvraag ontvangen voor ${subject}.`,
        url: '/admin'
      };
    }

    const delivery = await sendToSubscribers(payload);
    return json(res, 200, { success: true, ...delivery });
  } catch (error) {
    console.error('[send-push] Unexpected failure:', error.message);
    return json(res, 500, { error: 'Notificatie kon niet worden verwerkt.' });
  }
}
