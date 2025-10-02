import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type Step = 'welcome' | 'personal' | 'schedule' | 'interests' | 'complete';

export default function OnboardingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    fullName: '',
    age: '',
    gender: '',
    sleepTime: '22:00',
    wakeTime: '07:00',
    interests: [] as string[],
  });

  const interests = [
    { id: 'fitness', label: 'Fitness', icon: '💪' },
    { id: 'reading', label: 'Reading', icon: '📚' },
    { id: 'cooking', label: 'Cooking', icon: '🍳' },
    { id: 'travel', label: 'Travel', icon: '✈️' },
    { id: 'music', label: 'Music', icon: '🎵' },
    { id: 'nature', label: 'Nature', icon: '🌿' },
  ];

  const nextStep = () => {
    const steps: Step[] = ['welcome', 'personal', 'schedule', 'interests', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: Step[] = ['welcome', 'personal', 'schedule', 'interests', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const toggleInterest = (interestId: string) => {
    setUserData(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId]
    }));
  };

  const completeOnboarding = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: userData.fullName,
        updated_at: new Date().toISOString(),
      });
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderWelcome = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.welcomeEmoji}>✨</Text>
      <Text style={styles.welcomeTitle}>Welcome to Happi AI</Text>
      <Text style={styles.welcomeSubtitle}>Let's personalize your happiness journey</Text>
      <Pressable style={styles.primaryButton} onPress={nextStep}>
        <LinearGradient colors={['#FF6B6B', '#E91E63']} style={styles.buttonGradient}>
          <Text style={styles.buttonText}>Get Started</Text>
          <ChevronRight size={20} color="#fff" />
        </LinearGradient>
      </Pressable>
    </View>
  );

  const renderPersonal = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>About You</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={userData.fullName}
          onChangeText={(text) => setUserData(prev => ({ ...prev, fullName: text }))}
          placeholder="Enter your name"
          placeholderTextColor="rgba(255,255,255,0.5)"
        />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Age</Text>
        <TextInput
          style={styles.input}
          value={userData.age}
          onChangeText={(text) => setUserData(prev => ({ ...prev, age: text }))}
          placeholder="Enter your age"
          placeholderTextColor="rgba(255,255,255,0.5)"
          keyboardType="number-pad"
        />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Gender</Text>
        <View style={styles.genderButtons}>
          {['Male', 'Female', 'Other'].map((gender) => (
            <Pressable
              key={gender}
              style={[styles.genderButton, userData.gender === gender && styles.genderButtonSelected]}
              onPress={() => setUserData(prev => ({ ...prev, gender }))}
            >
              <Text style={[styles.genderButtonText, userData.gender === gender && styles.genderButtonTextSelected]}>
                {gender}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.wizardButtons}>
        <Pressable style={styles.secondaryButton} onPress={prevStep}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={nextStep} disabled={!userData.fullName.trim()}>
          <LinearGradient colors={['#FF6B6B', '#E91E63']} style={styles.buttonGradient}>
            <Text style={styles.buttonText}>Continue</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );

  const renderSchedule = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Your Schedule</Text>
      <View style={styles.timeInputsContainer}>
        <View style={styles.timeInputGroup}>
          <Text style={styles.inputLabel}>Sleep Time</Text>
          <TextInput
            style={styles.timeInput}
            value={userData.sleepTime}
            onChangeText={(text) => setUserData(prev => ({ ...prev, sleepTime: text }))}
            placeholder="22:00"
            placeholderTextColor="rgba(255,255,255,0.5)"
          />
        </View>
        <View style={styles.timeInputGroup}>
          <Text style={styles.inputLabel}>Wake Time</Text>
          <TextInput
            style={styles.timeInput}
            value={userData.wakeTime}
            onChangeText={(text) => setUserData(prev => ({ ...prev, wakeTime: text }))}
            placeholder="07:00"
            placeholderTextColor="rgba(255,255,255,0.5)"
          />
        </View>
      </View>
      <View style={styles.wizardButtons}>
        <Pressable style={styles.secondaryButton} onPress={prevStep}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={nextStep}>
          <LinearGradient colors={['#FF6B6B', '#E91E63']} style={styles.buttonGradient}>
            <Text style={styles.buttonText}>Continue</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );

  const renderInterests = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Your Interests</Text>
      <View style={styles.interestsGrid}>
        {interests.map((interest) => (
          <Pressable
            key={interest.id}
            style={[styles.interestCard, userData.interests.includes(interest.id) && styles.interestCardSelected]}
            onPress={() => toggleInterest(interest.id)}
          >
            <Text style={styles.interestIcon}>{interest.icon}</Text>
            <Text style={[styles.interestLabel, userData.interests.includes(interest.id) && styles.interestLabelSelected]}>
              {interest.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.wizardButtons}>
        <Pressable style={styles.secondaryButton} onPress={prevStep}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={nextStep} disabled={userData.interests.length === 0}>
          <LinearGradient colors={['#FF6B6B', '#E91E63']} style={styles.buttonGradient}>
            <Text style={styles.buttonText}>Continue</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );

  const renderComplete = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.completeEmoji}>🎉</Text>
      <Text style={styles.completeTitle}>You're All Set!</Text>
      <Text style={styles.completeSubtitle}>Your AI coach is ready to help you on your happiness journey</Text>
      <Pressable style={styles.primaryButton} onPress={completeOnboarding} disabled={loading}>
        <LinearGradient colors={['#4CAF50', '#66BB6A']} style={styles.buttonGradient}>
          <Sparkles size={20} color="#fff" />
          <Text style={styles.buttonText}>{loading ? 'Setting up...' : 'Start Journey'}</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome': return renderWelcome();
      case 'personal': return renderPersonal();
      case 'schedule': return renderSchedule();
      case 'interests': return renderInterests();
      case 'complete': return renderComplete();
      default: return renderWelcome();
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2', '#f093fb']} style={styles.gradient}>
        <View style={styles.header}>
          {currentStep !== 'welcome' && (
            <Pressable onPress={prevStep} style={styles.backButton}>
              <ArrowLeft color="#fff" size={24} />
            </Pressable>
          )}
          <Text style={styles.headerTitle}>Setup Profile</Text>
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderCurrentStep()}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 24, paddingBottom: 20 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  headerTitle: { fontSize: 20, fontFamily: 'Inter-Bold', color: '#fff' },
  content: { flex: 1, paddingHorizontal: 24 },
  stepContainer: { flex: 1, paddingBottom: 40, alignItems: 'center' },
  welcomeEmoji: { fontSize: 64, marginBottom: 24 },
  welcomeTitle: { fontSize: 28, fontFamily: 'Inter-Bold', color: '#fff', textAlign: 'center', marginBottom: 16 },
  welcomeSubtitle: { fontSize: 16, fontFamily: 'Inter-Regular', color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: 40 },
  stepTitle: { fontSize: 24, fontFamily: 'Inter-Bold', color: '#fff', marginBottom: 32, textAlign: 'center' },
  inputContainer: { marginBottom: 24, width: '100%' },
  inputLabel: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#fff', marginBottom: 8 },
  input: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 16, fontSize: 16, fontFamily: 'Inter-Regular', color: '#fff' },
  genderButtons: { flexDirection: 'row', gap: 8 },
  genderButton: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center' },
  genderButtonSelected: { backgroundColor: '#fff' },
  genderButtonText: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: 'rgba(255,255,255,0.8)' },
  genderButtonTextSelected: { color: '#667eea' },
  timeInputsContainer: { flexDirection: 'row', gap: 12, marginBottom: 32, width: '100%' },
  timeInputGroup: { flex: 1 },
  timeInput: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 16, fontSize: 16, fontFamily: 'Inter-Regular', color: '#fff', textAlign: 'center' },
  interestsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32, width: '100%' },
  interestCard: { width: '47%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  interestCardSelected: { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: '#fff' },
  interestIcon: { fontSize: 32, marginBottom: 8 },
  interestLabel: { fontSize: 12, fontFamily: 'Inter-SemiBold', color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  interestLabelSelected: { color: '#fff' },
  completeEmoji: { fontSize: 64, marginBottom: 24 },
  completeTitle: { fontSize: 28, fontFamily: 'Inter-Bold', color: '#fff', textAlign: 'center', marginBottom: 16 },
  completeSubtitle: { fontSize: 16, fontFamily: 'Inter-Regular', color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: 40 },
  wizardButtons: { flexDirection: 'row', gap: 16, width: '100%' },
  primaryButton: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  secondaryButton: { flex: 1, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 16, alignItems: 'center' },
  buttonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  buttonText: { fontSize: 16, fontFamily: 'Inter-Bold', color: '#fff' },
  secondaryButtonText: { fontSize: 16, fontFamily: 'Inter-SemiBold', color: '#fff' },
});