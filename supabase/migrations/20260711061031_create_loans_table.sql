/*
# Create loans table

1. New Tables
- `loans`
- `id` (uuid, primary key)
- `user_id` (uuid, not null, defaults to authenticated user, references auth.users)
- `type` (text, not null) - 'lent' (money given to someone) or 'borrowed' (money received from someone)
- `amount` (decimal, not null) - the principal amount
- `person_name` (text, not null) - name of the person you lent to or borrowed from
- `date` (date, not null) - date the loan was created
- `due_date` (date, nullable) - expected repayment date
- `status` (text, not null, default 'active') - 'active' or 'settled'
- `note` (text, nullable) - optional notes
- `created_at` (timestamp)
- `updated_at` (timestamp)

2. Security
- Enable RLS on `loans`.
- Owner-scoped CRUD: each authenticated user can only access their own loans.
- Uses DEFAULT auth.uid() so inserts work without passing user_id.

3. Indexes
- Index on user_id for faster queries
- Index on date for sorting/filtering
- Index on type for filtering
- Index on status for filtering
*/

CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('lent', 'borrowed')),
  amount numeric(12, 2) NOT NULL,
  person_name text NOT NULL,
  date date NOT NULL,
  due_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'settled')),
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_loans" ON loans;
CREATE POLICY "select_own_loans" ON loans FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_loans" ON loans;
CREATE POLICY "insert_own_loans" ON loans FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_loans" ON loans;
CREATE POLICY "update_own_loans" ON loans FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_loans" ON loans;
CREATE POLICY "delete_own_loans" ON loans FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_date ON loans(date DESC);
CREATE INDEX IF NOT EXISTS idx_loans_type ON loans(type);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
