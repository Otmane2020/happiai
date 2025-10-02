export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
  created_at: string;
};

export type Subcategory = {
  id: string;
  category_id: string;
  name: string;
  icon: string;
  suggested_duration: number;
  sort_order: number;
  created_at: string;
};

export type Activity = {
  id: string;
  user_id: string;
  subcategory_id: string | null;
  title: string;
  scheduled_start: string;
  duration_minutes: number;
  notes: string;
  status: 'scheduled' | 'completed' | 'missed' | 'partial';
  completion_percentage: number;
  created_at: string;
  updated_at: string;
};

export type Habit = {
  id: string;
  user_id: string;
  subcategory_id: string | null;
  title: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  target_count: number;
  reminder_times: string[];
  is_active: boolean;
  created_at: string;
};

export type HabitLog = {
  id: string;
  habit_id: string;
  user_id: string;
  log_date: string;
  status: 'completed' | 'partial' | 'missed';
  notes: string;
  created_at: string;
};

export type Goal = {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  description: string;
  target_value: number;
  current_value: number;
  unit: string;
  deadline: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type GoalMilestone = {
  id: string;
  goal_id: string;
  title: string;
  target_value: number;
  is_completed: boolean;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
};

export type MoodLog = {
  id: string;
  user_id: string;
  log_date: string;
  mood_score: number;
  mood_emoji: string;
  reflection_notes: string;
  created_at: string;
};

export type HappinessScore = {
  id: string;
  user_id: string;
  score_date: string;
  activity_score: number;
  mood_score: number;
  goal_score: number;
  habit_score: number;
  overall_score: number;
  created_at: string;
};

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: 'free' | 'premium';
  subscription_expires_at: string | null;
  created_at: string;
  updated_at: string;
};
