import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../theme/theme';

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ visible, onClose }) => {
  const alerts = [
    {
      id: '1',
      title: 'Tokyo Fare Drop Alert',
      desc: 'Flights from SFO to HND dropped ₹12,500 today. Best price is now ₹54,900 roundtrip.',
      time: '10m ago',
      icon: 'trending-down',
      iconColor: Colors.tertiary,
      unread: true,
    },
    {
      id: '2',
      title: 'Seat Assignment Confirmed',
      desc: 'Seat 23A (Window) locked for All Nippon Airways flight NH 107.',
      time: '1h ago',
      icon: 'airline-seat-recline-extra',
      iconColor: Colors.primaryContainer,
      unread: true,
    },
    {
      id: '3',
      title: 'Autumn Deal in Paris',
      desc: 'Hotel Gracery rates slashed by 25% for stays between Oct 15-28.',
      time: '1d ago',
      icon: 'hotel',
      iconColor: Colors.secondaryContainer,
      unread: false,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MaterialIcons name="notifications-active" size={20} color={Colors.primary} />
              <Text style={styles.title}>Travel Alerts & Deals</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={20} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll}>
            {alerts.map((item) => (
              <View key={item.id} style={[styles.alertItem, item.unread && styles.unreadItem]}>
                <View style={[styles.alertIconBadge, { backgroundColor: item.iconColor + '18' }]}>
                  <MaterialIcons name={item.icon as any} size={20} color={item.iconColor} />
                </View>
                <View style={styles.alertContent}>
                  <View style={styles.alertHeaderRow}>
                    <Text style={styles.alertTitle}>{item.title}</Text>
                    <Text style={styles.alertTime}>{item.time}</Text>
                  </View>
                  <Text style={styles.alertDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.actionBtn} onPress={onClose}>
            <Text style={styles.actionBtnText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 27, 46, 0.45)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill as object,
  },
  sheet: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '75%',
    ...Shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainerLow,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  closeBtn: {
    padding: 4,
  },
  scroll: {
    marginVertical: Spacing.sm,
  },
  alertItem: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginVertical: 4,
  },
  unreadItem: {
    backgroundColor: Colors.surfaceContainerLow,
  },
  alertIconBadge: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  alertTime: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  alertDesc: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 17,
  },
  actionBtn: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
});
