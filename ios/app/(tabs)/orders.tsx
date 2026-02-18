import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { getOrders, type Order } from '@/services/api';
import { getOrderStatus } from '@/services/thanks-io';
import { ShoppingCart, Clock, CheckCircle, AlertCircle, Truck } from 'lucide-react-native';

const STATUS_CONFIG: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  queued: { icon: Clock, color: '#d69e2e', label: 'Queued' },
  processing: { icon: Clock, color: '#3182ce', label: 'Processing' },
  sent: { icon: Truck, color: '#38a169', label: 'Sent' },
  delivered: { icon: CheckCircle, color: '#38a169', label: 'Delivered' },
  failed: { icon: AlertCircle, color: '#e53e3e', label: 'Failed' },
};

export default function OrdersScreen() {
  const { colors } = useTheme();
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

  const refreshOrderStatus = async (order: Order) => {
    try {
      const status = await getOrderStatus(order.thanks_io_order_id);
      if (status) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id ? { ...o, status: status.status } : o,
          ),
        );
      }
    } catch (error) {
      console.error('Failed to refresh order status:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    card: { backgroundColor: colors.card, marginHorizontal: 16, marginBottom: 12, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    productType: { fontSize: 15, fontWeight: '600', color: colors.text, textTransform: 'capitalize' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    statusText: { fontSize: 12, fontWeight: '600' },
    recipient: { fontSize: 15, color: colors.textSecondary, marginTop: 8 },
    preview: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
    cardBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    date: { fontSize: 13, color: colors.textMuted },
    cost: { fontSize: 14, fontWeight: '600', color: colors.primary },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyText: { fontSize: 17, color: colors.textMuted, marginTop: 12, textAlign: 'center' },
    listContent: { paddingTop: 16, paddingBottom: 40 },
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
      {orders.length === 0 ? (
        <View style={s.empty}>
          <ShoppingCart size={48} color={colors.textMuted} />
          <Text style={s.emptyText}>No orders yet.{'\n'}Send your first letter to see it here.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(); }} />
          }
          renderItem={({ item }) => {
            const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.queued;
            const Icon = cfg.icon;
            return (
              <TouchableOpacity style={s.card} onPress={() => refreshOrderStatus(item)}>
                <View style={s.cardTop}>
                  <Text style={s.productType}>{item.product_type.replace('_', ' ')}</Text>
                  <View style={[s.statusBadge, { backgroundColor: cfg.color + '20' }]}>
                    <Icon size={14} color={cfg.color} />
                    <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>
                <Text style={s.recipient}>{item.recipient_name} — {item.recipient_address}</Text>
                <Text style={s.preview} numberOfLines={2}>{item.message_preview}</Text>
                <View style={s.cardBottom}>
                  <Text style={s.date}>{formatDate(item.created_at)}</Text>
                  <Text style={s.cost}>${item.cost.toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}
