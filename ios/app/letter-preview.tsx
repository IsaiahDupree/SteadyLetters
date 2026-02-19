import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/providers/ThemeProvider';
import { Send, ArrowLeft } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;
const CARD_HEIGHT = CARD_WIDTH * 0.65;

export default function LetterPreviewScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    message?: string;
    recipientName?: string;
    recipientAddress?: string;
    productType?: string;
    frontImageUrl?: string;
    senderName?: string;
    senderAddress?: string;
  }>();

  const message = params.message || '';
  const recipientName = params.recipientName || 'Recipient';
  const recipientAddress = params.recipientAddress || '';
  const productType = params.productType || 'postcard';
  const frontImageUrl = params.frontImageUrl || '';
  const senderName = params.senderName || '';
  const senderAddress = params.senderAddress || '';

  const isPostcard = productType === 'postcard';
  const isGreeting = productType === 'greeting';

  const handleSend = () => {
    router.back();
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 24, paddingBottom: 40 },
    title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 4 },
    subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: 24 },

    // Card container
    cardShadow: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
      marginBottom: 20,
    },
    card: {
      backgroundColor: '#FFFFF8',
      borderRadius: 8,
      overflow: 'hidden',
    },
    cardFront: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      backgroundColor: '#E8E4DF',
    },
    cardFrontImage: {
      width: '100%',
      height: '100%',
    },
    cardBody: {
      padding: 20,
      minHeight: isPostcard ? 200 : 340,
    },

    // Stamp area (postcard)
    stampRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    stampBox: {
      width: 44,
      height: 52,
      borderWidth: 1.5,
      borderColor: '#C4B5A0',
      borderRadius: 3,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stampText: { fontSize: 8, color: '#A09080', textAlign: 'center' },

    // Address block
    addressBlock: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: '#D4CFC8',
      paddingTop: 12,
      marginBottom: 16,
    },
    addressLabel: { fontSize: 10, color: '#A09080', fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
    addressText: { fontSize: 13, color: '#4A4540', lineHeight: 18, fontFamily: 'Georgia' },

    // Message
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#D4CFC8', marginVertical: 12 },
    messageText: {
      fontSize: 14,
      color: '#3A3530',
      lineHeight: 24,
      fontFamily: 'Georgia',
      fontStyle: 'italic',
    },
    senderBlock: {
      marginTop: 20,
      alignItems: 'flex-end',
    },
    senderText: { fontSize: 14, color: '#4A4540', fontFamily: 'Georgia', fontStyle: 'italic' },

    // Label
    labelBadge: {
      alignSelf: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      marginBottom: 16,
    },
    labelText: { fontSize: 11, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

    // Send button
    sendButton: {
      backgroundColor: colors.success,
      borderRadius: 14,
      paddingVertical: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      marginTop: 8,
    },
    sendText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    backButton: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    backText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  });

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>Letter Preview</Text>
      <Text style={s.subtitle}>This is a preview of how your mail will look when printed.</Text>

      {/* Front side — for postcards and greeting cards */}
      {(isPostcard || isGreeting) && (
        <>
          <View style={s.labelBadge}>
            <Text style={s.labelText}>{isPostcard ? 'Front' : 'Cover'}</Text>
          </View>
          <View style={s.cardShadow}>
            <View style={s.card}>
              {frontImageUrl ? (
                <Image source={{ uri: frontImageUrl }} style={[s.cardFront, s.cardFrontImage]} resizeMode="cover" />
              ) : (
                <View style={[s.cardFront, { alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ fontSize: 16, color: '#A09080' }}>Default Design</Text>
                </View>
              )}
            </View>
          </View>
        </>
      )}

      {/* Back / inside */}
      <View style={s.labelBadge}>
        <Text style={s.labelText}>
          {isPostcard ? 'Back' : isGreeting ? 'Inside' : 'Letter'}
        </Text>
      </View>
      <View style={s.cardShadow}>
        <View style={s.card}>
          <View style={s.cardBody}>
            {/* Postcard has stamp + address on the right */}
            {isPostcard && (
              <View style={s.stampRow}>
                <View style={{ flex: 1 }} />
                <View style={s.stampBox}>
                  <Text style={s.stampText}>STAMP</Text>
                </View>
              </View>
            )}

            {/* Address block */}
            <View style={s.addressBlock}>
              <Text style={s.addressLabel}>To</Text>
              <Text style={s.addressText}>{recipientName}</Text>
              {recipientAddress ? <Text style={s.addressText}>{recipientAddress}</Text> : null}
            </View>

            {senderName || senderAddress ? (
              <View style={[s.addressBlock, { borderTopWidth: 0, marginBottom: 8 }]}>
                <Text style={s.addressLabel}>From</Text>
                {senderName ? <Text style={s.addressText}>{senderName}</Text> : null}
                {senderAddress ? <Text style={s.addressText}>{senderAddress}</Text> : null}
              </View>
            ) : null}

            <View style={s.divider} />

            {/* Message content */}
            <Text style={s.messageText}>
              {message.length > 500 ? message.slice(0, 500) + '…' : message}
            </Text>

            {senderName ? (
              <View style={s.senderBlock}>
                <Text style={s.senderText}>— {senderName}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={s.sendButton}
        onPress={handleSend}
        accessibilityLabel="Continue to send"
        accessibilityRole="button"
      >
        <Send size={20} color="#fff" />
        <Text style={s.sendText}>Looks Good — Send It</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={s.backButton}
        onPress={() => router.back()}
        accessibilityLabel="Go back to edit"
        accessibilityRole="button"
      >
        <ArrowLeft size={18} color={colors.text} />
        <Text style={s.backText}>Edit Letter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
