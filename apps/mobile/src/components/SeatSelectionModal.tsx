import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../theme/theme';

interface SeatSelectionModalProps {
  visible: boolean;
  currentSeat: string;
  onSelectSeat: (seat: string) => void;
  onClose: () => void;
}

export const SeatSelectionModal: React.FC<SeatSelectionModalProps> = ({
  visible,
  currentSeat,
  onSelectSeat,
  onClose,
}) => {
  const [selectedSeat, setSelectedSeat] = useState(currentSeat);

  const rows = [
    { rowNum: 21, seats: ['21A', '21B', '21C', '21D', '21E', '21F'] },
    { rowNum: 22, seats: ['22A', '22B', '22C', '22D', '22E', '22F'] },
    { rowNum: 23, seats: ['23A', '23B', '23C', '23D', '23E', '23F'] },
    { rowNum: 24, seats: ['24A', '24B', '24C', '24D', '24E', '24F'] },
    { rowNum: 25, seats: ['25A', '25B', '25C', '25D', '25E', '25F'] },
  ];

  const occupiedSeats = ['21B', '21D', '22A', '22E', '23C', '24B', '25D'];

  const handleConfirm = () => {
    onSelectSeat(selectedSeat);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Select Your Seat</Text>
              <Text style={styles.subtitle}>Boeing 787-9 • Economy Cabin</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={22} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Seat Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.seatLegendBox, styles.seatAvailable]} />
              <Text style={styles.legendText}>Available</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.seatLegendBox, styles.seatSelected]} />
              <Text style={styles.legendText}>Selected</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.seatLegendBox, styles.seatOccupied]} />
              <Text style={styles.legendText}>Occupied</Text>
            </View>
          </View>

          <ScrollView style={styles.aircraftBody} contentContainerStyle={styles.aircraftContent}>
            <View style={styles.fuselageHeader}>
              <Text style={styles.fuselageText}>Forward Aircraft Section</Text>
            </View>

            {/* Column labels */}
            <View style={styles.rowWrapper}>
              <View style={styles.seatGroup}>
                <Text style={styles.colLabel}>A</Text>
                <Text style={styles.colLabel}>B</Text>
                <Text style={styles.colLabel}>C</Text>
              </View>
              <View style={styles.aisle} />
              <View style={styles.seatGroup}>
                <Text style={styles.colLabel}>D</Text>
                <Text style={styles.colLabel}>E</Text>
                <Text style={styles.colLabel}>F</Text>
              </View>
            </View>

            {rows.map((row) => (
              <View key={row.rowNum} style={styles.rowWrapper}>
                {/* Left trio: A, B, C */}
                <View style={styles.seatGroup}>
                  {row.seats.slice(0, 3).map((seatId) => {
                    const isOccupied = occupiedSeats.includes(seatId);
                    const isSelected = selectedSeat === seatId;
                    return (
                      <TouchableOpacity
                        key={seatId}
                        disabled={isOccupied}
                        onPress={() => setSelectedSeat(seatId)}
                        style={[
                          styles.seatBox,
                          isOccupied && styles.seatOccupied,
                          isSelected && styles.seatSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.seatText,
                            isSelected && styles.seatTextSelected,
                            isOccupied && styles.seatTextOccupied,
                          ]}
                        >
                          {seatId.slice(-1)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Aisle with Row Number */}
                <View style={styles.aisle}>
                  <Text style={styles.rowNumText}>{row.rowNum}</Text>
                </View>

                {/* Right trio: D, E, F */}
                <View style={styles.seatGroup}>
                  {row.seats.slice(3, 6).map((seatId) => {
                    const isOccupied = occupiedSeats.includes(seatId);
                    const isSelected = selectedSeat === seatId;
                    return (
                      <TouchableOpacity
                        key={seatId}
                        disabled={isOccupied}
                        onPress={() => setSelectedSeat(seatId)}
                        style={[
                          styles.seatBox,
                          isOccupied && styles.seatOccupied,
                          isSelected && styles.seatSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.seatText,
                            isSelected && styles.seatTextSelected,
                            isOccupied && styles.seatTextOccupied,
                          ]}
                        >
                          {seatId.slice(-1)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Confirm Button */}
          <View style={styles.footer}>
            <View>
              <Text style={styles.footerLabel}>Selected Seat</Text>
              <Text style={styles.footerSeat}>{selectedSeat} (Window / Forward)</Text>
            </View>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>Save Seat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 27, 46, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '80%',
    ...Shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  closeBtn: {
    padding: 4,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  seatLegendBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  aircraftBody: {
    maxHeight: 280,
  },
  aircraftContent: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  fuselageHeader: {
    marginBottom: Spacing.sm,
  },
  fuselageText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  rowWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  seatGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  aisle: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowNumText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  colLabel: {
    width: 34,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
  },
  seatBox: {
    width: 34,
    height: 38,
    borderRadius: 6,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  seatAvailable: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderColor: Colors.outlineVariant,
  },
  seatSelected: {
    backgroundColor: Colors.primaryContainer,
    borderColor: Colors.primary,
  },
  seatOccupied: {
    backgroundColor: Colors.surfaceDim,
    borderColor: 'transparent',
    opacity: 0.4,
  },
  seatText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  seatTextSelected: {
    color: '#ffffff',
  },
  seatTextOccupied: {
    color: Colors.outline,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainerLow,
    marginTop: Spacing.sm,
  },
  footerLabel: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  footerSeat: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  confirmBtn: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
