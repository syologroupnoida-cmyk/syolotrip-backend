import React, { useState, useEffect } from 'react';
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
import {
  PartnerPropertyData,
  HotelRoomData,
  DailyInventoryData,
} from '../types/partner';
import {
  getDailyInventoryApi,
  setDailyInventoryApi,
  getPartnerPropertiesApi,
} from '../services/api';

interface InventoryCalendarScreenProps {
  initialProperty?: PartnerPropertyData;
  initialRoom?: HotelRoomData;
  onBack: () => void;
}

export const InventoryCalendarScreen: React.FC<InventoryCalendarScreenProps> = ({
  initialProperty,
  initialRoom,
  onBack,
}) => {
  const [properties, setProperties] = useState<PartnerPropertyData[]>(
    initialProperty ? [initialProperty] : []
  );
  const [selectedProperty, setSelectedProperty] = useState<PartnerPropertyData | null>(
    initialProperty || null
  );
  const [selectedRoom, setSelectedRoom] = useState<HotelRoomData | null>(
    initialRoom || null
  );
  const [inventoryList, setInventoryList] = useState<DailyInventoryData[]>([]);
  const [loading, setLoading] = useState(false);

  // Set Availability Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [overrideDate, setOverrideDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [availableUnits, setAvailableUnits] = useState('5');
  const [customPrice, setCustomPrice] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load properties if not supplied
  useEffect(() => {
    if (!initialProperty) {
      getPartnerPropertiesApi('APPROVED')
        .then((props) => {
          setProperties(props);
          if (props.length > 0) {
            setSelectedProperty(props[0]);
            if (props[0].rooms && props[0].rooms.length > 0) {
              setSelectedRoom(props[0].rooms[0]);
            }
          }
        })
        .catch(() => {});
    } else if (initialProperty && !initialRoom && initialProperty.rooms && initialProperty.rooms.length > 0) {
      setSelectedRoom(initialProperty.rooms[0]);
    }
  }, [initialProperty]);

  // Load daily inventory when room is selected
  const fetchInventory = async () => {
    if (!selectedProperty || !selectedRoom) return;
    setLoading(true);
    try {
      const data = await getDailyInventoryApi(selectedProperty.id, selectedRoom.id);
      setInventoryList(data);
    } catch (err: any) {
      console.warn('[Inventory] Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [selectedProperty?.id, selectedRoom?.id]);

  const handleSaveOverride = async () => {
    if (!selectedProperty || !selectedRoom) return;
    if (!overrideDate.trim().match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert('Invalid Date', 'Date must be formatted as YYYY-MM-DD (e.g. 2026-11-01)');
      return;
    }
    const units = parseInt(availableUnits, 10);
    const override = customPrice ? parseFloat(customPrice) : null;

    if (isNaN(units) || units < 0) {
      Alert.alert('Validation Error', 'Available units must be 0 or higher.');
      return;
    }

    setSaving(true);
    try {
      await setDailyInventoryApi(selectedProperty.id, selectedRoom.id, {
        date: overrideDate.trim(),
        available_rooms: units,
        price_override: override,
        is_blocked: isBlocked,
      });
      Alert.alert('Success', `Daily inventory updated for ${overrideDate}`);
      setModalVisible(false);
      fetchInventory();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update daily inventory.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header Card */}
      <View style={styles.topCard}>
        <Text style={styles.title}>Daily Inventory &amp; Rate Overrides</Text>
        <Text style={styles.subtitle}>
          Control real-time daily available units, weekend surges, and blackout dates.
        </Text>

        {/* Room Picker Chips */}
        {selectedProperty?.rooms && selectedProperty.rooms.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roomChipsScroll}>
            {selectedProperty.rooms.map((room) => {
              const isSelected = selectedRoom?.id === room.id;
              return (
                <TouchableOpacity
                  key={room.id}
                  style={[styles.roomChip, isSelected && styles.roomChipActive]}
                  onPress={() => setSelectedRoom(room)}
                >
                  <Text style={[styles.roomChipText, isSelected && styles.roomChipTextActive]}>
                    {room.room_type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Main Content */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {!selectedRoom ? (
          <View style={styles.emptyCard}>
            <MaterialIcons name="meeting-room" size={32} color={Colors.onSurfaceSubtle} />
            <Text style={styles.emptyTitle}>Select a Room Category</Text>
            <Text style={styles.emptyDesc}>
              Select a room category above to view and configure date-specific inventory rules.
            </Text>
          </View>
        ) : (
          <View>
            <View style={styles.roomSummaryBanner}>
              <View>
                <Text style={styles.summaryRoomName}>{selectedRoom.room_type}</Text>
                <Text style={styles.summaryMeta}>
                  Default Base Rate: {formatINR(selectedRoom.price_per_night)} · Total Units: {selectedRoom.available_rooms}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.addOverrideBtn}
                onPress={() => {
                  setAvailableUnits(String(selectedRoom.available_rooms));
                  setCustomPrice('');
                  setIsBlocked(false);
                  setModalVisible(true);
                }}
              >
                <MaterialIcons name="add" size={16} color="#ffffff" />
                <Text style={styles.addOverrideBtnText}>Set Date Rule</Text>
              </TouchableOpacity>
            </View>

            {/* List of active daily records */}
            <Text style={styles.sectionHeader}>Active Daily Overrides &amp; Blackouts</Text>

            {loading ? (
              <ActivityIndicator style={{ marginTop: Spacing.xl }} color={Colors.primary} />
            ) : inventoryList.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialIcons name="event-available" size={32} color={Colors.onSurfaceSubtle} />
                <Text style={styles.emptyTitle}>No Daily Overrides Configured</Text>
                <Text style={styles.emptyDesc}>
                  All dates default to {selectedRoom.available_rooms} available units at {formatINR(selectedRoom.price_per_night)}/night. Use "Set Date Rule" to customize specific dates.
                </Text>
              </View>
            ) : (
              <View style={styles.recordsList}>
                {inventoryList.map((item) => (
                  <View key={item.id} style={styles.recordCard}>
                    <View style={styles.recordHeader}>
                      <View style={styles.dateBadge}>
                        <MaterialIcons name="calendar-today" size={14} color={Colors.primary} />
                        <Text style={styles.dateText}>{item.date}</Text>
                      </View>

                      {item.is_blocked ? (
                        <View style={[styles.statusTag, { backgroundColor: '#fee2e2' }]}>
                          <Text style={[styles.statusTagText, { color: Colors.error }]}>BLACKOUT / BLOCKED</Text>
                        </View>
                      ) : (
                        <View style={[styles.statusTag, { backgroundColor: '#dcfce7' }]}>
                          <Text style={[styles.statusTagText, { color: Colors.statusApproved }]}>OPEN FOR BOOKING</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.recordDetailsRow}>
                      <Text style={styles.detailText}>
                        Available: <Text style={{ fontWeight: 'bold' }}>{item.available_rooms} Units</Text>
                      </Text>

                      <Text style={styles.detailText}>
                        Rate: <Text style={{ fontWeight: 'bold', color: Colors.secondaryDark }}>
                          {item.price_override !== null && item.price_override !== undefined
                            ? `${formatINR(item.price_override)} (Custom)`
                            : `${formatINR(selectedRoom.price_per_night)} (Default)`}
                        </Text>
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Set Date Override Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Daily Rule</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={20} color={Colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: Spacing.md }}>
              <Text style={styles.modalSub}>
                Configuring for {selectedRoom?.room_type}
              </Text>

              <Text style={styles.inputLabel}>Target Date (YYYY-MM-DD) *</Text>
              <TextInput
                style={styles.input}
                placeholder="2026-11-15"
                placeholderTextColor={Colors.onSurfaceSubtle}
                value={overrideDate}
                onChangeText={setOverrideDate}
              />

              <Text style={styles.inputLabel}>Available Units for Date *</Text>
              <TextInput
                style={styles.input}
                placeholder="5"
                placeholderTextColor={Colors.onSurfaceSubtle}
                keyboardType="numeric"
                value={availableUnits}
                onChangeText={setAvailableUnits}
              />

              <Text style={styles.inputLabel}>Price Override (Leave empty for default rate)</Text>
              <TextInput
                style={styles.input}
                placeholder={`Default: ${selectedRoom?.price_per_night || 3000}`}
                placeholderTextColor={Colors.onSurfaceSubtle}
                keyboardType="numeric"
                value={customPrice}
                onChangeText={setCustomPrice}
              />

              <TouchableOpacity
                style={[styles.blockToggle, isBlocked && styles.blockToggleActive]}
                onPress={() => setIsBlocked(!isBlocked)}
              >
                <MaterialIcons
                  name={isBlocked ? 'check-box' : 'check-box-outline-blank'}
                  size={20}
                  color={isBlocked ? Colors.error : Colors.onSurfaceVariant}
                />
                <Text style={styles.blockToggleText}>
                  Block this date (Disallow guest bookings)
                </Text>
              </TouchableOpacity>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSaveOverride}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Rule</Text>
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
  topCard: {
    backgroundColor: '#ffffff',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  roomChipsScroll: {
    flexDirection: 'row',
  },
  roomChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceLow,
    marginRight: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  roomChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roomChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  roomChipTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  roomSummaryBanner: {
    backgroundColor: '#ffffff',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    ...Shadows.sm,
  },
  summaryRoomName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  summaryMeta: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  addOverrideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  addOverrideBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.onSurface,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  recordsList: {
    gap: Spacing.xs,
  },
  recordCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusTagText: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  recordDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceLow,
  },
  detailText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  emptyDesc: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 16,
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
  modalSub: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
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
  blockToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.surfaceLow,
    borderRadius: BorderRadius.md,
  },
  blockToggleActive: {
    backgroundColor: '#fee2e2',
  },
  blockToggleText: {
    fontSize: 11,
    fontWeight: '600',
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
