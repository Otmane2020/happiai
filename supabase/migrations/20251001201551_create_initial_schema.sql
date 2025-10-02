/*
  # Happiness with AI - Initial Database Schema

  ## Overview
  Complete database schema for the Happiness with AI coaching app that helps users 
  track their daily activities, habits, goals, and happiness scores using AI-powered insights.

  ## New Tables

  1. **profiles**
     - `id` (uuid, primary key, references auth.users)
     - `full_name` (text)
     - `avatar_url` (text)
     - `subscription_tier` (text) - 'free' or 'premium'
     - `subscription_expires_at` (timestamptz)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  2. **categories**
     - `id` (uuid, primary key)
     - `name` (text) - Health, Productivity, Social, Leisure, etc.
     - `icon` (text) - emoji or icon name
     - `color` (text) - hex color code
     - `sort_order` (integer)

  3. **subcategories**
     - `id` (uuid, primary key)
     - `category_id` (uuid, references categories)
     - `name` (text) - running, gym, yoga, etc.
     - `icon` (text)
     - `suggested_duration` (integer) - in minutes
     - `sort_order` (integer)

  4. **activities**
     - `id` (uuid, primary key)
     - `user_id` (uuid, references auth.users)
     - `subcategory_id` (uuid, references subcategories)
     - `title` (text)
     - `scheduled_start` (timestamptz)
     - `duration_minutes` (integer)
     - `notes` (text)
     - `status` (text) - 'scheduled', 'completed', 'missed', 'partial'
     - `completion_percentage` (integer) - 0-100
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  5. **habits**
     - `id` (uuid, primary key)
     - `user_id` (uuid, references auth.users)
     - `subcategory_id` (uuid, references subcategories)
     - `title` (text)
     - `description` (text)
     - `frequency` (text) - 'daily', 'weekly', 'monthly'
     - `target_count` (integer) - how many times per frequency
     - `reminder_times` (jsonb) - array of time strings
     - `is_active` (boolean)
     - `created_at` (timestamptz)

  6. **habit_logs**
     - `id` (uuid, primary key)
     - `habit_id` (uuid, references habits)
     - `user_id` (uuid, references auth.users)
     - `log_date` (date)
     - `status` (text) - 'completed', 'partial', 'missed'
     - `notes` (text)
     - `created_at` (timestamptz)

  7. **goals**
     - `id` (uuid, primary key)
     - `user_id` (uuid, references auth.users)
     - `category_id` (uuid, references categories)
     - `title` (text)
     - `description` (text)
     - `target_value` (integer)
     - `current_value` (integer)
     - `unit` (text) - 'books', 'kg', 'times', etc.
     - `deadline` (date)
     - `is_completed` (boolean)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  8. **goal_milestones**
     - `id` (uuid, primary key)
     - `goal_id` (uuid, references goals)
     - `title` (text)
     - `target_value` (integer)
     - `is_completed` (boolean)
     - `completed_at` (timestamptz)
     - `sort_order` (integer)

  9. **mood_logs**
     - `id` (uuid, primary key)
     - `user_id` (uuid, references auth.users)
     - `log_date` (date)
     - `mood_score` (integer) - 1-10
     - `mood_emoji` (text)
     - `reflection_notes` (text)
     - `created_at` (timestamptz)

  10. **happiness_scores**
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `score_date` (date)
      - `activity_score` (integer) - 0-100
      - `mood_score` (integer) - 0-100
      - `goal_score` (integer) - 0-100
      - `habit_score` (integer) - 0-100
      - `overall_score` (integer) - 0-100
      - `created_at` (timestamptz)

  11. **ai_interactions**
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `message_type` (text) - 'user', 'assistant'
      - `message_content` (text)
      - `context_data` (jsonb)
      - `created_at` (timestamptz)

  12. **ai_recommendations**
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `recommendation_type` (text) - 'activity', 'habit', 'insight'
      - `title` (text)
      - `description` (text)
      - `is_dismissed` (boolean)
      - `created_at` (timestamptz)

  13. **community_posts**
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `content` (text)
      - `post_type` (text) - 'success', 'challenge', 'general'
      - `likes_count` (integer)
      - `comments_count` (integer)
      - `created_at` (timestamptz)

  14. **post_likes**
      - `id` (uuid, primary key)
      - `post_id` (uuid, references community_posts)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamptz)
      - UNIQUE(post_id, user_id)

  15. **post_comments**
      - `id` (uuid, primary key)
      - `post_id` (uuid, references community_posts)
      - `user_id` (uuid, references auth.users)
      - `content` (text)
      - `created_at` (timestamptz)

  16. **challenges**
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `challenge_type` (text) - 'weekly', 'monthly'
      - `start_date` (date)
      - `end_date` (date)
      - `target_metric` (jsonb)
      - `created_at` (timestamptz)

  17. **challenge_participants**
      - `id` (uuid, primary key)
      - `challenge_id` (uuid, references challenges)
      - `user_id` (uuid, references auth.users)
      - `current_progress` (integer)
      - `rank` (integer)
      - `joined_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Policies ensure users can only access their own data
  - Community features allow read access to all authenticated users
  - Profile data is readable by all authenticated users for community features
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  subscription_tier text DEFAULT 'free',
  subscription_expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text DEFAULT '',
  color text DEFAULT '#3b82f6',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

-- Create subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories ON DELETE CASCADE,
  name text NOT NULL,
  icon text DEFAULT '',
  suggested_duration integer DEFAULT 30,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view subcategories"
  ON subcategories FOR SELECT
  TO authenticated
  USING (true);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  subcategory_id uuid REFERENCES subcategories ON DELETE SET NULL,
  title text NOT NULL,
  scheduled_start timestamptz NOT NULL,
  duration_minutes integer DEFAULT 30,
  notes text DEFAULT '',
  status text DEFAULT 'scheduled',
  completion_percentage integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activities"
  ON activities FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities"
  ON activities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities"
  ON activities FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities"
  ON activities FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create habits table
CREATE TABLE IF NOT EXISTS habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  subcategory_id uuid REFERENCES subcategories ON DELETE SET NULL,
  title text NOT NULL,
  description text DEFAULT '',
  frequency text DEFAULT 'daily',
  target_count integer DEFAULT 1,
  reminder_times jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own habits"
  ON habits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habits"
  ON habits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits"
  ON habits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits"
  ON habits FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create habit_logs table
CREATE TABLE IF NOT EXISTS habit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid REFERENCES habits ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  log_date date NOT NULL,
  status text DEFAULT 'completed',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(habit_id, log_date)
);

ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own habit logs"
  ON habit_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habit logs"
  ON habit_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habit logs"
  ON habit_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own habit logs"
  ON habit_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories ON DELETE SET NULL,
  title text NOT NULL,
  description text DEFAULT '',
  target_value integer DEFAULT 0,
  current_value integer DEFAULT 0,
  unit text DEFAULT '',
  deadline date,
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals"
  ON goals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON goals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON goals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON goals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create goal_milestones table
CREATE TABLE IF NOT EXISTS goal_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES goals ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  target_value integer DEFAULT 0,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE goal_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view milestones of own goals"
  ON goal_milestones FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = goal_milestones.goal_id
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert milestones for own goals"
  ON goal_milestones FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = goal_milestones.goal_id
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update milestones of own goals"
  ON goal_milestones FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = goal_milestones.goal_id
      AND goals.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = goal_milestones.goal_id
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete milestones of own goals"
  ON goal_milestones FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = goal_milestones.goal_id
      AND goals.user_id = auth.uid()
    )
  );

-- Create mood_logs table
CREATE TABLE IF NOT EXISTS mood_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  log_date date NOT NULL,
  mood_score integer DEFAULT 5,
  mood_emoji text DEFAULT '😊',
  reflection_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, log_date)
);

ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mood logs"
  ON mood_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mood logs"
  ON mood_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood logs"
  ON mood_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mood logs"
  ON mood_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create happiness_scores table
CREATE TABLE IF NOT EXISTS happiness_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  score_date date NOT NULL,
  activity_score integer DEFAULT 0,
  mood_score integer DEFAULT 0,
  goal_score integer DEFAULT 0,
  habit_score integer DEFAULT 0,
  overall_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, score_date)
);

ALTER TABLE happiness_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own happiness scores"
  ON happiness_scores FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own happiness scores"
  ON happiness_scores FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own happiness scores"
  ON happiness_scores FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create ai_interactions table
CREATE TABLE IF NOT EXISTS ai_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  message_type text NOT NULL,
  message_content text NOT NULL,
  context_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai interactions"
  ON ai_interactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai interactions"
  ON ai_interactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create ai_recommendations table
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  recommendation_type text NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  is_dismissed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai recommendations"
  ON ai_recommendations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai recommendations"
  ON ai_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai recommendations"
  ON ai_recommendations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create community_posts table
CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  post_type text DEFAULT 'general',
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view posts"
  ON community_posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own posts"
  ON community_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON community_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON community_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create post_likes table
CREATE TABLE IF NOT EXISTS post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES community_posts ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view likes"
  ON post_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own likes"
  ON post_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON post_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create post_comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES community_posts ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view comments"
  ON post_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own comments"
  ON post_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON post_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON post_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  challenge_type text DEFAULT 'weekly',
  start_date date NOT NULL,
  end_date date NOT NULL,
  target_metric jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view challenges"
  ON challenges FOR SELECT
  TO authenticated
  USING (true);

-- Create challenge_participants table
CREATE TABLE IF NOT EXISTS challenge_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES challenges ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  current_progress integer DEFAULT 0,
  rank integer DEFAULT 0,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view participants"
  ON challenge_participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own participation"
  ON challenge_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation"
  ON challenge_participants FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activities_user_date ON activities(user_id, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_habits_user_active ON habits(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date ON habit_logs(habit_id, log_date);
CREATE INDEX IF NOT EXISTS idx_goals_user_completed ON goals(user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_mood_logs_user_date ON mood_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_happiness_scores_user_date ON happiness_scores(user_id, score_date);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenges_dates ON challenges(start_date, end_date);