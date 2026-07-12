/*
# Create budgets and savings_goals tables

1. New Tables
- `budgets`
- `id` (uuid, primary key)
- `user_id` (uuid, not null, defaults to authenticated user, references auth.users)
- `category` (text, not null) - expense category this budget applies to
- `limit_amount` (decimal, not null) - maximum amount budgeted
- `period` (text, not null, default 'monthly') - budget period: 'weekly', 'monthly', 'yearly'
- `created_at` (timestamp)
- `updated_at` (timestamp)

- `savings_goals`
- `id` (uuid, primary key)
- `user_id` (uuid, not null, defaults to authenticated user, references auth.users)
- `name` (text, not null) - goal name
- `target_amount` (decimal, not null) - amount to save
- `current_amount` (decimal, not null, default 0) - amount saved so far
- `target_date` (date, nullable) - optional deadline
- `created_at` (timestamp)
- `updated_at` (timestamp)

2. Security
- Enable RLS on both tables.
- Owner-scoped CRUD: each authenticated user can only access their own budgets and savings goals.
- Uses DEFAULT auth.uid() so inserts work without passing user_id.

3. Indexes
- Index on user_id for both tables
*/

CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  limit_amount numeric(12, 2) NOT NULL,
  period text NOT NULL DEFAULT 'monthly' CHECK (period IN ('weekly', 'monthly', 'yearly')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_budgets" ON budgets;
CREATE POLICY "select_own_budgets" ON budgets FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_budgets" ON budgets;
CREATE POLICY "insert_own_budgets" ON budgets FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_budgets" ON budgets;
CREATE POLICY "update_own_budgets" ON budgets FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_budgets" ON budgets;
CREATE POLICY "delete_own_budgets" ON budgets FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category);

CREATE TABLE IF NOT EXISTS savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_amount numeric(12, 2) NOT NULL,
  current_amount numeric(12, 2) NOT NULL DEFAULT 0,
  target_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_savings_goals" ON savings_goals;
CREATE POLICY "select_own_savings_goals" ON savings_goals FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_savings_goals" ON savings_goals;
CREATE POLICY "insert_own_savings_goals" ON savings_goals FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_savings_goals" ON savings_goals;
CREATE POLICY "update_own_savings_goals" ON savings_goals FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_savings_goals" ON savings_goals;
CREATE POLICY "delete_own_savings_goals" ON savings_goals FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals(user_id);
