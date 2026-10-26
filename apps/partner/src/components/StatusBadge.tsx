import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius, Spacing } from '../theme/theme';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = (status || '').toUpperCase();

  let bg = Colors.surfaceLow;
  let text = Colors.onSurfaceVariant;
  let label = norm.replace(/_/g, ' ');

  if (norm === 'APPROVED' || norm === 'VERIFIED' || norm === 'CONFIRMED' || norm === 'PAID') {
    bg = Colors.statusApprovedBg;
    text = Colors.statusApproved;
  } else if (norm === 'PENDING_APPROVAL' || norm === 'PENDING_VERIFICATION' || norm === 'PENDING') {
    bg = Colors.statusPendingBg;
    text = Colors.statusPending;
    label = norm === 'PENDING_APPROVAL' ? 'IN REVIEW' : 'PENDING';
  } else if (norm === 'REJECTED' || norm === 'FAILED' || norm === 'SUSPENDED') {
    bg = Colors.statusRejectedBg;
    text = Colors.statusRejected;
  } else if (norm === 'DRAFT') {
    bg = Colors.statusDraftBg;
    text = Colors.statusDraft;
  } else if (norm === 'CANCELLED' || norm === 'REFUNDED') {
    bg = '#f1f5f9';
    text = '#64748b';
  }

  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: bg }, isSmall && styles.badgeSm]}>
      <View style={[styles.dot, { backgroundColor: text }]} />
      <Text style={[styles.badgeText, { color: text }, isSmall && styles.badgeTextSm]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  badgeTextSm: {
    fontSize: 9,
  },
});
