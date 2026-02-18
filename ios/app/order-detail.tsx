import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getOrders, type Order } from '@/services/api';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Truck,
  Printer,
  Package,
  XCircle,
  Eye,
  MapPin,
  Mail,
  DollarSign,
  Calendar,
  Hash,
} from 'lucide-react-native';

const STATUS_CONFIG: Record<string, { icon: typeof Clock; color: string; label: string; description: string }> = {
  reviewing: { icon: Eye, color: '#d69e2e', label: 'Reviewing', description: 'Your order is being reviewed.' },
  printing: { icon: Printer, color: '#3182ce', label: 'Printing', description: 'Your letter has been sent to the printer.' },
  printed: { icon: Printer, color: '#3182ce', label: 'Printed', description: 'All pieces have been printed.' },
  fulfilled: { icon: Package, color: '#38a169', label: 'Fulfilled', description: 'Processing is complete and settled.' },
  shipped: { icon: Truck, color: '#38a169', label: 'Shipped', description: 'Your letter is in transit.' },
  delivered: { icon: CheckCircle, color: '#38a169', label: 'Delivered', description: 'Your letter has been delivered!' },
  cancelled: { icon: XCircle, color: '#a0aec0', label: 'Cancelled', description: 'This order was cancelled.' },
  error: { icon: AlertCircle, color: '#e53e3e', label: 'Error', description: 'There was an error with this order.' },
  pending: { icon: Clock, color: '#d69e2e', label: 'Pending', description: 'Your order is pending.' },
  queued: { icon: Clock, color: '#d69e2e', label: 'Queued', description: 'Your order is queued.' },
  processing: { icon: Clock, color: '#3182ce', label: 'Processing', description: 'Your order is being processed.' },
  sent: { icon: Truck, color: '#38a169', label: 'Sent', description: 'Your letter has been sent.' },
};

const STATUS_TIMELINE = ['reviewing', 'printing', 'printed', 'fulfilled', 'shipped', 'delivered'];

function getTimelineIndex(status: string): number {
  const lower = status.toLowerCase();
  const idx = STATUS_TIMELINE.indexOf(lower);
  if (idx >= 0) return idx;
  if (lower === 'queued' || lower === 'pending') return 0;
  if (lower === 'processing') return 1;
  if (lower === 'sent') return 4;
  return 0;
}

