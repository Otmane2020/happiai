import { View, Text, StyleSheet, ScrollView, Pressable, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Target, Flag } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Subcategory } from '@/types/database';

export default function SubcategoryScreen() {
  const router = useRouter();
  const { categoryId, categoryName } = useLocalSearchParams();
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  useEffect(() => {
    loadSubcategories();
  }, []);

  const loadSubcategories = async () => {
    const { data, error } = await supabase
      .from('subcategories')
      .select('*')
      .eq('category_id', categoryId)
      .order('sort_order');

    if (data) {
      setSubcategories(data);
    }
  };

  const getGradientColors = (index: number): [string, string] => {
    const gradients: [string, string][] = [
      ['#4CAF50', '#66BB6A'],
      ['#8BC34A', '#A5D6A7'],
      ['#66BB6A', '#C8E6C9'],
      ['#2E7D32', '#4CAF50'],
      ['#388E3C', '#81C784'],
    ];
    return gradients[index % gradients.length];
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
            <Text style={styles.title}>{categoryName} Course 🏌️</Text>
            <Text style={styles.subtitle}>Choose your practice drill</Text>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {subcategories.map((subcategory, index) => (
            <Pressable
              key={subcategory.id}
              style={styles.subcategoryButton}
              onPress={() => router.push({
                pathname: '/activity/duration',
                params: {
                  subcategoryId: subcategory.id,
                  subcategoryName: subcategory.name,
                  suggestedDuration: subcategory.suggested_duration
                }
              })}
            >
              <LinearGradient
                colors={getGradientColors(index)}
                style={styles.subcategoryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.iconContainer}>
                  <Text style={styles.subcategoryEmoji}>{subcategory.icon || '🏌️'}</Text>
                </View>
                <View style={styles.subcategoryContent}>
                  <Text style={styles.subcategoryText}>{subcategory.name}</Text>
                  <Text style={styles.durationText}>
                    Suggested: {subcategory.suggested_duration} minutes
                  </Text>
                </View>
                <View style={styles.targetContainer}>
                  <Target size={20} color="rgba(255,255,255,0.8)" />
                </View>
              </LinearGradient>
            </Pressable>
          ))}
          
          <View style={styles.tipCard}>
            <Text style={styles.tipEmoji}>💡</Text>
            <Text style={styles.tipTitle}>Pro Tip</Text>
            <Text style={styles.tipText}>
              Start with shorter sessions and gradually increase duration. Consistency beats intensity!
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
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.9)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    zIndex: 1,
  },
  subcategoryButton: {
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  subcategoryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  subcategoryEmoji: {
    fontSize: 24,
  },
  subcategoryContent: {
    flex: 1,
  },
  subcategoryText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 4,
  },
  durationText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.8)',
  },
  targetContainer: {
    marginLeft: 12,
  },
  tipCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  tipEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
});