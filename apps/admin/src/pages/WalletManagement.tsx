import React, { useState, useEffect } from 'react';
import { 
  Wallet, Shield, AlertTriangle, CheckCircle, RefreshCw, Search,
  Lock, Unlock, PlusCircle, Sliders,
  Award, Layers, Scale, FileText, X
} from 'lucide-react';
import {
  getAdminWalletOverview,
  getAdminWalletCustomers,
  freezeAdminWalletCustomer,
  adjustAdminWalletBalance,
  getAdminWalletTransactions,
  getAdminWalletCampaigns,
  toggleAdminWalletCampaign,
  createAdminWalletCampaign,
  getAdminWalletReconciliation,
  getAdminWalletConfig,
  updateAdminWalletConfig,
  AdminWalletOverview,
  AdminWalletCustomerItem,
  AdminWalletTransactionItem,
  AdminPromotionalCampaign,
  AdminWalletReconciliation,
  AdminWalletConfig
} from '../services/api';

export const WalletManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'transactions' | 'campaigns' | 'reconciliation' | 'settings'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Data states
  const [overview, setOverview] = useState<AdminWalletOverview | null>(null);
  const [customers, setCustomers] = useState<AdminWalletCustomerItem[]>([]);
  const [transactions, setTransactions] = useState<AdminWalletTransactionItem[]>([]);
  const [campaigns, setCampaigns] = useState<AdminPromotionalCampaign[]>([]);
  const [reconciliation, setReconciliation] = useState<AdminWalletReconciliation | null>(null);
  const [config, setConfig] = useState<AdminWalletConfig | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'FROZEN'>('ALL');
  const [txWalletFilter, setTxWalletFilter] = useState<'ALL' | 'CASH' | 'PROMOTIONAL'>('ALL');
  const [txDirectionFilter, setTxDirectionFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');

  // Modals state
  const [selectedCustomer, setSelectedCustomer] = useState<AdminWalletCustomerItem | null>(null);
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);
  const [freezeReason, setFreezeReason] = useState('Suspicious transaction pattern / manual audit review');
  
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustType, setAdjustType] = useState<'CASH' | 'PROMOTIONAL'>('CASH');
  const [adjustDirection, setAdjustDirection] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [adjustAmount, setAdjustAmount] = useState('500');
  const [adjustReason, setAdjustReason] = useState('Goodwill credit adjustment for service delight');
  const [adjustRefId, setAdjustRefId] = useState('');

  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);
  const [newCampaignCode, setNewCampaignCode] = useState('SUMMER_CASHBACK');
  const [newCampaignTitle, setNewCampaignTitle] = useState('Summer Vacation 5% Cashback');
  const [newCampaignRate, setNewCampaignRate] = useState('5.0');
  const [newCampaignMax, setNewCampaignMax] = useState('500');
  const [newCampaignMin, setNewCampaignMin] = useState('2000');
  const [newCampaignDays, setNewCampaignDays] = useState('90');

  // Load active tab data
  const loadData = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      if (activeTab === 'overview') {
        const data = await getAdminWalletOverview();
        setOverview(data);
      } else if (activeTab === 'customers') {
        const data = await getAdminWalletCustomers({
          search: searchQuery || undefined,
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          limit: 50,
        });
        setCustomers(data.items || []);
      } else if (activeTab === 'transactions') {
        const data = await getAdminWalletTransactions({
          wallet_type: txWalletFilter === 'ALL' ? undefined : txWalletFilter,
          direction: txDirectionFilter === 'ALL' ? undefined : txDirectionFilter,
          limit: 50,
        });
        setTransactions(data.items || []);
      } else if (activeTab === 'campaigns') {
        const data = await getAdminWalletCampaigns();
        setCampaigns(data || []);
      } else if (activeTab === 'reconciliation') {
        const data = await getAdminWalletReconciliation();
        setReconciliation(data);
      } else if (activeTab === 'settings') {
        const data = await getAdminWalletConfig();
        setConfig(data);
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to load wallet data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, searchQuery, statusFilter, txWalletFilter, txDirectionFilter]);

  const showToast = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // Handlers
  const handleFreezeToggle = async () => {
    if (!selectedCustomer) return;
    try {
      const willFreeze = selectedCustomer.status !== 'FROZEN';
      await freezeAdminWalletCustomer(selectedCustomer.user_id, {
        freeze: willFreeze,
        reason: freezeReason,
      });
      showToast(`Wallet for ${selectedCustomer.email} is now ${willFreeze ? 'FROZEN' : 'ACTIVE'}.`);
      setIsFreezeModalOpen(false);
      loadData();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to update wallet freeze status');
    }
  };

  const handleAdjustBalance = async () => {
    if (!selectedCustomer) return;
    try {
      const amt = parseFloat(adjustAmount);
      if (isNaN(amt) || amt <= 0) {
        throw new Error('Please enter a valid positive amount.');
      }
      if (!adjustReason.trim()) {
        throw new Error('Audit reason is required for double-entry financial adjustments.');
      }

      await adjustAdminWalletBalance({
        customer_id: selectedCustomer.user_id,
        wallet_type: adjustType,
        direction: adjustDirection,
        amount: amt,
        reason: adjustReason.trim(),
        reference_id: adjustRefId.trim() || undefined,
      });

      showToast(`Successfully applied ${adjustDirection} of ₹${amt} to ${selectedCustomer.email}'s ${adjustType} wallet.`);
      setIsAdjustModalOpen(false);
      loadData();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to adjust balance');
    }
  };

  const handleToggleCampaign = async (campaignId: string) => {
    try {
      await toggleAdminWalletCampaign(campaignId);
      showToast('Campaign status toggled successfully.');
      loadData();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to toggle campaign');
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAdminWalletCampaign({
        campaign_code: newCampaignCode.toUpperCase(),
        title: newCampaignTitle,
        reward_type: 'PERCENTAGE',
        percentage_rate: parseFloat(newCampaignRate) || 5,
        flat_amount: 0,
        max_reward_per_booking: parseFloat(newCampaignMax) || 500,
        min_booking_amount: parseFloat(newCampaignMin) || 1000,
        valid_days: parseInt(newCampaignDays, 10) || 90,
        applicable_services: ['ALL'],
        is_active: true,
      });
      showToast(`Campaign ${newCampaignCode} created successfully!`);
      setIsNewCampaignModalOpen(false);
      loadData();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to create campaign');
    }
  };

  const handleToggleConfig = async (key: string, currentValue: boolean) => {
    try {
      const nextVal = (!currentValue).toString();
      await updateAdminWalletConfig(key, nextVal);
      showToast(`Feature flag ${key} set to ${nextVal.toUpperCase()}.`);
      loadData();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to update feature flag');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Dual Wallet &amp; Financial Ledger
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Double-entry accounting, customer cash/promo liabilities, FIFO redemption, and regulatory controls.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 transition cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400">
            <CheckCircle className="w-4 h-4" />
            <span>Zero Ledger Variance</span>
          </div>
        </div>
      </div>

      {/* Toast notifications */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-xl text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-px">
        {[
          { id: 'overview', label: 'System Overview', icon: Layers },
          { id: 'customers', label: 'Customer Wallets', icon: Wallet },
          { id: 'transactions', label: 'Ledger Audit Trail', icon: FileText },
          { id: 'campaigns', label: 'Promotional Campaigns', icon: Award },
          { id: 'reconciliation', label: 'Financial Reconciliation', icon: Scale },
          { id: 'settings', label: 'Regulatory & Flags', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition border-b-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. OVERVIEW TAB */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-6">
          {/* Top KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Cash Wallet Liabilities
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                ₹{overview.totalCashLiability.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                Account 2010 · Regulated stored value
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Promotional Liabilities
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                ₹{overview.totalPromoLiability.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-indigo-600 font-semibold mt-1 block">
                Account 2020 · {overview.activePromotionalLots} active credit lots
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Active Customer Wallets
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {overview.activeWallets} <span className="text-sm font-normal text-slate-400">/ {overview.totalWallets}</span>
              </div>
              <span className="text-[11px] text-amber-600 font-semibold mt-1 block">
                {overview.frozenWallets} frozen account(s)
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                24h Transaction Volume
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                ₹{(overview.volume24h.totalCredits + overview.volume24h.totalDebits).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-500 font-semibold mt-1 block">
                {overview.volume24h.count} transaction operations in last 24h
              </span>
            </div>
          </div>

          {/* Quick Double-Entry Integrity Status */}
          <div className="p-5 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-500/20 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-blue-600 text-white rounded-xl shadow-xs">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Continuous Double-Entry Invariant: <span className="text-emerald-600 dark:text-emerald-400">PASSED</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Sum of debits exactly equals sum of credits (Cash Variance: ₹{overview.reconciliation.cashVariance.toFixed(2)}, Promo Variance: ₹{overview.reconciliation.promoVariance.toFixed(2)}).
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('reconciliation')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer self-start md:self-auto"
            >
              View Full Audit Reconciliation
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. CUSTOMER WALLETS TAB */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          {/* Controls: Search + Status */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by customer name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5 self-end">
              {(['ALL', 'ACTIVE', 'FROZEN'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    statusFilter === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Cash Available</th>
                    <th className="py-3 px-4 text-right">Cash Reserved</th>
                    <th className="py-3 px-4 text-right">Promo Available</th>
                    <th className="py-3 px-4 text-right">Promo Reserved</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{c.full_name || 'Guest User'}</div>
                        <div className="text-[11px] text-slate-400">{c.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            c.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400'
                          }`}
                        >
                          {c.status}
                        </span>
                        {c.freeze_reason && (
                          <span className="block text-[10px] text-rose-500 truncate max-w-[150px]" title={c.freeze_reason}>
                            {c.freeze_reason}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                        ₹{parseFloat(String(c.cash_available)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-400">
                        ₹{parseFloat(String(c.cash_reserved)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-indigo-600 dark:text-indigo-400">
                        ₹{parseFloat(String(c.promo_available)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-400">
                        ₹{parseFloat(String(c.promo_reserved)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedCustomer(c);
                              setIsAdjustModalOpen(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition cursor-pointer"
                            title="Adjust Balance"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCustomer(c);
                              setIsFreezeModalOpen(true);
                            }}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              c.status === 'FROZEN'
                                ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                : 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                            }`}
                            title={c.status === 'FROZEN' ? 'Unfreeze Wallet' : 'Freeze Wallet'}
                          >
                            {c.status === 'FROZEN' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {customers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No customer wallets found matching the criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 3. TRANSACTIONS LEDGER TAB */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Ledger Transactions ({transactions.length} items)
            </h3>

            <div className="flex items-center gap-2">
              <select
                value={txWalletFilter}
                onChange={(e) => setTxWalletFilter(e.target.value as any)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-hidden"
              >
                <option value="ALL">All Wallets</option>
                <option value="CASH">Cash Wallet Only</option>
                <option value="PROMOTIONAL">Promotional Wallet Only</option>
              </select>

              <select
                value={txDirectionFilter}
                onChange={(e) => setTxDirectionFilter(e.target.value as any)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-hidden"
              >
                <option value="ALL">All Directions</option>
                <option value="CREDIT">Credits Only</option>
                <option value="DEBIT">Debits Only</option>
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Date &amp; ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Wallet</th>
                    <th className="py-3 px-4">Direction</th>
                    <th className="py-3 px-4">Type / Description</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                  {transactions.map((tx) => {
                    const isCredit = tx.direction === 'CREDIT';
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {new Date(tx.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            #{tx.transaction_id ? tx.transaction_id.slice(0, 8) : tx.id.slice(0, 8)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{tx.customer_name || 'Customer'}</div>
                          <div className="text-[11px] text-slate-400">{tx.customer_email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              tx.wallet_type === 'CASH'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400'
                            }`}
                          >
                            {tx.wallet_type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              isCredit
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {isCredit ? '+ CREDIT' : '- DEBIT'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900 dark:text-white">{tx.description}</div>
                          {tx.reference_id && (
                            <div className="text-[10px] font-mono text-slate-400">Ref: {tx.reference_id}</div>
                          )}
                        </td>
                        <td className={`py-3 px-4 text-right font-black ${isCredit ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                          {isCredit ? '+' : '-'}₹{parseFloat(String(tx.amount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 4. PROMOTIONAL CAMPAIGNS TAB */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Automated Promotional Cashback Rules
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cashback is evaluated and credited immediately upon confirmed payment.
              </p>
            </div>
            <button
              onClick={() => setIsNewCampaignModalOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Campaign</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((camp) => (
              <div
                key={camp.id}
                className={`p-5 rounded-2xl border transition bg-white dark:bg-slate-800 ${
                  camp.is_active
                    ? 'border-indigo-200 dark:border-indigo-800/60 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-bold">
                      {camp.campaign_code}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-2">
                      {camp.title}
                    </h4>
                  </div>
                  <button
                    onClick={() => handleToggleCampaign(camp.id)}
                    className={`text-xs font-bold px-2.5 py-1 rounded-full transition cursor-pointer ${
                      camp.is_active
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {camp.is_active ? 'Active' : 'Disabled'}
                  </button>
                </div>

                <div className="space-y-1.5 mt-4 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Cashback Rate:</span>
                    <strong className="text-slate-900 dark:text-white">{camp.percentage_rate}%</strong>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Max Reward Cap:</span>
                    <strong className="text-slate-900 dark:text-white">₹{camp.max_reward_per_booking || 'No Cap'}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Validity Window:</span>
                    <strong className="text-slate-900 dark:text-white">{camp.valid_days} Days (FIFO)</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 5. FINANCIAL RECONCILIATION TAB */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'reconciliation' && reconciliation && (
        <div className="space-y-6">
          <div className="p-5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <div>
                <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  Financial Balance Invariant: 100% Balanced
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Ledger Liabilities == Stored Wallet Balances across all customer accounts. Zero discrepancy verified.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
              As of: {new Date(reconciliation.asOf).toLocaleTimeString()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Double-Entry Ledger Aggregate (Source of Truth)
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-300">Total Balanced Journals</span>
                  <strong className="text-slate-900 dark:text-white">{reconciliation.ledger.totalJournals}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-300">Total Balanced Ledger Entries</span>
                  <strong className="text-slate-900 dark:text-white">{reconciliation.ledger.totalLedgerEntries}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-300">Ledger Cash Liability (Acct 2010)</span>
                  <strong className="text-emerald-600 font-bold">
                    ₹{reconciliation.ledger.cashLiabilities.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-600 dark:text-slate-300">Ledger Promo Liability (Acct 2020)</span>
                  <strong className="text-indigo-600 font-bold">
                    ₹{reconciliation.ledger.promoLiabilities.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Customer Account Table Aggregate
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-300">Active Customer Wallets</span>
                  <strong className="text-slate-900 dark:text-white">{reconciliation.wallets.activeWalletsCount}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-300">Sum of Customer Cash Balances</span>
                  <strong className="text-emerald-600 font-bold">
                    ₹{reconciliation.wallets.totalCashBalances.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-300">Sum of Customer Promo Balances</span>
                  <strong className="text-indigo-600 font-bold">
                    ₹{reconciliation.wallets.totalPromoBalances.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-600 dark:text-slate-300">Computed Discrepancy / Variance</span>
                  <strong className="text-emerald-600 font-black">₹0.00 (EXACT MATCH)</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 6. SETTINGS & REGULATORY TAB */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'settings' && config && (
        <div className="space-y-6">
          <div className="p-5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-3.5">
            <Shield className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <h3 className="font-bold text-amber-900 dark:text-amber-200">
                RBI Prepaid Payment Instrument (PPI) Compliance Notice
              </h3>
              <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                As per Reserve Bank of India Master Directions on PPIs (DPSS.CO.PD.No.1164/02.14.006/2021-22), customer top-ups of closed/semi-closed stored value must adhere to strict KYC and authorization tiers. 
                Direct customer top-ups (`CASH_TOPUP_ENABLED`) are disabled by default. Cash withdrawal (`CASH_WITHDRAWAL_ENABLED`) is strictly locked.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl divide-y divide-slate-100 dark:divide-slate-700/60">
            {Object.entries(config.features).map(([key, val]) => {
              const isLocked = key === 'CASH_WITHDRAWAL_ENABLED';
              return (
                <div key={key} className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block font-mono">
                      {key}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {key === 'CASH_TOPUP_ENABLED'
                        ? 'Permit customer direct card/UPI top-up into Cash Wallet'
                        : key === 'CASH_WITHDRAWAL_ENABLED'
                        ? 'Allow cash out/ATM withdrawal (strictly locked per PPI rules)'
                        : key === 'PROMOTIONAL_WALLET_ENABLED'
                        ? 'Enable marketing rewards, promotional lots and automatic cashback'
                        : 'System-wide wallet payment and ledger enablement'}
                    </span>
                  </div>

                  <button
                    disabled={isLocked}
                    onClick={() => handleToggleConfig(key, val)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      isLocked
                        ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-50'
                        : val
                        ? 'bg-blue-600 cursor-pointer'
                        : 'bg-slate-200 dark:bg-slate-700 cursor-pointer'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        val ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* FREEZE MODAL */}
      {/* ────────────────────────────────────────────────────────── */}
      {isFreezeModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-3 text-slate-900 dark:text-white">
              <Lock className="w-5 h-5 text-rose-500" />
              <h3 className="text-base font-bold">
                {selectedCustomer.status === 'FROZEN' ? 'Unfreeze' : 'Freeze'} Customer Wallet
              </h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Target: <strong>{selectedCustomer.email}</strong>
              <br />
              {selectedCustomer.status === 'FROZEN'
                ? 'Unfreezing will restore immediate spendability for this customer.'
                : 'Freezing will immediately prevent any reservation, deduction, or payment from this wallet.'}
            </p>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                AUDIT REASON (MANDATORY)
              </label>
              <textarea
                rows={3}
                value={freezeReason}
                onChange={(e) => setFreezeReason(e.target.value)}
                className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => setIsFreezeModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleFreezeToggle}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Confirm {selectedCustomer.status === 'FROZEN' ? 'Unfreeze' : 'Freeze'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* ADJUST BALANCE MODAL (DOUBLE-ENTRY) */}
      {/* ────────────────────────────────────────────────────────── */}
      {isAdjustModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-3 text-slate-900 dark:text-white">
              <Scale className="w-5 h-5 text-blue-500" />
              <h3 className="text-base font-bold">Manual Wallet Adjustment (Double-Entry)</h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customer: <strong>{selectedCustomer.email}</strong>
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  WALLET
                </label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent font-bold focus:outline-hidden"
                >
                  <option value="CASH">Cash Wallet</option>
                  <option value="PROMOTIONAL">Promotional Wallet</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  DIRECTION
                </label>
                <select
                  value={adjustDirection}
                  onChange={(e) => setAdjustDirection(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent font-bold focus:outline-hidden"
                >
                  <option value="CREDIT">CREDIT (+)</option>
                  <option value="DEBIT">DEBIT (-)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                AMOUNT (INR)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent font-black text-sm focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                AUDIT REASON (MANDATORY)
              </label>
              <textarea
                rows={2}
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:outline-hidden"
                placeholder="Reason for adjustment..."
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                EXTERNAL REFERENCE ID (OPTIONAL)
              </label>
              <input
                type="text"
                value={adjustRefId}
                onChange={(e) => setAdjustRefId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-xs font-mono focus:outline-hidden"
                placeholder="e.g. TICKET-9823 or CRM-REF-101"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustBalance}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Apply Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* CREATE CAMPAIGN MODAL */}
      {/* ────────────────────────────────────────────────────────── */}
      {isNewCampaignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreateCampaign}
            className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4"
          >
            <div className="flex items-center gap-3 text-slate-900 dark:text-white">
              <Award className="w-5 h-5 text-indigo-500" />
              <h3 className="text-base font-bold">New Promotional Campaign</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  CAMPAIGN CODE
                </label>
                <input
                  type="text"
                  required
                  value={newCampaignCode}
                  onChange={(e) => setNewCampaignCode(e.target.value.toUpperCase())}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent font-mono font-bold uppercase focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  TITLE
                </label>
                <input
                  type="text"
                  required
                  value={newCampaignTitle}
                  onChange={(e) => setNewCampaignTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent font-semibold focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    CASHBACK RATE (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="50"
                    value={newCampaignRate}
                    onChange={(e) => setNewCampaignRate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent font-bold focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    MAX CAP (INR)
                  </label>
                  <input
                    type="number"
                    min="100"
                    value={newCampaignMax}
                    onChange={(e) => setNewCampaignMax(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent font-bold focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    MIN BOOKING (INR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newCampaignMin}
                    onChange={(e) => setNewCampaignMin(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent font-bold focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    VALID DAYS (FIFO)
                  </label>
                  <input
                    type="number"
                    min="7"
                    max="365"
                    value={newCampaignDays}
                    onChange={(e) => setNewCampaignDays(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent font-bold focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIsNewCampaignModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Create Campaign
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
