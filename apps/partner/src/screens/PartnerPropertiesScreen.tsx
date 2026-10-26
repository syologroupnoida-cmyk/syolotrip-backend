import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows, formatINR } from '../theme/theme';
import { ScreenName, PartnerPropertyData } from '../types/partner';
import { usePartnerAuth } from '../context/PartnerAuthContext';
import { getPartnerPropertiesApi, submitPropertyForApprovalApi } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { VerificationBanner } from '../components/VerificationBanner';

interface PartnerPropertiesScreenProps {
  onNavigate: (screen: ScreenName) => void;
  onSelectProperty: (property: PartnerPropertyData) => void;
  onEditProperty: (property: PartnerPropertyData) => void;
  onManageRooms: (property: PartnerPropertyData) => void;
}

export const PartnerPropertiesScreen: React.FC<PartnerPropertiesScreenProps> = ({
  onNavigate,
  onSelectProperty,
  onEditProperty,
  onManageRooms,
}) => {
  const { partnerProfile, isVerified, refreshProfile } = usePartnerAuth();

  const [properties, setProperties] = useState<PartnerPropertyData[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'APPROVED' | 'PENDING_APPROVAL' | 'DRAFT' | 'REJECTED'>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchProperties = async () => {
    try {
      if (isVerified) {
        const filterQuery = filter === 'ALL' ? undefined : filter;
        const res = await getPartnerPropertiesApi(filterQuery);
        setProperties(res);
      } else {
        setProperties([]);
      }
    } catch (err: any) {
      console.warn('[PartnerProperties] Fetch failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [filter, isVerified]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    await fetchProperties();
  };

  const handleSubmitForApproval = async (prop: PartnerPropertyData) => {
    if (!prop.rooms || prop.rooms.length === 0) {
      Alert.alert(
        'Room Category Required',
        'Please add at least one room category to this property before submitting for admin approval.',
        [
          { text: 'Add Rooms Now', onPress: () => onManageRooms(prop) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    Alert.alert(
      'Submit for Admin Approval',
      `Are you ready to submit "${prop.name}" for compliance and listing verification?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Listing',
          onPress: async () => {
            setActionLoadingId(prop.id);
            try {
              await submitPropertyForApprovalApi(prop.id);
              Alert.alert('Submitted', 'Property submitted for administrator review.');
              fetchProperties();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Submission failed.');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  const filteredList =
    filter === 'ALL'
      ? properties
      : properties.filter((p) => p.publication_status === filter);

  return (
    <View style={styles.container}>
      {/* Top Verification Banner if pending */}
      <VerificationBanner partnerProfile={partnerProfile} onRefresh={onRefresh} />

      {/* Filter Chips Bar */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {[
            { key: 'ALL', label: 'All Listings' },
            { key: 'APPROVED', label: 'Live' },
            { key: 'PENDING_APPROVAL', label: 'In Review' },
            { key: 'DRAFT', label: 'Drafts' },
            { key: 'REJECTED', label: 'Rejected' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterChip, filter === tab.key && styles.filterChipActive]}
              onPress={() => setFilter(tab.key as any)}
            >
              <Text style={[styles.filterChipText, filter === tab.key && styles.filterChipTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Property List or Empty / Locked States */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {!isVerified ? (
          <View style={styles.lockedBox}>
            <MaterialIcons name="lock" size={32} color={Colors.statusPending} />
            <Text style={styles.lockedTitle}>Property Management Locked</Text>
            <Text style={styles.lockedDesc}>
              Account verification is required before you can create and manage property listings. Platform administration is currently reviewing your registered credentials.
            </Text>
          </View>
        ) : loading ? (
          <ActivityIndicator style={{ marginTop: Spacing.xl }} color={Colors.primary} />
        ) : filteredList.length === 0 ? (
          <View style={styles.emptyBox}>
            <MaterialIcons name="apartment" size={40} color={Colors.onSurfaceSubtle} />
            <Text style={styles.emptyTitle}>No properties found</Text>
            <Text style={styles.emptyDesc}>
              {filter === 'ALL'
                ? 'You have not created any property listings yet. Create your first hotel or homestay draft to get started.'
                : `No properties currently matching status: ${filter.replace(/_/g, ' ')}`}
            </Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => onNavigate('create_property')}
            >
              <MaterialIcons name="add" size={18} color="#ffffff" />
              <Text style={styles.createBtnText}>Create New Listing</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredList.map((prop) => {
            const isDraft = prop.publication_status === 'DRAFT';
            const isPending = prop.publication_status === 'PENDING_APPROVAL';
            const isApproved = prop.publication_status === 'APPROVED';
            const isRejected = prop.publication_status === 'REJECTED';
            const isSubmitting = actionLoadingId === prop.id;

            return (
              <TouchableOpacity
                key={prop.id}
                style={styles.propertyCard}
                onPress={() => onSelectProperty(prop)}
                activeOpacity={0.9}
              >
                {/* Property Featured Image */}
                <View style={styles.imageBox}>
                  <Image
                    source={{
                      uri:
                        prop.featured_image ||
                        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
                    }}
                    style={styles.image}
                  />
                  <View style={styles.badgeOverlay}>
                    <StatusBadge status={prop.publication_status} size="sm" />
                  </View>
                </View>

                {/* Property Body */}
                <View style={styles.cardBody}>
                  <View style={styles.typeRow}>
                    <Text style={styles.propertyType}>
                      {prop.property_type === 'HOMESTAY' ? 'Homestay / Villa' : 'Hotel / Resort'} · {prop.city}
                    </Text>
                    <View style={styles.ratingRow}>
                      <MaterialIcons name="star" size={13} color="#f59e0b" />
                      <Text style={styles.ratingText}>{prop.star_rating} Star</Text>
                    </View>
                  </View>

                  <Text style={styles.propertyName}>{prop.name}</Text>
                  <Text style={styles.propertyAddress} numberOfLines={1}>
                    {prop.address}
                  </Text>

                  {/* Rejection notice if rejected */}
                  {isRejected && prop.admin_rejection_reason && (
                    <View style={styles.rejectionBox}>
                      <MaterialIcons name="info" size={13} color={Colors.error} />
                      <Text style={styles.rejectionText}>
                        Admin Note: {prop.admin_rejection_reason}
                      </Text>
                    </View>
                  )}

                  {/* Pricing and room capacity footer */}
                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.priceLabel}>Base Rate</Text>
                      <Text style={styles.priceValue}>{formatINR(prop.starting_price)}/night</Text>
                    </View>

                    <Text style={styles.roomsCountText}>
                      {prop.rooms ? prop.rooms.length : 0} Room Categories
                    </Text>
                  </View>

                  {/* Operational Action Buttons */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.manageRoomsBtn}
                      onPress={() => onManageRooms(prop)}
                    >
                      <MaterialIcons name="meeting-room" size={14} color={Colors.primary} />
                      <Text style={styles.manageRoomsBtnText}>Manage Rooms</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => onEditProperty(prop)}
                    >
                      <MaterialIcons name="edit" size={14} color={Colors.onSurfaceVariant} />
                      <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>

                    {isDraft && (
                      <TouchableOpacity
                        style={styles.submitApprovalBtn}
                        onPress={() => handleSubmitForApproval(prop)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <>
                            <MaterialIcons name="publish" size={14} color="#ffffff" />
                            <Text style={styles.submitApprovalBtnText}>Submit</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Floating Add Property Button */}
      {isVerified && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => onNavigate('create_property')}
          activeOpacity={0.8}
        >
          <MaterialIcons name="add" size={24} color="#ffffff" />
          <Text style={styles.fabText}>New Property</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  filterBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    paddingVertical: Spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceLow,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 90,
    gap: Spacing.md,
  },
  propertyCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    ...Shadows.sm,
  },
  imageBox: {
    width: '100%',
    height: 150,
    backgroundColor: Colors.surfaceLow,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgeOverlay: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  cardBody: {
    padding: Spacing.md,
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  propertyType: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondary,
    textTransform: 'uppercase',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  propertyAddress: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef2f2',
    padding: Spacing.xs + 2,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  rejectionText: {
    fontSize: 10.5,
    color: Colors.error,
    fontWeight: '600',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceLow,
  },
  priceLabel: {
    fontSize: 9,
    color: Colors.onSurfaceSubtle,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  roomsCountText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  manageRoomsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(12, 45, 107, 0.08)',
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  manageRoomsBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  editBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  submitApprovalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  submitApprovalBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    ...Shadows.lg,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyBox: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginTop: Spacing.lg,
    gap: Spacing.xs,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.onSurface,
    marginTop: 4,
  },
  emptyDesc: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  createBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lockedBox: {
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  lockedTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400e',
  },
  lockedDesc: {
    fontSize: 12,
    color: '#78350f',
    textAlign: 'center',
    lineHeight: 18,
  },
});
