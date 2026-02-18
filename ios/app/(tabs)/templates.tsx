import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { getTemplates, type LetterTemplate } from '@/services/api';
import { useRouter } from 'expo-router';
import { FileText } from 'lucide-react-native';

export default function TemplatesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [templates, setTemplates] = useState<LetterTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTemplates = useCallback(async () => {
    try {
      const data = await getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    card: { backgroundColor: colors.card, marginHorizontal: 16, marginBottom: 12, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    name: { fontSize: 17, fontWeight: '600', color: colors.text, flex: 1 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: colors.infoLight },
    badgeText: { fontSize: 11, fontWeight: '600', color: colors.info },
    meta: { flexDirection: 'row', gap: 12, marginTop: 6 },
    metaText: { fontSize: 13, color: colors.textMuted },
    preview: { fontSize: 14, color: colors.textSecondary, marginTop: 10, lineHeight: 20 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyText: { fontSize: 17, color: colors.textMuted, marginTop: 12, textAlign: 'center' },
    listContent: { paddingTop: 16, paddingBottom: 40 },
  });

  if (isLoading) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {templates.length === 0 ? (
        <View style={s.empty}>
          <FileText size={48} color={colors.textMuted} />
          <Text style={s.emptyText}>No templates yet.{'\n'}Create letters and save them as templates.</Text>
        </View>
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={s.card}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)',
                  params: { templateContent: item.content, templateOccasion: item.occasion, templateTone: item.tone },
                })
              }
            >
              <View style={s.cardHeader}>
                <Text style={s.name} numberOfLines={1}>{item.name}</Text>
                {item.is_system && (
                  <View style={s.badge}><Text style={s.badgeText}>System</Text></View>
                )}
              </View>
              <View style={s.meta}>
                <Text style={s.metaText}>{item.occasion}</Text>
                <Text style={s.metaText}>•</Text>
                <Text style={s.metaText}>{item.tone}</Text>
              </View>
              <Text style={s.preview} numberOfLines={3}>{item.content}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
