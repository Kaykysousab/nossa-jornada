/*
  # Nossa Jornada App Schema

  ## Overview
  Complete database schema for a couples' financial management app focused on shared goals and expense tracking.

  ## Tables Created

  ### 1. couples
  The main table representing a couple's account
  - `id` (uuid, primary key) - Unique identifier for the couple
  - `user1_id` (uuid) - First partner's auth user ID
  - `user2_id` (uuid, nullable) - Second partner's auth user ID (nullable until they join)
  - `user1_name` (text) - First partner's name
  - `user2_name` (text, nullable) - Second partner's name
  - `relationship_start_date` (date, nullable) - When they started dating
  - `profile_photo_url` (text, nullable) - Couple's photo
  - `created_at` (timestamptz) - Account creation timestamp

  ### 2. goals
  Financial goals/dreams the couple is saving for
  - `id` (uuid, primary key) - Unique goal identifier
  - `couple_id` (uuid, foreign key) - References couples table
  - `name` (text) - Goal name (e.g., "Viagem para a Praia")
  - `target_amount` (numeric) - Total amount needed
  - `current_amount` (numeric) - Amount saved so far
  - `target_date` (date, nullable) - When they want to achieve it
  - `inspiration_photo_url` (text, nullable) - Motivational photo
  - `created_at` (timestamptz) - Goal creation timestamp
  - `is_completed` (boolean) - Whether goal is achieved

  ### 3. contributions
  Individual contributions to goals
  - `id` (uuid, primary key) - Unique contribution identifier
  - `goal_id` (uuid, foreign key) - References goals table
  - `amount` (numeric) - Amount contributed
  - `contributed_by` (text) - Name of who contributed
  - `contributed_at` (timestamptz) - When the contribution was made
  - `notes` (text, nullable) - Optional notes

  ### 4. expenses
  Shared expenses tracking
  - `id` (uuid, primary key) - Unique expense identifier
  - `couple_id` (uuid, foreign key) - References couples table
  - `description` (text) - What was purchased
  - `amount` (numeric) - Total amount spent
  - `category` (text) - Category (Alimentação, Casa, Lazer, Saúde, Transporte)
  - `paid_by` (text) - Who paid (user1_name, user2_name, or "Dividimos")
  - `expense_date` (date) - When the expense occurred
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Couples can only access their own data
  - Both partners have full access to shared data

  ## Important Notes
  - All monetary values use numeric type for precision
  - Timestamps use timestamptz for timezone awareness
  - Foreign keys ensure data integrity
  - Indexes added for common query patterns
*/

CREATE TABLE IF NOT EXISTS couples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid REFERENCES auth.users(id) NOT NULL,
  user2_id uuid REFERENCES auth.users(id),
  user1_name text NOT NULL,
  user2_name text,
  relationship_start_date date,
  profile_photo_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  target_amount numeric(10,2) NOT NULL CHECK (target_amount > 0),
  current_amount numeric(10,2) DEFAULT 0 CHECK (current_amount >= 0),
  target_date date,
  inspiration_photo_url text,
  created_at timestamptz DEFAULT now(),
  is_completed boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  contributed_by text NOT NULL,
  contributed_at timestamptz DEFAULT now(),
  notes text
);

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  category text NOT NULL CHECK (category IN ('Alimentação', 'Casa', 'Lazer', 'Saúde', 'Transporte', 'Outros')),
  paid_by text NOT NULL,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goals_couple_id ON goals(couple_id);
CREATE INDEX IF NOT EXISTS idx_contributions_goal_id ON contributions(goal_id);
CREATE INDEX IF NOT EXISTS idx_expenses_couple_id ON expenses(couple_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);

ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couples can view own data"
  ON couples FOR SELECT
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Couples can update own data"
  ON couples FOR UPDATE
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id)
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can insert couple data"
  ON couples FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user1_id);

CREATE POLICY "Couples can view own goals"
  ON goals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = goals.couple_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

CREATE POLICY "Couples can insert own goals"
  ON goals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = goals.couple_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

CREATE POLICY "Couples can update own goals"
  ON goals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = goals.couple_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = goals.couple_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

CREATE POLICY "Couples can delete own goals"
  ON goals FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = goals.couple_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

CREATE POLICY "Couples can view own contributions"
  ON contributions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM goals
      JOIN couples ON couples.id = goals.couple_id
      WHERE goals.id = contributions.goal_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

CREATE POLICY "Couples can insert own contributions"
  ON contributions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM goals
      JOIN couples ON couples.id = goals.couple_id
      WHERE goals.id = contributions.goal_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

CREATE POLICY "Couples can view own expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = expenses.couple_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

CREATE POLICY "Couples can insert own expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = expenses.couple_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

CREATE POLICY "Couples can update own expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = expenses.couple_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = expenses.couple_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

CREATE POLICY "Couples can delete own expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = expenses.couple_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );