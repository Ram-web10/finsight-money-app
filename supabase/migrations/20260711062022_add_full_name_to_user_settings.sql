/*
# Add full_name column to user_settings

1. Modified Tables
- `user_settings`
- Add `full_name` (text, nullable) - user's display name

2. Security
- No changes to existing RLS policies
*/

ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS full_name text;
