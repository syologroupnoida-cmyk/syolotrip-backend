import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../theme/theme';
import { PartnerProfileData } from '../types/partner';

interface VerificationBannerProps {
  partnerProfile: PartnerProfileData | null;
  onRefresh?: () => void;
  onEditProfile?: () => void;
}

export const VerificationBanner: React.FC<VerificationBannerProps> = ({
  partnerProfile,
  onRefresh,
  onEditProfile,
}) => {
  if (!partnerProfile) return null;

  const isVerified =
    partnerProfile.status === 'VERIFIED' ||
    partnerProfile.status === 'APPROVED' ||
    partnerProfile.is_verified;

  if (isVerified) return null;

  const isRejected = partnerProfile.status === 'REJECTED';
  const isSuspended = partnerProfile.status === 'SUSPENDED';

  if (isSuspended) {
    return (
      <View style={[styles.container, styles.suspendedContainer]}>
        <MaterialIcons name="block" size={20} color={Colors.statusRejected} />
        <View style={styles.content}>
          <Text style={styles.title}>Account Suspended</Text>
          <Text style={styles.desc}>
            Your partner access has been suspended by platform administration. Please contact partner-support@ssjourney.com for assistance.
          </Text>
        </View>
      </View>
    );
  }

  if (isRejected) {
    return (
      <View style={[styles.container, styles.rejectedContainer]}>
        <MaterialIcons name="cancel" size={20} color={Colors.statusRejected} />
        <View style={styles.content}>
          <Text style={styles.title}>Application Requires Attention</Text>
          <Text style={styles.desc}>
            Reason: {partnerProfile.rejection_reason || 'Compliance criteria not met. Please review your business details.'}
          </Text>
          {onEditProfile && (
            <TouchableOpacity style={styles.actionBtn} onPress={onEditProfile}>
              <Text style={styles.actionBtnText}>Update & Resubmit Profile</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Pending verification default
  return (
    <View style={[styles.container, styles.pendingContainer]}>
      <MaterialIcons name="hourglass-top" size={20} color={Colors.statusPending} />
      <View style={styles.content}>
        <Text style={styles.title}>Verification In Progress</Text>
        <Text style={styles.desc}>
          Your partner profile for "{partnerProfile.business_name}" is currently under administrative compliance review. Publishing live listings and managing inventory will unlock automatically once approved.
        </Text>
        {onRefresh && (
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <MaterialIcons name="refresh" size={14} color={Colors.primary} />
            <Text style={styles.refreshBtnText}>Check Status</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  pendingContainer: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  rejectedContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  suspendedContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.onSurface,
    marginBottom: 2,
  },
  desc: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    lineHeight: 16,
  },
  actionBtn: {
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: Colors.statusRejected,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(12, 45, 107, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  refreshBtnText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: 'bold',
  },
});
