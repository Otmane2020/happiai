import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Send, Bot } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type Message = {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export default function AICoachScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadMessages();
  }, [user]);

  const loadMessages = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('ai_interactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(50);

    if (data) {
      const formattedMessages: Message[] = data.map(msg => ({
        id: msg.id,
        type: msg.message_type as 'user' | 'assistant',
        content: msg.message_content,
        timestamp: new Date(msg.created_at),
      }));
      setMessages(formattedMessages);
    }

    if (data && data.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'assistant',
        content: "Hi! I'm your AI happiness coach. I'm here to help you plan your day, build better habits, and achieve your goals. How can I support you today?",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    await supabase.from('ai_interactions').insert({
      user_id: user.id,
      message_type: 'user',
      message_content: inputText,
    });

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/ai-coach`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputText,
          userId: user.id,
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.message || "I'm here to help! Could you tell me more about what you'd like to work on?",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      await supabase.from('ai_interactions').insert({
        user_id: user.id,
        message_type: 'assistant',
        message_content: assistantMessage.content,
      });
    } catch (error) {
      console.error('AI Coach error:', error);

      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I'm having trouble connecting right now. Let me help you anyway! What would you like to focus on today - planning your schedule, building habits, or working on goals?",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#A29BFE', '#6C5CE7']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color="#fff" size={24} />
          </Pressable>
          <View style={styles.headerContent}>
            <View style={styles.botIcon}>
              <Bot size={24} color="#fff" />
            </View>
            <View>
              <Text style={styles.headerTitle}>AI Coach</Text>
              <Text style={styles.headerSubtitle}>Your happiness guide</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageWrapper,
                message.type === 'user' ? styles.userMessageWrapper : styles.assistantMessageWrapper,
              ]}
            >
              {message.type === 'assistant' && (
                <View style={styles.avatarContainer}>
                  <Bot size={16} color="#A29BFE" />
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  message.type === 'user' ? styles.userMessage : styles.assistantMessage,
                ]}
              >
                <Text style={[
                  styles.messageText,
                  message.type === 'user' ? styles.userMessageText : styles.assistantMessageText,
                ]}>
                  {message.content}
                </Text>
              </View>
            </View>
          ))}
          {loading && (
            <View style={[styles.messageWrapper, styles.assistantMessageWrapper]}>
              <View style={styles.avatarContainer}>
                <Bot size={16} color="#A29BFE" />
              </View>
              <View style={[styles.messageBubble, styles.assistantMessage]}>
                <Text style={styles.assistantMessageText}>Thinking...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask me anything..."
            placeholderTextColor="#B2BEC3"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <Pressable
            style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || loading}
          >
            <Send size={20} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  botIcon: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.9)',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 16,
  },
  messageWrapper: {
    flexDirection: 'row',
    gap: 8,
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  assistantMessageWrapper: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    backgroundColor: '#F3F0FF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: 12,
  },
  userMessage: {
    backgroundColor: '#FF6B6B',
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  messageText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    lineHeight: 21,
  },
  userMessageText: {
    color: '#fff',
  },
  assistantMessageText: {
    color: '#2D3436',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#DFE6E9',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#2D3436',
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    backgroundColor: '#FF6B6B',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
