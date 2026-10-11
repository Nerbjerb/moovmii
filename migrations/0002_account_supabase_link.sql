-- Phase 2: link each account to its Supabase user (Supabase owns SSO + linking).
-- accounts is empty, so NOT NULL is safe to add directly. Idempotent.
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS supabase_user_id text NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS accounts_supabase_user_id_unique ON accounts (supabase_user_id);
