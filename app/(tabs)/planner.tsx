import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput, Alert, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, ChevronLeft, ChevronRight, Clock, Heart, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Activity } from '@/types/database';
import { updateDailyHappinessScore } from '@/lib/happinessCalculator';

export default function PlannerScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [newActivityTitle, setNewActivityTitle] = useState('');
  const [newActivityDuration, setNewActivityDuration] = useState(30);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [currentActivityForMood, setCurrentActivityForMood] = useState<Activity | null>(null);

  useEffect(() => {
    if (user) {
      loadActivities();
    }
  }, [user, selectedDate]);

  const loadActivities = async () => {
    if (!user) return;

    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .gte('scheduled_start', startOfDay.toISOString())
      .lte('scheduled_start', endOfDay.toISOString())
      .order('scheduled_start');

    if (data) {
      setActivities(data);
    }
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'completed':
        return ['#4CAF50', '#66BB6A'];
      case 'partial':
        return ['#FF9800', '#FFB74D'];
      case 'missed':
        return ['#F44336', '#EF5350'];
      default:
        return ['#2196F3', '#42A5F5'];
    }
  };

  const updateActivityStatus = async (activityId: string, status: string) => {
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;

    const { error } = await supabase
      .from('activities')
      .update({ 
        status, 
        completion_percentage: status === 'completed' ? 100 : status === 'partial' ? 50 : 0 
      })
      .eq('id', activityId);

    if (!error && user) {
      await updateDailyHappinessScore(user.id);
      await loadActivities();
      setSelectedActivity(null);
      
      // Show mood tracking for completed activities
      if (status === 'completed') {
        setCurrentActivityForMood(activity);
        setShowMoodModal(true);
      }
    }
  };

  const logActivityMood = async (mood: string) => {
    if (!user || !currentActivityForMood) return;

    const today = new Date().toISOString().split('T')[0];
    const moodScore = mood === 'happy' ? 8 : mood === 'neutral' ? 5 : 3;

    await supabase
      .from('mood_logs')
      .upsert({
        user_id: user.id,
        log_date: today,
        mood_score: moodScore,
        mood_emoji: mood === 'happy' ? '😊' : mood === 'neutral' ? '😐' : '😔',
        reflection_notes: `After completing: ${currentActivityForMood.title}`,
      }, { onConflict: 'user_id,log_date' });

    setShowMoodModal(false);
    setCurrentActivityForMood(null);

    // Show AI encouragement
    const encouragements = {
      happy: "🌟 Fantastic! You're radiating positive energy. Keep this momentum going!",
      neutral: "👍 Good job completing your activity. Every step forward counts!",
      sad: "💙 It's okay to feel this way. You still showed up and that's what matters. Be proud of yourself!"
    };

    Alert.alert(
      '✨ Your AI Coach',
      encouragements[mood as keyof typeof encouragements],
      [{ text: 'Thank you', style: 'default' }]
    );
  };

  const handleHourClick = (hour: number) => {
    setSelectedHour(hour);
    setShowAddModal(true);
  };

  const addQuickActivity = async () => {
    if (!user || !newActivityTitle.trim() || selectedHour === null) {
      Alert.alert('Error', 'Please enter activity title');
      return;
    }

    try {
      const activityDate = new Date(selectedDate);
      activityDate.setHours(selectedHour, 0, 0, 0);

      const { error } = await supabase
        .from('activities')
        .insert({
          user_id: user.id,
          subcategory_id: null,
          title: newActivityTitle.trim(),
          scheduled_start: activityDate.toISOString(),
          duration_minutes: newActivityDuration,
          status: 'scheduled',
        });

      if (error) throw error;

      await updateDailyHappinessScore(user.id);
      await loadActivities();
      setShowAddModal(false);
      setNewActivityTitle('');
      setSelectedHour(null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add activity');
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <ImageBackground 
      source={{ uri: 'https://images.pexels.com/photos/1325735/pexels-photo-1325735.jpeg' }} 
      style={styles.container} 
      resizeMode="cover"
    >
      <LinearGradient
        colors={['#0f0c29', '#24243e', '#302b63']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Life Planner ✨</Text>
            <Pressable 
              style={styles.profileButton}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <View style={styles.profileIcon}>
                <Text style={styles.profileText}>👤</Text>
              </View>
            </Pressable>
          </View>
          <Text style={styles.headerDate}>
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>

        <View style={styles.weekDays}>
          <Pressable onPress={() => changeDate(-1)} style={styles.navButton}>
            <ChevronLeft color="#fff" size={20} />
          </Pressable>
          {[-3, -2, -1, 0, 1, 2, 3].map((offset) => {
            const date = new Date(selectedDate);
            date.setDate(date.getDate() + offset);
            const isSelected = offset === 0;
            return (
              <Pressable
                key={offset}
                style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
                onPress={() => changeDate(offset)}
              >
                <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
                  {date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}
                </Text>
                <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>
                  {date.getDate()}
                </Text>
              </Pressable>
            );
          })}
          <Pressable onPress={() => changeDate(1)} style={styles.navButton}>
            <ChevronRight color="#fff" size={20} />
          </Pressable>
        </View>

        <ScrollView style={styles.timeline} showsVerticalScrollIndicator={false}>
          <View style={styles.timelineContent}>
            {hours.map((hour) => {
              const hourActivities = activities.filter((activity) => {
                const activityHour = new Date(activity.scheduled_start).getHours();
                return activityHour === hour;
              });

              return (
                <View key={hour} style={styles.timeSlot}>
                  <Pressable style={styles.timeLabel} onPress={() => handleHourClick(hour)}>
                    <Text style={styles.timeText}>
                      {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                    </Text>
                    <Text style={styles.addHint}>Tap to plan</Text>
                  </Pressable>
                  <View style={styles.timeSlotContent}>
                    {hourActivities.length === 0 && (
                      <Pressable style={styles.emptySlot} onPress={() => handleHourClick(hour)}>
                        <Plus size={16} color="rgba(255,255,255,0.6)" />
                        <Text style={styles.emptySlotText}>Plan something meaningful</Text>
                      </Pressable>
                    )}
                    {hourActivities.map((activity) => (
                      <Pressable
                        key={activity.id}
                        style={styles.activityBlock}
                        onPress={() => setSelectedActivity(activity)}
                      >
                        <LinearGradient
                          colors={getActivityColor(activity.status)}
                          style={styles.activityGradient}
                        >
                          <View style={styles.activityHeader}>
                            <Text style={styles.activityTitle} numberOfLines={1}>
                              {activity.title}
                            </Text>
                            <Heart size={16} color="rgba(255,255,255,0.8)" />
                          </View>
                          <Text style={styles.activityTime}>
                            {formatTime(activity.scheduled_start)} · {activity.duration_minutes}min
                          </Text>
                          {activity.status === 'completed' && (
                            <View style={styles.completedBadge}>
                              <CheckCircle size={12} color="#fff" />
                              <Text style={styles.completedText}>Completed with joy!</Text>
                            </View>
                          )}
                        </LinearGradient>
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <Pressable style={styles.fab} onPress={() => router.push('/activity/add')}>
          <LinearGradient
            colors={['#FF6B6B', '#E91E63']}
            style={styles.fabGradient}
          >
            <Heart size={24} color="#fff" />
          </LinearGradient>
        </Pressable>

        {/* Quick Add Modal */}
        <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Plan Your Happiness ✨</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedHour !== null && 
                    `${selectedHour === 0 ? '12 AM' : selectedHour < 12 ? `${selectedHour} AM` : selectedHour === 12 ? '12 PM' : `${selectedHour - 12} PM`}`
                  }
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>What brings you joy?</Text>
                <TextInput
                  style={styles.input}
                  value={newActivityTitle}
                  onChangeText={setNewActivityTitle}
                  placeholder="e.g., Morning meditation, Call a friend"
                  placeholderTextColor="#B2BEC3"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Duration (minutes)</Text>
                <View style={styles.durationButtons}>
                  {[15, 30, 45, 60, 90].map((duration) => (
                    <Pressable
                      key={duration}
                      style={[
                        styles.durationButton,
                        newActivityDuration === duration && styles.durationButtonSelected
                      ]}
                      onPress={() => setNewActivityDuration(duration)}
                    >
                      <Text style={[
                        styles.durationButtonText,
                        newActivityDuration === duration && styles.durationButtonTextSelected
                      ]}>
                        {duration}m
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.modalActions}>
                <Pressable style={styles.cancelButton} onPress={() => setShowAddModal(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.addButton} onPress={addQuickActivity}>
                  <LinearGradient
                    colors={['#FF6B6B', '#E91E63']}
                    style={styles.addButtonGradient}
                  >
                    <Text style={styles.addButtonText}>Add to Day</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Activity Details Modal */}
        <Modal visible={!!selectedActivity} transparent animationType="slide" onRequestClose={() => setSelectedActivity(null)}>
          <Pressable style={styles.modalOverlay} onPress={() => setSelectedActivity(null)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedActivity?.title}</Text>
                <Heart size={24} color="#FF6B6B" />
              </View>
              <Text style={styles.modalTime}>
                {selectedActivity && formatTime(selectedActivity.scheduled_start)} · {selectedActivity?.duration_minutes}min
              </Text>
              {selectedActivity?.notes && <Text style={styles.modalNotes}>{selectedActivity.notes}</Text>}

              <Text style={styles.modalLabel}>How did it go?</Text>
              <View style={styles.statusButtons}>
                <Pressable
                  style={[styles.statusButton, { backgroundColor: '#4CAF50' }]}
                  onPress={() => selectedActivity && updateActivityStatus(selectedActivity.id, 'completed')}
                >
                  <LinearGradient
                    colors={['#4CAF50', '#66BB6A']}
                    style={styles.statusButtonGradient}
                  >
                    <Text style={styles.statusButtonText}>✨ Completed with joy</Text>
                  </LinearGradient>
                </Pressable>
                <Pressable
                  style={[styles.statusButton, { backgroundColor: '#FF9800' }]}
                  onPress={() => selectedActivity && updateActivityStatus(selectedActivity.id, 'partial')}
                >
                  <LinearGradient
                    colors={['#FF9800', '#FFB74D']}
                    style={styles.statusButtonGradient}
                  >
                    <Text style={styles.statusButtonText}>👍 Partially done</Text>
                  </LinearGradient>
                </Pressable>
                <Pressable
                  style={[styles.statusButton, { backgroundColor: '#F44336' }]}
                  onPress={() => selectedActivity && updateActivityStatus(selectedActivity.id, 'missed')}
                >
                  <LinearGradient
                    colors={['#F44336', '#EF5350']}
                    style={styles.statusButtonGradient}
                  >
                    <Text style={styles.statusButtonText}>💙 Didn't happen</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Mood Tracking Modal */}
        <Modal visible={showMoodModal} transparent animationType="slide" onRequestClose={() => setShowMoodModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>How are you feeling? 💫</Text>
              </View>
              <Text style={styles.modalSubtitle}>
                You just completed: {currentActivityForMood?.title}
              </Text>

              <View style={styles.moodButtons}>
                <Pressable
                  style={styles.moodButton}
                  onPress={() => logActivityMood('happy')}
                >
                  <LinearGradient
                    colors={['#4CAF50', '#66BB6A']}
                    style={styles.moodButtonGradient}
                  >
                    <Text style={styles.moodEmoji}>😊</Text>
                    <Text style={styles.moodText}>Happy & Energized</Text>
                  </LinearGradient>
                </Pressable>
                <Pressable
                  style={styles.moodButton}
                  onPress={() => logActivityMood('neutral')}
                >
                  <LinearGradient
                    colors={['#FF9800', '#FFB74D']}
                    style={styles.moodButtonGradient}
                  >
                    <Text style={styles.moodEmoji}>😐</Text>
                    <Text style={styles.moodText}>Neutral & Calm</Text>
                  </LinearGradient>
                </Pressable>
                <Pressable
                  style={styles.moodButton}
                  onPress={() => logActivityMood('sad')}
                >
                  <LinearGradient
                    colors={['#9C27B0', '#BA68C8']}
                    style={styles.moodButtonGradient}
                  >
                    <Text style={styles.moodEmoji}>😔</Text>
                    <Text style={styles.moodText}>Could be better</Text>
                  </LinearGradient>
                </Pressable>
              </View>
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
  headerDate: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.9)',
  },
  weekDays: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  navButton: {
    padding: 4,
  },
  dayButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 56,
    borderRadius: 12,
  },
  dayButtonSelected: {
    backgroundColor: '#FFD700',
  },
  dayLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  dayLabelSelected: {
    color: '#fff',
    fontFamily: 'Inter-SemiBold',
  },
  dayNumber: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  dayNumberSelected: {
    color: '#fff',
  },
  timeline: {
    flex: 1,
  },
  timelineContent: {
    paddingBottom: 100,
  },
  timeSlot: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    minHeight: 60,
  },
  timeLabel: {
    width: 80,
    paddingTop: 8,
    paddingLeft: 16,
    paddingRight: 8,
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.7)',
  },
  addHint: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#FFD700',
    marginTop: 2,
  },
  timeSlotContent: {
    flex: 1,
    paddingRight: 16,
    paddingVertical: 4,
    gap: 4,
  },
  emptySlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
  },
  emptySlotText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.6)',
  },
  activityBlock: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  activityGradient: {
    padding: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
    flex: 1,
  },
  activityTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.9)',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  completedText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#2D3436',
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
  },
  modalTime: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#636E72',
    marginBottom: 16,
  },
  modalNotes: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#2D3436',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#2D3436',
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 20,
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
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#2D3436',
    borderWidth: 2,
    borderColor: '#E8EBED',
  },
  durationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  durationButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  durationButtonSelected: {
    backgroundColor: '#FFD700',
  },
  durationButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#636E72',
  },
  durationButtonTextSelected: {
    color: '#fff',
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
  addButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  addButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  statusButtons: {
    gap: 12,
  },
  statusButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  statusButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  statusButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  moodButtons: {
    gap: 12,
    marginTop: 16,
  },
  moodButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  moodButtonGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  moodEmoji: {
    fontSize: 24,
  },
  moodText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
});