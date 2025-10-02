import { View, Text, StyleSheet, Pressable, ImageBackground, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, Target, Flag } from 'lucide-react-native';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { updateDailyHappinessScore } from '@/lib/happinessCalculator';

export default function DurationScreen() {
  const router = useRouter();
  const { subcategoryId, subcategoryName, suggestedDuration } = useLocalSearchParams();
  const { user } = useAuth();
  const [selectedDuration, setSelectedDuration] = useState<number>(parseInt(suggestedDuration as string) || 30);
  const [customTime, setCustomTime] = useState('');
  const [loading, setLoading] = useState(false);

  const durations = [15, 30, 45, 60];

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const now = new Date();
      const { error } = await supabase
        .from('activities')
        .insert({
          user_id: user.id,
          subcategory_id: subcategoryId,
          title: subcategoryName as string,
          scheduled_start: now.toISOString(),
          duration_minutes: selectedDuration,
          status: 'scheduled',
        });

      if (error) throw error;

      await updateDailyHappinessScore(user.id);

      Alert.alert('🏆 Tee Time Booked!', 'Your golf session is ready to begin!', [
        { text: 'Start Playing', onPress: () => router.push('/(tabs)') }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to book tee time');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.pexels.com/photos/1325735/pexels-photo-1325735.jpeg' }}
      style={styles.container}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(76,175,80,0.9)', 'rgba(139,195,74,0.95)']}
        style={styles.gradient}
      >
        <View style={styles.golfCourse}>
          <Text style={styles.grassEmoji}>🌱🌱🌱🌱🌱🌱🌱🌱</Text>
        </View>
        
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color="#fff" size={24} />
          </Pressable>
          <View style={styles.titleContainer}>
            <Text style={styles.category}>GOLF SESSION</Text>
            <Text style={styles.subtitle}>
              Perfect your {subcategoryName?.toString().toLowerCase()} technique
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.activityCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
              style={styles.activityGradient}
            >
              <View style={styles.activityIcon}>
                <Text style={styles.activityEmoji}>🏌️</Text>
              </View>
              <Text style={styles.activityName}>{subcategoryName?.toString().toUpperCase()}</Text>
              <Text style={styles.activitySubtext}>Golf Practice Session</Text>
            </LinearGradient>
          </View>

          <View style={styles.durationSection}>
            <Text style={styles.durationTitle}>Select Practice Duration</Text>
            {durations.map((duration) => (
              <Pressable
                key={duration}
                style={[
                  styles.durationButton,
                  selectedDuration === duration && styles.durationButtonSelected
                ]}
                onPress={() => setSelectedDuration(duration)}
              >
                <LinearGradient
                  colors={selectedDuration === duration ? ['#2E7D32', '#4CAF50'] : ['#4CAF50', '#66BB6A']}
                  style={styles.durationGradient}
                >
                  {selectedDuration === duration && (
                    <View style={styles.checkIcon}>
                      <Check color="#fff" size={20} strokeWidth={3} />
                    </View>
                  )}
                  <Text style={styles.durationText}>
                    {duration} MINUTES
                  </Text>
                  <View style={styles.flagIcon}>
                    <Flag size={16} color="rgba(255,255,255,0.8)" />
                  </View>
                </LinearGradient>
              </Pressable>
            ))}
          </View>

          <View style={styles.motivationSection}>
            <Text style={styles.motivationEmoji}>🎯</Text>
            <Text style={styles.motivationText}>
              "Focus on form, not force. Quality practice beats quantity every time!"
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <LinearGradient
              colors={['#2E7D32', '#4CAF50']}
              style={styles.saveGradient}
            >
              <Target size={20} color="#fff" />
              <Text style={styles.saveButtonText}>
                {loading ? 'Booking Tee Time...' : '🏌️ Start Golf Session'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
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
    position: 'relative',
  },
  golfCourse: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  grassEmoji: {
    fontSize: 20,
    textAlign: 'center',
    opacity: 0.3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    marginTop: 4,
  },
  titleContainer: {
    flex: 1,
  },
  category: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    zIndex: 1,
  },
  activityCard: {
    borderRadius: 24,
    marginBottom: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  activityGradient: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  activityIcon: {
    width: 72,
    height: 72,
    backgroundColor: '#4CAF50',
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  activityEmoji: {
    fontSize: 36,
  },
  activityName: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#2D3436',
    letterSpacing: 1,
    marginBottom: 4,
  },
  activitySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#636E72',
  },
  durationSection: {
    marginBottom: 32,
  },
  durationTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  durationButton: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  durationGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative',
  },
  checkIcon: {
    position: 'absolute',
    left: 20,
    width: 32,
    height: 32,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    letterSpacing: 1,
  },
  flagIcon: {
    position: 'absolute',
    right: 20,
  },
  motivationSection: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  motivationEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  motivationText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    zIndex: 1,
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveGradient: {
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
});