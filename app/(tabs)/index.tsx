import { View, Text, StyleSheet, ScrollView, Pressable, ImageBackground, Modal, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bot, Heart, Target, TrendingUp, Plus, Trophy, Sparkles, Sun, Moon, Calendar, Bell } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { calculateHappinessScore } from '@/lib/happinessCalculator';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [userName, setUserName] = useState('Friend');
  const [happinessScore, setHappinessScore] = useState(0);
  const [weeklyScore, setWeeklyScore] = useState(0);
  const [monthlyScore, setMonthlyScore] = useState(0);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [stats, setStats] = useState({
    completedToday: 0,
    activeGoals: 0,
    activeHabits: 0,
    currentStreak: 0,
  });
  const [notifications, setNotifications] = useState(3); // Mock notification count

  useEffect(() => {
    loadUserData();
    checkEndOfDayReminder();
  }, [user]);

  const checkEndOfDayReminder = () => {
    const now = new Date();
    const hour = now.getHours();
    
    // Show end of day reminder between 8-10 PM
    if (hour >= 20 && hour <= 22) {
      // Check if user has activities today
      checkTodayActivities();
    }
  };

  const checkTodayActivities = async () => {
    if (!user) return;

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .gte('scheduled_start', startOfDay.toISOString())
      .lte('scheduled_start', endOfDay.toISOString());

    if (activities && activities.length > 0) {
      const incomplete = activities.filter(a => a.status === 'scheduled');
      if (incomplete.length > 0) {
        Alert.alert(
          '🌅 End of Day Reflection',
          `You planned ${activities.length} activities today. How did it go?`,
          [
            { text: 'Review Later', style: 'cancel' },
            { text: 'Reflect Now', onPress: () => showDayReflection(activities) }
          ]
        );
      }
    }
  };

  const showDayReflection = (activities: any[]) => {
    // This would open a reflection modal
    Alert.alert(
      '✨ Daily Reflection',
      'How are you feeling about today?',
      [
        { text: '😊 Happy', onPress: () => logMood('happy') },
        { text: '😐 Neutral', onPress: () => logMood('neutral') },
        { text: '😔 Could be better', onPress: () => logMood('sad') }
      ]
    );
  };

  const logMood = async (mood: string) => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const moodScore = mood === 'happy' ? 8 : mood === 'neutral' ? 5 : 3;

    await supabase
      .from('mood_logs')
      .upsert({
        user_id: user.id,
        log_date: today,
        mood_score: moodScore,
        mood_emoji: mood === 'happy' ? '😊' : mood === 'neutral' ? '😐' : '😔',
        reflection_notes: '',
      }, { onConflict: 'user_id,log_date' });

    // Generate AI recommendation based on mood
    generateAIRecommendation(mood);
  };

  const generateAIRecommendation = (mood: string) => {
    const recommendations = {
      happy: [
        "🌟 Wonderful! Your positive energy is contagious. Keep riding this wave of happiness!",
        "✨ You're glowing today! This is the perfect time to tackle a challenging goal.",
        "🎉 Your happiness is inspiring! Consider sharing this joy with someone special."
      ],
      neutral: [
        "🌱 Every day is a new opportunity for growth. What small step can you take today?",
        "⚖️ Balance is key. Perhaps try a mindful activity or connect with nature.",
        "🎯 Neutral days are perfect for planning. What would make tomorrow brighter?"
      ],
      sad: [
        "🤗 It's okay to have tough days. Be gentle with yourself and take it one step at a time.",
        "🌈 Remember, storms pass and rainbows follow. What's one small thing that usually lifts your spirits?",
        "💪 You're stronger than you know. Consider reaching out to a friend or doing something nurturing for yourself."
      ]
    };

    const moodRecs = recommendations[mood as keyof typeof recommendations];
    const randomRec = moodRecs[Math.floor(Math.random() * moodRecs.length)];
    setAiRecommendation(randomRec);
    setShowAIModal(true);
  };

  const loadUserData = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.full_name) {
      setUserName(profile.full_name.split(' ')[0]);
    }

    // Load happiness scores
    const today = new Date().toISOString().split('T')[0];
    
    let { data: score } = await supabase
      .from('happiness_scores')
      .select('overall_score')
      .eq('user_id', user.id)
      .eq('score_date', today)
      .maybeSingle();

    if (!score) {
      const calculatedScore = await calculateHappinessScore(user.id);
      setHappinessScore(calculatedScore);
    } else {
      setHappinessScore(score.overall_score);
    }

    // Calculate weekly and monthly averages
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { data: weeklyScores } = await supabase
      .from('happiness_scores')
      .select('overall_score')
      .eq('user_id', user.id)
      .gte('score_date', weekAgo.toISOString().split('T')[0]);

    if (weeklyScores && weeklyScores.length > 0) {
      const avg = weeklyScores.reduce((sum, s) => sum + s.overall_score, 0) / weeklyScores.length;
      setWeeklyScore(Math.round(avg));
    }

    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    const { data: monthlyScores } = await supabase
      .from('happiness_scores')
      .select('overall_score')
      .eq('user_id', user.id)
      .gte('score_date', monthAgo.toISOString().split('T')[0]);

    if (monthlyScores && monthlyScores.length > 0) {
      const avg = monthlyScores.reduce((sum, s) => sum + s.overall_score, 0) / monthlyScores.length;
      setMonthlyScore(Math.round(avg));
    }

    // Load stats
    const { data: goals } = await supabase
      .from('goals')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_completed', false);

    const { data: habits } = await supabase
      .from('habits')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const { data: todayActivities } = await supabase
      .from('activities')
      .select('status')
      .eq('user_id', user.id)
      .gte('scheduled_start', new Date().toISOString().split('T')[0]);

    const completedToday = todayActivities?.filter(a => a.status === 'completed').length || 0;

    setStats({
      completedToday,
      activeGoals: goals?.length || 0,
      activeHabits: habits?.length || 0,
      currentStreak: 0, // Calculate streak logic here
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FFD700';
    if (score >= 40) return '#FF9800';
    return '#FF6B6B';
  };

  const getScoreLevel = (score: number) => {
    if (score >= 90) return { level: 'Radiant Soul', icon: '✨', desc: 'You are glowing with happiness!' };
    if (score >= 80) return { level: 'Joyful Spirit', icon: '🌟', desc: 'Your positive energy is inspiring!' };
    if (score >= 70) return { level: 'Happy Heart', icon: '💖', desc: 'You are in a wonderful place!' };
    if (score >= 60) return { level: 'Balanced Being', icon: '⚖️', desc: 'You have found your center!' };
    if (score >= 50) return { level: 'Growing Soul', icon: '🌱', desc: 'You are on a beautiful journey!' };
    return { level: 'Brave Warrior', icon: '💪', desc: 'Every step forward is courage!' };
  };

  const currentLevel = getScoreLevel(happinessScore);
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';
  const timeIcon = currentHour < 12 ? <Sun size={24} color="#FFD700" /> : <Moon size={24} color="#FFD700" />;

  return (
    <ImageBackground
      source={{ uri: 'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg' }}
      style={styles.container}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.greetingRow}>
              {timeIcon}
              <Text style={styles.greeting}>{greeting}, {userName} ✨</Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable style={styles.notificationButton}>
                <Bell size={22} color="#FFD700" />
                {notifications > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationCount}>{notifications}</Text>
                  </View>
                )}
              </Pressable>
              <Pressable style={styles.aiButton} onPress={() => router.push('/ai-coach')}>
                <LinearGradient
                  colors={['#A29BFE', '#6C5CE7']}
                  style={styles.aiButtonGradient}
                >
                  <Bot size={20} color="#fff" />
                </LinearGradient>
              </Pressable>
              <Pressable 
                style={styles.profileButton}
                onPress={() => router.push('/(tabs)/profile')}
              >
                <View style={styles.profileIcon}>
                  <Text style={styles.profileText}>👤</Text>
                </View>
              </Pressable>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>How is your happiness journey today?</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Happiness Score Card - Enhanced */}
          <View style={styles.scoreCard}>
            <LinearGradient
              colors={[
                happinessScore >= 80 ? '#00C851' : 
                happinessScore >= 60 ? '#FFD700' : 
                happinessScore >= 40 ? '#FF8800' : '#FF4444',
                happinessScore >= 80 ? '#00FF7F' : 
                happinessScore >= 60 ? '#FFEB3B' : 
                happinessScore >= 40 ? '#FFA726' : '#FF6B6B'
              ]}
              style={styles.scoreGradient}
            >
              <View style={styles.scoreHeader}>
                <Text style={styles.scoreTitle}>Your Happiness Level</Text>
                <Text style={styles.levelIcon}>{currentLevel.icon}</Text>
              </View>
              
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreValue}>
                  {happinessScore}
                </Text>
                <Text style={styles.scoreLabel}>out of 100</Text>
              </View>
              
              <Text style={styles.levelText}>{currentLevel.level}</Text>
              <Text style={styles.levelDesc}>{currentLevel.desc}</Text>
              
              <View style={styles.scoreBar}>
                <View
                  style={[
                    styles.scoreProgress,
                    {
                      width: `${happinessScore}%`,
                      backgroundColor: 'rgba(255,255,255,0.8)',
                    },
                  ]}
                />
              </View>
            </LinearGradient>
          </View>

          {/* Time Period Scores */}
          <View style={styles.periodScores}>
            <View style={styles.periodCard}>
              <Text style={styles.periodValue}>{weeklyScore}</Text>
              <Text style={styles.periodLabel}>7-Day Average</Text>
            </View>
            <View style={styles.periodCard}>
              <Text style={styles.periodValue}>{monthlyScore}</Text>
              <Text style={styles.periodLabel}>30-Day Average</Text>
            </View>
            <View style={styles.periodCard}>
              <Text style={styles.periodValue}>{stats.currentStreak}</Text>
              <Text style={styles.periodLabel}>Day Streak</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Life Challenges</Text>
            <View style={styles.actionGrid}>
              <Pressable
                style={[styles.actionCard, { backgroundColor: '#FF6B6B' }]}
                onPress={() => router.push('/activity/add')}
              >
                <LinearGradient
                  colors={['#FF6B6B', '#FF8A80']}
                  style={styles.actionGradient}
                >
                  <Heart size={28} color="#fff" />
                  <Text style={styles.actionText}>Plan Activity</Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                style={[styles.actionCard, { backgroundColor: '#4CAF50' }]}
                onPress={() => router.push('/(tabs)/habits')}
              >
                <LinearGradient
                  colors={['#4CAF50', '#66BB6A']}
                  style={styles.actionGradient}
                >
                  <Target size={28} color="#fff" />
                  <Text style={styles.actionText}>Build Habits</Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                style={[styles.actionCard, { backgroundColor: '#FFD700' }]}
                onPress={() => router.push('/(tabs)/goals')}
              >
                <LinearGradient
                  colors={['#FFD700', '#FFA726']}
                  style={styles.actionGradient}
                >
                  <Trophy size={28} color="#fff" />
                  <Text style={styles.actionText}>Set Goals</Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                style={[styles.actionCard, { backgroundColor: '#9C27B0' }]}
                onPress={() => router.push('/ai-coach')}
              >
                <LinearGradient
                  colors={['#9C27B0', '#BA68C8']}
                  style={styles.actionGradient}
                >
                  <Bot size={28} color="#fff" />
                  <Text style={styles.actionText}>AI Coach</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>

          {/* Today's Progress */}
          <View style={styles.progressSection}>
            <Text style={styles.sectionTitle}>Today's Journey</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.completedToday}</Text>
                <Text style={styles.statLabel}>Completed</Text>
                <Text style={styles.statEmoji}>✅</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.activeGoals}</Text>
                <Text style={styles.statLabel}>Active Goals</Text>
                <Text style={styles.statEmoji}>🎯</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.activeHabits}</Text>
                <Text style={styles.statLabel}>Daily Habits</Text>
                <Text style={styles.statEmoji}>🔄</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>

      {/* AI Recommendation Modal */}
      <Modal
        visible={showAIModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAIModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Sparkles size={24} color="#9C27B0" />
              <Text style={styles.modalTitle}>Your AI Coach Says</Text>
            </View>
            <Text style={styles.modalText}>{aiRecommendation}</Text>
            <Pressable
              style={styles.modalButton}
              onPress={() => setShowAIModal(false)}
            >
              <LinearGradient
                colors={['#9C27B0', '#E91E63']}
                style={styles.modalButtonGradient}
              >
                <Text style={styles.modalButtonText}>Thank You</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationCount: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  aiButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  aiButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    fontSize: 16,
  },
  greeting: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.9)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scoreCard: {
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  scoreGradient: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  scoreTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  levelIcon: {
    fontSize: 24,
  },
  scoreCircle: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreValue: {
    fontSize: 48,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  scoreLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.9)',
  },
  levelText: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 4,
  },
  levelDesc: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 16,
  },
  scoreBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreProgress: {
    height: '100%',
    borderRadius: 4,
  },
  periodScores: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  periodCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  periodValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#2D3436',
  },
  periodLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#636E72',
    textAlign: 'center',
  },
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionGradient: {
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
    textAlign: 'center',
  },
  progressSection: {
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#2D3436',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#636E72',
    textAlign: 'center',
  },
  statEmoji: {
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#2D3436',
  },
  modalText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#2D3436',
    lineHeight: 24,
    marginBottom: 20,
  },
  modalButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
});