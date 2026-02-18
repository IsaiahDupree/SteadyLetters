import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { TIERS, type TierName } from '@/constants/config';
import { useBilling } from '@/providers/BillingProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { Check, Crown, Star, Zap } from 'lucide-react-native';

const TIER_KEYS: TierName[] = ['free', 'pro', 'business'];

const TIER_META: Record<TierName, { icon: typeof Crown; tagline: string; badge: string | null }> = {
  free: { icon: Zap, tagline: 'Get started with the basics', badge: null },
  pro: { icon: Star, tagline: 'For individuals who send regularly', badge: 'Most Popular' },
  business: { icon: Crown, tagline: 'Unlimited power for your business', badge: 'Best Value' },
};

const FEATURE_ROWS: { label: string; field: keyof typeof TIERS.free }[] = [
  { label: 'Letter generations / mo', field: 'letterGenerations' },
  { label: 'Image generations / mo', field: 'imageGenerations' },
  { label: 'Letters sent / mo', field: 'lettersSent' },
];

function formatLimit(value: number): string {
  if (value === -1) return 'Unlimited';
  return String(value);
}

function formatProducts(products: readonly string[]): string {
  const names: Record<string, string> = {
    postcard: 'Postcards',
    letter: 'Letters',
    greeting: 'Greeting Cards',
    windowless_letter: 'Windowless Letters',
    giftcard: 'Gift Cards',
  };
  return products.map((p) => names[p] || p).join(', ');
}

export default function PaywallScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const {
    tier: currentTier,
    offerings,
    purchasePackage,
    restorePurchases,
    isLoading,
  } = useBilling();

  const [purchasing, setPurchasing] = useState<TierName | null>(null);

  const handlePurchase = async (tierKey: TierName) => {
    if (tierKey === 'free' || tierKey === currentTier) return;

    const currentOffering = offerings?.current;
    if (!currentOffering) {
      Alert.alert('Unavailable', 'Subscription packages are not available right now. Please try again later.');
      return;
    }

    // Match the RevenueCat package identifier to the tier
    const pkg = currentOffering.availablePackages.find((p) =>
      p.identifier.toLowerCase().includes(tierKey),
    );

    if (!pkg) {
      Alert.alert('Unavailable', `The ${TIERS[tierKey].name} package could not be found.`);
      return;
    }

    setPurchasing(tierKey);
    try {
      await purchasePackage(pkg);
      Alert.alert('Success', `You are now on the ${TIERS[tierKey].name} plan!`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Purchase Failed', error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setPurchasing(null);
    }
  };

  const handleRestore = async () => {
    try {
      await restorePurchases();
      Alert.alert('Restored', 'Your purchases have been restored.');
    } catch (error) {
      Alert.alert('Restore Failed', error instanceof Error ? error.message : 'Could not restore purchases.');
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 60 },
    header: { fontSize: 28, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: 8 },
    subtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginTop: 6, marginBottom: 24 },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      marginBottom: 16,
    },
    cardHighlighted: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    badgeContainer: {
      position: 'absolute',
      top: -12,
      alignSelf: 'center',
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    badge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 14,
      paddingVertical: 4,
      borderRadius: 12,
    },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
    tierName: { fontSize: 22, fontWeight: '700', color: colors.text },
    tagline: { fontSize: 13, color: colors.textMuted, marginBottom: 12 },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
    price: { fontSize: 36, fontWeight: '800', color: colors.text },
    priceUnit: { fontSize: 15, color: colors.textMuted, marginLeft: 4 },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 14 },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    featureText: { fontSize: 14, color: colors.textSecondary, flex: 1 },
    featureValue: { fontSize: 14, fontWeight: '600', color: colors.text },
    productsLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginTop: 4, marginBottom: 4 },
    productsText: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
    purchaseButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 16,
    },
    purchaseButtonDisabled: { opacity: 0.5 },
    purchaseButtonCurrent: { backgroundColor: colors.successLight },
    purchaseButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    purchaseButtonTextCurrent: { color: colors.success },
    currentBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    restoreButton: {
      alignItems: 'center',
      paddingVertical: 16,
      marginTop: 8,
    },
    restoreText: { fontSize: 14, color: colors.textMuted, textDecorationLine: 'underline' },
    closeButton: {
      position: 'absolute',
      top: 16,
      right: 16,
      zIndex: 10,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeText: { fontSize: 18, color: colors.textSecondary, fontWeight: '600' },
  });

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <TouchableOpacity style={s.closeButton} onPress={() => router.back()}>
        <Text style={s.closeText}>X</Text>
      </TouchableOpacity>

      <Text style={s.header}>Choose Your Plan</Text>
      <Text style={s.subtitle}>Unlock more letters, designs, and products</Text>

      {TIER_KEYS.map((tierKey) => {
        const config = TIERS[tierKey];
        const meta = TIER_META[tierKey];
        const Icon = meta.icon;
        const isCurrent = tierKey === currentTier;
        const isHighlighted = tierKey === 'pro';
        const isPurchasing = purchasing === tierKey;
        const isDisabled = isLoading || isPurchasing || isCurrent || tierKey === 'free';

        return (
          <View key={tierKey} style={[s.card, isHighlighted && s.cardHighlighted]}>
            {meta.badge && (
              <View style={s.badgeContainer}>
                <View style={s.badge}>
                  <Text style={s.badgeText}>{meta.badge}</Text>
                </View>
              </View>
            )}

            <View style={s.cardHeader}>
              <Icon size={24} color={colors.primary} />
              <Text style={s.tierName}>{config.name}</Text>
            </View>
            <Text style={s.tagline}>{meta.tagline}</Text>

            <View style={s.priceRow}>
              <Text style={s.price}>
                {config.price === 0 ? 'Free' : `$${config.price}`}
              </Text>
              {config.price > 0 && <Text style={s.priceUnit}>/mo</Text>}
            </View>

            <View style={s.divider} />

            {FEATURE_ROWS.map((feat) => (
              <View key={feat.field} style={s.featureRow}>
                <Check size={16} color={colors.success} />
                <Text style={s.featureText}>{feat.label}</Text>
                <Text style={s.featureValue}>
                  {formatLimit(config[feat.field] as number)}
                </Text>
              </View>
            ))}

            <Text style={s.productsLabel}>Available Products</Text>
            <Text style={s.productsText}>{formatProducts(config.products)}</Text>

            <TouchableOpacity
              style={[
                s.purchaseButton,
                isCurrent && s.purchaseButtonCurrent,
                isDisabled && s.purchaseButtonDisabled,
              ]}
              onPress={() => handlePurchase(tierKey)}
              disabled={isDisabled}
            >
              {isPurchasing ? (
                <ActivityIndicator color="#fff" />
              ) : isCurrent ? (
                <View style={s.currentBadge}>
                  <Check size={18} color={colors.success} />
                  <Text style={s.purchaseButtonTextCurrent}>Current Plan</Text>
                </View>
              ) : tierKey === 'free' ? (
                <Text style={s.purchaseButtonText}>Free Forever</Text>
              ) : (
                <Text style={s.purchaseButtonText}>
                  Subscribe to {config.name} - ${config.price}/mo
                </Text>
              )}
            </TouchableOpacity>
          </View>
        );
      })}

      <TouchableOpacity style={s.restoreButton} onPress={handleRestore} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color={colors.textMuted} />
        ) : (
          <Text style={s.restoreText}>Restore Purchases</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
