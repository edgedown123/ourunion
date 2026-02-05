import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ ok: false, error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' });
    }

    const { endpoint, p256dh, auth } = req.body || {};
    if (!endpoint) return res.status(400).json({ ok: false, error: 'Missing endpoint' });

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Optional user linkage
    let user_id = null;
    let anonymous = true;

    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      const jwt = authHeader.slice('Bearer '.length);
      try {
        const { data } = await supabaseAdmin.auth.getUser(jwt);
        user_id = data?.user?.id || null;
        anonymous = !user_id;
      } catch {
        // ignore token errors; store anonymously
      }
    }

    const payload = { endpoint, p256dh: p256dh ?? null, auth: auth ?? null, user_id };

    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .upsert(payload, { onConflict: 'endpoint' });

    if (error) return res.status(500).json({ ok: false, error: error.message });

    return res.status(200).json({ ok: true, stored: true, anonymous, user_id });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
}
