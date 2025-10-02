import { View, Text, StyleSheet, ScrollView, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp } from 'lucide-react-native';

export default function InsightsScreen() {
  return (
    <ImageBackground
      source={{ uri: 'https://images.pexels.com/photos/114296/pexels-photo-114296.jpeg' }}
      style={styles.container}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.5)', 'rgba(0,30,60,0.9)']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Insights</Text>
          <Text style={styles.headerSubtitle}>Track your progress</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Happiness Score</Text>
            <Text style={styles.scoreValue}>0%</Text>
            <View style={styles.scoreBar}>
              <View style={[styles.scoreProgress, { width: '0%' }]} />
            </View>
            <Text style={styles.scoreStatus}>Start tracking to see your score</Text>
          </View>

          <View style={styles.emptyState}>
            <TrendingUp color="rgba(255,255,255,0.5)" size={48} />
            <Text style={styles.emptyTitle}>No data yet</Text>
            <Text style={styles.emptyText}>
              Complete activities and log your mood{'\n'}to see insights and trends
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
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.7)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scoreCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  scoreLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 16,
  },
  scoreBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  scoreProgress: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  scoreStatus: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.6)',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 20,
  },
});
