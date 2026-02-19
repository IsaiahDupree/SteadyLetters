import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/providers/ThemeProvider';
import { useBilling } from '@/providers/BillingProvider';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
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
import { Send, ChevronDown, Check, Plus, Lock, ImagePlus, X, Eye } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { trackEvent, Events } from '@/services/events';

const DEFAULT_FRONT_IMAGE = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80';

const PRODUCT_TYPES: { value: ProductType; label: string }[] = [
  { value: 'postcard', label: 'Postcard' },
  { value: 'letter', label: 'Letter' },
  { value: 'greeting', label: 'Greeting Card' },
];

export default function SendScreen() {
  const { colors } = useTheme();
  const { canUseProduct } = useBilling();
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
  const [frontImage, setFrontImage] = useState<string | null>(null);

  // Refresh recipients every time the screen comes into focus
  // (e.g. after navigating back from add-recipient)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

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
                front_image_url: frontImage || DEFAULT_FRONT_IMAGE,
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

              trackEvent(Events.LETTER_SENT, {
                product_type: productType,
                recipient: selectedRecipient.name,
                cost: product.basePrice,
                order_id: result.id,
              });

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

              Alert.alert(
                'Letter Sent!',
                `Your ${product.name} is on its way to ${selectedRecipient.name}.\n\nOrder ID: ${result.id}`,
                [{ text: 'View Orders', onPress: () => router.push('/(tabs)/orders') }],
              );
            } catch (error) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
    previewButton: { backgroundColor: colors.info, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 16 },
    previewButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    sendButton: { backgroundColor: colors.success, borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 12, opacity: 1 },
    sendButtonDisabled: { opacity: 0.6 },
    sendButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Text style={s.header}>Send Letter</Text>

        <Text style={s.sectionTitle}>Product Type</Text>
        <View style={s.chipRow}>
          {PRODUCT_TYPES.map((p) => {
            const allowed = canUseProduct(p.value);
            return (
              <TouchableOpacity
                key={p.value}
                style={[s.chip, productType === p.value && s.chipActive, !allowed && { opacity: 0.5 }]}
                onPress={() => {
                  if (!allowed) {
                    Alert.alert('Upgrade Required', `${p.label} is not available on your plan.`, [
                      { text: 'Upgrade', onPress: () => router.push('/paywall') },
                      { text: 'Cancel', style: 'cancel' },
                    ]);
                    return;
                  }
                  setProductType(p.value);
                }}
                accessibilityLabel={`Product type: ${p.label}, $${PRODUCT_CATALOG[p.value].basePrice.toFixed(2)}${!allowed ? ', upgrade required' : ''}`}
                accessibilityRole="button"
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  {!allowed && <Lock size={12} color={productType === p.value ? '#fff' : colors.textMuted} />}
                  <Text style={[s.chipText, productType === p.value && s.chipTextActive]}>{p.label}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={s.sectionTitle}>Recipient</Text>
        <TouchableOpacity
          style={s.recipientSelector}
          onPress={() => setShowRecipients(!showRecipients)}
          accessibilityLabel={selectedRecipient ? `Selected recipient: ${selectedRecipient.name}` : 'Select a recipient'}
          accessibilityRole="button"
        >
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
            {recipients.length === 0 ? (
              <TouchableOpacity
                style={[s.recipientOption, { justifyContent: 'center' }]}
                onPress={() => { setShowRecipients(false); router.push('/add-recipient'); }}
                accessibilityLabel="Add a new recipient"
                accessibilityRole="button"
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Plus size={18} color={colors.primary} />
                  <Text style={[s.recipientName, { color: colors.primary }]}>Add New Recipient</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <>
                {recipients.map((r, i) => (
                  <TouchableOpacity
                    key={r.id || i}
                    style={s.recipientOption}
                    onPress={() => { setSelectedRecipient(r); setShowRecipients(false); }}
                    accessibilityLabel={`Recipient: ${r.name}, ${r.address}`}
                    accessibilityRole="button"
                  >
                    <View>
                      <Text style={s.recipientName}>{r.name}</Text>
                      <Text style={s.recipientAddr}>{r.address}, {r.city}</Text>
                    </View>
                    {selectedRecipient?.id === r.id && <Check size={18} color={colors.success} />}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={s.recipientOption}
                  onPress={() => { setShowRecipients(false); router.push('/add-recipient'); }}
                  accessibilityLabel="Add a new recipient"
                  accessibilityRole="button"
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Plus size={16} color={colors.primary} />
                    <Text style={{ fontSize: 15, fontWeight: '500', color: colors.primary }}>Add New</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.recipientOption, { borderBottomWidth: 0 }]}
                  onPress={() => { setShowRecipients(false); router.push('/import-contacts'); }}
                  accessibilityLabel="Import from phone contacts"
                  accessibilityRole="button"
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Plus size={16} color={colors.accent} />
                    <Text style={{ fontSize: 15, fontWeight: '500', color: colors.accent }}>Import from Contacts</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        <Text style={s.sectionTitle}>Handwriting Style</Text>
        <View style={s.styleRow}>
          {styles.slice(0, 6).map((st) => (
            <TouchableOpacity
              key={st.id}
              style={[s.chip, selectedStyle === st.id && s.chipActive]}
              onPress={() => setSelectedStyle(st.id)}
              accessibilityLabel={`Handwriting style: ${st.name}`}
              accessibilityRole="button"
            >
              <Text style={[s.chipText, selectedStyle === st.id && s.chipTextActive]}>{st.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {(productType === 'postcard' || productType === 'greeting') && (
          <>
            <Text style={s.sectionTitle}>Card Front Image</Text>
            {frontImage ? (
              <View style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
                <Image source={{ uri: frontImage }} style={{ width: '100%', height: 180, borderRadius: 12 }} resizeMode="cover" />
                <TouchableOpacity
                  onPress={() => setFrontImage(null)}
                  style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 14, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}
                  accessibilityLabel="Remove image"
                  accessibilityRole="button"
                >
                  <X size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderStyle: 'dashed',
                  paddingVertical: 32,
                  alignItems: 'center',
                  gap: 8,
                }}
                onPress={async () => {
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    allowsEditing: true,
                    aspect: [4, 3],
                    quality: 0.8,
                  });
                  if (!result.canceled && result.assets[0]) {
                    setFrontImage(result.assets[0].uri);
                  }
                }}
                accessibilityLabel="Choose front image for card"
                accessibilityRole="button"
              >
                <ImagePlus size={28} color={colors.textMuted} />
                <Text style={{ fontSize: 14, color: colors.textMuted }}>Tap to choose a photo</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>or we'll use a default design</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <Text style={s.sectionTitle}>Message</Text>
        <TextInput
          style={s.messageInput}
          placeholder="Your letter message..."
          placeholderTextColor={colors.textMuted}
          value={message}
          onChangeText={setMessage}
          multiline
          accessibilityLabel="Letter message"
        />

        <View style={s.priceRow}>
          <Text style={s.priceLabel}>Estimated Cost</Text>
          <Text style={s.priceValue}>${PRODUCT_CATALOG[productType].basePrice.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={s.previewButton}
          onPress={() => {
            router.push({
              pathname: '/letter-preview',
              params: {
                message,
                recipientName: selectedRecipient?.name || '',
                recipientAddress: selectedRecipient
                  ? `${selectedRecipient.address}, ${selectedRecipient.city}, ${selectedRecipient.province} ${selectedRecipient.postal_code}`
                  : '',
                productType,
                frontImageUrl: frontImage || DEFAULT_FRONT_IMAGE,
              },
            });
          }}
          accessibilityLabel="Preview letter before sending"
          accessibilityRole="button"
        >
          <Eye size={18} color="#fff" />
          <Text style={s.previewButtonText}>Preview</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.sendButton, isSending && s.sendButtonDisabled]}
          onPress={handleSend}
          disabled={isSending}
          accessibilityLabel={`Send ${PRODUCT_CATALOG[productType].name}`}
          accessibilityRole="button"
        >
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
    </TouchableWithoutFeedback>
  );
}
