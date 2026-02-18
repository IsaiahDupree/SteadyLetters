import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useBilling } from '@/providers/BillingProvider';
import { getUsageStats, type UsageStats } from '@/services/api';
import { TIERS } from '@/constants/config';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import {
  User,
  Moon,
  Sun,
  Monitor,
  CreditCard,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  BarChart3,
} from 'lucide-react-native';

export default function SettingsScreen() {
  const { colors, theme, setTheme, isDark } = useTheme();
  const { user, signOut } = useAuth();
  const { tier } = useBilling();
  const router = useRouter();
  const [usage, setUsage] = useState<UsageStats | null>(null);

  useEffect(() => {
    getUsageStats().then(setUsage).catch(() => {});
  }, []);

  const tierConfig = TIERS[tier];

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingBottom: 40 },
    section: { marginTop: 24 },
    sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 16, marginBottom: 8 },
    row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    rowFirst: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    rowIcon: { width: 32, alignItems: 'center' },
    rowContent: { flex: 1, marginLeft: 12 },
    rowLabel: { fontSize: 16, color: colors.text },
    rowValue: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
    rowRight: { marginLeft: 8 },
    themeRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
    themeOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    themeActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    themeText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
    themeTextActive: { color: '#fff' },
    signOutRow: { marginTop: 24, marginHorizontal: 16, backgroundColor: colors.errorLight, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    signOutText: { fontSize: 16, fontWeight: '600', color: colors.error },
  });

  const Row = ({ icon: Icon, label, value, onPress, first }: { icon: typeof User; label: string; value?: string; onPress?: () => void; first?: boolean }) => (
    <TouchableOpacity
      style={[s.row, first && s.rowFirst]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityLabel={value ? `${label}: ${value}` : label}
      accessibilityRole={onPress ? 'button' : 'text'}
    >
      <View style={s.rowIcon}><Icon size={20} color={colors.textSecondary} /></View>
      <View style={s.rowContent}>
        <Text style={s.rowLabel}>{label}</Text>
        {value && <Text style={s.rowValue}>{value}</Text>}
      </View>
      {onPress && <View style={s.rowRight}><ChevronRight size={18} color={colors.textMuted} /></View>}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.section}>
        <Text style={s.sectionTitle}>Account</Text>
        <Row icon={User} label="Profile" value={user?.email || ''} first />
        <Row icon={CreditCard} label="Subscription" value={`${tierConfig.name} plan — Manage`} onPress={() => router.push('/paywall')} />
      </View>

      {usage && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Usage This Month</Text>
          <View style={{ backgroundColor: colors.card, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 14 }}>
            {[
              { label: 'Letters Generated', used: usage.letterGenerations, limit: tierConfig.letterGenerations },
              { label: 'Images Generated', used: usage.imageGenerations, limit: tierConfig.imageGenerations },
              { label: 'Letters Sent', used: usage.lettersSent, limit: tierConfig.lettersSent },
            ].map((item) => {
              const limitText = item.limit === -1 ? 'Unlimited' : String(item.limit);
              const pct = item.limit === -1 ? 0.1 : Math.min(item.used / item.limit, 1);
              const isNearLimit = item.limit !== -1 && item.used >= item.limit * 0.8;
              return (
                <View key={item.label} style={{ marginBottom: 14 }} accessibilityLabel={`${item.label}: ${item.used} of ${limitText}`}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 14, color: colors.text }}>{item.label}</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: isNearLimit ? colors.warning : colors.textSecondary }}>
                      {item.used} / {limitText}
                    </Text>
                  </View>
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.border }}>
                    <View style={{ height: 6, borderRadius: 3, width: `${Math.max(pct * 100, 2)}%` as any, backgroundColor: isNearLimit ? colors.warning : colors.primary }} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <View style={s.section}>
        <Text style={s.sectionTitle}>Appearance</Text>
        <View style={s.themeRow}>
          {([
            { key: 'light' as const, icon: Sun, label: 'Light' },
            { key: 'dark' as const, icon: Moon, label: 'Dark' },
            { key: 'system' as const, icon: Monitor, label: 'System' },
          ]).map(({ key, icon: TIcon, label }) => (
            <TouchableOpacity
              key={key}
              style={[s.themeOption, theme === key && s.themeActive]}
              onPress={() => setTheme(key)}
              accessibilityLabel={`Theme: ${label}`}
              accessibilityRole="button"
            >
              <TIcon size={16} color={theme === key ? '#fff' : colors.textSecondary} />
              <Text style={[s.themeText, theme === key && s.themeTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>App</Text>
        <Row icon={Bell} label="Notifications" value="Manage notification preferences" onPress={() => Linking.openSettings()} first />
        <Row icon={Shield} label="Privacy Policy" onPress={() => Linking.openURL('https://steadyletters.com/privacy')} />
        <Row icon={HelpCircle} label="Help & FAQ" onPress={() => Linking.openURL('https://steadyletters.com/help')} />
      </View>

      <TouchableOpacity
        style={s.signOutRow}
        onPress={handleSignOut}
        accessibilityLabel="Sign out"
        accessibilityRole="button"
      >
        <LogOut size={20} color={colors.error} />
        <Text style={s.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 24, marginBottom: 8 }}>
        SteadyLetters v{Constants.expoConfig?.version ?? '1.0.0'}
      </Text>
    </ScrollView>
  );
}