export default function OrderDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const orders = await getOrders();
        const found = orders.find((o) => o.id === orderId);
        setOrder(found || null);
      } catch (error) {
        console.error('Failed to load order:', error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [orderId]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <AlertCircle size={48} color={colors.textMuted} />
        <Text style={{ fontSize: 17, color: colors.textMuted, marginTop: 12, textAlign: 'center' }}>Order not found</Text>
        <TouchableOpacity
          style={{ backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 16 }}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cfg = STATUS_CONFIG[order.status.toLowerCase()] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;
  const timelineIdx = getTimelineIndex(order.status);
  const isFailed = order.status.toLowerCase() === 'error' || order.status.toLowerCase() === 'cancelled';

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 40 },
    statusCard: {
      backgroundColor: cfg.color + '12',
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: cfg.color + '30',
    },
    statusLabel: { fontSize: 22, fontWeight: '700', color: cfg.color, marginTop: 10 },
    statusDesc: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 20 },
    section: { marginTop: 24 },
    sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
    card: { backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    rowLast: { borderBottomWidth: 0 },
    rowIcon: { width: 28 },
    rowContent: { flex: 1, marginLeft: 10 },
    rowLabel: { fontSize: 13, color: colors.textMuted },
    rowValue: { fontSize: 15, fontWeight: '500', color: colors.text, marginTop: 2 },
    messageCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border },
    messageText: { fontSize: 15, color: colors.text, lineHeight: 22 },
    timelineRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    timelineDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
    timelineDotActive: { backgroundColor: cfg.color },
    timelineDotInactive: { backgroundColor: colors.border },
    timelineDotCurrent: { width: 14, height: 14, borderRadius: 7, marginRight: 10 },
    timelineLabel: { fontSize: 14, color: colors.textSecondary },
    timelineLabelActive: { fontWeight: '600', color: colors.text },
    timelineLabelCurrent: { fontWeight: '700', color: cfg.color },
    timelineLine: { width: 2, height: 14, backgroundColor: colors.border, marginLeft: 4, marginBottom: 4 },
    timelineLineActive: { backgroundColor: cfg.color },
    reorderBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
    reorderText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  });

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Status Hero */}
      <View style={s.statusCard} accessibilityLabel={`Order status: ${cfg.label}`}>
        <StatusIcon size={40} color={cfg.color} />
        <Text style={s.statusLabel}>{cfg.label}</Text>
        <Text style={s.statusDesc}>{cfg.description}</Text>
      </View>

      {/* Status Timeline */}
      {!isFailed && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Status Timeline</Text>
          {STATUS_TIMELINE.map((step, i) => {
            const isActive = i <= timelineIdx;
            const isCurrent = i === timelineIdx;
            const stepCfg = STATUS_CONFIG[step];
            return (
              <View key={step}>
                <View style={s.timelineRow}>
                  <View
                    style={[
                      isCurrent ? s.timelineDotCurrent : s.timelineDot,
                      isActive ? s.timelineDotActive : s.timelineDotInactive,
                    ]}
                  />
                  <Text
                    style={[
                      s.timelineLabel,
                      isActive && s.timelineLabelActive,
                      isCurrent && s.timelineLabelCurrent,
                    ]}
                    accessibilityLabel={`${stepCfg.label}: ${isActive ? 'complete' : 'pending'}`}
                  >
                    {stepCfg.label}
                  </Text>
                </View>
                {i < STATUS_TIMELINE.length - 1 && (
                  <View style={[s.timelineLine, isActive && s.timelineLineActive]} />
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Order Details */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Order Details</Text>
        <View style={s.card}>
          <View style={s.row}>
            <View style={s.rowIcon}><Hash size={16} color={colors.textMuted} /></View>
            <View style={s.rowContent}>
              <Text style={s.rowLabel}>Order ID</Text>
              <Text style={s.rowValue} selectable>{order.thanks_io_order_id || order.id}</Text>
            </View>
          </View>
          <View style={s.row}>
            <View style={s.rowIcon}><Mail size={16} color={colors.textMuted} /></View>
            <View style={s.rowContent}>
              <Text style={s.rowLabel}>Product Type</Text>
              <Text style={[s.rowValue, { textTransform: 'capitalize' }]}>{order.product_type.replace('_', ' ')}</Text>
            </View>
          </View>
          <View style={s.row}>
            <View style={s.rowIcon}><Calendar size={16} color={colors.textMuted} /></View>
            <View style={s.rowContent}>
              <Text style={s.rowLabel}>Date Ordered</Text>
              <Text style={s.rowValue}>{new Date(order.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
            </View>
          </View>
          <View style={[s.row, s.rowLast]}>
            <View style={s.rowIcon}><DollarSign size={16} color={colors.textMuted} /></View>
            <View style={s.rowContent}>
              <Text style={s.rowLabel}>Cost</Text>
              <Text style={s.rowValue}>${order.cost.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Recipient */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Recipient</Text>
        <View style={s.card}>
          <View style={[s.row, s.rowLast]}>
            <View style={s.rowIcon}><MapPin size={16} color={colors.textMuted} /></View>
            <View style={s.rowContent}>
              <Text style={[s.rowValue, { marginTop: 0 }]}>{order.recipient_name}</Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>{order.recipient_address}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Message Preview */}
      {order.message_preview && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Message Preview</Text>
          <View style={s.messageCard}>
            <Text style={s.messageText} selectable>{order.message_preview}</Text>
          </View>
        </View>
      )}

      {/* Reorder */}
      <TouchableOpacity
        style={s.reorderBtn}
        onPress={() => router.push({ pathname: '/send', params: { message: order.message_preview } })}
        accessibilityLabel="Send a similar letter"
        accessibilityRole="button"
      >
        <Text style={s.reorderText}>Send Similar Letter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
