import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Heart, ChevronRight, Sparkles } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Category } from '@/types/database';

export default function AddActivityScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');

    if (data) {
      setCategories(data);
    }
  };

  const getCategoryGradient = (index: number): [string, string] => {
    const gradients: [string, string][] = [
      ['#ff9a9e', '#fecfef'],
      ['#a8edea', '#fed6e3'],
      ['#ffecd2', '#fcb69f'],
      ['#ff8a80', '#ff80ab'],
      ['#8fd3f4', '#84fab0'],
      ['#cbb4d4', '#20002c'],
      ['#667eea', '#764ba2'],
      ['#f093fb', '#f5576c'],
    ];
    return gradients[index % gradients.length];
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
            <Text style={styles.title}>Plan Your Happiness ✨</Text>
            <Text style={styles.subtitle}>Choose an area of life to focus on</Text>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.welcomeCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.1)']}
              style={styles.welcomeGradient}
            >
              <Text style={styles.welcomeEmoji}>🌟</Text>
              <Text style={styles.welcomeTitle}>Create Meaningful Moments</Text>
              <Text style={styles.welcomeText}>
                Every activity is an opportunity to grow, connect, and find joy in your daily life
              </Text>
            </LinearGradient>
          </View>
          
          {categories.map((category, index) => (
            <Pressable
              key={category.id}
              style={styles.categoryCard}
              onPress={() => router.push({
                pathname: '/activity/subcategory',
                params: { categoryId: category.id, categoryName: category.name }
              })}
            >
              <LinearGradient
                colors={getCategoryGradient(index)}
                style={styles.categoryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.categoryContent}>
                  <View style={styles.iconContainer}>
                    <Text style={styles.categoryEmoji}>{category.icon || '💫'}</Text>
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryText}>{category.name}</Text>
                    <Text style={styles.categorySubtext}>Enhance your well-being</Text>
                  </View>
                  <View style={styles.arrowContainer}>
                    <ChevronRight size={24} color="rgba(255,255,255,0.8)" />
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          ))}
          
          <View style={styles.motivationCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              style={styles.motivationGradient}
            >
              <Sparkles size={24} color="#fff" />
              <Text style={styles.motivationText}>
                "The secret of getting ahead is getting started. Every small step counts on your journey to happiness."
              </Text>
            </LinearGradient>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.9)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  welcomeCard: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  welcomeGradient: {
    padding: 24,
    alignItems: 'center',
  },
  welcomeEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  categoryCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  categoryGradient: {
    borderRadius: 20,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  categoryEmoji: {
    fontSize: 28,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 4,
  },
  categorySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.9)',
  },
  arrowContainer: {
    marginLeft: 12,
  },
  motivationCard: {
    marginTop: 24,
    marginBottom: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  motivationGradient: {
    padding: 20,
    alignItems: 'center',
    gap: 16,
  },
  motivationText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  },
});