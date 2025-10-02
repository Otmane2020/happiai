import { View, Text, StyleSheet, ScrollView, Pressable, Alert, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Save, Trash2, Target } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Goal } from '@/types/database';

export default function EditGoalScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [unit, setUnit] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id && user) {
      loadGoal();
    }
  }, [id, user]);

  const loadGoal = async () => {
    if (!user || !id) return;

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      Alert.alert('Error', 'Goal not found');
      router.back();
      return;
    }

    if (data) {
      setGoal(data);
      setTitle(data.title);
      setDescription(data.description || '');
      setTargetValue(data.target_value.toString());
      setCurrentValue(data.current_value.toString());
      setUnit(data.unit);
      setDeadline(data.deadline || '');
    }
  };

  const handleSave = async () => {
    if (!user || !goal || !title.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }

    const target = parseFloat(targetValue);
    const current = parseFloat(currentValue);

    if (isNaN(target) || target <= 0) {
      Alert.alert('Error', 'Please enter a valid target value greater than 0');
      return;
    }

    if (isNaN(current) || current < 0) {
      Alert.alert('Error', 'Please enter a valid current value');
      return;
    }

    if (!unit.trim()) {
      Alert.alert('Error', 'Please specify a unit');
      return;
    }

    setLoading(true);
    try {
      const isCompleted = current >= target;

      const { error } = await supabase
        .from('goals')
        .update({
          title: title.trim(),
          description: description.trim(),
          target_value: target,
          current_value: current,
          unit: unit.trim(),
          deadline: deadline || null,
          is_completed: isCompleted,
          updated_at: new Date().toISOString(),
        })
        .eq('id', goal.id)
        .eq('user_id', user.id);

      if (error) throw error;

      const message = isCompleted && !goal.is_completed 
        ? '🎉 Goal Completed! Congratulations on achieving your dream!'
        : '✨ Goal Updated! Your changes have been saved successfully!';

      Alert.alert('Success', message, [
        { text: 'Great!', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Error updating goal:', error);
      Alert.alert('Error', error.message || 'Failed to update goal');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !goal) return;

    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase
                .from('goals')
                .delete()
                .eq('id', goal.id)
                .eq('user_id', user.id);

              if (error) throw error;

              Alert.alert('Goal Deleted', 'Your goal has been removed.', [
                { text: 'OK', onPress: () => router.replace('/(tabs)/goals') }
              ]);
            } catch (error: any) {
              console.error('Error deleting goal:', error);
              Alert.alert('Error', error.message || 'Failed to delete goal');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (!goal) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading goal...</Text>
      </View>
    );
  }

  const progressPercentage = goal.target_value > 0 ? Math.min((parseFloat(currentValue) / parseFloat(targetValue)) * 100, 100) : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#ff9a9e', '#fecfef', '#fecfef']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color="#fff" size={24} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Goal</Text>
          <Pressable onPress={handleDelete} style={styles.deleteButton}>
            <Trash2 color="#FF6B6B" size={24} />
          </Pressable>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.progressCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.8)']}
              style={styles.progressGradient}
            >
              <Target size={24} color="#FF6B6B" />
              <Text style={styles.progressTitle}>Current Progress</Text>
              <Text style={styles.progressValue}>{progressPercentage.toFixed(0)}%</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
              </View>
            </LinearGradient>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Goal Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter goal title"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Add details about your goal..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Current Value</Text>
                <TextInput
                  style={styles.input}
                  value={currentValue}
                  onChangeText={setCurrentValue}
                  placeholder="0"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Target Value</Text>
                <TextInput
                  style={styles.input}
                  value={targetValue}
                  onChangeText={setTargetValue}
                  placeholder="100"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Unit</Text>
              <TextInput
                style={styles.input}
                value={unit}
                onChangeText={setUnit}
                placeholder="e.g., books, workouts, dollars"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Deadline (Optional)</Text>
              <TextInput
                style={styles.input}
                value={deadline}
                onChangeText={setDeadline}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <LinearGradient
              colors={['#4CAF50', '#66BB6A']}
              style={styles.saveButtonGradient}
            >
              <Save size={20} color="#fff" />
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  progressCard: {
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressGradient: {
    padding: 20,
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2D3436',
    marginTop: 8,
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FF6B6B',
    marginBottom: 12,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E8EBED',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 4,
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ff9a9e',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#fff',
  },
});