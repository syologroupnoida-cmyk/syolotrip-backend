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
import { Colors, Spacing, BorderRadius, Shadows, formatINR } from '../theme/theme';
import { PartnerPropertyData, HotelRoomData } from '../types/partner';
import {
  addPropertyRoomApi,
  updatePropertyRoomApi,
  deletePropertyRoomApi,
  getPartnerPropertyByIdApi,
} from '../services/api';

interface ManageRoomsScreenProps {
  property: PartnerPropertyData;
  onOpenInventory: (property: PartnerPropertyData, room?: HotelRoomData) => void;
  onBack: () => void;
}

export const ManageRoomsScreen: React.FC<ManageRoomsScreenProps> = ({
  property,
  onOpenInventory,
  onBack,
}) => {
  const [rooms, setRooms] = useState<HotelRoomData[]>(property.rooms || []);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoom, setEditingRoom] = useState<HotelRoomData | null>(null);

  // Modal Form State
  const [roomType, setRoomType] = useState('');
  const [bedType, setBedType] = useState('King Bed');
  const [maxOccupancy, setMaxOccupancy] = useState('2');
  const [pricePerNight, setPricePerNight] = useState('3000');
  const [availableRooms, setAvailableRooms] = useState('5');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingRoom(null);
    setRoomType('');
    setBedType('King Bed');
    setMaxOccupancy('2');
    setPricePerNight('3000');
    setAvailableRooms('5');
    setModalVisible(true);
  };

  const openEditModal = (r: HotelRoomData) => {
    setEditingRoom(r);
    setRoomType(r.room_type);
    setBedType(r.bed_type);
    setMaxOccupancy(String(r.max_occupancy));
    setPricePerNight(String(r.price_per_night));
    setAvailableRooms(String(r.available_rooms));
    setModalVisible(true);
  };

  const handleSaveRoom = async () => {
    if (!roomType.trim()) {
      Alert.alert('Validation Error', 'Room category name is required.');
      return;
    }
    const price = parseFloat(pricePerNight);
    const capacity = parseInt(maxOccupancy, 10);
    const qty = parseInt(availableRooms, 10);

    if (isNaN(price) || price <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid price per night.');
      return;
    }

    setSaving(true);
    try {
      if (editingRoom) {
        const updated = await updatePropertyRoomApi(property.id, editingRoom.id, {
          room_type: roomType.trim(),
          bed_type: bedType.trim(),
          max_occupancy: capacity || 2,
          price_per_night: price,
          available_rooms: isNaN(qty) ? 1 : qty,
        });
        setRooms(rooms.map((r) => (r.id === updated.id ? updated : r)));
        Alert.alert('Updated', 'Room category details saved.');
      } else {
        const created = await addPropertyRoomApi(property.id, {
          room_type: roomType.trim(),
          bed_type: bedType.trim(),
          max_occupancy: capacity || 2,
          price_per_night: price,
          available_rooms: isNaN(qty) ? 5 : qty,
        });
        setRooms([...rooms, created]);
        Alert.alert('Added', 'New room category added to listing.');
      }
      setModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save room category.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoom = (r: HotelRoomData) => {
    Alert.alert(
      'Delete Room Category',
      `Are you sure you want to delete "${r.room_type}"? This will permanently remove its inventory records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(r.id);
            try {
              await deletePropertyRoomApi(property.id, r.id);
              setRooms(rooms.filter((item) => item.id !== r.id));
              Alert.alert('Deleted', 'Room category removed.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete room.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Subheader */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{property.name}</Text>
          <Text style={styles.headerSub}>Manage Room Types, Capacities &amp; Base Rates</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <MaterialIcons name="add" size={16} color="#ffffff" />
          <Text style={styles.addBtnText}>Add Room</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {rooms.length === 0 ? (
          <View style={styles.emptyBox}>
            <MaterialIcons name="meeting-room" size={40} color={Colors.onSurfaceSubtle} />
            <Text style={styles.emptyTitle}>No Room Categories</Text>
            <Text style={styles.emptyDesc}>
              A listing must have at least one room category (e.g. Deluxe Room, Executive Suite, 2BHK Chalet) to be submitted for admin approval and receive guest bookings.
            </Text>
            <TouchableOpacity style={styles.addFirstBtn} onPress={openAddModal}>
              <Text style={styles.addFirstBtnText}>+ Add Room Category</Text>
            </TouchableOpacity>
          </View>
        ) : (
          rooms.map((room) => {
            const isDeleting = deletingId === room.id;
            return (
              <View key={room.id} style={styles.roomCard}>
                <View style={styles.cardTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.roomName}>{room.room_type}</Text>
                    <Text style={styles.roomSpecs}>
                      {room.bed_type} · Max Occupancy: {room.max_occupancy} Adults
                    </Text>
                  </View>
                  <Text style={styles.roomPrice}>{formatINR(room.price_per_night)}/night</Text>
                </View>

                <View style={styles.capacityBadge}>
                  <MaterialIcons name="check-circle" size={12} color={Colors.statusApproved} />
                  <Text style={styles.capacityText}>
                    {room.available_rooms} Units Total Allocated Capacity
                  </Text>
                </View>

                {/* Actions Row */}
                <View style={styles.roomActionsRow}>
                  <TouchableOpacity
                    style={styles.inventoryBtn}
                    onPress={() => onOpenInventory(property, room)}
                  >
                    <MaterialIcons name="calendar-month" size={14} color={Colors.secondary} />
                    <Text style={styles.inventoryBtnText}>Daily Inventory &amp; Overrides</Text>
                  </TouchableOpacity>

                  <View style={styles.secondaryActions}>
                    <TouchableOpacity
                      style={styles.iconAction}
                      onPress={() => openEditModal(room)}
                    >
                      <MaterialIcons name="edit" size={16} color={Colors.onSurfaceVariant} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.iconAction}
                      onPress={() => handleDeleteRoom(room)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <ActivityIndicator size="small" color={Colors.error} />
                      ) : (
                        <MaterialIcons name="delete" size={16} color={Colors.error} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add / Edit Room Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingRoom ? 'Edit Room Category' : 'New Room Category'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={20} color={Colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: Spacing.md }}>
              <Text style={styles.inputLabel}>Room Category Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Deluxe Balcony Suite"
                placeholderTextColor={Colors.onSurfaceSubtle}
                value={roomType}
                onChangeText={setRoomType}
              />

              <Text style={styles.inputLabel}>Bed Configuration</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 1 King Bed or 2 Twin Beds"
                placeholderTextColor={Colors.onSurfaceSubtle}
                value={bedType}
                onChangeText={setBedType}
              />

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Max Occupancy (Guests)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="2"
                    placeholderTextColor={Colors.onSurfaceSubtle}
                    keyboardType="numeric"
                    value={maxOccupancy}
                    onChangeText={setMaxOccupancy}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Available Units (Qty)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="5"
                    placeholderTextColor={Colors.onSurfaceSubtle}
                    keyboardType="numeric"
                    value={availableRooms}
                    onChangeText={setAvailableRooms}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Base Rate Per Night (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="3000"
                placeholderTextColor={Colors.onSurfaceSubtle}
                keyboardType="numeric"
                value={pricePerNight}
                onChangeText={setPricePerNight}
              />

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={handleSaveRoom}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.modalSaveBtnText}>
                      {editingRoom ? 'Update Category' : 'Add Category'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  headerSub: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyBox: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  emptyDesc: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
  addFirstBtn: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  addFirstBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  roomCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    ...Shadows.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  roomName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  roomSpecs: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  roomPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceLow,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs + 2,
  },
  capacityText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  roomActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceLow,
  },
  inventoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inventoryBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondary,
  },
  secondaryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  iconAction: {
    padding: 6,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceLow,
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
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  modalCancelBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 9,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  modalCancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  modalSaveBtn: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 9,
    borderRadius: BorderRadius.full,
  },
  modalSaveBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
