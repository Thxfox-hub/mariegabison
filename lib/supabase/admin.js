/**
 * Supabase admin client (service role key).
 * Bypasses RLS — only use in secure server-side contexts (webhooks, server actions).
 *
 * Lazy-initialized so the module can be imported during build even when
 * env vars are not yet configured.
 */
import { createClient } from '@supabase/supabase-js';

let _admin = null;

export function getAdminClient() {
  if (_admin) return _admin;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!supabaseServiceRoleKey) {
    throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY');
  }

  _admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return _admin;
}

/**
 * Convenience proxy — allows `import { supabaseAdmin } from ...` while
 * remaining lazy. Accessing any property triggers initialization.
 */
export const supabaseAdmin = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getAdminClient();
      const value = client[prop];
      return typeof value === 'function' ? value.bind(client) : value;
    },
  }
);
