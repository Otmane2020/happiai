import { View, Text, StyleSheet, ScrollView, Pressable, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Crown, Check, Sparkles, Zap, Shield } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function SubscriptionScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentTier, setCurrentTier] = useState<'free' | 'premium'>('free');

  useEffect(() => {
    if (user) {
      loadSubscription();
    }
  }, [user]);

  const loadSubscription = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      setCurrentTier(data.subscription_tier || 'free');
    }
  };

  const features = {
    free: [
      'Track unlimited habits',
      'Set personal goals',
      'Basic activity planning',
      'Happiness score tracking',
      'Limited AI insights (5 per day)',
    ],
    premium: [
      'Everything in Free',
      'Unlimited AI Coach conversations',
      'Advanced analytics & insights',
      'Custom habit reminders',
      'Priority support',
      'Export your data',
      'Ad-free experience',
      'Early access to new features',
    ],
  };

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
          <Text style={styles.headerTitle}>Subscription</Text>
        </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.currentPlanCard}>
          <View style={styles.planHeader}>
            <View style={styles.planIcon}>
              {currentTier === 'premium' ? (
                <Crown size={24} color="#FFD93D" fill="#FFD93D" />
              ) : (
                <Sparkles size={24} color="#4ECDC4" />
              )}
            </View>
            <View style={styles.planInfo}>
              <Text style={styles.currentPlanLabel}>Current Plan</Text>
              <Text style={styles.currentPlanName}>
                {currentTier === 'premium' ? 'Premium' : 'Free Plan'}
              </Text>
            </View>
          </View>
          {currentTier === 'premium' && (
            <Text style={styles.expiryText}>Renews on December 1, 2025</Text>
          )}
        </View>

        {currentTier === 'free' && (
          <View style={styles.premiumCard}>
            <LinearGradient
              colors={['#FFD93D', '#FFA07A']}
              style={styles.premiumGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.premiumHeader}>
                <Crown size={32} color="#fff" fill="rgba(255,255,255,0.3)" />
                <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
                <Text style={styles.premiumSubtitle}>
                  Unlock unlimited AI coaching and advanced features
                </Text>
              </View>

              <View style={styles.priceContainer}>
                <Text style={styles.price}>$9.99</Text>
                <Text style={styles.priceUnit}>/month</Text>
              </View>

              <Pressable style={styles.upgradeButton}>
                <Text style={styles.upgradeButtonText}>Start Free Trial</Text>
                <Text style={styles.upgradeButtonSubtext}>7 days free, then $9.99/mo</Text>
              </Pressable>
            </LinearGradient>
          </View>
        )}

        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>
            {currentTier === 'premium' ? 'Your Premium Features' : 'Premium Features'}
          </Text>

          {features.premium.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.checkIcon}>
                <Check size={16} color="#fff" strokeWidth={3} />
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.comparisonCard}>
          <Text style={styles.comparisonTitle}>What's Included</Text>

          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonFeature}>Habit Tracking</Text>
            <Check size={20} color="#4ECDC4" />
            <Check size={20} color="#FFD93D" />
          </View>

          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonFeature}>Goal Setting</Text>
            <Check size={20} color="#4ECDC4" />
            <Check size={20} color="#FFD93D" />
          </View>

          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonFeature}>AI Coach</Text>
            <Text style={styles.limitedText}>5/day</Text>
            <Text style={styles.unlimitedText}>Unlimited</Text>
          </View>

          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonFeature}>Analytics</Text>
            <Text style={styles.limitedText}>Basic</Text>
            <Text style={styles.unlimitedText}>Advanced</Text>
          </View>

          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonFeature}>Custom Reminders</Text>
            <View style={styles.crossIcon} />
            <Check size={20} color="#FFD93D" />
          </View>

          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonFeature}>Export Data</Text>
            <View style={styles.crossIcon} />
            <Check size={20} color="#FFD93D" />
          </View>
        </View>

        {currentTier === 'premium' && (
          <Pressable style={styles.manageLinkButton}>
            <Text style={styles.manageLinkText}>Manage Subscription</Text>
          </Pressable>
        )}
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
  currentPlanCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  planInfo: {
    flex: 1,
  },
  currentPlanLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#636E72',
    marginBottom: 4,
  },
  currentPlanName: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#2D3436',
  },
  expiryText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#636E72',
    marginTop: 12,
  },
  premiumCard: {
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FFD93D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  premiumGradient: {
    padding: 24,
  },
  premiumHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  premiumTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
  },
  premiumSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 20,
  },
  price: {
    fontSize: 48,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  priceUnit: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 4,
  },
  upgradeButton: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 17,
    fontFamily: 'Inter-Bold',
    color: '#FF6B6B',
    marginBottom: 2,
  },
  upgradeButtonSubtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#636E72',
  },
  featuresCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featuresTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#2D3436',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4ECDC4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#2D3436',
    flex: 1,
  },
  comparisonCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  comparisonTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#2D3436',
    marginBottom: 16,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  comparisonFeature: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#2D3436',
  },
  limitedText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#B2BEC3',
    width: 60,
    textAlign: 'center',
  },
  unlimitedText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#4ECDC4',
    width: 60,
    textAlign: 'center',
  },
  crossIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 20,
  },
  manageLinkButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 32,
  },
  manageLinkText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#4ECDC4',
  },
});
