import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  sendPostcard,
  sendLetter,
  sendGreetingCard,
  getHandwritingStyles,
  PRODUCT_CATALOG,
  type ProductType,
  type HandwritingStyle,
  type Recipient,
} from '@/services/thanks-io';
import { getRecipients } from '@/services/api';
import { createOrder, incrementUsage } from '@/services/api';
import { Send, ChevronDown, Check } from 'lucide-react-native';

const PRODUCT_TYPES: { value: ProductType; label: string }[] = [
  { value: 'postcard', label: 'Postcard' },
  { value: 'letter', label: 'Letter' },
  { value: 'greeting', label: 'Greeting Card' },
];

export default function SendScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ message?: string }>();

  const [message, setMessage] = useState(params.message || '');
  const [productType, setProductType] = useState<ProductType>('postcard');
  const [recipients, setRecipients] = useState<(Recipient & { id?: string })[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<(Recipient & { id?: string }) | null>(null);
  const [styles, setStyles] = useState<HandwritingStyle[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>('1');
  const [isSending, setIsSending] = useState(false);
  const [showRecipients, setShowRecipients] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [recipientData, styleData] = await Promise.all([
        getRecipients(),
        getHandwritingStyles(),
      ]);
      setRecipients(recipientData as (Recipient & { id?: string })[]);
      setStyles(styleData);
      if (recipientData.length > 0) setSelectedRecipient(recipientData[0] as Recipient & { id?: string });
    } catch (error) {
      console.error('Failed to load send data:', error);
    }
  };

  const handleSend = async () => {
    if (!selectedRecipient) {
      Alert.alert('Select Recipient', 'Please select a recipient first.');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Empty Message', 'Please write or generate a message.');
      return;
    }

    const product = PRODUCT_CATALOG[productType];

    Alert.alert(
      'Confirm Send',
      `Send a ${product.name} to ${selectedRecipient.name}?\n\nCost: $${product.basePrice.toFixed(2)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setIsSending(true);
            try {
              const sendParams = {
                recipients: [selectedRecipient],
                message,
                handwriting_style: selectedStyle,
              };

              let result;
              switch (productType) {
                case 'postcard':
                  result = await sendPostcard(sendParams);
                  break;
                case 'letter':
                  result = await sendLetter(sendParams);
                  break;
                case 'greeting':
                  result = await sendGreetingCard(sendParams);
                  break;
                default:
                  result = await sendPostcard(sendParams);
              }

              await createOrder({
                thanks_io_order_id: result.id,
                product_type: productType,
                status: result.status,
                recipient_name: selectedRecipient.name,
                recipient_address: `${selectedRecipient.address}, ${selectedRecipient.city}, ${selectedRecipient.province} ${selectedRecipient.postal_code}`,
                message_preview: message.slice(0, 100),
                cost: product.basePrice,
              });

              await incrementUsage('letters_sent');

              Alert.alert(
                'Letter Sent!',
                `Your ${product.name} is on its way to ${selectedRecipient.name}.\n\nOrder ID: ${result.id}`,
                [{ text: 'View Orders', onPress: () => router.push('/(tabs)/orders') }],
              );
            } catch (error) {
              Alert.alert('Send Failed', error instanceof Error ? error.message : 'Something went wrong');
            } finally {
              setIsSending(false);
            }
          },
        },
      ],
    );
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 40 },
    header: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 20 },
    sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, marginTop: 20 },
    chipRow: { flexDirection: 'row', gap: 8 },
    chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
    chipTextActive: { color: '#fff' },
    recipientSelector: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    recipientName: { fontSize: 16, fontWeight: '500', color: colors.text },
    recipientAddr: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
    recipientOption: { padding: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dropdown: { backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginTop: 4, overflow: 'hidden' },
    messageInput: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border, minHeight: 150, textAlignVertical: 'top' },
    styleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginTop: 20 },
    priceLabel: { fontSize: 15, color: colors.textSecondary },
    priceValue: { fontSize: 24, fontWeight: '700', color: colors.primary },
    sendButton: { backgroundColor: colors.success, borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 20 },
    sendButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  });

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.header}>Send Letter</Text>

      <Text style={s.sectionTitle}>Product Type</Text>
      <View style={s.chipRow}>
        {PRODUCT_TYPES.map((p) => (
          <TouchableOpacity
            key={p.value}
            style={[s.chip, productType === p.value && s.chipActive]}
            onPress={() => setProductType(p.value)}
          >
            <Text style={[s.chipText, productType === p.value && s.chipTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.sectionTitle}>Recipient</Text>
      <TouchableOpacity style={s.recipientSelector} onPress={() => setShowRecipients(!showRecipients)}>
        <View>
          <Text style={s.recipientName}>{selectedRecipient?.name || 'Select recipient...'}</Text>
          {selectedRecipient && (
            <Text style={s.recipientAddr}>{selectedRecipient.address}, {selectedRecipient.city}</Text>
          )}
        </View>
        <ChevronDown size={20} color={colors.textMuted} />
      </TouchableOpacity>
      {showRecipients && (
        <View style={s.dropdown}>
          {recipients.map((r, i) => (
            <TouchableOpacity
              key={r.id || i}
              style={s.recipientOption}
              onPress={() => { setSelectedRecipient(r); setShowRecipients(false); }}
            >
              <View>
                <Text style={s.recipientName}>{r.name}</Text>
                <Text style={s.recipientAddr}>{r.address}, {r.city}</Text>
              </View>
              {selectedRecipient?.id === r.id && <Check size={18} color={colors.success} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={s.sectionTitle}>Handwriting Style</Text>
      <View style={s.styleRow}>
        {styles.slice(0, 6).map((st) => (
          <TouchableOpacity
            key={st.id}
            style={[s.chip, selectedStyle === st.id && s.chipActive]}
            onPress={() => setSelectedStyle(st.id)}
          >
            <Text style={[s.chipText, selectedStyle === st.id && s.chipTextActive]}>{st.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.sectionTitle}>Message</Text>
      <TextInput
        style={s.messageInput}
        placeholder="Your letter message..."
        placeholderTextColor={colors.textMuted}
        value={message}
        onChangeText={setMessage}
        multiline
      />

      <View style={s.priceRow}>
        <Text style={s.priceLabel}>Estimated Cost</Text>
        <Text style={s.priceValue}>${PRODUCT_CATALOG[productType].basePrice.toFixed(2)}</Text>
      </View>

      <TouchableOpacity style={s.sendButton} onPress={handleSend} disabled={isSending}>
        {isSending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Send size={22} color="#fff" />
            <Text style={s.sendButtonText}>Send {PRODUCT_CATALOG[productType].name}</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
