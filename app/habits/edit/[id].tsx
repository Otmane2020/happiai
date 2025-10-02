import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Switch, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Save, Trash2 } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Habit } from '@/types/database';

export default function EditHabitScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [targetCount, setTargetCount] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id && user) {
      loadHabit();
    }
  }, [id, user]);

  const loadHabit = async () => {
    if (!user || !id) return;

    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      Alert.alert('Error', 'Habit not found');
      router.back();
      return;
    }

    if (data) {
      setHabit(data);
      setTitle(data.title);
      setDescription(data.description || '');
      setFrequency(data.frequency as 'daily' | 'weekly');
      setTargetCount(data.target_count);
      setIsActive(data.is_active);
    }
  };

  const handleSave = async () => {
    if (!user || !habit || !title.trim()) {
      Alert.alert('Error', 'Please enter a habit title');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('habits')
        .update({
          title: title.trim(),
          description: description.trim(),
          frequency,
          target_count: targetCount,
          is_active: isActive,
        })
        .eq('id', habit.id)
        .eq('user_id', user.id);

      if (error) throw error;

      Alert.alert('✨ Habit Updated!', 'Your habit has been successfully updated!', [
        { text: 'Great!', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Error updating habit:', error);
      Alert.alert('Error', error.message || 'Failed to update habit');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !habit) return;

    Alert.alert(
      'Delete Habit',
      'Are you sure you want to delete this habit? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase
                .from('habits')
                .delete()
                .eq('id', habit.id)
                .eq('user_id', user.id);

              if (error) throw error;

              Alert.alert('Habit Deleted', 'Your habit has been removed.', [
                { text: 'OK', onPress: () => router.replace('/(tabs)/habits') }
              ]);
            } catch (error: any) {
              console.error('Error deleting habit:', error);
              Alert.alert('Error', error.message || 'Failed to delete habit');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (!habit) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading habit...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color="#fff" size={24} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Habit</Text>
          <Pressable onPress={handleDelete} style={styles.deleteButton}>
            <Trash2 color="#FF6B6B" size={24} />
          </Pressable>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Habit Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter habit title"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Add details about your habit..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Frequency</Text>
              <View style={styles.frequencyButtons}>
                <Pressable
                  style={[styles.frequencyButton, frequency === 'daily' && styles.frequencyButtonSelected]}
                  onPress={() => setFrequency('daily')}
                >
                  <Text style={[styles.frequencyButtonText, frequency === 'daily' && styles.frequencyButtonTextSelected]}>
                    Daily
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.frequencyButton, frequency === 'weekly' && styles.frequencyButtonSelected]}
                  onPress={() => setFrequency('weekly')}
                >
                  <Text style={[styles.frequencyButtonText, frequency === 'weekly' && styles.frequencyButtonTextSelected]}>
                    Weekly
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Target Count</Text>
              <View style={styles.targetButtons}>
                {[1, 2, 3, 5].map((count) => (
                  <Pressable
                    key={count}
                    style={[styles.targetButton, targetCount === count && styles.targetButtonSelected]}
                    onPress={() => setTargetCount(count)}
                  >
                    <Text style={[
                      styles.targetButtonText,
                      targetCount === count && styles.targetButtonTextSelected
                    ]}>
                      {count}x
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Active Habit</Text>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#4CAF50' }}
                thumbColor={'#fff'}
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
  form: {
    gap: 24,
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
  frequencyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  frequencyButtonSelected: {
    backgroundColor: '#fff',
  },
  frequencyButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'rgba(255,255,255,0.8)',
  },
  frequencyButtonTextSelected: {
    color: '#667eea',
  },
  targetButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  targetButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  targetButtonSelected: {
    backgroundColor: '#fff',
  },
  targetButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: 'rgba(255,255,255,0.8)',
  },
  targetButtonTextSelected: {
    color: '#667eea',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
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
    backgroundColor: '#667eea',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#fff',
  },
});