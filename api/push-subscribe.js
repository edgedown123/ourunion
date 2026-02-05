import { createClient } from '@supabase/supabase-js';

// Save web push subscription into `push_subscriptions`.
// This API uses service_role so it bypasses RLS policies safely.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ ok: false, error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' });
    }

    const authHeader = req.headers.authorization || '';
const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    let user_id = null;
let anonymous = true;

if (token) {
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return res.status(401).json({ ok: false, error: 'Invalid access token' });
  }
  user_id = userData.user.id;
  anonymous = false;
}

const { endpoint, p256dh = null, auth = null } = req.body || {};
    if (!endpoint) {
      return res.status(400).json({ ok: false, error: 'Missing endpoint' });
    }

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        endpoint,
        p256dh,
        auth,
        user_id,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' }
    );

    if (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }

    return res.status(200).json({ ok: true, stored: true, user_id, anonymous });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
}
