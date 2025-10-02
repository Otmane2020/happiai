import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Settings, Bell, CreditCard, LogOut, ChevronRight, Mail, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      setProfile(data);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/');
          }
        }
      ]
    );
  };

  const menuSections = [
    {
      title: 'Account',
      items: [
        {
          icon: User,
          label: 'Account Details',
          subtitle: 'Manage your personal information',
          color: '#4ECDC4',
          onPress: () => router.push('/settings/account'),
        },
        {
          icon: Bell,
          label: 'Notifications & Reminders',
          subtitle: 'Configure alerts and reminders',
          color: '#FFD93D',
          onPress: () => router.push('/settings/notifications'),
        },
      ],
    },
    {
      title: 'Subscription',
      items: [
        {
          icon: CreditCard,
          label: 'Subscription Plan',
          subtitle: profile?.subscription_tier === 'premium' ? 'Premium Member' : 'Free Plan',
          color: '#FF6B6B',
          badge: profile?.subscription_tier === 'premium' ? 'PREMIUM' : null,
          onPress: () => router.push('/settings/subscription'),
        },
      ],
    },
    {
      title: 'AI Features',
      items: [
        {
          icon: Sparkles,
          label: 'AI Happiness Coach',
          subtitle: 'Personalized insights and guidance',
          color: '#A29BFE',
          onPress: () => router.push('/ai-coach'),
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6BCF7F', '#4ECDC4']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <User size={40} color="#fff" strokeWidth={2} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {profile?.full_name || 'User'}
              </Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, itemIndex) => {
                const IconComponent = item.icon;
                return (
                  <Pressable
                    key={itemIndex}
                    style={[
                      styles.menuItem,
                      itemIndex < section.items.length - 1 && styles.menuItemBorder
                    ]}
                    onPress={item.onPress}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                      <IconComponent size={24} color={item.color} strokeWidth={2} />
                    </View>
                    <View style={styles.menuItemContent}>
                      <View style={styles.menuItemHeader}>
                        <Text style={styles.menuItemLabel}>{item.label}</Text>
                        {item.badge && (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>{item.badge}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                    </View>
                    <ChevronRight size={20} color="#B2BEC3" />
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        <View style={styles.section}>
          <Pressable style={styles.signOutButton} onPress={handleSignOut}>
            <LogOut size={20} color="#FF6B6B" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Version 1.0.0</Text>
          <Text style={styles.footerText}>Happi AI - Your Happiness Journey</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.9)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#636E72',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  menuItemLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2D3436',
  },
  badge: {
    backgroundColor: '#FFD93D',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#2D3436',
    letterSpacing: 0.5,
  },
  menuItemSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#636E72',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  signOutText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FF6B6B',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#B2BEC3',
  },
});
