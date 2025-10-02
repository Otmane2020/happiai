import { View, Text, StyleSheet, ScrollView, Pressable, Switch, ImageBackground, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, Mail, Smartphone, MessageSquare, Clock } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type NotificationPreferences = {
  user_id: string;
  push_notifications_enabled: boolean;
  email_notifications_enabled: boolean;
  habit_reminders_enabled: boolean;
  goal_reminders_enabled: boolean;
  daily_summary_enabled: boolean;
  ai_coach_updates_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  updated_at: string;
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences(data);
      } else {
        const defaultPrefs = {
          user_id: user.id,
          push_notifications_enabled: true,
          email_notifications_enabled: false,
          habit_reminders_enabled: true,
          goal_reminders_enabled: true,
          daily_summary_enabled: false,
          ai_coach_updates_enabled: true,
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00',
          updated_at: new Date().toISOString(),
        };
        setPreferences(defaultPrefs);
      }
    } catch (error: any) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean | string) => {
    if (!user || !preferences) return;

    const updatedPrefs = { ...preferences, [key]: value, updated_at: new Date().toISOString() };
    setPreferences(updatedPrefs);

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert(updatedPrefs, { onConflict: 'user_id' });

      if (error) throw error;
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update preferences');
      setPreferences(preferences);
    }
  };

  if (loading || !preferences) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,30,60,0.85)']}
          style={styles.gradient}
        >
          <Text style={styles.loadingText}>Loading...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <ImageBackground
      source={{ uri: 'https://images.pexels.com/photos/114296/pexels-photo-114296.jpeg' }}
      style={styles.container}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'rgba(0,30,60,0.85)']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color="#fff" size={24} />
          </Pressable>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>NOTIFICATION CHANNELS</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Smartphone size={22} color="#4ECDC4" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive alerts on your device
              </Text>
            </View>
            <Switch
              value={preferences.push_notifications_enabled}
              onValueChange={(value) => updatePreference('push_notifications_enabled', value)}
              trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#4ECDC4' }}
              thumbColor={'#fff'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Mail size={22} color="#FF6B6B" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Email Notifications</Text>
              <Text style={styles.settingDescription}>
                Get updates via email
              </Text>
            </View>
            <Switch
              value={preferences.email_notifications_enabled}
              onValueChange={(value) => updatePreference('email_notifications_enabled', value)}
              trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#4ECDC4' }}
              thumbColor={'#fff'}
            />
          </View>

          <Text style={[styles.sectionLabel, { marginTop: 32 }]}>REMINDER TYPES</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Bell size={22} color="#FFD93D" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Habit Reminders</Text>
              <Text style={styles.settingDescription}>
                Get reminded about your daily habits
              </Text>
            </View>
            <Switch
              value={preferences.habit_reminders_enabled}
              onValueChange={(value) => updatePreference('habit_reminders_enabled', value)}
              trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#4ECDC4' }}
              thumbColor={'#fff'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Bell size={22} color="#A29BFE" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Goal Reminders</Text>
              <Text style={styles.settingDescription}>
                Track progress on your goals
              </Text>
            </View>
            <Switch
              value={preferences.goal_reminders_enabled}
              onValueChange={(value) => updatePreference('goal_reminders_enabled', value)}
              trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#4ECDC4' }}
              thumbColor={'#fff'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <MessageSquare size={22} color="#6BCF7F" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>AI Coach Updates</Text>
              <Text style={styles.settingDescription}>
                Personalized insights and tips
              </Text>
            </View>
            <Switch
              value={preferences.ai_coach_updates_enabled}
              onValueChange={(value) => updatePreference('ai_coach_updates_enabled', value)}
              trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#4ECDC4' }}
              thumbColor={'#fff'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Clock size={22} color="#FFA07A" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Daily Summary</Text>
              <Text style={styles.settingDescription}>
                Receive a summary at {preferences.quiet_hours_start}
              </Text>
            </View>
            <Switch
              value={preferences.daily_summary_enabled}
              onValueChange={(value) => updatePreference('daily_summary_enabled', value)}
              trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#4ECDC4' }}
              thumbColor={'#fff'}
            />
          </View>

          <View style={styles.infoCard}>
            <Bell size={20} color="#4ECDC4" />
            <Text style={styles.infoText}>
              Notifications help you stay on track with your habits and goals. You can customize reminders for each habit individually in the habit details.
            </Text>
          </View>
        </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#fff',
    textAlign: 'center',
    marginTop: 100,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    marginBottom: 16,
    marginTop: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.7)',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(78,205,196,0.15)',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginBottom: 32,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
});
