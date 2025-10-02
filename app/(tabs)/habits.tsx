import { View, Text, StyleSheet, ScrollView, Pressable, Modal, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Flame, Target, CircleCheck as CheckCircle, Trophy, Heart, Sparkles, Bot } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Habit, HabitLog } from '@/types/database';

export default function HabitsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<Record<string, HabitLog[]>>({});
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'ongoing' | 'not_started'>('all');

  useEffect(() => {
    if (user) {
      loadHabits();
    }
  }, [user]);

  const loadHabits = async () => {
    if (!user) return;

    setLoading(true);
    const { data: habitsData } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (habitsData) {
      setHabits(habitsData);

      const logsMap: Record<string, HabitLog[]> = {};
      for (const habit of habitsData) {
        const { data: logs } = await supabase
          .from('habit_logs')
          .select('*')
          .eq('habit_id', habit.id)
          .order('log_date', { ascending: false })
          .limit(30);

        if (logs) {
          logsMap[habit.id] = logs;
        }
      }
      setHabitLogs(logsMap);
    }
    setLoading(false);
  };

  const calculateStreak = (logs: HabitLog[]): number => {
    if (!logs || logs.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < logs.length; i++) {
      const logDate = new Date(logs[i].log_date);
      logDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);

      if (logDate.getTime() === expectedDate.getTime() && logs[i].status === 'completed') {
        streak++;
      } else if (logDate.getTime() < expectedDate.getTime()) {
        break;
      }
    }

    return streak;
  };

  const getTodayLog = (habitId: string): HabitLog | null => {
    const logs = habitLogs[habitId] || [];
    const today = new Date().toISOString().split('T')[0];
    return logs.find(log => log.log_date === today) || null;
  };

  const logHabit = async (habitId: string, status: 'completed' | 'partial' | 'missed') => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const existingLog = getTodayLog(habitId);

    try {
      if (existingLog) {
        await supabase
          .from('habit_logs')
          .update({ status })
          .eq('id', existingLog.id);
      } else {
        await supabase
          .from('habit_logs')
          .insert({
            habit_id: habitId,
            user_id: user.id,
            log_date: today,
            status,
            notes: '',
          });
      }

      await loadHabits();
      setSelectedHabit(null);
    } catch (error) {
      console.error('Error logging habit:', error);
    }
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🏆';
    if (streak >= 14) return '🔥';
    if (streak >= 7) return '⚡';
    if (streak >= 3) return '🌟';
    return '💫';
  };

  const getHabitLevel = (streak: number) => {
    if (streak >= 30) return { level: 'Habit Master', color: ['#FFD700', '#FFA500'] };
    if (streak >= 14) return { level: 'Consistency Champion', color: ['#FF6B6B', '#E91E63'] };
    if (streak >= 7) return { level: 'Weekly Warrior', color: ['#4CAF50', '#66BB6A'] };
    if (streak >= 3) return { level: 'Rising Star', color: ['#2196F3', '#42A5F5'] };
    return { level: 'Getting Started', color: ['#9C27B0', '#BA68C8'] };
  };

  const getHabitStatus = (habitId: string) => {
    const todayLog = getTodayLog(habitId);
    if (todayLog?.status === 'completed') return 'completed';
    if (todayLog) return 'ongoing';
    return 'not_started';
  };

  const filteredHabits = habits.filter(habit => {
    if (filterStatus === 'all') return true;
    return getHabitStatus(habit.id) === filterStatus;
  });

  return (
    <ImageBackground
      source={{ uri: 'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg' }}
      style={styles.container}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Life Habits ✨</Text>
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
          <Text style={styles.headerSubtitle}>Build your happiness daily with AI guidance</Text>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Habits</Text>
            <View style={styles.headerButtons}>
              <Pressable style={styles.addButton} onPress={() => router.push('/habits/create')}>
                <LinearGradient
                  colors={['#FF6B6B', '#E91E63']}
                  style={styles.addButtonGradient}
                >
                  <Plus size={16} color="#fff" />
                  <Text style={styles.addButtonText}>Habit</Text>
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
                <Text style={[styles.filterText, filterStatus === 'all' && styles.filterTextActive]}>All ({habits.length})</Text>
              </Pressable>
              <Pressable
                style={[styles.filterChip, filterStatus === 'completed' && styles.filterChipActive]}
                onPress={() => setFilterStatus('completed')}
              >
                <Text style={[styles.filterText, filterStatus === 'completed' && styles.filterTextActive]}>✅ Done ({habits.filter(h => getHabitStatus(h.id) === 'completed').length})</Text>
              </Pressable>
              <Pressable
                style={[styles.filterChip, filterStatus === 'ongoing' && styles.filterChipActive]}
                onPress={() => setFilterStatus('ongoing')}
              >
                <Text style={[styles.filterText, filterStatus === 'ongoing' && styles.filterTextActive]}>🔄 Ongoing ({habits.filter(h => getHabitStatus(h.id) === 'ongoing').length})</Text>
              </Pressable>
              <Pressable
                style={[styles.filterChip, filterStatus === 'not_started' && styles.filterChipActive]}
                onPress={() => setFilterStatus('not_started')}
              >
                <Text style={[styles.filterText, filterStatus === 'not_started' && styles.filterTextActive]}>⏳ New ({habits.filter(h => getHabitStatus(h.id) === 'not_started').length})</Text>
              </Pressable>
            </ScrollView>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Loading your habits...</Text>
              </View>
            ) : filteredHabits.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🌱</Text>
                <Text style={styles.emptyTitle}>
                  {filterStatus === 'all' ? 'No habits yet' : `No ${filterStatus.replace('_', ' ')} habits`}
                </Text>
                <Text style={styles.emptyText}>
                  {filterStatus === 'all' ? 'Create meaningful habits that bring joy to your life' : 'Try a different filter'}
                </Text>
              </View>
            ) : (
              filteredHabits.map((habit) => {
                const logs = habitLogs[habit.id] || [];
                const streak = calculateStreak(logs);
                const todayLog = getTodayLog(habit.id);
                const isCompleted = todayLog?.status === 'completed';
                const habitLevel = getHabitLevel(streak);

                return (
                  <Pressable
                    key={habit.id}
                    style={[styles.habitCard, isCompleted && styles.habitCardCompleted]}
                    onPress={() => setSelectedHabit(habit)}
                  >
                    <LinearGradient
                      colors={isCompleted ? ['#4CAF50', '#66BB6A'] : ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
                      style={styles.habitGradient}
                    >
                      <View style={styles.habitHeader}>
                        <View style={styles.habitInfo}>
                          <View style={styles.habitTitleRow}>
                            <Text style={[styles.habitTitle, isCompleted && styles.habitTitleCompleted]}>
                              {habit.title}
                            </Text>
                            {isCompleted && (
                              <View style={styles.completedBadge}>
                                <CheckCircle size={20} color="#fff" />
                              </View>
                            )}
                          </View>
                          <Text style={[styles.habitFrequency, isCompleted && styles.habitFrequencyCompleted]}>
                            {habit.target_count}x {habit.frequency} • {habitLevel.level}
                          </Text>
                        </View>
                      </View>

                      {habit.description?.trim() ? (
                        <Text style={[styles.habitDescription, isCompleted && styles.habitDescriptionCompleted]} numberOfLines={2}>
                          {habit.description}
                        </Text>
                      ) : null}

                      <View style={styles.habitStats}>
                        <View style={styles.statItem}>
                          <Text style={styles.statEmoji}>{getStreakEmoji(streak)}</Text>
                          <Text style={[styles.statValue, isCompleted && styles.statValueCompleted]}>
                            {streak}
                          </Text>
                          <Text style={[styles.statLabel, isCompleted && styles.statLabelCompleted]}>
                            Day Streak
                          </Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statEmoji}>📊</Text>
                          <Text style={[styles.statValue, isCompleted && styles.statValueCompleted]}>
                            {logs.length}
                          </Text>
                          <Text style={[styles.statLabel, isCompleted && styles.statLabelCompleted]}>
                            Total Days
                          </Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statEmoji}>💯</Text>
                          <Text style={[styles.statValue, isCompleted && styles.statValueCompleted]}>
                            {Math.round((logs.filter(l => l.status === 'completed').length / Math.max(logs.length, 1)) * 100)}%
                          </Text>
                          <Text style={[styles.statLabel, isCompleted && styles.statLabelCompleted]}>
                            Success Rate
                          </Text>
                        </View>
                      </View>

                      {isCompleted && (
                        <View style={styles.completedSection}>
                          <Sparkles size={16} color="#fff" />
                          <Text style={styles.completedText}>Completed today! You're amazing! ✨</Text>
                        </View>
                      )}

                      {!isCompleted && (
                        <View style={styles.levelBadge}>
                          <LinearGradient
                            colors={habitLevel.color}
                            style={styles.levelBadgeGradient}
                          >
                            <Text style={styles.levelBadgeText}>{habitLevel.level}</Text>
                          </LinearGradient>
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
          visible={!!selectedHabit}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedHabit(null)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setSelectedHabit(null)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedHabit?.title}</Text>
                <Heart size={24} color="#FF6B6B" />
              </View>
              <Text style={styles.modalSubtitle}>How did this habit make you feel today?</Text>

              <View style={styles.logButtons}>
                <Pressable
                  style={styles.logButton}
                  onPress={() => selectedHabit && logHabit(selectedHabit.id, 'completed')}
                >
                  <LinearGradient
                    colors={['#4CAF50', '#66BB6A']}
                    style={styles.logButtonGradient}
                  >
                    <Text style={styles.logButtonEmoji}>✨</Text>
                    <Text style={styles.logButtonText}>Completed with joy!</Text>
                  </LinearGradient>
                </Pressable>
                <Pressable
                  style={styles.logButton}
                  onPress={() => selectedHabit && logHabit(selectedHabit.id, 'partial')}
                >
                  <LinearGradient
                    colors={['#FF9800', '#FFB74D']}
                    style={styles.logButtonGradient}
                  >
                    <Text style={styles.logButtonEmoji}>👍</Text>
                    <Text style={styles.logButtonText}>Partially done</Text>
                  </LinearGradient>
                </Pressable>
                <Pressable
                  style={styles.logButton}
                  onPress={() => selectedHabit && logHabit(selectedHabit.id, 'missed')}
                >
                  <LinearGradient
                    colors={['#9C27B0', '#BA68C8']}
                    style={styles.logButtonGradient}
                  >
                    <Text style={styles.logButtonEmoji}>💙</Text>
                    <Text style={styles.logButtonText}>Didn't happen today</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
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
    paddingBottom: 24,
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
    paddingHorizontal: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  habitCard: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  habitCardCompleted: {
    shadowColor: '#4CAF50',
    shadowOpacity: 0.3,
  },
  habitGradient: {
    borderRadius: 16,
    padding: 20,
  },
  habitHeader: {
    marginBottom: 8,
  },
  habitInfo: {
    flex: 1,
  },
  habitTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  habitTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#2D3436',
    flex: 1,
  },
  habitTitleCompleted: {
    color: '#fff',
  },
  completedBadge: {
    marginLeft: 8,
  },
  habitFrequency: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#636E72',
  },
  habitFrequencyCompleted: {
    color: 'rgba(255,255,255,0.9)',
  },
  habitDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#636E72',
    marginBottom: 16,
    lineHeight: 20,
  },
  habitDescriptionCompleted: {
    color: 'rgba(255,255,255,0.8)',
  },
  habitStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statEmoji: {
    fontSize: 20,
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#2D3436',
  },
  statValueCompleted: {
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#636E72',
    textAlign: 'center',
  },
  statLabelCompleted: {
    color: 'rgba(255,255,255,0.9)',
  },
  completedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  completedText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#fff',
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
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#2D3436',
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#636E72',
    marginBottom: 20,
  },
  logButtons: {
    gap: 12,
  },
  logButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  logButtonGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logButtonEmoji: {
    fontSize: 20,
  },
  logButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
});