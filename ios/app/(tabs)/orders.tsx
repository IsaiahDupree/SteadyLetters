import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { getOrders, type Order } from '@/services/api';
import { ShoppingCart, Clock, CheckCircle, AlertCircle, Truck, Send, Printer, Package, XCircle, Eye } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const STATUS_CONFIG: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  reviewing: { icon: Eye, color: '#d69e2e', label: 'Reviewing' },
  printing: { icon: Printer, color: '#3182ce', label: 'Printing' },
  printed: { icon: Printer, color: '#3182ce', label: 'Printed' },
  fulfilled: { icon: Package, color: '#38a169', label: 'Fulfilled' },
  shipped: { icon: Truck, color: '#38a169', label: 'Shipped' },
  delivered: { icon: CheckCircle, color: '#38a169', label: 'Delivered' },
  cancelled: { icon: XCircle, color: '#a0aec0', label: 'Cancelled' },
  error: { icon: AlertCircle, color: '#e53e3e', label: 'Error' },
  pending: { icon: Clock, color: '#d69e2e', label: 'Pending' },
  queued: { icon: Clock, color: '#d69e2e', label: 'Queued' },
  processing: { icon: Clock, color: '#3182ce', label: 'Processing' },
  sent: { icon: Truck, color: '#38a169', label: 'Sent' },
};

const SkeletonCard = memo(({ colors }: { colors: Record<string, string> }) => (
  <View style={{ backgroundColor: colors.card, marginHorizontal: 16, marginBottom: 12, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <View style={{ width: '40%', height: 16, backgroundColor: colors.surfaceElevated, borderRadius: 4 }} />
      <View style={{ width: 60, height: 20, backgroundColor: colors.surfaceElevated, borderRadius: 6 }} />
    </View>
    <View style={{ width: '70%', height: 14, backgroundColor: colors.surfaceElevated, borderRadius: 4, marginTop: 10 }} />
    <View style={{ width: '90%', height: 12, backgroundColor: colors.surfaceElevated, borderRadius: 4, marginTop: 6 }} />
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
      <View style={{ width: 80, height: 12, backgroundColor: colors.surfaceElevated, borderRadius: 4 }} />
      <View style={{ width: 40, height: 14, backgroundColor: colors.surfaceElevated, borderRadius: 4 }} />
    </View>
  </View>
));

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const OrderCard = memo(({ item, colors, onPress }: {
  item: Order;
  colors: Record<string, string>;
  onPress: () => void;
}) => {
  const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.queued;
  const Icon = cfg.icon;
  return (
    <TouchableOpacity
      style={{ backgroundColor: colors.card, marginHorizontal: 16, marginBottom: 12, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border }}
      onPress={onPress}
      accessibilityLabel={`Order: ${item.product_type} to ${item.recipient_name}, status ${cfg.label}, cost $${item.cost.toFixed(2)}`}
      accessibilityRole="button"
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text, textTransform: 'capitalize' }}>{item.product_type.replace('_', ' ')}</Text>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: cfg.color + '20' }}
          accessibilityLabel={`Status: ${cfg.label}`}
        >
          <Icon size={14} color={cfg.color} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: cfg.color }}>{cfg.label}</Text>
        </View>
      </View>
      <Text style={{ fontSize: 15, color: colors.textSecondary, marginTop: 8 }}>{item.recipient_name} — {item.recipient_address}</Text>
      <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 4 }} numberOfLines={2}>{item.message_preview}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
        <Text style={{ fontSize: 13, color: colors.textMuted }}>{formatDate(item.created_at)}</Text>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>${item.cost.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );
});

export default function OrdersScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const handleOrderPress = useCallback((order: Order) => {
    router.push({ pathname: '/order-detail', params: { orderId: order.id } });
  }, [router]);

  const colorsObj = colors as unknown as Record<string, string>;

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: 16 }}>
        {[1, 2, 3].map((i) => <SkeletonCard key={i} colors={colorsObj} />)}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {orders.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <ShoppingCart size={48} color={colors.textMuted} />
          <Text style={{ fontSize: 17, color: colors.textMuted, marginTop: 12, textAlign: 'center' }}>
            No orders yet.{'\n'}Send your first letter to see it here.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 16 }}
            onPress={() => router.push('/(tabs)')}
            accessibilityLabel="Create your first letter"
            accessibilityRole="button"
          >
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Create Letter</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(); }} />
          }
          renderItem={({ item }) => (
            <OrderCard item={item} colors={colorsObj} onPress={() => handleOrderPress(item)} />
          )}
        />
      )}
    </View>
  );
}
