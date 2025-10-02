import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput, Alert, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Target, Calendar, TrendingUp, CircleCheck as CheckCircle, Trophy, Heart, Sparkles, Star, Bot, Flag } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Goal, GoalMilestone } from '@/types/database';

type GoalStatus = 'all' | 'in_progress' | 'completed' | 'not_started';

export default function GoalsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [milestones, setMilestones] = useState<Record<string, GoalMilestone[]>>({});
  const [updateValue, setUpdateValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<GoalStatus>('all');
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState('');

  useEffect(() => {
    if (user) {
      loadGoals();
    }
  }, [user]);

  const loadGoals = async () => {
    if (!user) return;

    setLoading(true);
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setGoals(data);

      // Load milestones for each goal
      const milestonesMap: Record<string, GoalMilestone[]> = {};
      for (const goal of data) {
        const { data: goalMilestones } = await supabase
          .from('goal_milestones')
          .select('*')
          .eq('goal_id', goal.id)
          .order('sort_order');

        if (goalMilestones) {
          milestonesMap[goal.id] = goalMilestones;
        }
      }
      setMilestones(milestonesMap);
    }
    setLoading(false);
  };

  const updateGoalProgress = async () => {
    if (!selectedGoal) return;

    const newValue = parseInt(updateValue);
    if (isNaN(newValue) || newValue < 0) {
      Alert.alert('Error', 'Please enter a valid number');
      return;
    }

    try {
      const isCompleted = newValue >= selectedGoal.target_value;
      const { error } = await supabase
        .from('goals')
        .update({
          current_value: newValue,
          is_completed: isCompleted,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedGoal.id);

      if (error) throw error;

      if (isCompleted) {
        Alert.alert(
          '🎉 Goal Achieved!', 
          `Congratulations! You've accomplished: ${selectedGoal.title}\n\nYou are absolutely amazing! This achievement shows your dedication and strength. Keep shining! ✨\n\nHow are you feeling about this achievement?`,
          [
            { text: '😊 Ecstatic!', onPress: () => logGoalMood('ecstatic') },
            { text: '😌 Satisfied', onPress: () => logGoalMood('satisfied') },
            { text: '🤔 Neutral', onPress: () => logGoalMood('neutral') }
          ]
        );
      }

      await loadGoals();
      setSelectedGoal(null);
      setUpdateValue('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update goal');
    }
  };

  const logGoalMood = async (mood: string) => {
    if (!user || !selectedGoal) return;

    const today = new Date().toISOString().split('T')[0];
    const moodScore = mood === 'ecstatic' ? 10 : mood === 'satisfied' ? 8 : 5;

    await supabase
      .from('mood_logs')
      .upsert({
        user_id: user.id,
        log_date: today,
        mood_score: moodScore,
        mood_emoji: mood === 'ecstatic' ? '😊' : mood === 'satisfied' ? '😌' : '🤔',
        reflection_notes: `Completed goal: ${selectedGoal.title}`,
      }, { onConflict: 'user_id,log_date' });

    generateAIRecommendation(mood);
  };

  const generateAIRecommendation = (mood: string) => {
    const recommendations = {
      ecstatic: [
        "🌟 Incredible achievement! Your dedication is inspiring. Consider setting an even bigger dream - you've proven you can achieve anything!",
        "✨ You're on fire! This success shows your amazing potential. What's the next mountain you want to climb?",
        "🎉 Outstanding! Your joy is contagious. Share this victory with someone special and let it fuel your next adventure!"
      ],
      satisfied: [
        "👏 Well done! Steady progress leads to lasting success. What did you learn from this journey that can help with your next goal?",
        "🎯 Great work! You've shown consistency and determination. Consider celebrating this win before tackling your next challenge.",
        "💪 Solid achievement! Your methodical approach is paying off. What aspect of this goal brought you the most satisfaction?"
      ],
      neutral: [
        "🤗 Every achievement matters, even if it doesn't feel overwhelming right now. Sometimes the most important victories are quiet ones.",
        "🌱 Completion is success, regardless of how you feel. Your future self will thank you for this persistence.",
        "⚖️ It's okay to feel neutral about achievements. What matters is that you followed through. What would make your next goal more exciting?"
      ]
    };

    const moodRecs = recommendations[mood as keyof typeof recommendations];
    const randomRec = moodRecs[Math.floor(Math.random() * moodRecs.length)];
    setAiRecommendation(randomRec);
    setShowAIModal(true);
  };

  const getProgressPercentage = (goal: Goal): number => {
    if (goal.target_value === 0) return 0;
    return Math.min(Math.round((goal.current_value / goal.target_value) * 100), 100);
  };

  const getDaysRemaining = (deadline: string | null): string => {
    if (!deadline) return 'No deadline';

    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Past deadline';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return '1 day left';
    return `${diffDays} days left`;
  };

  const getGoalStatus = (goal: Goal): GoalStatus => {
    if (goal.is_completed) return 'completed';
    if (goal.current_value === 0) return 'not_started';
    return 'in_progress';
  };

  const getGoalEmoji = (progress: number, isCompleted: boolean) => {
    if (isCompleted) return '🏆';
    if (progress >= 75) return '🌟';
    if (progress >= 50) return '💫';
    if (progress >= 25) return '✨';
    return '🎯';
  };

  const getGoalLevel = (progress: number, isCompleted: boolean) => {
    if (isCompleted) return { level: 'Goal Achieved!', color: ['#FFD700', '#FFA500'] };
    if (progress >= 75) return { level: 'Almost There!', color: ['#4CAF50', '#66BB6A'], textColor: '#fff' };
    if (progress >= 50) return { level: 'Halfway Hero', color: ['#2196F3', '#42A5F5'], textColor: '#fff' };
    if (progress >= 25) return { level: 'Making Progress', color: ['#FF9800', '#FFB74D'], textColor: '#fff' };
    return { level: 'Just Started', color: ['#9C27B0', '#BA68C8'], textColor: '#fff' };
  };

  const commonGoals = [
    { title: 'Buy a Car', icon: '🚗+❤️', category: 'Financial', target: 25000, unit: 'dollars' },
    { title: 'Buy Apartment', icon: '🏠+⭐', category: 'Financial', target: 200000, unit: 'dollars' },
    { title: 'Get Married', icon: '💍+❤️', category: 'Personal', target: 1, unit: 'milestone' },
    { title: 'Have Children', icon: '👶+⭐', category: 'Personal', target: 2, unit: 'children' },
    { title: 'Become Rich', icon: '💰+❤️', category: 'Financial', target: 1000000, unit: 'dollars' },
    { title: 'Travel World', icon: '✈️+⭐', category: 'Adventure', target: 50, unit: 'countries' },
  ];

  const filteredGoals = goals.filter(goal => {
    if (filterStatus === 'all') return true;
    return getGoalStatus(goal) === filterStatus;
  });

  return (
    <ImageBackground
      source={{ uri: 'https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg' }}
      style={styles.container}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['#ff9a9e', '#fecfef', '#fecfef']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Life Dreams 🌟</Text>
            <View style={styles.headerActions}>
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
          <Text style={styles.headerSubtitle}>Turn your dreams into reality with AI guidance</Text>
        </View>

        {/* Common Goals Section */}
        <View style={styles.commonGoalsSection}>
          <Text style={styles.commonGoalsTitle}>✨ Popular Life Goals</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.commonGoalsScroll}>
            {commonGoals.map((commonGoal, index) => (
              <Pressable
                key={index}
                style={styles.commonGoalCard}
                onPress={() => {
                  // Pre-fill goal creation with common goal data
                  router.push({
                    pathname: '/goals/create',
                    params: {
                      template: JSON.stringify(commonGoal)
                    }
                  });
                }}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.8)']}
                  style={styles.commonGoalGradient}
                >
                  <Text style={styles.commonGoalIcon}>{commonGoal.icon}</Text>
                  <Text style={styles.commonGoalTitle}>{commonGoal.title}</Text>
                  <Text style={styles.commonGoalCategory}>{commonGoal.category}</Text>
                </LinearGradient>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Dreams</Text>
            <View style={styles.headerButtons}>
              <Pressable style={styles.addButton} onPress={() => router.push('/goals/create')}>
                <LinearGradient
                  colors={['#FF6B6B', '#E91E63']}
                  style={styles.addButtonGradient}
                >
                  <Plus size={16} color="#fff" />
                  <Text style={styles.addButtonText}>Goal</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>

          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <Pressable
                style={[styles.filterChip, filterStatus === 'all' && styles.filterChipActive]}
                onPress={() => setFilterStatus('all')}
              >
                <Text style={[styles.filterText, filterStatus === 'all' && styles.filterTextActive]}>
                  All Dreams ({goals.length})
                </Text>
              </Pressable>
              <Pressable
                style={[styles.filterChip, filterStatus === 'in_progress' && styles.filterChipActive]}
                onPress={() => setFilterStatus('in_progress')}
              >
                <Text style={[styles.filterText, filterStatus === 'in_progress' && styles.filterTextActive]}>
                  In Progress ({goals.filter(g => getGoalStatus(g) === 'in_progress').length})
                </Text>
              </Pressable>
              <Pressable
                style={[styles.filterChip, filterStatus === 'completed' && styles.filterChipActive]}
                onPress={() => setFilterStatus('completed')}
              >
                <Text style={[styles.filterText, filterStatus === 'completed' && styles.filterTextActive]}>
                  Achieved ({goals.filter(g => g.is_completed).length})
                </Text>
              </Pressable>
              <Pressable
                style={[styles.filterChip, filterStatus === 'not_started' && styles.filterChipActive]}
                onPress={() => setFilterStatus('not_started')}
              >
                <Text style={[styles.filterText, filterStatus === 'not_started' && styles.filterTextActive]}>
                  New Dreams ({goals.filter(g => getGoalStatus(g) === 'not_started').length})
                </Text>
              </Pressable>
            </ScrollView>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {loading ? (
              <Text style={styles.loadingText}>Loading your dreams...</Text>
            ) : filteredGoals.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🌟</Text>
                <Text style={styles.emptyText}>
                  {filterStatus === 'all' ? 'No dreams yet' : `No ${filterStatus.replace('_', ' ')} dreams`}
                </Text>
                <Text style={styles.emptySubtext}>
                  {filterStatus === 'all' ? 'Create your first life goal!' : 'Try a different filter'}
                </Text>
              </View>
            ) : (
              filteredGoals.map((goal) => {
                const progress = getProgressPercentage(goal);
                const status = getGoalStatus(goal);
                const goalEmoji = getGoalEmoji(progress, goal.is_completed);
                const goalLevel = getGoalLevel(progress, goal.is_completed);
                const goalMilestones = milestones[goal.id] || [];
                
                return (
                  <Pressable
                    key={goal.id}
                    style={[styles.goalCard, goal.is_completed && styles.goalCardCompleted]}
                    onPress={() => router.push(`/goals/edit/${goal.id}`)}
                  >
                    <LinearGradient
                      colors={goal.is_completed ? ['#FFD700', '#FFA500'] : ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
                      style={styles.goalGradient}
                    >
                      <View style={styles.goalHeader}>
                        <View style={styles.goalTitleRow}>
                          <Text style={[
                            styles.goalTitle, 
                            goal.is_completed && styles.goalTitleCompleted,
                            { color: goal.is_completed ? '#fff' : '#1a1a2e' }
                          ]}>
                            {goal.title}
                          </Text>
                          <Text style={styles.goalEmoji}>{goalEmoji}</Text>
                        </View>
                        <Text style={[
                          styles.goalProgress, 
                          goal.is_completed && styles.goalProgressCompleted,
                          { color: goal.is_completed ? 'rgba(255,255,255,0.9)' : '#4a5568' }
                        ]}>
                          {goal.current_value} / {goal.target_value} {goal.unit}
                        </Text>
                      </View>

                      {/* Milestones */}
                      {goalMilestones.length > 0 && (
                        <View style={styles.milestonesSection}>
                          <Text style={[
                            styles.milestonesTitle,
                            { color: goal.is_completed ? 'rgba(255,255,255,0.9)' : '#4a5568' }
                          ]}>
                            Milestones
                          </Text>
                          {goalMilestones.slice(0, 3).map((milestone, index) => (
                            <View key={milestone.id} style={styles.milestoneItem}>
                              <Flag 
                                size={12} 
                                color={milestone.is_completed ? '#4CAF50' : (goal.is_completed ? 'rgba(255,255,255,0.7)' : '#9ca3af')} 
                              />
                              <Text style={[
                                styles.milestoneText,
                                milestone.is_completed && styles.milestoneTextCompleted,
                                { color: goal.is_completed ? 'rgba(255,255,255,0.8)' : '#6b7280' }
                              ]}>
                                {milestone.title}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}

                      <View style={styles.progressSection}>
                        <View style={styles.progressBarContainer}>
                          <View style={styles.progressBarBackground}>
                            <LinearGradient
                              colors={goal.is_completed ? ['#4CAF50', '#66BB6A'] : goalLevel.color}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={[styles.progressBarFill, { width: `${progress}%` }]}
                            />
                          </View>
                          <Text style={[
                            styles.progressPercentage,
                            { color: goal.is_completed ? '#fff' : '#2d3748' }
                          ]}>
                            {progress}%
                          </Text>
                        </View>
                        
                        <View style={styles.levelBadge}>
                          <LinearGradient
                            colors={goalLevel.color}
                            style={styles.levelBadgeGradient}
                          >
                            <Text style={[styles.levelBadgeText, { color: goalLevel.textColor || '#fff' }]}>
                              {goalLevel.level}
                            </Text>
                          </LinearGradient>
                        </View>
                      </View>

                      <View style={styles.goalFooter}>
                        {goal.deadline && (
                          <View style={styles.deadlineContainer}>
                            <Calendar size={14} color={goal.is_completed ? '#fff' : '#6b7280'} />
                            <Text style={[
                              styles.deadlineText,
                              { color: goal.is_completed ? 'rgba(255,255,255,0.9)' : '#6b7280' }
                            ]}>
                              {getDaysRemaining(goal.deadline)}
                            </Text>
                          </View>
                        )}
                      </View>

                      {goal.is_completed && (
                        <View style={styles.achievedSection}>
                          <Sparkles size={16} color="#fff" />
                          <Text style={styles.achievedText}>Dream Achieved! You're incredible! 🎉</Text>
                        </View>
                      )}
                    </LinearGradient>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>

        <Modal
          visible={selectedGoal !== null}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedGoal(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Update Your Progress ✨</Text>
                <Heart size={24} color="#FF6B6B" />
              </View>
              <Text style={styles.modalSubtitle}>{selectedGoal?.title}</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Current Progress</Text>
                <TextInput
                  style={styles.input}
                  value={updateValue}
                  onChangeText={setUpdateValue}
                  keyboardType="number-pad"
                  placeholder="0"
                />
                <Text style={styles.inputHint}>
                  Target: {selectedGoal?.target_value} {selectedGoal?.unit}
                </Text>
              </View>

              <View style={styles.modalActions}>
                <Pressable style={styles.cancelButton} onPress={() => setSelectedGoal(null)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.updateButton} onPress={updateGoalProgress}>
                  <LinearGradient
                    colors={['#FF6B6B', '#E91E63']}
                    style={styles.updateButtonGradient}
                  >
                    <Text style={styles.updateButtonText}>Update Progress</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

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
                <Bot size={24} color="#A29BFE" />
                <Text style={styles.modalTitle}>Your AI Life Coach</Text>
              </View>
              <Text style={styles.modalText}>{aiRecommendation}</Text>
              <Pressable
                style={styles.aiModalButton}
                onPress={() => setShowAIModal(false)}
              >
                <LinearGradient
                  colors={['#A29BFE', '#6C5CE7']}
                  style={styles.aiModalButtonGradient}
                >
                  <Text style={styles.aiModalButtonText}>Thank You, Coach!</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </Modal>
      </LinearGradient>
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
    marginBottom: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
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
  headerTitle: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.9)',
  },
  commonGoalsSection: {
    paddingVertical: 16,
  },
  commonGoalsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  commonGoalsScroll: {
    paddingLeft: 20,
  },
  commonGoalCard: {
    width: 120,
    height: 100,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
  },
  commonGoalGradient: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commonGoalIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  commonGoalTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#2D3436',
    textAlign: 'center',
    marginBottom: 2,
  },
  commonGoalCategory: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#636E72',
    textAlign: 'center',
  },
  mainContent: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  addButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  addButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  filterContainer: {
    paddingVertical: 8,
    marginBottom: 16,
  },
  filterScroll: {
    paddingHorizontal: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#FFD700',
  },
  filterText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: 'rgba(255,255,255,0.8)',
  },
  filterTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
  },
  goalCard: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  goalCardCompleted: {
    shadowColor: '#FFD700',
    shadowOpacity: 0.3,
  },
  goalGradient: {
    borderRadius: 16,
    padding: 20,
  },
  goalHeader: {
    marginBottom: 16,
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    flex: 1,
  },
  goalTitleCompleted: {},
  goalEmoji: {
    fontSize: 24,
    marginLeft: 8,
  },
  goalProgress: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  goalProgressCompleted: {},
  milestonesSection: {
    marginBottom: 12,
  },
  milestonesTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    marginBottom: 6,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  milestoneText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  milestoneTextCompleted: {
    textDecorationLine: 'line-through',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#E8EBED',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    minWidth: 45,
    textAlign: 'right',
  },
  levelBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    overflow: 'hidden',
  },
  levelBadgeGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  levelBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  goalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deadlineText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  achievedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  achievedText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    color: '#2D3436',
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#636E72',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#2D3436',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#2D3436',
    borderWidth: 2,
    borderColor: '#E8EBED',
  },
  inputHint: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#636E72',
    marginTop: 6,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#636E72',
  },
  updateButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  updateButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  updateButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  modalText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#2D3436',
    lineHeight: 24,
    marginBottom: 20,
  },
  aiModalButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  aiModalButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  aiModalButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
});