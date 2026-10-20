import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../theme/theme';

interface BookingSuccessModalProps {
  visible: boolean;
  bookingRef: string;
  totalAmount: string;
  onDone: () => void;
  onViewTrips: () => void;
}

export const BookingSuccessModal: React.FC<BookingSuccessModalProps> = ({
  visible,
  bookingRef,
  totalAmount,
  onDone,
  onViewTrips,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDone}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Success Icon Circle */}
          <View style={styles.successBadge}>
            <MaterialIcons name="check" size={36} color="#ffffff" />
          </View>

          <Text style={styles.title}>Booking Confirmed!</Text>
          <Text style={styles.subtitle}>
            Your Tokyo Discovery combo has been booked and ticketed successfully.
          </Text>

          {/* Ticket voucher stub */}
          <View style={styles.ticketStub}>
            <View style={styles.ticketRow}>
              <Text style={styles.ticketLabel}>Booking Reference</Text>
              <Text style={styles.ticketValueBold}>{bookingRef}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.ticketRow}>
              <Text style={styles.ticketLabel}>Route</Text>
              <Text style={styles.ticketValue}>SFO ➔ HND (Tokyo)</Text>
            </View>
            <View style={styles.ticketRow}>
              <Text style={styles.ticketLabel}>Hotel Stay</Text>
              <Text style={styles.ticketValue}>Hotel Gracery (7 Nights)</Text>
            </View>
            <View style={styles.ticketRow}>
              <Text style={styles.ticketLabel}>Total Charged</Text>
              <Text style={styles.ticketValuePrice}>{totalAmount}</Text>
            </View>
          </View>

          {/* Eco badge */}
          <View style={styles.ecoRow}>
            <MaterialIcons name="eco" size={16} color={Colors.tertiary} />
            <Text style={styles.ecoText}>100% Carbon-Offset Flight Verified</Text>
          </View>

          {/* Action buttons */}
          <TouchableOpacity style={styles.primaryBtn} onPress={onViewTrips} activeOpacity={0.8}>
            <MaterialIcons name="luggage" size={18} color="#ffffff" />
            <Text style={styles.primaryBtnText}>View in My Trips</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={onDone} activeOpacity={0.7}>
            <Text style={styles.secondaryBtnText}>Back to Explore</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 27, 46, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.lg,
  },
  successBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.onSurface,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  ticketStub: {
    width: '100%',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  divider: {
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 0.8,
    borderColor: Colors.outlineVariant,
    marginVertical: Spacing.sm,
  },
  ticketLabel: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  ticketValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  ticketValueBold: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  ticketValuePrice: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.secondaryContainer,
  },
  ecoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: Spacing.md,
  },
  ecoText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.tertiary,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: Colors.secondaryContainer,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...Shadows.md,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    marginTop: Spacing.sm,
    paddingVertical: 8,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
});
