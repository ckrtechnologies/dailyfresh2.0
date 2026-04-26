import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

const NotificationsScreen = ({ navigation }) => {
  const notifications = [
    {
      id: '1',
      title: 'Order Delivered!',
      body: 'Your order RN-20260423-1234 has been delivered successfully.',
      time: '2 hours ago',
      type: 'order',
      isRead: false,
    },
    {
      id: '2',
      title: 'Weekend Sale is Here!',
      body: 'Get up to 30% off on all frozen meat products this weekend.',
      time: '1 day ago',
      type: 'promo',
      isRead: true,
    },
    {
      id: '3',
      title: 'Profile Updated',
      body: 'Your profile information was updated successfully.',
      time: '3 days ago',
      type: 'system',
      isRead: true,
    }
  ];

  const getIcon = (type) => {
    switch (type) {
      case 'order': return 'package-variant-closed';
      case 'promo': return 'tag-outline';
      default: return 'bell-outline';
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={[styles.notificationCard, !item.isRead && styles.unreadCard]}>
      <View style={[styles.iconContainer, { backgroundColor: item.isRead ? '#F3F4F6' : 'rgba(125, 180, 52, 0.1)' }]}>
        <Icon 
          name={getIcon(item.type)} 
          size={24} 
          color={item.isRead ? COLORS.gray : COLORS.primary} 
        />
      </View>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, !item.isRead && styles.unreadText]}>{item.title}</Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.body}>{item.body}</Text>
        <Text style={styles.time}>{item.time}</Text>
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
        <TouchableOpacity>
          <Text style={styles.markRead}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="bell-off-outline" size={80} color="#E5E7EB" />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>We'll notify you about your orders and special offers.</Text>
          </View>
        }
      />
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
