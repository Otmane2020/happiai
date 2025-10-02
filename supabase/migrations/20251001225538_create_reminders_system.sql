/*
  # Create Reminders System

  ## Overview
  Complete reminder and notification system for habits and goals with user preferences.

  ## New Tables
  
  ### `reminders`
  Stores scheduled reminders for habits and goals
  - `id` (uuid, primary key) - Unique reminder identifier
  - `user_id` (uuid, foreign key) - User who owns the reminder
  - `entity_type` (text) - Type of entity: 'habit' or 'goal'
  - `entity_id` (uuid) - ID of the habit or goal
  - `reminder_time` (time) - Time of day for reminder (e.g., '09:00')
  - `reminder_days` (jsonb) - Days of week for reminder [0-6, where 0=Sunday]
  - `is_active` (boolean) - Whether reminder is active
  - `last_sent_at` (timestamptz) - Last time reminder was sent
  - `created_at` (timestamptz) - When reminder was created
  
  ### `notification_preferences`
  User preferences for different notification types
  - `user_id` (uuid, primary key, foreign key) - User identifier
  - `push_notifications_enabled` (boolean) - Enable push notifications
  - `email_notifications_enabled` (boolean) - Enable email notifications
  - `habit_reminders_enabled` (boolean) - Enable habit reminders
  - `goal_reminders_enabled` (boolean) - Enable goal deadline reminders
  - `daily_summary_enabled` (boolean) - Enable daily summary notifications
  - `ai_coach_updates_enabled` (boolean) - Enable AI coach notifications
  - `quiet_hours_start` (time) - Start of quiet hours (no notifications)
  - `quiet_hours_end` (time) - End of quiet hours
  - `updated_at` (timestamptz) - Last update time

  ## Security
  - Enable RLS on all tables
  - Users can only access their own reminders and preferences
  - Policies for authenticated users to read/write their own data

  ## Indexes
  - Index on user_id for fast lookups
  - Index on entity_type and entity_id for reminder queries
  - Index on is_active for active reminder queries
*/

-- Create reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('habit', 'goal')),
  entity_id uuid NOT NULL,
  reminder_time time NOT NULL,
  reminder_days jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  last_sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  push_notifications_enabled boolean DEFAULT true,
  email_notifications_enabled boolean DEFAULT false,
  habit_reminders_enabled boolean DEFAULT true,
  goal_reminders_enabled boolean DEFAULT true,
  daily_summary_enabled boolean DEFAULT false,
  ai_coach_updates_enabled boolean DEFAULT true,
  quiet_hours_start time DEFAULT '22:00',
  quiet_hours_end time DEFAULT '08:00',
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_entity ON reminders(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_reminders_active ON reminders(is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reminders table
CREATE POLICY "Users can view own reminders"
  ON reminders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reminders"
  ON reminders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
  ON reminders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
  ON reminders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for notification_preferences table
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own notification preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to create default notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default preferences when a user signs up
DROP TRIGGER IF EXISTS on_auth_user_created_notification_prefs ON auth.users;
CREATE TRIGGER on_auth_user_created_notification_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();
