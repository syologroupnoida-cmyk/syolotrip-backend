import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing } from '../theme/theme';
import {
  getWalletBalancesMobileApi,
  getWalletLedgerMobileApi,
  MobileWalletBalances,
  MobileWalletLedgerEntry,
} from '../services/api';

interface WalletModalProps {
  visible: boolean;
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ visible, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState<MobileWalletBalances | null>(null);
  const [ledger, setLedger] = useState<MobileWalletLedgerEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

  const loadWalletData = async () => {
    setLoading(true);
    try {
      const [bal, led] = await Promise.all([
        getWalletBalancesMobileApi(),
        getWalletLedgerMobileApi(30),
      ]);
      setBalances(bal);
      setLedger(led);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadWalletData();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.walletIconCircle}>
              <MaterialIcons name="account-balance-wallet" size={20} color="#059669" />
            </View>
            <div>
              <Text style={styles.headerTitle}>Syolo Wallet</Text>
              <Text style={styles.headerSub}>Dual Stored-Value &amp; Rewards</Text>
            </div>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <MaterialIcons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#059669" />
            <Text style={styles.loadingText}>Fetching your wallet balance...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Total Balance Card */}
            <View style={styles.totalCard}>
              <View style={styles.totalCardHeader}>
                <Text style={styles.totalCardLabel}>TOTAL SPENDABLE BALANCE</Text>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>
                    {balances?.isFrozen ? 'FROZEN' : 'ACTIVE'}
                  </Text>
                </View>
              </View>

              <Text style={styles.totalCardValue}>
                ₹{balances?.totalSpendable?.toLocaleString('en-IN') || '0'}
              </Text>
              <Text style={styles.totalCardSub}>
                Combined cash funds and promotional rewards automatically applied at checkout.
              </Text>
            </View>

