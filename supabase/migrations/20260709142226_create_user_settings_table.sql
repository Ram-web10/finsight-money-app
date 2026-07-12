/*
# Create user_settings table for user preferences

1. New Tables
- `user_settings`
- `id` (uuid, primary key)
- `user_id` (uuid, references auth.users, defaults to authenticated user)
- `currency` (text, defaults to 'USD')
- `onboarding_completed` (boolean, defaults to false)
- `created_at` (timestamp)
- `updated_at` (timestamp)

2. Security
- Enable RLS on `user_settings`.
- Owner-scoped CRUD: each authenticated user can only access their own settings.
- Uses DEFAULT auth.uid() so inserts work without passing user_id.
*/

CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  currency text NOT NULL DEFAULT 'USD',
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_settings" ON user_settings;
CREATE POLICY "select_own_settings" ON user_settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_settings" ON user_settings;
CREATE POLICY "insert_own_settings" ON user_settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_settings" ON user_settings;
CREATE POLICY "update_own_settings" ON user_settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_settings" ON user_settings;
CREATE POLICY "delete_own_settings" ON user_settings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
