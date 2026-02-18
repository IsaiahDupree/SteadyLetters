import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
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
} from 'lucide-react-native';

export default function SettingsScreen() {
  const { colors, theme, setTheme, isDark } = useTheme();
  const { user, signOut } = useAuth();

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
    <TouchableOpacity style={[s.row, first && s.rowFirst]} onPress={onPress} disabled={!onPress}>
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
        <Row icon={CreditCard} label="Subscription" value="Manage plan" onPress={() => {}} />
      </View>

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
            >
              <TIcon size={16} color={theme === key ? '#fff' : colors.textSecondary} />
              <Text style={[s.themeText, theme === key && s.themeTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>App</Text>
        <Row icon={Bell} label="Notifications" onPress={() => {}} first />
        <Row icon={Shield} label="Privacy Policy" onPress={() => {}} />
        <Row icon={HelpCircle} label="Help & FAQ" onPress={() => {}} />
      </View>

      <TouchableOpacity style={s.signOutRow} onPress={handleSignOut}>
        <LogOut size={20} color={colors.error} />
        <Text style={s.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
