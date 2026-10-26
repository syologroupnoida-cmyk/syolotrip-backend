import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows, formatINR } from '../theme/theme';
import {
  MobileRazorpayOrder,
  MobileRazorpayVerifyResult,
  testAuthorizeRazorpayMobileApi,
  verifyRazorpayPaymentMobileApi,
} from '../services/api';

interface RazorpayModalProps {
  visible: boolean;
  orderData: MobileRazorpayOrder | null;
  guestToken?: string;
  onSuccess: (result: MobileRazorpayVerifyResult) => void;
  onFailure: (errorMessage: string) => void;
  onDismiss: () => void;
}

export const RazorpayModal: React.FC<RazorpayModalProps> = ({
  visible,
  orderData,
  guestToken,
  onSuccess,
  onFailure,
  onDismiss,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'CARD' | 'UPI' | 'NETBANKING'>('CARD');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!orderData) return null;

  const payableAmountRupees = Math.round(orderData.amount / 100);

  const handlePay = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      // 1. Mobile test authorization (generates official HMAC signature on backend test sandbox)
      const authResult = await testAuthorizeRazorpayMobileApi({
        booking_id: orderData.booking_id,
        razorpay_order_id: orderData.order_id,
        guest_token: guestToken,
      });

      // 2. Official server-side signature verification & atomic database confirmation
      const verifyResult = await verifyRazorpayPaymentMobileApi({
        booking_id: orderData.booking_id,
        razorpay_order_id: authResult.razorpay_order_id,
        razorpay_payment_id: authResult.razorpay_payment_id,
        razorpay_signature: authResult.razorpay_signature,
        guest_token: guestToken,
      });

      if (verifyResult.status === 'SUCCESS' || verifyResult.success) {
        onSuccess(verifyResult);
      } else {
        const msg = verifyResult.message || 'Payment verification failed on the server.';
        setErrorMessage(msg);
        onFailure(msg);
      }
    } catch (err: any) {
      const msg = err.message || 'Payment authorization or verification error.';
      setErrorMessage(msg);
      onFailure(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = () => {
    const msg = 'Payment declined (simulated in Razorpay Test Mode). Booking remains pending.';
    setErrorMessage(msg);
    onFailure(msg);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.shieldBadge}>
                <MaterialIcons name="security" size={20} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Razorpay Test Mode</Text>
                <Text style={styles.headerSubtitle}>Safe Sandbox Checkout</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onDismiss}
              disabled={isProcessing}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <MaterialIcons name="close" size={20} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Amount banner */}
          <View style={styles.amountBanner}>
            <View>
              <Text style={styles.amountLabel}>Payable Amount</Text>
              <Text style={styles.amountValue}>{formatINR(payableAmountRupees)}</Text>
            </View>
            <View style={styles.orderIdBadge}>
              <Text style={styles.orderIdText}>{orderData.order_id}</Text>
              <Text style={styles.refText}>Ref: {orderData.booking_reference}</Text>
            </View>
          </View>

          {/* Error notice if present */}
          {errorMessage && (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={16} color="#b3261e" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <ScrollView style={styles.methodScroll} showsVerticalScrollIndicator={false}>
            {/* Payment method selector tabs */}
            <Text style={styles.sectionTitle}>SELECT TEST PAYMENT METHOD</Text>
            <View style={styles.methodTabs}>
              <TouchableOpacity
                style={[styles.methodTab, selectedMethod === 'CARD' && styles.methodTabActive]}
                onPress={() => setSelectedMethod('CARD')}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name="credit-card"
                  size={18}
                  color={selectedMethod === 'CARD' ? Colors.primary : Colors.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.methodTabText,
                    selectedMethod === 'CARD' && styles.methodTabTextActive,
                  ]}
                >
                  Test Card
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.methodTab, selectedMethod === 'UPI' && styles.methodTabActive]}
                onPress={() => setSelectedMethod('UPI')}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name="account-balance-wallet"
                  size={18}
                  color={selectedMethod === 'UPI' ? Colors.primary : Colors.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.methodTabText,
                    selectedMethod === 'UPI' && styles.methodTabTextActive,
                  ]}
                >
                  Test UPI
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.methodTab, selectedMethod === 'NETBANKING' && styles.methodTabActive]}
                onPress={() => setSelectedMethod('NETBANKING')}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name="account-balance"
                  size={18}
                  color={selectedMethod === 'NETBANKING' ? Colors.primary : Colors.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.methodTabText,
                    selectedMethod === 'NETBANKING' && styles.methodTabTextActive,
                  ]}
                >
                  Netbanking
                </Text>
              </TouchableOpacity>
            </View>

            {/* Method Details Card */}
            {selectedMethod === 'CARD' && (
              <View style={styles.detailsBox}>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Card Number:</Text>
                  <Text style={styles.detailsValueBold}>4111 2222 3333 4444</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Expiry & CVV:</Text>
                  <Text style={styles.detailsValue}>12 / 28 • CVV 123</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Test OTP:</Text>
                  <Text style={styles.detailsValue}>123456</Text>
                </View>
              </View>
            )}

            {selectedMethod === 'UPI' && (
              <View style={styles.detailsBox}>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Test VPA / UPI ID:</Text>
                  <Text style={styles.detailsValueBold}>success@razorpay</Text>
                </View>
                <Text style={styles.detailsHint}>
                  Simulates instant UPI app authorization and verified server callback.
                </Text>
              </View>
            )}

            {selectedMethod === 'NETBANKING' && (
              <View style={styles.detailsBox}>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Test Bank:</Text>
                  <Text style={styles.detailsValueBold}>HDFC / SBI / ICICI</Text>
                </View>
                <Text style={styles.detailsHint}>
                  Simulates successful netbanking authentication in Razorpay sandbox.
                </Text>
              </View>
            )}

            {/* Test Security Note */}
            <View style={styles.sandboxNote}>
              <MaterialIcons name="info" size={14} color={Colors.primary} />
              <Text style={styles.sandboxNoteText}>
                Official Razorpay Test Mode: No real funds debited. Server signature verification is enforced.
              </Text>
            </View>
          </ScrollView>

          {/* Action buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.payBtn, isProcessing && styles.btnDisabled]}
              onPress={handlePay}
              disabled={isProcessing}
              activeOpacity={0.85}
            >
              {isProcessing ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <MaterialIcons name="lock" size={16} color="#ffffff" />
                  <Text style={styles.payBtnText}>Pay {formatINR(payableAmountRupees)} (Test Mode)</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.subActionsRow}>
              <TouchableOpacity
                style={styles.declineBtn}
                onPress={handleDecline}
                disabled={isProcessing}
                activeOpacity={0.7}
              >
                <Text style={styles.declineBtnText}>Simulate Failure</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dismissBtn}
                onPress={onDismiss}
                disabled={isProcessing}
                activeOpacity={0.7}
              >
                <Text style={styles.dismissBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 27, 51, 0.65)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '85%',
    ...Shadows.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  shieldBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 98, 125, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.3,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLow,
  },
  amountBanner: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 98, 125, 0.15)',
  },
  amountLabel: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  amountValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
  orderIdBadge: {
    alignItems: 'flex-end',
  },
  orderIdText: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.onSurface,
  },
  refText: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fde8e8',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    gap: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#b3261e',
    flex: 1,
  },
  methodScroll: {
    maxHeight: 220,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.6,
    marginBottom: Spacing.xs,
  },
  methodTabs: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    gap: 4,
  },
  methodTabActive: {
    backgroundColor: 'rgba(0, 98, 125, 0.08)',
    borderColor: Colors.primary,
  },
  methodTabText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  methodTabTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  detailsBox: {
    backgroundColor: '#f8fafc',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(203, 213, 225, 0.6)',
    gap: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailsLabel: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  detailsValueBold: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
    fontFamily: 'monospace',
  },
  detailsValue: {
    fontSize: 12,
    color: Colors.onSurface,
  },
  detailsHint: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
    fontStyle: 'italic',
  },
  sandboxNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
    paddingVertical: 4,
  },
  sandboxNoteText: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  actionsContainer: {
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  payBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...Shadows.md,
  },
  payBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  subActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  declineBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  declineBtnText: {
    fontSize: 12,
    color: '#b3261e',
    fontWeight: '600',
  },
  dismissBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dismissBtnText: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
});
