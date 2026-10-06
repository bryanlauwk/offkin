import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Cache-Control': 'no-store',
    },
  });

const ALLOWED_KEYS = ['logo_url', 'logo_link', 'site_title'] as const;
const MAX_VALUE_CHARS = 2000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return json({});
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const adminPassword = Deno.env.get('ADMIN_PASSWORD');
  const url = Deno.env.get('SUPABASE_URL');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!adminPassword || !url || !service) {
    return json({ error: 'Admin settings are not configured.' }, 503);
  }

  let input: unknown;
  try {
    input = await req.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return json({ error: 'Invalid request.' }, 400);
  }

  const { password, settings } = input as { password?: unknown; settings?: unknown };
  if (typeof password !== 'string' || password.length === 0 || password.length > 200) {
    return json({ error: 'Invalid request.' }, 400);
  }
  if (password !== adminPassword) {
    return json({ ok: false, error: 'Incorrect password' }, 401);
  }

  // Verify-only request (login gate).
  if (settings === undefined) {
    return json({ ok: true });
  }

  // Save request: validate and update allowed site settings.
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return json({ error: 'Invalid settings.' }, 400);
  }
  const entries = Object.entries(settings as Record<string, unknown>);
  if (entries.length === 0 || entries.length > ALLOWED_KEYS.length) {
    return json({ error: 'Invalid settings.' }, 400);
  }
  for (const [key, value] of entries) {
    if (!ALLOWED_KEYS.includes(key as (typeof ALLOWED_KEYS)[number])) {
      return json({ error: 'Invalid settings.' }, 400);
    }
    if (typeof value !== 'string' || value.length > MAX_VALUE_CHARS) {
      return json({ error: 'Invalid settings.' }, 400);
    }
  }

  const db = createClient(url, service);
  for (const [key, value] of entries) {
    const { error } = await db
      .from('site_settings')
      .update({ value: value as string })
      .eq('key', key);
    if (error) return json({ error: 'Failed to save settings.' }, 500);
  }
  return json({ ok: true, saved: true });
});
