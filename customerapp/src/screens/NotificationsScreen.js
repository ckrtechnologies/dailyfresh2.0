import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { safeDistanceToNow } from '../utils/dateUtils';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import apiClient from '../api/apiClient';

const NotificationsScreen = ({ navigation }) => {
  const { user, token } = useSelector((state) => state.auth);
  const isAuthenticated = !!(token && user);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async (showLoading = true) => {
    if (!isAuthenticated) {
      setNotifications([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      if (showLoading) setLoading(true);
      const response = await apiClient.get('/customer/notifications');
      if (response.data?.success) {
        const raw = response.data.data;
        const list = Array.isArray(raw) ? raw : (raw?.notifications || []);
        const formatted = list.map(n => ({
          ...n,
          is_read: n.is_read !== undefined ? n.is_read : (n.isRead !== undefined ? n.isRead : false),
          isRead: n.is_read !== undefined ? n.is_read : (n.isRead !== undefined ? n.isRead : false),
          created_at: n.created_at || n.createdAt,
        }));
        setNotifications(formatted);
      }
    } catch (error) {
      console.error('Fetch notifications error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications(false);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      // Optimistic update
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      await apiClient.patch(`/customer/notifications/${id}/read`);
    } catch (error) {
      console.error('Mark as read error:', error);
      // Rollback or handle error
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      // Note: Backend might need a bulk mark-all-read endpoint, for now we do it sequentially or wait
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => apiClient.patch(`/customer/notifications/${n.id}/read`)));
    } catch (error) {
      console.error('Mark all as read error:', error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'order':
      case 'order_status_update': 
        return 'package-variant-closed';
      case 'promo': 
        return 'tag-outline';
      case 'alert':
      case 'danger':
        return 'alert-circle-outline';
      default: 
        return 'bell-outline';
    }
  };

  const formatNotificationTime = (dateValue) => {
    return safeDistanceToNow(dateValue, 'Just now');
  };

  const handleNotificationPress = async (item) => {
    if (!item.is_read) {
      handleMarkAsRead(item.id);
    }
    let data = item.data || {};
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {}
    }
    const orderId = data.order_id || data.orderId || (item.type?.startsWith('order') && data.id);
    if (orderId) {
      navigation.navigate('OrderDetail', { orderId, order: { id: orderId } });
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.notificationCard, !item.is_read && styles.unreadCard]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.iconContainer, 
        { backgroundColor: item.is_read ? '#F3F4F6' : 'rgba(125, 180, 52, 0.1)' }
      ]}>
        <Icon 
          name={getIcon(item.type)} 
          size={24} 
          color={item.is_read ? COLORS.gray : COLORS.primary} 
        />
      </View>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, !item.is_read && styles.unreadText]}>{item.title}</Text>
          {!item.is_read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.body}>{item.body}</Text>
        <Text style={styles.time}>
          {formatNotificationTime(item.created_at || item.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text style={styles.markRead}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="bell-off-outline" size={80} color="#E5E7EB" />
              <Text style={styles.emptyTitle}>
                {!isAuthenticated ? 'Please Log In' : 'No Notifications'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {!isAuthenticated
                  ? 'Sign in to receive order updates, exclusive deals, and delivery notifications.'
                  : "We'll notify you about your orders and special offers."}
              </Text>
              {!isAuthenticated && (
                <TouchableOpacity
                  style={{ marginTop: 16, backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 }}
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 14 }}>Log In</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    padding: SPACING.s,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
  markRead: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  unreadCard: {
    backgroundColor: 'rgba(125, 180, 52, 0.02)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: SPACING.m,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  unreadText: {
    fontWeight: '800',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  body: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: SPACING.s,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.dark,
    marginTop: SPACING.l,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: SPACING.s,
  },
});

export default NotificationsScreen;

