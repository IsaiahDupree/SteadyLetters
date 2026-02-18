import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { getTemplates, type LetterTemplate } from '@/services/api';
import { useRouter } from 'expo-router';
import { FileText, PenLine } from 'lucide-react-native';
import type { LetterOccasion } from '@/services/openai';

const OCCASION_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'thank_you', label: 'Thank You' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'congratulations', label: 'Congrats' },
  { value: 'thinking_of_you', label: 'Thinking of You' },
  { value: 'sympathy', label: 'Sympathy' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'business', label: 'Business' },
];

const SkeletonCard = memo(({ colors }: { colors: Record<string, string> }) => (
  <View style={{ backgroundColor: colors.card, marginHorizontal: 16, marginBottom: 12, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <View style={{ width: '50%', height: 18, backgroundColor: colors.surfaceElevated, borderRadius: 4 }} />
      <View style={{ width: 50, height: 18, backgroundColor: colors.surfaceElevated, borderRadius: 6 }} />
    </View>
    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
      <View style={{ width: 60, height: 12, backgroundColor: colors.surfaceElevated, borderRadius: 4 }} />
      <View style={{ width: 40, height: 12, backgroundColor: colors.surfaceElevated, borderRadius: 4 }} />
    </View>
    <View style={{ width: '90%', height: 14, backgroundColor: colors.surfaceElevated, borderRadius: 4, marginTop: 10 }} />
    <View style={{ width: '70%', height: 14, backgroundColor: colors.surfaceElevated, borderRadius: 4, marginTop: 4 }} />
  </View>
));

export default function TemplatesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [templates, setTemplates] = useState<LetterTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [occasionFilter, setOccasionFilter] = useState('all');

  const loadTemplates = useCallback(async () => {
    try {
      const data = await getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const filtered = occasionFilter === 'all'
    ? templates
    : templates.filter((t) => t.occasion === occasionFilter);

  const colorsObj = colors as unknown as Record<string, string>;

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: 16 }}>
        {[1, 2, 3].map((i) => <SkeletonCard key={i} colors={colorsObj} />)}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={OCCASION_FILTERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.value}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
              backgroundColor: occasionFilter === item.value ? colors.primary : colors.surface,
              borderWidth: 1, borderColor: occasionFilter === item.value ? colors.primary : colors.border,
            }}
            onPress={() => setOccasionFilter(item.value)}
            accessibilityLabel={`Filter by ${item.label}`}
            accessibilityRole="button"
          >
            <Text style={{
              fontSize: 13, fontWeight: '500',
              color: occasionFilter === item.value ? '#fff' : colors.textSecondary,
            }}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />

      {filtered.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <FileText size={48} color={colors.textMuted} />
          <Text style={{ fontSize: 17, color: colors.textMuted, marginTop: 12, textAlign: 'center' }}>
            No templates yet.{'\n'}Create letters and save them as templates.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 16 }}
            onPress={() => router.push('/(tabs)')}
            accessibilityLabel="Create your first letter"
            accessibilityRole="button"
          >
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Create Letter</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTemplates(); }} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{ backgroundColor: colors.card, marginHorizontal: 16, marginBottom: 12, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border }}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)',
                  params: { templateContent: item.content, templateOccasion: item.occasion, templateTone: item.tone },
                })
              }
              accessibilityLabel={`Template: ${item.name}`}
              accessibilityRole="button"
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text, flex: 1 }} numberOfLines={1}>{item.name}</Text>
                {item.is_system && (
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: colors.infoLight }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: colors.info }}>System</Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
                <Text style={{ fontSize: 13, color: colors.textMuted }}>{item.occasion}</Text>
                <Text style={{ fontSize: 13, color: colors.textMuted }}>•</Text>
                <Text style={{ fontSize: 13, color: colors.textMuted }}>{item.tone}</Text>
              </View>
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 10, lineHeight: 20 }} numberOfLines={3}>{item.content}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
