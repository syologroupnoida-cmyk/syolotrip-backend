import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows, formatINR } from '../theme/theme';
import { PartnerPropertyData } from '../types/partner';
import { getPartnerPropertyByIdApi, submitPropertyForApprovalApi } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

interface PropertyDetailScreenProps {
  propertyId: string;
  onEditProperty: (prop: PartnerPropertyData) => void;
  onManageRooms: (prop: PartnerPropertyData) => void;
  onManageInventory: (prop: PartnerPropertyData) => void;
  onBack: () => void;
}

export const PropertyDetailScreen: React.FC<PropertyDetailScreenProps> = ({
  propertyId,
  onEditProperty,
  onManageRooms,
  onManageInventory,
  onBack,
}) => {
  const [property, setProperty] = useState<PartnerPropertyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchProperty = async () => {
    try {
      const data = await getPartnerPropertyByIdApi(propertyId);
      setProperty(data);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load property details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperty();
  }, [propertyId]);

  const handleSubmit = async () => {
    if (!property) return;
    if (!property.rooms || property.rooms.length === 0) {
      Alert.alert('Room Category Required', 'Add at least one room category before submitting for approval.');
      return;
    }

    Alert.alert(
      'Submit Listing for Verification',
      'Are you sure you want to submit this listing for administrative compliance review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Submission',
          onPress: async () => {
            setSubmitting(true);
            try {
              const updated = await submitPropertyForApprovalApi(property.id);
              setProperty(updated);
              Alert.alert('Success', 'Property submitted for administrator approval.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Submission failed.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.center}>
        <Text>Property not found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isDraft = property.publication_status === 'DRAFT';
  const isRejected = property.publication_status === 'REJECTED';
  const isApproved = property.publication_status === 'APPROVED';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Property Hero Image */}
      <View style={styles.heroBox}>
        <Image
          source={{
            uri:
              property.featured_image ||
              'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
          }}
          style={styles.heroImage}
        />
        <View style={styles.heroOverlayBadge}>
          <StatusBadge status={property.publication_status} />
        </View>
      </View>

      {/* Main Info Card */}
      <View style={styles.card}>
        <View style={styles.categoryRow}>
          <Text style={styles.categoryText}>
            {property.property_type === 'HOMESTAY' ? 'Homestay / Villa' : 'Hotel / Resort'} · {property.city}
          </Text>
          <View style={styles.starsRow}>
            <MaterialIcons name="star" size={14} color="#f59e0b" />
            <Text style={styles.starText}>{property.star_rating} Star</Text>
          </View>
        </View>

        <Text style={styles.title}>{property.name}</Text>
        <Text style={styles.address}>
          {property.address}, {property.city}, {property.country}
        </Text>

        {isRejected && property.admin_rejection_reason && (
          <View style={styles.rejectionNotice}>
            <MaterialIcons name="report" size={18} color={Colors.error} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rejectionTitle}>Admin Feedback / Rejection Reason</Text>
              <Text style={styles.rejectionReason}>{property.admin_rejection_reason}</Text>
            </View>
          </View>
        )}

        {/* Pricing / Room stats bar */}
        <View style={styles.statsBar}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Starting Base Rate</Text>
            <Text style={styles.statVal}>{formatINR(property.starting_price)}/night</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Room Categories</Text>
            <Text style={styles.statVal}>{property.rooms?.length || 0} Categories</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Status</Text>
            <Text style={styles.statVal}>{property.publication_status.replace(/_/g, ' ')}</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <Text style={styles.overviewText}>{property.overview}</Text>

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesWrap}>
              {property.amenities.map((a, i) => (
                <View key={i} style={styles.amenityChip}>
                  <MaterialIcons name="check" size={12} color={Colors.statusApproved} />
                  <Text style={styles.amenityChipText}>{a}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Room Categories Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Room Categories ({property.rooms?.length || 0})</Text>
          <TouchableOpacity onPress={() => onManageRooms(property)}>
            <Text style={styles.manageLinkText}>Manage Rooms</Text>
          </TouchableOpacity>
        </View>

        {(!property.rooms || property.rooms.length === 0) ? (
          <View style={styles.noRoomsBox}>
            <MaterialIcons name="meeting-room" size={24} color={Colors.onSurfaceSubtle} />
            <Text style={styles.noRoomsText}>No room categories added yet.</Text>
            <TouchableOpacity
              style={styles.addRoomBtn}
              onPress={() => onManageRooms(property)}
            >
              <Text style={styles.addRoomBtnText}>+ Add First Room Category</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.roomsList}>
            {property.rooms.map((room) => (
              <View key={room.id} style={styles.roomCard}>
                <View style={styles.roomHeader}>
                  <Text style={styles.roomType}>{room.room_type}</Text>
                  <Text style={styles.roomPrice}>{formatINR(room.price_per_night)}/night</Text>
                </View>
                <Text style={styles.roomMeta}>
                  {room.bed_type} · Max Occupancy: {room.max_occupancy} Guests · Available Rooms: {room.available_rooms}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons Toolbar */}
        <View style={styles.actionToolbar}>
          <TouchableOpacity
            style={styles.toolbarBtn}
            onPress={() => onEditProperty(property)}
          >
            <MaterialIcons name="edit" size={16} color={Colors.primary} />
            <Text style={styles.toolbarBtnText}>Edit Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolbarBtn}
            onPress={() => onManageInventory(property)}
          >
            <MaterialIcons name="event-available" size={16} color={Colors.secondary} />
            <Text style={[styles.toolbarBtnText, { color: Colors.secondary }]}>Daily Rates</Text>
          </TouchableOpacity>

          {isDraft && (
            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <MaterialIcons name="publish" size={16} color="#ffffff" />
                  <Text style={styles.primaryActionBtnText}>Submit Approval</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: Spacing.xxl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  heroBox: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlayBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
  },
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: Spacing.md,
    marginTop: -Spacing.lg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    ...Shadows.md,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondary,
    textTransform: 'uppercase',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  starText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.onSurface,
    marginTop: 4,
  },
  address: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  rejectionNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  rejectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.error,
  },
  rejectionReason: {
    fontSize: 11,
    color: '#7f1d1d',
    marginTop: 2,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceLow,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
    justifyContent: 'space-between',
  },
  statCol: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.onSurfaceSubtle,
    textTransform: 'uppercase',
  },
  statVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.onSurface,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.onSurface,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  overviewText: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
  },
  amenitiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: 4,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceLow,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  amenityChipText: {
    fontSize: 11,
    color: Colors.onSurface,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  manageLinkText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  noRoomsBox: {
    backgroundColor: Colors.surfaceLow,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  noRoomsText: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  addRoomBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    marginTop: 4,
  },
  addRoomBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  roomsList: {
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  roomCard: {
    backgroundColor: Colors.surfaceLow,
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  roomPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  roomMeta: {
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  actionToolbar: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceLow,
  },
  toolbarBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 9,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  toolbarBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  primaryActionBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.secondary,
    paddingVertical: 9,
    borderRadius: BorderRadius.full,
  },
  primaryActionBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  backBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  backBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
