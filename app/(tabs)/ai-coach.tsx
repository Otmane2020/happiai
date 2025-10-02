import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bot, Lightbulb, Heart, Sparkles, TrendingUp, Target } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function AICoachScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [happinessScore, setHappinessScore] = useState(68);
  const [currentMood, setCurrentMood] = useState('neutral');
  const [dailyTip, setDailyTip] = useState('');

  useEffect(() => {
    loadUserData();
    generateDailyTip();
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    
    const { data: score } = await supabase
      .from('happiness_scores')
      .select('overall_score')
      .eq('user_id', user.id)
      .eq('score_date', today)
      .maybeSingle();

    if (score) {
      setHappinessScore(score.overall_score);
    }

    const { data: mood } = await supabase
      .from('mood_logs')
      .select('mood_emoji')
      .eq('user_id', user.id)
      .eq('log_date', today)
      .maybeSingle();

    if (mood) {
      if (mood.mood_emoji === '😊') setCurrentMood('happy');
      else if (mood.mood_emoji === '😔') setCurrentMood('sad');
      else setCurrentMood('neutral');
    }
  };

  const generateDailyTip = () => {
    const tips = [
      {
        title: 'The Gratitude List',
        description: 'Boost your mood by listing three things you\'re grateful for. This practice shifts your focus from what\'s missing to what you cherish, promoting feelings of happiness and contentment.',
        icon: '🙏'
      },
      {
        title: 'Mindful Breathing',
        description: 'Take 5 minutes to focus on your breath. Deep, conscious breathing activates your parasympathetic nervous system, reducing stress and increasing feelings of calm and well-being.',
        icon: '🧘'
      },
      {
        title: 'Movement Medicine',
        description: 'Even 10 minutes of movement can boost your mood. Physical activity releases endorphins, your body\'s natural happiness chemicals, and helps reduce anxiety and depression.',
        icon: '🏃'
      },
      {
        title: 'Connection Catalyst',
        description: 'Reach out to someone you care about. Human connection is fundamental to happiness. A simple text, call, or hug can significantly boost both your mood and theirs.',
        icon: '💝'
      },
      {
        title: 'Nature Therapy',
        description: 'Spend time outdoors, even if it\'s just 5 minutes. Nature has a profound calming effect on the mind and can help reduce stress, improve focus, and boost overall well-being.',
        icon: '🌿'
      }
    ];

    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    setDailyTip(randomTip);
  };

  const getMoodEmoji = () => {
    switch (currentMood) {
      case 'happy': return '😊';
      case 'sad': return '😔';
      default: return '😐';
    }
  };

  const getMoodText = () => {
    switch (currentMood) {
      case 'happy': return 'You\'re feeling Happy';
      case 'sad': return 'You\'re feeling Down';
      default: return 'You\'re feeling Neutral';
    }
  };

  const getScoreColor = () => {
    if (happinessScore >= 80) return '#4CAF50';
    if (happinessScore >= 60) return '#FFD700';
    if (happinessScore >= 40) return '#FF9800';
    return '#FF6B6B';
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>AI Happiness</Text>
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

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Happiness Score Card */}
          <View style={styles.scoreCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
              style={styles.scoreGradient}
            >
              <View style={styles.scoreHeader}>
                <Text style={styles.scoreTitle}>HAPPINESS SCORE</Text>
                <View style={styles.scoreValue}>
                  <Text style={[styles.scoreNumber, { color: getScoreColor() }]}>
                    {happinessScore}
                  </Text>
                  <Text style={styles.scoreMax}>/100</Text>
                </View>
                <Lightbulb size={24} color={getScoreColor()} />
              </View>
            </LinearGradient>
          </View>

          {/* Current Mood */}
          <View style={styles.moodCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
              style={styles.moodGradient}
            >
              <Text style={styles.moodEmoji}>{getMoodEmoji()}</Text>
              <Text style={styles.moodText}>{getMoodText()}</Text>
            </LinearGradient>
          </View>

          {/* AI Tips Section */}
          <View style={styles.tipsSection}>
            <LinearGradient
              colors={['#4ECDC4', '#44A08D']}
              style={styles.tipsHeader}
            >
              <Text style={styles.tipsTitle}>Tips</Text>
              <View style={styles.aiIcon}>
                <Text style={styles.aiText}>AI</Text>
              </View>
            </LinearGradient>

            <View style={styles.tipCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
                style={styles.tipGradient}
              >
                {/* AI Robot Illustration */}
                <View style={styles.robotContainer}>
                  <View style={styles.robotHead}>
                    <View style={styles.robotEye} />
                    <View style={styles.robotEye} />
                  </View>
                  <View style={styles.robotBody}>
                    <View style={styles.robotChest} />
                  </View>
                </View>

                <Text style={styles.tipTitle}>{dailyTip.title}</Text>
                <Text style={styles.tipDescription}>{dailyTip.description}</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsSection}>
            <Pressable 
              style={styles.actionButton}
              onPress={() => router.push('/ai-coach')}
            >
              <LinearGradient
                colors={['#FF6B6B', '#FF8A80']}
                style={styles.actionGradient}
              >
                <Bot size={20} color="#fff" />
                <Text style={styles.actionText}>Chat with AI Coach</Text>
              </LinearGradient>
            </Pressable>

            <Pressable 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/planner')}
            >
              <LinearGradient
                colors={['#4CAF50', '#66BB6A']}
                style={styles.actionGradient}
              >
                <Target size={20} color="#fff" />
                <Text style={styles.actionText}>Plan Your Day</Text>
              </LinearGradient>
            </Pressable>

            <Pressable 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/insights')}
            >
              <LinearGradient
                colors={['#9C27B0', '#BA68C8']}
                style={styles.actionGradient}
              >
                <TrendingUp size={20} color="#fff" />
                <Text style={styles.actionText}>View Insights</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
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
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#fff',
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scoreCard: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreGradient: {
    borderRadius: 16,
    padding: 20,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#4ECDC4',
    letterSpacing: 1,
  },
  scoreValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flex: 1,
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
  },
  scoreMax: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#636E72',
    marginLeft: 4,
  },
  moodCard: {
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  moodGradient: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  moodEmoji: {
    fontSize: 32,
  },
  moodText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#2D3436',
    fontStyle: 'italic',
  },
  tipsSection: {
    marginBottom: 24,
  },
  tipsHeader: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tipsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  aiIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  tipCard: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tipGradient: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  robotContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  robotHead: {
    width: 60,
    height: 40,
    backgroundColor: '#E8EBED',
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 8,
  },
  robotEye: {
    width: 8,
    height: 8,
    backgroundColor: '#4ECDC4',
    borderRadius: 4,
  },
  robotBody: {
    width: 50,
    height: 40,
    backgroundColor: '#DFE6E9',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  robotChest: {
    width: 12,
    height: 12,
    backgroundColor: '#4ECDC4',
    borderRadius: 6,
  },
  tipTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#2D3436',
    textAlign: 'center',
    marginBottom: 12,
  },
  tipDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#636E72',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionsSection: {
    gap: 12,
    paddingBottom: 32,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  actionText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
});