import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { getRecipients, deleteRecipient } from '@/services/api';
import { useRouter } from 'expo-router';
import { Plus, Trash2, MapPin, Search } from 'lucide-react-native';
import type { Recipient } from '@/services/thanks-io';

export default function RecipientsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [recipients, setRecipients] = useState<(Recipient & { id?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadRecipients = useCallback(async () => {
    try {
      const data = await getRecipients();
      setRecipients(data as (Recipient & { id?: string })[]);
    } catch (error) {
      console.error('Failed to load recipients:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadRecipients(); }, [loadRecipients]);

  const handleDelete = (id: string, name: string) => {
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
  };

  const filtered = recipients.filter(
    (r) =>
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.city?.toLowerCase().includes(search.toLowerCase()),
  );

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    searchBox: { flex: 1, backgroundColor: colors.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border },
    addBtn: { backgroundColor: colors.primary, borderRadius: 10, padding: 10 },
    card: { backgroundColor: colors.card, marginHorizontal: 16, marginBottom: 12, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center' },
    cardContent: { flex: 1 },
    name: { fontSize: 17, fontWeight: '600', color: colors.text },
    address: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
    cityState: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
    deleteBtn: { padding: 8 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyText: { fontSize: 17, color: colors.textMuted, marginTop: 12, textAlign: 'center' },
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
      <View style={s.header}>
        <TextInput
          style={s.searchBox}
          placeholder="Search recipients..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity style={s.addBtn} onPress={() => router.push('/add-recipient')}>
          <Plus size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {filtered.length === 0 ? (
        <View style={s.empty}>
          <MapPin size={48} color={colors.textMuted} />
          <Text style={s.emptyText}>No recipients yet.{'\n'}Add someone to get started.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id || item.name}
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.cardContent}>
                <Text style={s.name}>{item.name}</Text>
                <Text style={s.address}>{item.address}{item.address2 ? `, ${item.address2}` : ''}</Text>
                <Text style={s.cityState}>{item.city}, {item.province} {item.postal_code}</Text>
              </View>
              {item.id && (
                <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(item.id!, item.name)}>
                  <Trash2 size={20} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}
