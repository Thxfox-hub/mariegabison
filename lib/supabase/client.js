/**
 * Browser Supabase client.
 * Used in Client Components for auth and data access.
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        flowType: 'implicit',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
}

// Lazy singleton — avoids throwing during build when env vars are absent.
let _client = null;
export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      if (!_client) _client = createClient();
      const value = _client[prop];
      return typeof value === 'function' ? value.bind(_client) : value;
    },
  }
);
