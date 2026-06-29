import { createClient } from '@supabase/supabase-js';

// ponytail: returns any — Supabase v2 generic inference breaks through query chains.
// Upgrade path: run `supabase gen types typescript` once connected, replace with the
// generated Database type and explicit SupabaseClient<Database>.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDb(): any {
  if (client) return client;
  client = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  return client;
}
