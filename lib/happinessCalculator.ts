import { supabase } from './supabase';

export async function calculateHappinessScore(userId: string, date: Date = new Date()): Promise<number> {
  const dateString = date.toISOString().split('T')[0];

  const activityScore = await calculateActivityScore(userId, dateString);
  const moodScore = await calculateMoodScore(userId, dateString);
  const goalScore = await calculateGoalScore(userId);
  const habitScore = await calculateHabitScore(userId, dateString);

  const overallScore = Math.round(
    activityScore * 0.3 +
    moodScore * 0.3 +
    goalScore * 0.2 +
    habitScore * 0.2
  );

  await supabase
    .from('happiness_scores')
    .upsert({
      user_id: userId,
      score_date: dateString,
      activity_score: activityScore,
      mood_score: moodScore,
      goal_score: goalScore,
      habit_score: habitScore,
      overall_score: overallScore,
    }, {
      onConflict: 'user_id,score_date'
    });

  return overallScore;
}

async function calculateActivityScore(userId: string, date: string): Promise<number> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: activities } = await supabase
    .from('activities')
    .select('status, completion_percentage')
    .eq('user_id', userId)
    .gte('scheduled_start', startOfDay.toISOString())
    .lte('scheduled_start', endOfDay.toISOString());

  if (!activities || activities.length === 0) return 0;

  const totalCompletion = activities.reduce((sum, activity) => {
    if (activity.status === 'completed') return sum + 100;
    if (activity.status === 'partial') return sum + activity.completion_percentage;
    return sum;
  }, 0);

  return Math.min(Math.round(totalCompletion / activities.length), 100);
}

async function calculateMoodScore(userId: string, date: string): Promise<number> {
  const { data: moodLog } = await supabase
    .from('mood_logs')
    .select('mood_score')
    .eq('user_id', userId)
    .eq('log_date', date)
    .maybeSingle();

  if (!moodLog) return 0;

  return Math.round((moodLog.mood_score / 10) * 100);
}

async function calculateGoalScore(userId: string): Promise<number> {
  const { data: goals } = await supabase
    .from('goals')
    .select('target_value, current_value')
    .eq('user_id', userId);

  if (!goals || goals.length === 0) return 0;

  const totalProgress = goals.reduce((sum, goal) => {
    if (goal.target_value === 0) return sum;
    const progress = Math.min((goal.current_value / goal.target_value) * 100, 100);
    return sum + progress;
  }, 0);

  return Math.round(totalProgress / goals.length);
}

async function calculateHabitScore(userId: string, date: string): Promise<number> {
  const { data: habits } = await supabase
    .from('habits')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (!habits || habits.length === 0) return 0;

  let totalScore = 0;
  let habitCount = 0;

  for (const habit of habits) {
    const { data: logs } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('habit_id', habit.id)
      .order('log_date', { ascending: false })
      .limit(7);

    if (!logs || logs.length === 0) continue;

    habitCount++;

    const completedCount = logs.filter(log => log.status === 'completed').length;
    const partialCount = logs.filter(log => log.status === 'partial').length;

    const habitScore = Math.round(
      ((completedCount * 100) + (partialCount * 50)) / (logs.length * 100) * 100
    );

    totalScore += habitScore;
  }

  if (habitCount === 0) return 0;

  return Math.round(totalScore / habitCount);
}

export async function updateDailyHappinessScore(userId: string): Promise<void> {
  await calculateHappinessScore(userId);
}
