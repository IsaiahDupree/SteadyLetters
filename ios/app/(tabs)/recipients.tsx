import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { getRecipients, deleteRecipient } from '@/services/api';
import { useRouter } from 'expo-router';
import { Plus, Trash2, MapPin } from 'lucide-react-native';
import type { Recipient } from '@/services/thanks-io';

const SkeletonCard = memo(({ colors }: { colors: Record<string, string> }) => (
  <View style={{ backgroundColor: colors.card, marginHorizontal: 16, marginBottom: 12, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border }}>
    <View style={{ width: '60%', height: 18, backgroundColor: colors.surfaceElevated, borderRadius: 4, marginBottom: 8 }} />
    <View style={{ width: '80%', height: 14, backgroundColor: colors.surfaceElevated, borderRadius: 4, marginBottom: 4 }} />
    <View style={{ width: '50%', height: 12, backgroundColor: colors.surfaceElevated, borderRadius: 4 }} />
  </View>
));

const RecipientCard = memo(({ item, colors, onDelete }: {
  item: Recipient & { id?: string };
  colors: Record<string, string>;
  onDelete: (id: string, name: string) => void;
}) => (
  <View
    style={{ backgroundColor: colors.card, marginHorizontal: 16, marginBottom: 12, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center' }}
    accessibilityLabel={`Recipient: ${item.name}, ${item.address}, ${item.city}`}
  >
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text }}>{item.name}</Text>
      <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>{item.address}{item.address2 ? `, ${item.address2}` : ''}</Text>
      <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>{item.city}, {item.province} {item.postal_code}</Text>
    </View>
    {item.id && (
      <TouchableOpacity style={{ padding: 8 }} onPress={() => onDelete(item.id!, item.name)} accessibilityLabel={`Delete ${item.name}`} accessibilityRole="button">
        <Trash2 size={20} color={colors.error} />
      </TouchableOpacity>
    )}
  </View>
));

export default function RecipientsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [recipients, setRecipients] = useState<(Recipient & { id?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadRecipients = useCallback(async () => {
    try {
      const data = await getRecipients();
      setRecipients(data as (Recipient & { id?: string })[]);
    } catch (error) {
      console.error('Failed to load recipients:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadRecipients(); }, [loadRecipients]);

  const handleDelete = useCallback((id: string, name: string) => {
    Alert.alert('Delete Recipient', `Remove ${name} from your address book?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRecipient(id);
            setRecipients((prev) => prev.filter((r) => r.id !== id));
          } catch (error) {
            Alert.alert('Error', 'Failed to delete recipient');
          }
        },
      },
    ]);
  }, []);

  const filtered = recipients.filter(
    (r) =>
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.address?.toLowerCase().includes(search.toLowerCase()) ||
      r.city?.toLowerCase().includes(search.toLowerCase()),
  );

  const colorsObj = colors as unknown as Record<string, string>;

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: 16 }}>
        {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} colors={colorsObj} />)}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
        <TextInput
          style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border }}
          placeholder="Search recipients..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="Search recipients"
        />
        <TouchableOpacity
          style={{ backgroundColor: colors.primary, borderRadius: 10, padding: 10 }}
          onPress={() => router.push('/add-recipient')}
          accessibilityLabel="Add new recipient"
          accessibilityRole="button"
        >
          <Plus size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {filtered.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <MapPin size={48} color={colors.textMuted} />
          <Text style={{ fontSize: 17, color: colors.textMuted, marginTop: 12, textAlign: 'center' }}>
            No recipients yet.{'\n'}Add someone to get started.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 16 }}
            onPress={() => router.push('/add-recipient')}
            accessibilityLabel="Add your first recipient"
            accessibilityRole="button"
          >
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Add Recipient</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id || item.name}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadRecipients(); }} />
          }
          renderItem={({ item }) => (
            <RecipientCard item={item} colors={colorsObj} onDelete={handleDelete} />
          )}
        />
      )}
    </View>
  );
}
