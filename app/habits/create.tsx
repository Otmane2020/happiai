import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Switch, TextInput, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Bell, Music, Clock, Volume2, ChevronRight, Sparkles, Heart, Target } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Category, Subcategory } from '@/types/database';

type WizardStep = 'welcome' | 'category' | 'habit' | 'schedule' | 'customize' | 'reminders' | 'review';

type ReminderConfig = {
  time: string;
  beforeMinutes: number;
  soundEnabled: boolean;
  sound: string;
};

export default function CreateHabitWizard() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome');
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('💫');
  const [selectedColor, setSelectedColor] = useState('#667eea');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [targetCount, setTargetCount] = useState(1);
  const [reminders, setReminders] = useState<ReminderConfig[]>([]);
  const [loading, setLoading] = useState(false);

  const luxuryIcons = ['💫', '✨', '🌟', '⭐', '🔥', '💎', '👑', '🏆', '🎯', '💖', '🌸', '🦋'];
  const luxuryColors = [
    { name: 'Royal Purple', value: '#667eea' },
    { name: 'Rose Gold', value: '#ff9a9e' },
    { name: 'Emerald', value: '#11998e' },
    { name: 'Sapphire', value: '#38ef7d' },
    { name: 'Ruby', value: '#fc466b' },
    { name: 'Gold', value: '#fdbb2d' },
    { name: 'Diamond', value: '#e0eafc' },
    { name: 'Pearl', value: '#cfdef3' },
  ];

  const reminderSounds = [
    { name: 'Gentle Chime', value: 'gentle_chime' },
    { name: 'Crystal Bell', value: 'crystal_bell' },
    { name: 'Soft Piano', value: 'soft_piano' },
    { name: 'Nature Sounds', value: 'nature_sounds' },
    { name: 'Meditation Bell', value: 'meditation_bell' },
  ];

  const reminderTimes = ['06:00', '08:00', '12:00', '18:00', '20:00'];
  const beforeOptions = [
    { value: 0, label: 'At time' },
    { value: 15, label: '15 min before' },
    { value: 30, label: '30 min before' },
    { value: 60, label: '1 hour before' },
    { value: 1440, label: '1 day before' },
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadSubcategories(selectedCategory);
    }
  }, [selectedCategory]);

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');

    if (data) {
      setCategories(data);
    }
  };

  const loadSubcategories = async (categoryId: string) => {
    const { data } = await supabase
      .from('subcategories')
      .select('*')
      .eq('category_id', categoryId)
      .order('sort_order');

    if (data) {
      setSubcategories(data);
    }
  };

  const nextStep = () => {
    const steps: WizardStep[] = ['welcome', 'category', 'habit', 'schedule', 'customize', 'reminders', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: WizardStep[] = ['welcome', 'category', 'habit', 'schedule', 'customize', 'reminders', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Error', 'Please complete all required fields');
      return;
    }

    const habitTitle = customTitle.trim() || selectedSubcategory?.name;
    if (!habitTitle) {
      Alert.alert('Error', 'Please enter a habit title');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          subcategory_id: selectedSubcategory?.id || null,
          title: habitTitle.trim(),
          description: selectedSubcategory?.name ? `${selectedSubcategory.name} - A beautiful habit to enhance your life` : 'A beautiful habit to enhance your life',
          frequency,
          target_count: targetCount,
          reminder_times: reminders.map(r => r.time),
          is_active: true,
        });

      if (error) throw error;

      Alert.alert('✨ Habit Created!', 'Your new habit is ready to transform your life!', [
        { text: 'Perfect!', onPress: () => router.replace('/(tabs)/habits') }
      ]);
    } catch (error: any) {
      console.error('Error creating habit:', error);
      Alert.alert('Error', error.message || 'Failed to create habit');
    } finally {
      setLoading(false);
    }
  };

  const addReminder = (time: string) => {
    if (reminders.length < 3) {
      setReminders([...reminders, {
        time,
        beforeMinutes: 0,
        soundEnabled: true,
        sound: 'gentle_chime'
      }]);
    }
  };

  const removeReminder = (index: number) => {
    setReminders(reminders.filter((_, i) => i !== index));
  };

  const getStepProgress = () => {
    const steps = ['welcome', 'category', 'habit', 'schedule', 'customize', 'reminders', 'review'];
    return ((steps.indexOf(currentStep) + 1) / steps.length) * 100;
  };

  const renderWelcome = () => (
    <View style={styles.stepContainer}>
      <View style={styles.welcomeHeader}>
        <Text style={styles.welcomeEmoji}>✨</Text>
        <Text style={styles.welcomeTitle}>Create Your Perfect Habit</Text>
        <Text style={styles.welcomeSubtitle}>
          Let's design a beautiful habit that will transform your daily life into something extraordinary
        </Text>
      </View>

      <View style={styles.benefitsContainer}>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitEmoji}>🌟</Text>
          <Text style={styles.benefitText}>Build lasting positive changes</Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitEmoji}>💎</Text>
          <Text style={styles.benefitText}>Track your progress beautifully</Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitEmoji}>🎯</Text>
          <Text style={styles.benefitText}>Achieve your life goals</Text>
        </View>
      </View>

      <Pressable style={styles.primaryButton} onPress={nextStep}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.buttonGradient}
        >
          <Text style={styles.buttonText}>Begin Your Journey</Text>
          <ChevronRight size={20} color="#fff" />
        </LinearGradient>
      </Pressable>
    </View>
  );

  const renderCategorySelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Choose Your Life Area</Text>
      <Text style={styles.stepSubtitle}>Select the area of life you want to improve</Text>

      <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
        {categories.map((category, index) => (
          <Pressable
            key={category.id}
            style={[
              styles.luxuryCard,
              selectedCategory === category.id && styles.luxuryCardSelected
            ]}
            onPress={() => {
              setSelectedCategory(category.id);
              setTimeout(nextStep, 300);
            }}
          >
            <LinearGradient
              colors={selectedCategory === category.id ? ['#667eea', '#764ba2'] : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              style={styles.categoryCardGradient}
            >
              <View style={styles.categoryIconContainer}>
                <Text style={styles.categoryIcon}>{category.icon || '💫'}</Text>
              </View>
              <Text style={[
                styles.categoryTitle,
                selectedCategory === category.id && styles.categoryTitleSelected
              ]}>
                {category.name}
              </Text>
              <ChevronRight 
                size={20} 
                color={selectedCategory === category.id ? '#fff' : 'rgba(255,255,255,0.6)'} 
              />
            </LinearGradient>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  const renderHabitSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Design Your Habit</Text>
      <Text style={styles.stepSubtitle}>Create a custom habit or choose from our curated collection</Text>

      <View style={styles.customHabitCard}>
        <LinearGradient
          colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.1)']}
          style={styles.customHabitGradient}
        >
          <Text style={styles.customHabitLabel}>✨ Custom Habit</Text>
          <TextInput
            style={styles.luxuryInput}
            value={customTitle}
            onChangeText={setCustomTitle}
            placeholder="Enter your perfect habit..."
            placeholderTextColor="rgba(255,255,255,0.5)"
          />
        </LinearGradient>
      </View>

      <Text style={styles.orText}>OR CHOOSE A TEMPLATE</Text>

      <ScrollView style={styles.habitList} showsVerticalScrollIndicator={false}>
        {subcategories.map((sub) => (
          <Pressable
            key={sub.id}
            style={[
              styles.luxuryCard,
              selectedSubcategory?.id === sub.id && styles.luxuryCardSelected
            ]}
            onPress={() => {
              setSelectedSubcategory(sub);
              setSelectedIcon(sub.icon || '💫');
              setCustomTitle('');
            }}
          >
            <LinearGradient
              colors={selectedSubcategory?.id === sub.id ? ['#667eea', '#764ba2'] : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              style={styles.habitCardGradient}
            >
              <Text style={styles.habitIcon}>{sub.icon || '💫'}</Text>
              <Text style={[
                styles.habitTitle,
                selectedSubcategory?.id === sub.id && styles.habitTitleSelected
              ]}>
                {sub.name}
              </Text>
              {selectedSubcategory?.id === sub.id && (
                <Check size={20} color="#fff" />
              )}
            </LinearGradient>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.wizardButtons}>
        <Pressable style={styles.secondaryButton} onPress={prevStep}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
        <Pressable 
          style={[styles.primaryButton, (!selectedSubcategory && !customTitle.trim()) && styles.buttonDisabled]} 
          onPress={nextStep}
          disabled={!selectedSubcategory && !customTitle.trim()}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );

  const renderSchedule = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Set Your Rhythm</Text>
      <Text style={styles.stepSubtitle}>How often would you like to practice this habit?</Text>

      <View style={styles.frequencyContainer}>
        <Pressable
          style={[styles.frequencyCard, frequency === 'daily' && styles.frequencyCardSelected]}
          onPress={() => setFrequency('daily')}
        >
          <LinearGradient
            colors={frequency === 'daily' ? ['#667eea', '#764ba2'] : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            style={styles.frequencyGradient}
          >
            <Text style={styles.frequencyEmoji}>🌅</Text>
            <Text style={[styles.frequencyTitle, frequency === 'daily' && styles.frequencyTitleSelected]}>
              Daily
            </Text>
            <Text style={[styles.frequencySubtitle, frequency === 'daily' && styles.frequencySubtitleSelected]}>
              Every single day
            </Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          style={[styles.frequencyCard, frequency === 'weekly' && styles.frequencyCardSelected]}
          onPress={() => setFrequency('weekly')}
        >
          <LinearGradient
            colors={frequency === 'weekly' ? ['#667eea', '#764ba2'] : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            style={styles.frequencyGradient}
          >
            <Text style={styles.frequencyEmoji}>📅</Text>
            <Text style={[styles.frequencyTitle, frequency === 'weekly' && styles.frequencyTitleSelected]}>
              Weekly
            </Text>
            <Text style={[styles.frequencySubtitle, frequency === 'weekly' && styles.frequencySubtitleSelected]}>
              Several times per week
            </Text>
          </LinearGradient>
        </Pressable>
      </View>

      <View style={styles.targetContainer}>
        <Text style={styles.targetLabel}>Target Count</Text>
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

      <View style={styles.wizardButtons}>
        <Pressable style={styles.secondaryButton} onPress={prevStep}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={nextStep}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );

  const renderCustomize = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Personalize Your Habit</Text>
      <Text style={styles.stepSubtitle}>Make it uniquely yours</Text>

      <View style={styles.customizeSection}>
        <Text style={styles.customizeLabel}>Choose Your Icon</Text>
        <View style={styles.iconGrid}>
          {luxuryIcons.map((icon) => (
            <Pressable
              key={icon}
              style={[styles.iconOption, selectedIcon === icon && styles.iconOptionSelected]}
              onPress={() => setSelectedIcon(icon)}
            >
              <Text style={styles.iconEmoji}>{icon}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.customizeSection}>
        <Text style={styles.customizeLabel}>Select Your Color</Text>
        <View style={styles.colorGrid}>
          {luxuryColors.map((color) => (
            <Pressable
              key={color.value}
              style={[
                styles.colorOption,
                { backgroundColor: color.value },
                selectedColor === color.value && styles.colorOptionSelected
              ]}
              onPress={() => setSelectedColor(color.value)}
            />
          ))}
        </View>
      </View>

      <View style={styles.wizardButtons}>
        <Pressable style={styles.secondaryButton} onPress={prevStep}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={nextStep}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );

  const renderReminders = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Set Gentle Reminders</Text>
      <Text style={styles.stepSubtitle}>We'll help you stay on track with beautiful notifications</Text>

      <View style={styles.reminderTimeGrid}>
        {reminderTimes.map((time) => {
          const isSelected = reminders.some(r => r.time === time);
          return (
            <Pressable
              key={time}
              style={[styles.reminderTimeChip, isSelected && styles.reminderTimeChipSelected]}
              onPress={() => {
                if (isSelected) {
                  setReminders(reminders.filter(r => r.time !== time));
                } else {
                  addReminder(time);
                }
              }}
            >
              <Clock size={16} color={isSelected ? '#fff' : 'rgba(255,255,255,0.7)'} />
              <Text style={[
                styles.reminderTimeText,
                isSelected && styles.reminderTimeTextSelected
              ]}>
                {time}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {reminders.map((reminder, index) => (
        <View key={index} style={styles.reminderConfig}>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            style={styles.reminderConfigGradient}
          >
            <View style={styles.reminderConfigHeader}>
              <Text style={styles.reminderConfigTime}>🔔 {reminder.time}</Text>
              <Pressable onPress={() => removeReminder(index)}>
                <Text style={styles.removeReminder}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.soundRow}>
              <Volume2 size={16} color="rgba(255,255,255,0.7)" />
              <Text style={styles.soundLabel}>Notification Sound</Text>
              <Switch
                value={reminder.soundEnabled}
                onValueChange={(value) => {
                  const newReminders = [...reminders];
                  newReminders[index].soundEnabled = value;
                  setReminders(newReminders);
                }}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#667eea' }}
                thumbColor={'#fff'}
              />
            </View>
          </LinearGradient>
        </View>
      ))}

      <View style={styles.wizardButtons}>
        <Pressable style={styles.secondaryButton} onPress={prevStep}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={nextStep}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );

  const renderReview = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Your Beautiful Habit</Text>
      <Text style={styles.stepSubtitle}>Review and create your perfect habit</Text>

      <View style={styles.reviewCard}>
        <LinearGradient
          colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.1)']}
          style={styles.reviewGradient}
        >
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewIcon}>{selectedIcon}</Text>
            <Text style={styles.reviewTitle}>
              {customTitle || selectedSubcategory?.name || 'New Habit'}
            </Text>
          </View>

          <View style={styles.reviewDetails}>
            <View style={styles.reviewDetail}>
              <Text style={styles.reviewDetailLabel}>Frequency</Text>
              <Text style={styles.reviewDetailValue}>{targetCount}x {frequency}</Text>
            </View>
            <View style={styles.reviewDetail}>
              <Text style={styles.reviewDetailLabel}>Reminders</Text>
              <Text style={styles.reviewDetailValue}>{reminders.length} set</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.wizardButtons}>
        <Pressable style={styles.secondaryButton} onPress={prevStep}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
        <Pressable 
          style={[styles.primaryButton, loading && styles.buttonDisabled]} 
          onPress={handleSave}
          disabled={loading}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.buttonGradient}
          >
            <Sparkles size={20} color="#fff" />
            <Text style={styles.buttonText}>
              {loading ? 'Creating...' : 'Create Habit'}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome': return renderWelcome();
      case 'category': return renderCategorySelection();
      case 'habit': return renderHabitSelection();
      case 'schedule': return renderSchedule();
      case 'customize': return renderCustomize();
      case 'reminders': return renderReminders();
      case 'review': return renderReview();
      default: return renderWelcome();
    }
  };

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
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Create Habit</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${getStepProgress()}%` }]} />
            </View>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderCurrentStep()}
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
    flexDirection: 'row',
    alignItems: 'center',
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
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepContainer: {
    flex: 1,
    paddingBottom: 40,
  },
  welcomeHeader: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  welcomeEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  benefitsContainer: {
    paddingVertical: 40,
    gap: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  benefitEmoji: {
    fontSize: 24,
  },
  benefitText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 32,
    lineHeight: 22,
  },
  categoryList: {
    flex: 1,
  },
  luxuryCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  luxuryCardSelected: {
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  categoryCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'rgba(255,255,255,0.8)',
    flex: 1,
  },
  categoryTitleSelected: {
    color: '#fff',
  },
  customHabitCard: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  customHabitGradient: {
    padding: 20,
  },
  customHabitLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 12,
  },
  luxuryInput: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#fff',
  },
  orText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 1,
  },
  habitList: {
    flex: 1,
  },
  habitCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  habitIcon: {
    fontSize: 24,
  },
  habitTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'rgba(255,255,255,0.8)',
    flex: 1,
  },
  habitTitleSelected: {
    color: '#fff',
  },
  frequencyContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  frequencyCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  frequencyCardSelected: {
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  frequencyGradient: {
    padding: 24,
    alignItems: 'center',
  },
  frequencyEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  frequencyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  frequencyTitleSelected: {
    color: '#fff',
  },
  frequencySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  frequencySubtitleSelected: {
    color: 'rgba(255,255,255,0.9)',
  },
  targetContainer: {
    marginBottom: 32,
  },
  targetLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
    marginBottom: 16,
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
  customizeSection: {
    marginBottom: 32,
  },
  customizeLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
    marginBottom: 16,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionSelected: {
    borderColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  iconEmoji: {
    fontSize: 24,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#fff',
  },
  reminderTimeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  reminderTimeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  reminderTimeChipSelected: {
    backgroundColor: '#fff',
  },
  reminderTimeText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: 'rgba(255,255,255,0.7)',
  },
  reminderTimeTextSelected: {
    color: '#667eea',
  },
  reminderConfig: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  reminderConfigGradient: {
    padding: 16,
  },
  reminderConfigHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reminderConfigTime: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  removeReminder: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.6)',
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  soundLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.8)',
    flex: 1,
  },
  reviewCard: {
    marginBottom: 32,
    borderRadius: 20,
    overflow: 'hidden',
  },
  reviewGradient: {
    padding: 24,
  },
  reviewHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  reviewIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  reviewTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    textAlign: 'center',
  },
  reviewDetails: {
    gap: 16,
  },
  reviewDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewDetailLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.7)',
  },
  reviewDetailValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  wizardButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 32,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});