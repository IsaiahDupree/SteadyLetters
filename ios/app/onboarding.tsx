import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  type ViewToken,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/providers/ThemeProvider';
import { Mail, Sparkles, Send } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { trackEvent, Events } from '@/services/events';

const { width } = Dimensions.get('window');

const ONBOARDING_KEY = 'sl_onboarding_complete';

interface Slide {
  id: string;
  icon: typeof Mail;
  title: string;
  subtitle: string;
  color: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: Mail,
    title: 'Send Real Letters',
    subtitle:
      'SteadyLetters prints and mails real handwritten letters, postcards, and greeting cards — right from your phone.',
    color: '#4F46E5',
  },
  {
    id: '2',
    icon: Sparkles,
    title: 'AI Does the Writing',
    subtitle:
      'Tell us the occasion, tone, and a few key points. Our AI crafts a personal, thoughtful letter in seconds.',
    color: '#7C3AED',
  },
  {
    id: '3',
    icon: Send,
    title: 'We Handle the Rest',
    subtitle:
      'Pick a recipient, choose a style, and hit send. We print it in real handwriting and mail it for you.',
    color: '#2563EB',
  },
];

export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const val = await SecureStore.getItemAsync(ONBOARDING_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

export async function markOnboardingComplete(): Promise<void> {
  try {
    await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
  } catch {}
}

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    trackEvent(Events.SCREEN_VIEWED, { screen: 'onboarding_skipped', slide: activeIndex + 1 });
    handleFinish();
  };

  const handleFinish = async () => {
    await markOnboardingComplete();
    trackEvent(Events.SCREEN_VIEWED, { screen: 'onboarding_completed' });
    router.replace('/(auth)/sign-in');
  };

  const isLast = activeIndex === SLIDES.length - 1;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    slide: {
      width,
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    iconCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 32,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 16,
    },
    subtitle: {
      fontSize: 17,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 26,
    },
    footer: {
      paddingHorizontal: 24,
      paddingBottom: 50,
      paddingTop: 20,
    },
    dots: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 24,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
    },
    dotActive: {
      width: 24,
      backgroundColor: colors.primary,
    },
    nextButton: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 18,
      alignItems: 'center',
    },
    nextText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '700',
    },
    skipButton: {
      alignItems: 'center',
      paddingVertical: 14,
      marginTop: 8,
    },
    skipText: {
      fontSize: 15,
      color: colors.textMuted,
    },
  });

  return (
    <View style={s.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => {
          const Icon = item.icon;
          return (
            <View style={s.slide}>
              <View style={[s.iconCircle, { backgroundColor: item.color + '15' }]}>
                <Icon size={56} color={item.color} />
              </View>
              <Text style={s.title}>{item.title}</Text>
              <Text style={s.subtitle}>{item.subtitle}</Text>
            </View>
          );
        }}
      />

      <View style={s.footer}>
        <View style={s.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[s.dot, i === activeIndex && s.dotActive]} />
          ))}
        </View>

        <TouchableOpacity
          style={s.nextButton}
          onPress={handleNext}
          accessibilityLabel={isLast ? 'Get Started' : 'Next'}
          accessibilityRole="button"
        >
          <Text style={s.nextText}>{isLast ? 'Get Started' : 'Next'}</Text>
        </TouchableOpacity>

        {!isLast && (
          <TouchableOpacity
            style={s.skipButton}
            onPress={handleSkip}
            accessibilityLabel="Skip onboarding"
            accessibilityRole="button"
          >
            <Text style={s.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
