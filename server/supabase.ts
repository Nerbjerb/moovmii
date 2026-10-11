// Server-side Supabase client — used only to VERIFY a user's access token
// (supabase.auth.getUser(jwt)). Supabase is our identity provider; it does not
// store app data. The anon/publishable key is fine here (verification calls the
// auth server, which validates the token regardless of how it was signed).
import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error("SUPABASE_URL / SUPABASE_ANON_KEY must be set");
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
