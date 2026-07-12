/*
# Create transactions table

1. New Tables
- `transactions`
- `id` (uuid, primary key)
- `user_id` (uuid, not null, defaults to authenticated user, references auth.users)
- `type` (text, not null) - 'income', 'expense', or 'saving'
- `amount` (decimal, not null)
- `category` (text, not null) - food_dining, transport, housing, utilities, entertainment, shopping, health, education, travel, others
- `date` (date, not null)
- `note` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

2. Security
- Enable RLS on `transactions`.
- Owner-scoped CRUD: each authenticated user can only access their own transactions.
- Uses DEFAULT auth.uid() so inserts work without passing user_id.

3. Indexes
- Index on user_id for faster queries
- Index on date for sorting/filtering
- Index on type for filtering
*/

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('income', 'expense', 'saving')),
  amount numeric(12, 2) NOT NULL,
  category text NOT NULL CHECK (category IN ('food_dining', 'transport', 'housing', 'utilities', 'entertainment', 'shopping', 'health', 'education', 'travel', 'others', 'salary', 'freelance', 'investment', 'gift')),
  date date NOT NULL,
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_transactions" ON transactions;
CREATE POLICY "select_own_transactions" ON transactions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_transactions" ON transactions;
CREATE POLICY "insert_own_transactions" ON transactions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_transactions" ON transactions;
CREATE POLICY "update_own_transactions" ON transactions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_transactions" ON transactions;
CREATE POLICY "delete_own_transactions" ON transactions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
