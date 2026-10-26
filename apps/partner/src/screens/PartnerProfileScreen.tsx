import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../theme/theme';
import { usePartnerAuth } from '../context/PartnerAuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { updatePartnerProfileApi } from '../services/api';

interface PartnerProfileScreenProps {
  onLogout: () => void;
}

export const PartnerProfileScreen: React.FC<PartnerProfileScreenProps> = ({ onLogout }) => {
  const { user, partnerProfile, refreshProfile, logout } = usePartnerAuth();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [businessName, setBusinessName] = useState(partnerProfile?.business_name || '');
  const [businessType, setBusinessType] = useState(partnerProfile?.business_type || 'HOTELIER');
  const [phone, setPhone] = useState(partnerProfile?.phone || '');
  const [city, setCity] = useState(partnerProfile?.city || '');
  const [address, setAddress] = useState(partnerProfile?.address || '');
  const [taxId, setTaxId] = useState(partnerProfile?.tax_id || '');
  const [saving, setSaving] = useState(false);

  const openEditModal = () => {
    setBusinessName(partnerProfile?.business_name || '');
    setBusinessType(partnerProfile?.business_type || 'HOTELIER');
    setPhone(partnerProfile?.phone || '');
    setCity(partnerProfile?.city || '');
    setAddress(partnerProfile?.address || '');
    setTaxId(partnerProfile?.tax_id || '');
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!businessName.trim() || !city.trim()) {
      Alert.alert('Validation Error', 'Business name and city are required.');
      return;
    }

    setSaving(true);
    try {
      await updatePartnerProfileApi({
        business_name: businessName.trim(),
        business_type: businessType,
        phone: phone.trim() || undefined,
        city: city.trim(),
        address: address.trim() || undefined,
        tax_id: taxId.trim() || undefined,
      });
      await refreshProfile();
      Alert.alert('Success', 'Partner profile updated successfully.');
      setEditModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of the SS Journey Partner Portal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            onLogout();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header Card */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.avatarCircle}>
          <MaterialIcons name="business" size={32} color={Colors.secondary} />
        </View>
        <Text style={styles.businessTitle}>
          {partnerProfile?.business_name || 'Hospitality Partner'}
        </Text>
        <Text style={styles.userEmail}>{user?.email || 'partner@ssjourney.com'}</Text>
        <View style={styles.badgeWrap}>
          <StatusBadge status={partnerProfile?.status || 'PENDING'} />
        </View>
      </View>

      {/* Compliance & Verification Card */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>COMPLIANCE &amp; VERIFICATION</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Verification Status</Text>
          <Text style={[styles.detailVal, { fontWeight: 'bold' }]}>
            {partnerProfile?.is_verified ? 'Verified & Approved' : 'Pending Compliance Review'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Platform Commission</Text>
          <Text style={styles.detailVal}>
            {Math.round((partnerProfile?.commission_rate || 0.1) * 100)}% Standard Net
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Verified On</Text>
          <Text style={styles.detailVal}>
            {partnerProfile?.verified_at
              ? new Date(partnerProfile.verified_at).toLocaleDateString()
              : 'Pending Approval'}
          </Text>
        </View>

        {partnerProfile?.rejection_reason && (
          <View style={styles.rejectionBox}>
            <MaterialIcons name="error" size={16} color={Colors.error} />
            <Text style={styles.rejectionText}>
              Reason: {partnerProfile.rejection_reason}
            </Text>
          </View>
        )}
      </View>

      {/* Business Details Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardHeading}>BUSINESS PARTICULARS</Text>
          <TouchableOpacity onPress={openEditModal}>
            <Text style={styles.editLinkText}>Edit Details</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Business Type</Text>
          <Text style={styles.detailVal}>
            {partnerProfile?.business_type === 'HOMESTAY_HOST' ? 'Homestay & Villa Host' : 'Hotelier'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>City / Market</Text>
          <Text style={styles.detailVal}>{partnerProfile?.city || 'Not specified'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Operating Address</Text>
          <Text style={styles.detailVal}>{partnerProfile?.address || 'Not specified'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Contact Phone</Text>
          <Text style={styles.detailVal}>{partnerProfile?.phone || user?.phone || 'Not specified'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>GSTIN / Tax ID</Text>
          <Text style={styles.detailVal}>{partnerProfile?.tax_id || 'Not provided'}</Text>
        </View>
      </View>

      {/* Portal Actions */}
      <View style={styles.card}>
        <TouchableOpacity style={styles.actionItem} onPress={openEditModal}>
          <MaterialIcons name="edit" size={20} color={Colors.primary} />
          <Text style={styles.actionItemText}>Update Business Profile</Text>
          <MaterialIcons name="chevron-right" size={20} color={Colors.onSurfaceSubtle} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionItem, { borderTopWidth: 1, borderTopColor: Colors.surfaceLow }]}
          onPress={handleConfirmLogout}
        >
          <MaterialIcons name="logout" size={20} color={Colors.error} />
          <Text style={[styles.actionItemText, { color: Colors.error }]}>Sign Out of Partner Portal</Text>
          <MaterialIcons name="chevron-right" size={20} color={Colors.onSurfaceSubtle} />
        </TouchableOpacity>
      </View>

      <Text style={styles.appFooter}>
        SS Journey Partner Portal · v1.0.0 (Build 2026.10)
      </Text>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Business Details</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <MaterialIcons name="close" size={20} color={Colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: Spacing.md }}>
              <Text style={styles.inputLabel}>Business Name *</Text>
              <TextInput
                style={styles.input}
                value={businessName}
                onChangeText={setBusinessName}
              />

              <Text style={styles.inputLabel}>City *</Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
              />

              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
              />

              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
              />

              <Text style={styles.inputLabel}>GSTIN / Tax ID</Text>
              <TextInput
                style={styles.input}
                value={taxId}
                onChangeText={setTaxId}
              />

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Profile</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  profileHeaderCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    ...Shadows.sm,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.secondary,
  },
  businessTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  userEmail: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  badgeWrap: {
    marginTop: Spacing.sm,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    ...Shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  cardHeading: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  editLinkText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.secondary,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  detailVal: {
    fontSize: 12,
    color: Colors.onSurface,
  },
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  rejectionText: {
    fontSize: 11,
    color: Colors.error,
    fontWeight: '600',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.sm,
  },
  actionItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
    flex: 1,
  },
  appFooter: {
    textAlign: 'center',
    fontSize: 10,
    color: Colors.onSurfaceSubtle,
    marginTop: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceLow,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    fontSize: 13,
    color: Colors.onSurface,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  cancelBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 9,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  saveBtn: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 9,
    borderRadius: BorderRadius.full,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