            {/* Dual Sub-Wallets Grid */}
            <View style={styles.subWalletsRow}>
              {/* Cash Wallet */}
              <View style={[styles.subWalletBox, { borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' }]}>
                <View style={styles.subWalletHeader}>
                  <Text style={[styles.subWalletTitle, { color: '#166534' }]}>CASH WALLET</Text>
                  <MaterialIcons name="payments" size={16} color="#16a34a" />
                </View>
                <Text style={[styles.subWalletAmount, { color: '#15803d' }]}>
                  ₹{balances?.cashBalance?.toLocaleString('en-IN') || '0'}
                </Text>
                <Text style={styles.subWalletDesc}>
                  100% usable on all bookings. Never expires.
                </Text>
              </View>

              {/* Promotional Wallet */}
              <View style={[styles.subWalletBox, { borderColor: '#fde68a', backgroundColor: '#fffbeb' }]}>
                <View style={styles.subWalletHeader}>
                  <Text style={[styles.subWalletTitle, { color: '#92400e' }]}>PROMOTIONAL</Text>
                  <MaterialIcons name="stars" size={16} color="#d97706" />
                </View>
                <Text style={[styles.subWalletAmount, { color: '#b45309' }]}>
                  ₹{balances?.promotionalBalance?.toLocaleString('en-IN') || '0'}
                </Text>
                <Text style={styles.subWalletDesc}>
                  Earned via cashback. Automatically redeemed FIFO.
                </Text>
              </View>
            </View>

            {/* Segmented Tab Switcher */}
            <View style={styles.tabSwitcher}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'overview' && styles.tabBtnActive]}
                onPress={() => setActiveTab('overview')}
              >
                <Text style={[styles.tabBtnText, activeTab === 'overview' && styles.tabBtnTextActive]}>
                  Active Rewards ({balances?.eligibleLots?.length || 0})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
                onPress={() => setActiveTab('history')}
              >
                <Text style={[styles.tabBtnText, activeTab === 'history' && styles.tabBtnTextActive]}>
                  Transactions ({ledger.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* TAB 1: Rewards Overview */}
            {activeTab === 'overview' && (
              <View style={styles.tabContent}>
                {balances?.eligibleLots && balances.eligibleLots.length > 0 ? (
                  balances.eligibleLots.map((lot) => (
                    <View key={lot.id} style={styles.lotCard}>
                      <View style={styles.lotHeader}>
                        <Text style={styles.lotName}>{lot.lot_name}</Text>
                        <Text style={styles.lotAmount}>
                          ₹{lot.remaining_balance?.toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View style={styles.lotFooter}>
                        <View style={styles.expiryRow}>
                          <MaterialIcons name="schedule" size={14} color="#64748b" />
                          <Text style={styles.expiryText}>
                            Expires: {new Date(lot.expiry_date).toLocaleDateString()}
                          </Text>
                        </View>
                        {lot.allowed_services && (
                          <Text style={styles.servicesPill}>
                            {lot.allowed_services.join(', ')}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <MaterialIcons name="card-giftcard" size={40} color="#94a3b8" />
                    <Text style={styles.emptyTitle}>No Promotional Lots</Text>
                    <Text style={styles.emptySub}>
                      Cashback rewards from completed bookings will show here.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* TAB 2: Ledger History */}
            {activeTab === 'history' && (
              <View style={styles.tabContent}>
                {ledger.length > 0 ? (
                  ledger.map((entry) => {
                    const isCredit = entry.direction === 'CREDIT';
                    return (
                      <View key={entry.id} style={styles.ledgerRow}>
                        <View
                          style={[
                            styles.ledgerIconCircle,
                            { backgroundColor: isCredit ? '#dcfce7' : '#fee2e2' },
                          ]}
                        >
                          <MaterialIcons
                            name={isCredit ? 'arrow-downward' : 'arrow-upward'}
                            size={16}
                            color={isCredit ? '#16a34a' : '#dc2626'}
                          />
                        </View>
                        <View style={styles.ledgerInfoCol}>
                          <Text style={styles.ledgerDesc}>{entry.description}</Text>
                          <Text style={styles.ledgerDate}>
                            {new Date(entry.created_at).toLocaleString()} &bull; {entry.sub_wallet_type}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.ledgerAmount,
                            { color: isCredit ? '#16a34a' : '#dc2626' },
                          ]}
                        >
                          {isCredit ? '+' : '-'}₹{entry.amount?.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.emptyState}>
                    <MaterialIcons name="receipt-long" size={40} color="#94a3b8" />
                    <Text style={styles.emptyTitle}>No Transactions Yet</Text>
                    <Text style={styles.emptySub}>
                      All wallet credits, refunds, and redemptions will appear here.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  walletIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: Spacing.sm,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  totalCard: {
    backgroundColor: '#064e3b',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  totalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalCardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#a7f3d0',
    letterSpacing: 0.8,
  },
  activeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  activeBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  totalCardValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    marginVertical: Spacing.xs,
  },
  totalCardSub: {
    fontSize: 11,
    color: '#d1fae5',
    lineHeight: 16,
  },
  subWalletsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  subWalletBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  subWalletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  subWalletTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  subWalletAmount: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  subWalletDesc: {
    fontSize: 10,
    color: '#64748b',
    lineHeight: 14,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    padding: 3,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: '#0f172a',
    fontWeight: '800',
  },
  tabContent: {
    gap: Spacing.sm,
  },
  lotCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  lotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  lotName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  lotAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: '#059669',
  },
  lotFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiryText: {
    fontSize: 11,
    color: '#64748b',
  },
  servicesPill: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3b82f6',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  ledgerRow: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: Spacing.sm,
  },
  ledgerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ledgerInfoCol: {
    flex: 1,
  },
  ledgerDesc: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  ledgerDate: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  ledgerAmount: {
    fontSize: 14,
    fontWeight: '900',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
    marginTop: Spacing.sm,
  },
  emptySub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
});

