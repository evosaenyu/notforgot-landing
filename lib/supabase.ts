import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// Server-side client — uses the secret key, bypasses RLS where needed
export const supabaseAdmin = createClient(
  url,
  process.env.SUPABASE_SECRET_KEY!,
  {
    auth: { persistSession: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  }
);

// Client-side client — uses the publishable (anon) key, respects RLS
export const supabase = createClient(
  url,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);
