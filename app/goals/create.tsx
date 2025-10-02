import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Target, ChevronRight, Sparkles, Heart, Star } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Category } from '@/types/database';

type WizardStep = 'welcome' | 'category' | 'template' | 'details' | 'timeline' | 'review';

export default function CreateGoalWizard() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const goalTemplates = [
    { title: 'Read More Books', unit: 'books', icon: '📚', target: '12', description: 'Expand your knowledge and imagination' },
    { title: 'Exercise Regularly', unit: 'workouts', icon: '💪', target: '100', description: 'Build strength and improve health' },
    { title: 'Learn New Skills', unit: 'skills', icon: '🎯', target: '3', description: 'Develop yourself professionally' },
    { title: 'Save Money', unit: 'dollars', icon: '💰', target: '5000', description: 'Build financial security' },
    { title: 'Travel Adventures', unit: 'places', icon: '✈️', target: '5', description: 'Explore the world and create memories' },
    { title: 'Creative Projects', unit: 'projects', icon: '🎨', target: '10', description: 'Express yourself through creativity' },
  ];

  const timeframes = [
    { label: '3 Months', months: 3, icon: '🌱' },
    { label: '6 Months', months: 6, icon: '🌿' },
    { label: '1 Year', months: 12, icon: '🌳' },
    { label: '2 Years', months: 24, icon: '🏔️' },
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');

    if (data) {
      setCategories(data);
    }
  };

  const nextStep = () => {
    const steps: WizardStep[] = ['welcome', 'category', 'template', 'details', 'timeline', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: WizardStep[] = ['welcome', 'category', 'template', 'details', 'timeline', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const selectTemplate = (template: any) => {
    setSelectedTemplate(template);
    setGoalTitle(template.title);
    setUnit(template.unit);
    setTargetValue(template.target);
    setGoalDescription(template.description);
    nextStep();
  };

  const setTimeframe = (months: number) => {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + months);
    setDeadline(futureDate.toISOString().split('T')[0]);
    nextStep();
  };

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in to create goals');
      return;
    }

    if (!goalTitle.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }

    const target = parseFloat(targetValue);
    if (isNaN(target) || target <= 0) {
      Alert.alert('Error', 'Please enter a valid target value greater than 0');
      return;
    }

    if (!unit.trim()) {
      Alert.alert('Error', 'Please specify a unit (e.g., books, workouts, dollars)');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          category_id: selectedCategory,
          title: goalTitle.trim(),
          description: goalDescription.trim(),
          target_value: target,
          current_value: 0,
          unit: unit.trim(),
          deadline: deadline || null,
          is_completed: false,
        });

      if (error) throw error;

      Alert.alert('🌟 Dream Created!', 'Your beautiful goal is ready to inspire your journey!', [
        { text: 'Amazing!', onPress: () => router.replace('/(tabs)/goals') }
      ]);
    } catch (error: any) {
      console.error('Error creating goal:', error);
      Alert.alert('Error', error.message || 'Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  const getStepProgress = () => {
    const steps = ['welcome', 'category', 'template', 'details', 'timeline', 'review'];
    return ((steps.indexOf(currentStep) + 1) / steps.length) * 100;
  };

  const renderWelcome = () => (
    <View style={styles.stepContainer}>
      <View style={styles.welcomeHeader}>
        <Text style={styles.welcomeEmoji}>🌟</Text>
        <Text style={styles.welcomeTitle}>Create Your Dream</Text>
        <Text style={styles.welcomeSubtitle}>
          Transform your aspirations into achievable goals with our beautiful, guided process
        </Text>
      </View>

      <View style={styles.benefitsContainer}>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitEmoji}>🎯</Text>
          <Text style={styles.benefitText}>Set meaningful targets</Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitEmoji}>📈</Text>
          <Text style={styles.benefitText}>Track your progress</Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitEmoji}>🏆</Text>
          <Text style={styles.benefitText}>Celebrate achievements</Text>
        </View>
      </View>

      <Pressable style={styles.primaryButton} onPress={nextStep}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.buttonGradient}
        >
          <Text style={styles.buttonText}>Start Dreaming</Text>
          <ChevronRight size={20} color="#fff" />
        </LinearGradient>
      </Pressable>
    </View>
  );

  const renderCategorySelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Choose Your Focus Area</Text>
      <Text style={styles.stepSubtitle}>Select the life area you want to improve</Text>

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
              colors={selectedCategory === category.id ? ['#667eea', '#764ba2'] : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.8)']}
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

  const renderTemplateSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Choose a Template</Text>
      <Text style={styles.stepSubtitle}>Start with a proven goal template or create your own</Text>

      <Pressable
        style={styles.customGoalCard}
        onPress={() => {
          setSelectedTemplate(null);
          nextStep();
        }}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
          style={styles.customGoalGradient}
        >
          <Sparkles size={24} color="#667eea" />
          <Text style={styles.customGoalTitle}>Create Custom Goal</Text>
          <Text style={styles.customGoalSubtitle}>Design your unique dream</Text>
        </LinearGradient>
      </Pressable>

      <Text style={styles.orText}>OR CHOOSE A TEMPLATE</Text>

      <ScrollView style={styles.templateList} showsVerticalScrollIndicator={false}>
        {goalTemplates.map((template, index) => (
          <Pressable
            key={index}
            style={styles.templateCard}
            onPress={() => selectTemplate(template)}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.8)']}
              style={styles.templateGradient}
            >
              <Text style={styles.templateIcon}>{template.icon}</Text>
              <View style={styles.templateContent}>
                <Text style={styles.templateTitle}>{template.title}</Text>
                <Text style={styles.templateDescription}>{template.description}</Text>
                <Text style={styles.templateTarget}>Target: {template.target} {template.unit}</Text>
              </View>
              <ChevronRight size={20} color="#667eea" />
            </LinearGradient>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.wizardButtons}>
        <Pressable style={styles.secondaryButton} onPress={prevStep}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderDetails = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Goal Details</Text>
      <Text style={styles.stepSubtitle}>Customize your goal to make it perfect</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Goal Title</Text>
        <TextInput
          style={styles.luxuryInput}
          value={goalTitle}
          onChangeText={setGoalTitle}
          placeholder="e.g., Read 12 Books This Year"
          placeholderTextColor="rgba(255,255,255,0.5)"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Description (Optional)</Text>
        <TextInput
          style={[styles.luxuryInput, styles.textArea]}
          value={goalDescription}
          onChangeText={setGoalDescription}
          placeholder="Add details about your goal..."
          placeholderTextColor="rgba(255,255,255,0.5)"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputContainer, styles.halfWidth]}>
          <Text style={styles.inputLabel}>Target</Text>
          <TextInput
            style={styles.luxuryInput}
            value={targetValue}
            onChangeText={setTargetValue}
            placeholder="12"
            placeholderTextColor="rgba(255,255,255,0.5)"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={[styles.inputContainer, styles.halfWidth]}>
          <Text style={styles.inputLabel}>Unit</Text>
          <TextInput
            style={styles.luxuryInput}
            value={unit}
            onChangeText={setUnit}
            placeholder="books"
            placeholderTextColor="rgba(255,255,255,0.5)"
          />
        </View>
      </View>

      <View style={styles.wizardButtons}>
        <Pressable style={styles.secondaryButton} onPress={prevStep}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
        <Pressable 
          style={[styles.primaryButton, (!goalTitle.trim() || !targetValue || !unit.trim()) && styles.buttonDisabled]} 
          onPress={nextStep}
          disabled={!goalTitle.trim() || !targetValue || !unit.trim()}
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

  const renderTimeline = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Set Your Timeline</Text>
      <Text style={styles.stepSubtitle}>When would you like to achieve this goal?</Text>

      <View style={styles.timeframeGrid}>
        {timeframes.map((timeframe) => (
          <Pressable
            key={timeframe.months}
            style={styles.timeframeCard}
            onPress={() => setTimeframe(timeframe.months)}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              style={styles.timeframeGradient}
            >
              <Text style={styles.timeframeIcon}>{timeframe.icon}</Text>
              <Text style={styles.timeframeLabel}>{timeframe.label}</Text>
            </LinearGradient>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={styles.noDeadlineCard}
        onPress={() => {
          setDeadline('');
          nextStep();
        }}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
          style={styles.noDeadlineGradient}
        >
          <Text style={styles.noDeadlineIcon}>∞</Text>
          <Text style={styles.noDeadlineText}>No Deadline</Text>
          <Text style={styles.noDeadlineSubtext}>Take your time</Text>
        </LinearGradient>
      </Pressable>

      <View style={styles.wizardButtons}>
        <Pressable style={styles.secondaryButton} onPress={prevStep}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderReview = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Your Beautiful Goal</Text>
      <Text style={styles.stepSubtitle}>Review and create your dream</Text>

      <View style={styles.reviewCard}>
        <LinearGradient
          colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.1)']}
          style={styles.reviewGradient}
        >
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewIcon}>{selectedTemplate?.icon || '🌟'}</Text>
            <Text style={styles.reviewTitle}>{goalTitle}</Text>
          </View>

          {goalDescription && (
            <Text style={styles.reviewDescription}>{goalDescription}</Text>
          )}

          <View style={styles.reviewDetails}>
            <View style={styles.reviewDetail}>
              <Text style={styles.reviewDetailLabel}>Target</Text>
              <Text style={styles.reviewDetailValue}>{targetValue} {unit}</Text>
            </View>
            <View style={styles.reviewDetail}>
              <Text style={styles.reviewDetailLabel}>Deadline</Text>
              <Text style={styles.reviewDetailValue}>
                {deadline ? new Date(deadline).toLocaleDateString() : 'No deadline'}
              </Text>
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
            <Star size={20} color="#fff" />
            <Text style={styles.buttonText}>
              {loading ? 'Creating...' : 'Create Dream'}
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
      case 'template': return renderTemplateSelection();
      case 'details': return renderDetails();
      case 'timeline': return renderTimeline();
      case 'review': return renderReview();
      default: return renderWelcome();
    }
  };

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
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Create Dream</Text>
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
    shadowColor: '#ff9a9e',
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
  customGoalCard: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  customGoalGradient: {
    padding: 24,
    alignItems: 'center',
  },
  customGoalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#2D3436',
    marginTop: 12,
    marginBottom: 4,
  },
  customGoalSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#636E72',
  },
  orText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 1,
  },
  templateList: {
    flex: 1,
  },
  templateCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  templateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  templateIcon: {
    fontSize: 32,
  },
  templateContent: {
    flex: 1,
  },
  templateTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#2D3436',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#636E72',
    marginBottom: 4,
  },
  templateTarget: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#A29BFE',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
    marginBottom: 8,
  },
  luxuryInput: {
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
  timeframeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  timeframeCard: {
    width: '47%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  timeframeGradient: {
    padding: 24,
    alignItems: 'center',
  },
  timeframeIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  timeframeLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  noDeadlineCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  noDeadlineGradient: {
    padding: 24,
    alignItems: 'center',
  },
  noDeadlineIcon: {
    fontSize: 32,
    color: '#fff',
    marginBottom: 12,
  },
  noDeadlineText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 4,
  },
  noDeadlineSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.8)',
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
  reviewDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
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