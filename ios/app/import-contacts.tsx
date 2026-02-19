import React, { useState, useEffect } from 'react';
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
import * as Contacts from 'expo-contacts';
import { useTheme } from '@/providers/ThemeProvider';
import { useRouter } from 'expo-router';
import { createRecipient } from '@/services/api';
import { trackEvent, Events } from '@/services/events';
import { Check, Search, UserPlus, AlertCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface ParsedContact {
  id: string;
  name: string;
  address: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

function parseContacts(contacts: Contacts.Contact[]): ParsedContact[] {
  const result: ParsedContact[] = [];
  for (const c of contacts) {
    if (!c.addresses || c.addresses.length === 0) continue;
    const addr = c.addresses[0];
    if (!addr.street || !addr.city || !addr.region || !addr.postalCode) continue;
    result.push({
      id: (c as any).id ?? c.name ?? String(Math.random()),
      name: `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || 'Unknown',
      address: addr.street,
      city: addr.city,
      state: addr.region,
      zip: addr.postalCode,
      country: addr.country || 'US',
    });
  }
  return result;
}

export default function ImportContactsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [contacts, setContacts] = useState<ParsedContact[]>([]);
  const [filtered, setFiltered] = useState<ParsedContact[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        setPermissionDenied(true);
        setIsLoading(false);
        return;
      }
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Addresses, Contacts.Fields.FirstName, Contacts.Fields.LastName],
        sort: Contacts.SortTypes.FirstName,
      });
      const parsed = parseContacts(data);
      setContacts(parsed);
      setFiltered(parsed);
      setIsLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(contacts);
    } else {
      const q = search.toLowerCase();
      setFiltered(contacts.filter((c) => c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)));
    }
  }, [search, contacts]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleImport = async () => {
    if (selected.size === 0) {
      Alert.alert('No Selection', 'Please select at least one contact to import.');
      return;
    }
    setIsSaving(true);
    let success = 0;
    let failed = 0;
    for (const id of selected) {
      const c = contacts.find((x) => x.id === id);
      if (!c) continue;
      try {
        await createRecipient({
          name: c.name,
          address: c.address,
          address2: c.address2,
          city: c.city,
          province: c.state,
          postal_code: c.zip,
          country: c.country,
        });
        trackEvent(Events.RECIPIENT_ADDED, { name: c.name, source: 'contacts' });
        success++;
      } catch {
        failed++;
      }
    }
    setIsSaving(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Import Complete',
      `${success} contact${success !== 1 ? 's' : ''} imported${failed > 0 ? `, ${failed} failed` : ''}.`,
      [{ text: 'OK', onPress: () => router.back() }],
    );
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 10,
      margin: 16,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: colors.text, marginLeft: 8 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    rowSelected: { backgroundColor: colors.primary + '10' },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.border,
      marginRight: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    contactName: { fontSize: 16, fontWeight: '500', color: colors.text },
    contactAddr: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
    footer: {
      padding: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    importButton: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    importText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    emptyText: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginTop: 12, lineHeight: 24 },
  });

  if (isLoading) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textMuted, marginTop: 12 }}>Loading contacts...</Text>
      </View>
    );
  }

  if (permissionDenied) {
    return (
      <View style={s.emptyState}>
        <AlertCircle size={48} color={colors.textMuted} />
        <Text style={s.emptyText}>
          Contacts access was denied. Go to Settings → SteadyLetters → Contacts to enable it.
        </Text>
      </View>
    );
  }

  if (contacts.length === 0) {
    return (
      <View style={s.emptyState}>
        <UserPlus size={48} color={colors.textMuted} />
        <Text style={s.emptyText}>
          No contacts with mailing addresses found. Contacts need a street address, city, state, and ZIP to import.
        </Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.searchBar}>
        <Search size={18} color={colors.textMuted} />
        <TextInput
          style={s.searchInput}
          placeholder="Search contacts..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          accessibilityLabel="Search contacts"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSelected = selected.has(item.id);
          return (
            <TouchableOpacity
              style={[s.row, isSelected && s.rowSelected]}
              onPress={() => toggleSelect(item.id)}
              accessibilityLabel={`${item.name}, ${item.address}, ${item.city}`}
              accessibilityRole="checkbox"
            >
              <View style={[s.checkbox, isSelected && s.checkboxSelected]}>
                {isSelected && <Check size={14} color="#fff" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.contactName}>{item.name}</Text>
                <Text style={s.contactAddr}>{item.address}, {item.city}, {item.state} {item.zip}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.importButton, isSaving && { opacity: 0.6 }]}
          onPress={handleImport}
          disabled={isSaving}
          accessibilityLabel={`Import ${selected.size} contacts`}
          accessibilityRole="button"
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <UserPlus size={20} color="#fff" />
              <Text style={s.importText}>
                Import {selected.size > 0 ? `${selected.size} Contact${selected.size !== 1 ? 's' : ''}` : 'Selected'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
