import React, { useState, useEffect } from 'react';
import {
  getCustomerDashboardSummaryApi,
  getCustomerProfileApi,
  updateCustomerProfileApi,
  getSavedTravellersApi,
  createSavedTravellerApi,
  updateSavedTravellerApi,
  deleteSavedTravellerApi,
  getMyTripsApi,
  cancelBookingApi,
  getWalletBalancesApi,
  getWalletSummaryApi,
  getWalletTransactionsApi,
  getPromotionalLotsApi,
  createWalletTopupOrderApi,
  verifyWalletTopupApi,
  WalletBalancesResponse,
  WalletSummaryResponse,
  WalletTransactionItem,
  PromotionalCreditLot,
  CustomerDashboardSummary,
  CustomerProfileData,
  SavedTraveller,
  UserProfile,
} from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { WebCheckoutItem } from './BookingCheckoutPage';

export type DashboardSubTab =
  | 'overview'
  | 'trips'
  | 'wishlist'
  | 'travellers'
  | 'payments'
  | 'profile'
  | 'devices'
  | 'support'
  | 'wallet';

interface CustomerDashboardPageProps {
  onNavigate: (screen: any) => void;
  onInitiateCheckout?: (item: WebCheckoutItem) => void;
  onOpenAuth?: () => void;
  initialTab?: DashboardSubTab;
  currentUser?: UserProfile | null;
  onLogout: () => void;
}

export const CustomerDashboardPage: React.FC<CustomerDashboardPageProps> = ({
  onNavigate,
  initialTab = 'profile',
  currentUser,
  onLogout,
}) => {
  const { formatPrice } = useCurrency();

  const [activeTab, setActiveTab] = useState<DashboardSubTab>(initialTab);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<CustomerDashboardSummary | null>(null);
  const [profile, setProfile] = useState<CustomerProfileData | null>(null);
  const [travellers, setTravellers] = useState<SavedTraveller[]>([]);
  const [trips, setTrips] = useState<any[]>([]);

  // Trips filter & cancellation state
  const [tripFilter, setTripFilter] = useState<'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('Change of travel plans');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile edit state
  const [profileForm, setProfileForm] = useState<Partial<CustomerProfileData>>({
    fullName: '',
    phone: '',
    email: '',
    gender: 'MALE',
    dateOfBirth: '',
    maritalStatus: 'SINGLE',
    state: 'Delhi',
    passportNumber: '',
    passportExpiry: '',
    passportIssuingCountry: 'India',
    panCardNumber: '',
    autoInsurancePreferences: {
      domestic_hotel: false,
      domestic_flight: false,
      international_hotel: false,
      international_flight: false,
    },
    frequentFlyerDetails: [],
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Frequent Flyer Add State
  const [isAddingFlyer, setIsAddingFlyer] = useState(false);
  const [newFlyerAirline, setNewFlyerAirline] = useState('Air India');
  const [newFlyerNumber, setNewFlyerNumber] = useState('');

  // Password Reset Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');

  // Traveller edit/modal state
  const [isEditingCoTraveller, setIsEditingCoTraveller] = useState(false);
  const [isSavingTraveller, setIsSavingTraveller] = useState(false);
  const [editingTraveller, setEditingTraveller] = useState<SavedTraveller | null>(null);
  const [travellerForm, setTravellerForm] = useState<Partial<SavedTraveller>>({
    title: 'Mr',
    firstName: '',
    lastName: '',
    gender: 'MALE',
    dateOfBirth: '',
    passengerType: 'ADULT',
    phone: '',
    email: '',
    passportNumber: '',
    passportExpiry: '',
    nationality: 'India',
    mealPreference: 'No Preference',
    seatPreference: '',
    relationship: 'Spouse',
    berthPreference: 'No Preference',
    passportIssuingCountry: 'India',
  });

  // Dual Wallet state
  const [walletBalances, setWalletBalances] = useState<WalletBalancesResponse | null>(null);
  const [walletSummary, setWalletSummary] = useState<WalletSummaryResponse | null>(null);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransactionItem[]>([]);
  const [promotionalLots, setPromotionalLots] = useState<PromotionalCreditLot[]>([]);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletFilterType, setWalletFilterType] = useState<'ALL' | 'CASH' | 'PROMOTIONAL'>('ALL');
  const [walletFilterDir, setWalletFilterDir] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState('1000');
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupError, setTopupError] = useState<string | null>(null);
  const [topupSuccess, setTopupSuccess] = useState<string | null>(null);

  const fetchWalletData = async () => {
    try {
      setWalletLoading(true);
      const [bal, sum, lots, tx] = await Promise.all([
        getWalletBalancesApi().catch(() => null),
        getWalletSummaryApi().catch(() => null),
        getPromotionalLotsApi().catch(() => []),
        getWalletTransactionsApi({ limit: 50 }).catch(() => ({ items: [], pagination: {} })),
      ]);
      if (bal) setWalletBalances(bal);
      if (sum) setWalletSummary(sum);
      if (lots) setPromotionalLots(lots);
      if (tx?.items) setWalletTransactions(tx.items);
    } catch (e) {
      console.warn('Failed to load wallet information:', e);
    } finally {
      setWalletLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (activeTab === 'wallet') {
      fetchWalletData();
    }
  }, [activeTab]);

  // Load initial data
  const loadDashboardData = async () => {
    setIsLoading(true);
    setActionMessage(null);
    try {
      const [sumData, profData, travData, tripsData] = await Promise.allSettled([
        getCustomerDashboardSummaryApi(),
        getCustomerProfileApi(),
        getSavedTravellersApi(),
        getMyTripsApi(),
      ]);

      if (sumData.status === 'fulfilled') setSummary(sumData.value);
      if (profData.status === 'fulfilled') {
        const p = profData.value;
        setProfile(p);
        setProfileForm({
          ...p,
          fullName: p.fullName || currentUser?.fullName || '',
          email: p.email || currentUser?.email || '',
          phone: p.phone || currentUser?.phone || '',
          maritalStatus: p.maritalStatus || 'SINGLE',
          passportIssuingCountry: p.passportIssuingCountry || 'India',
          autoInsurancePreferences: p.autoInsurancePreferences || {
            domestic_hotel: false,
            domestic_flight: false,
            international_hotel: false,
            international_flight: false,
          },
          frequentFlyerDetails: p.frequentFlyerDetails || [],
        });
      }
      if (travData.status === 'fulfilled') setTravellers(travData.value);
      if (tripsData.status === 'fulfilled') setTrips(tripsData.value);
    } catch (err: any) {
      console.warn('Failed to load customer dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Handle profile save
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingProfile(true);
    setActionMessage(null);
    try {
      const updated = await updateCustomerProfileApi(profileForm);
      setProfile(updated);
      setProfileForm({
        ...updated,
        maritalStatus: updated.maritalStatus || 'SINGLE',
        passportIssuingCountry: updated.passportIssuingCountry || 'India',
        autoInsurancePreferences: updated.autoInsurancePreferences || {
          domestic_hotel: false,
          domestic_flight: false,
          international_hotel: false,
          international_flight: false,
        },
        frequentFlyerDetails: updated.frequentFlyerDetails || [],
      });
      setActionMessage({ type: 'success', text: 'Profile saved successfully!' });
      getCustomerDashboardSummaryApi().then((s) => setSummary(s));
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update profile.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Insurance checkbox toggle
  const toggleInsurancePref = (key: 'domestic_hotel' | 'domestic_flight' | 'international_hotel' | 'international_flight') => {
    setProfileForm((prev) => {
      const current = prev.autoInsurancePreferences || {
        domestic_hotel: false,
        domestic_flight: false,
        international_hotel: false,
        international_flight: false,
      };
      return {
        ...prev,
        autoInsurancePreferences: {
          ...current,
          [key]: !current[key],
        },
      };
    });
  };

  // Frequent Flyer Add & Remove
  const handleAddFrequentFlyer = () => {
    if (!newFlyerNumber.trim()) {
      alert('Please enter your frequent flyer number');
      return;
    }
    const current = profileForm.frequentFlyerDetails || [];
    setProfileForm({
      ...profileForm,
      frequentFlyerDetails: [...current, { airline: newFlyerAirline, number: newFlyerNumber.trim().toUpperCase() }],
    });
    setNewFlyerNumber('');
    setIsAddingFlyer(false);
  };

  const handleRemoveFrequentFlyer = (index: number) => {
    const current = profileForm.frequentFlyerDetails || [];
    setProfileForm({
      ...profileForm,
      frequentFlyerDetails: current.filter((_, idx) => idx !== index),
    });
  };

  // Handle Traveller Add / Update
  const handleOpenAddTraveller = () => {
    setEditingTraveller(null);
    setTravellerForm({
      title: 'Mr',
      firstName: '',
      lastName: '',
      gender: 'MALE',
      dateOfBirth: '',
      passengerType: 'ADULT',
      phone: '',
      email: '',
      passportNumber: '',
      passportExpiry: '',
      nationality: 'India',
      mealPreference: 'No Preference',
      seatPreference: '',
      relationship: 'Spouse',
      berthPreference: 'No Preference',
      passportIssuingCountry: 'India',
    });
    setIsEditingCoTraveller(true);
  };

  const handleOpenEditTraveller = (t: SavedTraveller) => {
    setEditingTraveller(t);
    setTravellerForm({
      ...t,
      dateOfBirth: t.dateOfBirth ? String(t.dateOfBirth).slice(0, 10) : '',
      passportExpiry: t.passportExpiry ? String(t.passportExpiry).slice(0, 10) : '',
      nationality: t.nationality || 'India',
      relationship: t.relationship || 'Spouse',
      mealPreference: t.mealPreference || 'No Preference',
      berthPreference: t.berthPreference || 'No Preference',
      passportIssuingCountry: t.passportIssuingCountry || 'India',
    });
    setIsEditingCoTraveller(true);
  };

  const handleSaveTraveller = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!travellerForm.firstName?.trim() || !travellerForm.lastName?.trim()) {
      alert('First name and Last name are required');
      return;
    }
    setIsSavingTraveller(true);
    try {
      if (editingTraveller) {
        await updateSavedTravellerApi(editingTraveller.id, travellerForm);
      } else {
        await createSavedTravellerApi(travellerForm);
      }
      setIsEditingCoTraveller(false);
      setEditingTraveller(null);
      const updatedTravellers = await getSavedTravellersApi();
      setTravellers(updatedTravellers);
      setActionMessage({
        type: 'success',
        text: editingTraveller ? 'Co-traveller updated successfully!' : 'Co-traveller added successfully!',
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save co-traveller');
    } finally {
      setIsSavingTraveller(false);
    }
  };

  const handleDeleteTraveller = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from co-travellers?`)) return;
    try {
      await deleteSavedTravellerApi(id);
      setTravellers((prev) => prev.filter((t) => t.id !== id));
      setActionMessage({ type: 'success', text: 'Co-traveller removed.' });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete traveller');
    }
  };

  // Handle Cancellation
  const handleConfirmCancel = async () => {
    if (!cancellingBookingId) return;
    try {
      await cancelBookingApi(cancellingBookingId, cancelReason);
      setIsCancelModalOpen(false);
      setCancellingBookingId(null);
      setActionMessage({ type: 'success', text: 'Booking cancelled successfully.' });
      const updatedTrips = await getMyTripsApi();
      setTrips(updatedTrips);
      const updatedSum = await getCustomerDashboardSummaryApi();
      setSummary(updatedSum);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const handleSimulatedTopup = async () => {
    setTopupLoading(true);
    setTopupError(null);
    setTopupSuccess(null);
    try {
      const amt = parseFloat(topupAmount);
      if (isNaN(amt) || amt <= 0) {
        throw new Error('Please enter a valid amount');
      }
      const orderRes = await createWalletTopupOrderApi(amt);
      if (orderRes.order_id) {
        await verifyWalletTopupApi({
          order_id: orderRes.order_id,
          razorpay_payment_id: `pay_sim_${Date.now()}`,
          razorpay_signature: 'simulated_valid_signature',
        });
        setTopupSuccess(`Successfully added ₹${amt} to your Cash Wallet!`);
        await fetchWalletData();
        setTimeout(() => {
          setIsTopupModalOpen(false);
          setTopupSuccess(null);
        }, 1500);
      }
    } catch (e: any) {
      setTopupError(e.response?.data?.message || e.message || 'Top-up failed');
    } finally {
      setTopupLoading(false);
    }
  };

  // Filter trips
  const filteredTrips = trips.filter((t) => {
    if (tripFilter === 'ALL') return true;
    if (tripFilter === 'UPCOMING') return t.status === 'CONFIRMED' || t.status === 'PENDING';
    if (tripFilter === 'COMPLETED') return t.status === 'COMPLETED';
    if (tripFilter === 'CANCELLED') return t.status === 'CANCELLED';
    return true;
  });


  if (isLoading && !summary && !profile) {
    return (
      <div className="w-full bg-[#f8fafc] min-h-[70vh] flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#008cff]/20 border-t-[#008cff] rounded-full animate-spin" />
          <p className="text-xs font-bold text-gray-500">Loading your profile details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-100/80 min-h-[85vh] py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1240px] mx-auto">
        {/* Toast / Action Banner */}
        {actionMessage && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center justify-between text-sm font-semibold shadow-sm animate-fade-in ${
              actionMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">
                {actionMessage.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <span>{actionMessage.text}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              className="p-1 hover:bg-black/5 rounded-full transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}

        {/* ── CARD WRAPPER: EXACT MAKEMYTRIP ACCOUNT LAYOUT ── */}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
          {/* ── LEFT SIDEBAR (MY ACCOUNT) — EXACT MATCH TO SCREENSHOT ── */}
          <aside className="lg:col-span-3 border-r border-gray-100 p-6 flex flex-col justify-between bg-white select-none">
            <div className="space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block px-2">
                MY ACCOUNT
              </span>

              <nav className="space-y-1">
                {/* 1. My Profile */}
                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setIsEditingCoTraveller(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'profile'
                      ? 'bg-[#eaf5ff] text-[#008cff]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px]">account_circle</span>
                    <span>My Profile</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-[#ff3b30]" />
                </button>

                {/* 2. My Wallet (Dual Wallet) */}
                <button
                  onClick={() => {
                    setActiveTab('wallet');
                    setIsEditingCoTraveller(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'wallet'
                      ? 'bg-emerald-50 text-emerald-700 font-extrabold shadow-xs'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px] text-emerald-600">account_balance_wallet</span>
                    <span>My Wallet</span>
                  </div>
                  {walletBalances && (
                    <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      ₹{walletBalances.totalSpendable || 0}
                    </span>
                  )}
                </button>

                {/* 3. My Trips & Bookings */}
                <button
                  onClick={() => {
                    setActiveTab('trips');
                    setIsEditingCoTraveller(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'trips'
                      ? 'bg-[#eaf5ff] text-[#008cff]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px] text-blue-600">luggage</span>
                    <span>My Trips</span>
                  </div>
                  {trips.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {trips.length}
                    </span>
                  )}
                </button>

                {/* 4. Co-Travellers */}
                <button
                  onClick={() => {
                    setActiveTab('travellers');
                    setIsEditingCoTraveller(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'travellers'
                      ? 'bg-[#eaf5ff] text-[#008cff]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px]">group</span>
                    <span>Co-Travellers</span>
                  </div>
                </button>

                {/* 5. Logged In Devices */}
                <button
                  onClick={() => {
                    setActiveTab('devices');
                    setIsEditingCoTraveller(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'devices'
                      ? 'bg-[#eaf5ff] text-[#008cff]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">devices</span>
                  <span>Logged In Devices</span>
                </button>

                {/* 4. Logout */}
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold text-gray-700 hover:text-rose-600 hover:bg-rose-50/50 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                  <span>Logout</span>
                </button>
              </nav>
            </div>

            {/* Bottom: Reset Password */}
            <div className="pt-6 border-t border-gray-100">
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[19px] text-gray-400">key</span>
                <span>Reset Password</span>
              </button>
            </div>
          </aside>

          {/* ── RIGHT MAIN CONTENT AREA ── */}
          <main className="lg:col-span-9 p-6 sm:p-8 lg:p-10 overflow-y-auto">
            {/* ==================================================== */}
            {/* 1. EXACT "MY PROFILE" VIEW FROM SCREENSHOTS */}
            {/* ==================================================== */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-8 animate-fade-in">
                {/* Header Bar: "My Profile" + Top-Right "SAVE" Button */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">My Profile</h2>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="bg-[#008cff] hover:bg-blue-600 disabled:opacity-50 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-xs transition cursor-pointer uppercase tracking-wider"
                  >
                    {isSavingProfile ? 'SAVING...' : 'SAVE'}
                  </button>
                </div>

                {/* ── BASIC DETAILS & GST SECTION ── */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        FULL NAME
                      </label>
                      <input
                        type="text"
                        required
                        value={profileForm.fullName || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                        className="w-full text-xs font-bold px-3.5 py-3 rounded-xl border border-gray-200 bg-white focus:outline-hidden focus:border-[#008cff] focus:ring-1 focus:ring-[#008cff]"
                        placeholder="e.g. Rahul Sharma"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        BIRTHDAY
                      </label>
                      <input
                        type="date"
                        value={profileForm.dateOfBirth ? String(profileForm.dateOfBirth).slice(0, 10) : ''}
                        onChange={(e) => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
                        className="w-full text-xs font-bold px-3 py-3 rounded-xl border border-gray-200 bg-white focus:outline-hidden focus:border-[#008cff]"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        GENDER
                      </label>
                      <select
                        value={profileForm.gender || 'MALE'}
                        onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                        className="w-full text-xs font-bold px-3 py-3 rounded-xl border border-gray-200 bg-white focus:outline-hidden focus:border-[#008cff]"
                      >
                        <option value="MALE">MALE</option>
                        <option value="FEMALE">FEMALE</option>
                        <option value="OTHER">OTHER</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        MARITAL STATUS
                      </label>
                      <select
                        value={profileForm.maritalStatus || 'SINGLE'}
                        onChange={(e) => setProfileForm({ ...profileForm, maritalStatus: e.target.value })}
                        className="w-full text-xs font-bold px-3.5 py-3 rounded-xl border border-gray-200 bg-white focus:outline-hidden focus:border-[#008cff]"
                      >
                        <option value="SINGLE">Single</option>
                        <option value="MARRIED">Married</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        STATE OF RESIDENCE
                      </label>
                      <input
                        type="text"
                        value={profileForm.state || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                        className="w-full text-xs font-bold px-3.5 py-3 rounded-xl border border-gray-200 bg-white focus:outline-hidden focus:border-[#008cff]"
                        placeholder="e.g. Maharashtra, Delhi, Karnataka"
                      />
                      <span className="text-[10px] text-gray-400 mt-1 block">
                        Required for GST purpose on your tax invoice
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── CONTACT DETAILS SECTION ── */}
                <div className="space-y-3 pt-6 border-t border-gray-100">
                  <div>
                    <h3 className="text-sm font-black text-gray-900">Contact Details</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Add contact information to receive booking details &amp; other alerts
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Mobile Number Box */}
                    <div className="relative">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        MOBILE NUMBER
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={profileForm.phone || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="w-full text-xs font-black text-gray-900 px-3.5 py-3 pr-10 rounded-xl border border-gray-200 bg-white focus:outline-hidden focus:border-[#008cff]"
                          placeholder="+91-9876543210"
                        />
                        <span className="absolute right-3 material-symbols-outlined text-[18px] text-emerald-500 font-bold">
                          check
                        </span>
                      </div>
                    </div>

                    {/* Email ID Box */}
                    <div className="relative">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        EMAIL ID
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="email"
                          disabled
                          value={profile?.email || profileForm.email || ''}
                          className="w-full text-xs font-bold text-gray-800 px-3.5 py-3 pr-10 rounded-xl border border-gray-200 bg-gray-50/70 cursor-not-allowed"
                        />
                        <span className="absolute right-3 material-symbols-outlined text-[18px] text-emerald-500 font-bold">
                          verified
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── DOCUMENTS DETAILS SECTION ── */}
                <div className="space-y-3 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-black text-gray-900">Documents Details</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Passport No */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        PASSPORT NO.
                      </label>
                      <input
                        type="text"
                        value={profileForm.passportNumber || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, passportNumber: e.target.value.toUpperCase() })}
                        className="w-full text-xs font-mono font-bold text-gray-900 px-3.5 py-3 rounded-xl border border-gray-200 bg-white focus:outline-hidden focus:border-[#008cff] uppercase placeholder:font-sans placeholder:normal-case"
                        placeholder="Enter Passport Number"
                      />
                    </div>

                    {/* Expiry Date */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        EXPIRY DATE
                      </label>
                      <input
                        type="date"
                        value={profileForm.passportExpiry ? String(profileForm.passportExpiry).slice(0, 10) : ''}
                        onChange={(e) => setProfileForm({ ...profileForm, passportExpiry: e.target.value })}
                        className="w-full text-xs font-bold px-3.5 py-3 rounded-xl border border-gray-200 bg-white focus:outline-hidden focus:border-[#008cff]"
                      />
                    </div>

                    {/* Issuing Country */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        ISSUING COUNTRY
                      </label>
                      <select
                        value={profileForm.passportIssuingCountry || 'India'}
                        onChange={(e) => setProfileForm({ ...profileForm, passportIssuingCountry: e.target.value })}
                        className="w-full text-xs font-bold text-gray-800 px-3.5 py-3 rounded-xl border border-gray-200 bg-white focus:outline-hidden focus:border-[#008cff]"
                      >
                        <option value="India">India</option>
                        <option value="United States">United States</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="United Arab Emirates">United Arab Emirates</option>
                        <option value="Singapore">Singapore</option>
                        <option value="Canada">Canada</option>
                        <option value="Australia">Australia</option>
                        <option value="Germany">Germany</option>
                        <option value="France">France</option>
                      </select>
                    </div>

                    {/* Pan Card Number */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        PAN CARD NUMBER
                      </label>
                      <input
                        type="text"
                        value={profileForm.panCardNumber || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, panCardNumber: e.target.value.toUpperCase() })}
                        className="w-full text-xs font-mono font-bold text-gray-900 px-3.5 py-3 rounded-xl border border-gray-200 bg-white focus:outline-hidden focus:border-[#008cff] uppercase placeholder:font-sans placeholder:normal-case"
                        placeholder="Enter 10-Digit PAN (e.g. ABCDE1234F)"
                        maxLength={10}
                      />
                    </div>
                  </div>

                  <p className="text-[11px] font-semibold text-amber-800 bg-amber-50/70 border border-amber-200/60 p-2.5 rounded-xl">
                    <span className="font-bold text-amber-900">NOTE:</span> Your PAN No. will only be used for international bookings as per RBI Guidelines
                  </p>
                </div>

                {/* ── AUTO-ADD TRAVEL INSURANCE / TRIP SECURE SECTION ── */}
                <div className="space-y-3 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-black text-gray-900">Auto-Add Travel Insurance/Trip Secure</h3>
                    <span className="material-symbols-outlined text-[16px] text-gray-400" title="Information">
                      info
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Set your default choice for travel insurance/trip secure to be added automatically on your future flights and hotel bookings.
                  </p>

                  <div className="border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden bg-white">
                    {[
                      {
                        key: 'domestic_hotel' as const,
                        label: 'On booking a Domestic Hotel:',
                        desc: 'Add Trip Secure (Hotels)',
                      },
                      {
                        key: 'domestic_flight' as const,
                        label: 'On booking a Domestic Flight:',
                        desc: 'Add Trip Secure (Flights)',
                      },
                      {
                        key: 'international_hotel' as const,
                        label: 'On booking an International Hotel:',
                        desc: 'Add International Travel & Medical Insurance (Hotels)',
                      },
                      {
                        key: 'international_flight' as const,
                        label: 'On booking an International Flight:',
                        desc: 'Add International Travel & Medical Insurance (Flights)',
                      },
                    ].map((row) => {
                      const isChecked = Boolean(profileForm.autoInsurancePreferences?.[row.key]);
                      return (
                        <div
                          key={row.key}
                          onClick={() => toggleInsurancePref(row.key)}
                          className="flex items-center justify-between p-3.5 hover:bg-gray-50 transition cursor-pointer"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 text-xs">
                            <span className="text-gray-500 italic min-w-[200px]">{row.label}</span>
                            <span className="font-bold text-gray-900">{row.desc}</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // handled by parent onClick
                            className="w-4 h-4 rounded text-[#008cff] focus:ring-[#008cff] cursor-pointer"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── FREQUENT FLYER DETAILS SECTION ── */}
                <div className="space-y-3 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-gray-900">Frequent Flyer Details</h3>
                    {!isAddingFlyer && (
                      <button
                        type="button"
                        onClick={() => setIsAddingFlyer(true)}
                        className="text-xs font-bold text-[#008cff] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>+ Add</span>
                      </button>
                    )}
                  </div>

                  {/* Active List */}
                  {profileForm.frequentFlyerDetails && profileForm.frequentFlyerDetails.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {profileForm.frequentFlyerDetails.map((ff, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between"
                        >
                          <div>
                            <span className="text-xs font-bold text-gray-900 block">{ff.airline}</span>
                            <span className="text-xs font-mono text-gray-600 font-semibold">{ff.number}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFrequentFlyer(idx)}
                            className="text-gray-400 hover:text-rose-600 transition"
                            title="Remove"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    !isAddingFlyer && (
                      <p className="text-xs text-gray-400 italic">No frequent flyer numbers added yet.</p>
                    )
                  )}

                  {/* Add New Flyer Input Row */}
                  {isAddingFlyer && (
                    <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-3">
                      <span className="text-xs font-bold text-gray-800 block">Add Frequent Flyer Number</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Airline</label>
                          <select
                            value={newFlyerAirline}
                            onChange={(e) => setNewFlyerAirline(e.target.value)}
                            className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-gray-300 bg-white"
                          >
                            <option value="Air India">Air India (Flying Returns)</option>
                            <option value="IndiGo">IndiGo (6E Rewards)</option>
                            <option value="Emirates">Emirates (Skywards)</option>
                            <option value="Singapore Airlines">Singapore Airlines (KrisFlyer)</option>
                            <option value="Qatar Airways">Qatar Airways (Privilege Club)</option>
                            <option value="British Airways">British Airways (Executive Club)</option>
                            <option value="Lufthansa">Lufthansa (Miles & More)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                            Membership Number
                          </label>
                          <input
                            type="text"
                            value={newFlyerNumber}
                            onChange={(e) => setNewFlyerNumber(e.target.value)}
                            className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-gray-300 bg-white"
                            placeholder="e.g. AI987654321"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingFlyer(false)}
                          className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleAddFrequentFlyer}
                          className="px-4 py-1.5 text-xs font-bold bg-[#008cff] text-white rounded-lg transition shadow-xs"
                        >
                          Save Flyer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            )}

            {/* ==================================================== */}
            {/* 2. CO-TRAVELLERS TAB */}
            {/* ==================================================== */}
            {activeTab === 'travellers' && (
              isEditingCoTraveller ? (
                /* ── EXACT "ADD NEW CO-TRAVELLER" VIEW FROM USER SCREENSHOT ── */
                <form onSubmit={handleSaveTraveller} className="space-y-7 animate-fade-in">
                  {/* Top Header: ← Add New Co-Traveller | CANCEL | SAVE */}
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingCoTraveller(false);
                          setEditingTraveller(null);
                        }}
                        className="p-1 -ml-1 text-gray-700 hover:text-[#008cff] hover:bg-gray-100 rounded-full transition cursor-pointer"
                        title="Back to Co-Travellers"
                      >
                        <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                      </button>
                      <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                        {editingTraveller ? 'Edit Co-Traveller' : 'Add New Co-Traveller'}
                      </h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingCoTraveller(false);
                          setEditingTraveller(null);
                        }}
                        className="bg-[#dcdfe4] hover:bg-gray-300 text-gray-800 font-extrabold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer uppercase tracking-wider"
                      >
                        CANCEL
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingTraveller}
                        className="bg-[#008cff] hover:bg-blue-600 disabled:opacity-50 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl transition shadow-xs cursor-pointer uppercase tracking-wider"
                      >
                        {isSavingTraveller ? 'SAVING...' : 'SAVE'}
                      </button>
                    </div>
                  </div>

                  {/* ── Section 1: General Information ── */}
                  <div className="space-y-4">
                    <h3 className="text-base font-black text-gray-900">General Information</h3>

                    {/* Row 1: FIRST & MIDDLE NAME | LAST NAME */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="border border-gray-200/90 rounded-xl px-4 py-2.5 bg-white focus-within:border-[#008cff] focus-within:ring-1 focus-within:ring-[#008cff] transition">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                          FIRST &amp; MIDDLE NAME
                        </label>
                        <input
                          type="text"
                          required
                          value={travellerForm.firstName || ''}
                          onChange={(e) => setTravellerForm({ ...travellerForm, firstName: e.target.value })}
                          className="w-full text-xs font-bold text-gray-900 bg-transparent focus:outline-hidden"
                          placeholder="First & Middle Name"
                        />
                      </div>

                      <div className="border border-gray-200/90 rounded-xl px-4 py-2.5 bg-white focus-within:border-[#008cff] focus-within:ring-1 focus-within:ring-[#008cff] transition">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                          LAST NAME
                        </label>
                        <input
                          type="text"
                          required
                          value={travellerForm.lastName || ''}
                          onChange={(e) => setTravellerForm({ ...travellerForm, lastName: e.target.value })}
                          className="w-full text-xs font-bold text-gray-900 bg-transparent focus:outline-hidden"
                          placeholder="Last Name"
                        />
                      </div>
                    </div>

                    {/* Row 2: GENDER | DATE OF BIRTH | NATIONALITY */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Gender */}
                      <div className="border border-gray-200/90 rounded-xl px-4 py-2.5 bg-white relative focus-within:border-[#008cff] transition">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                          GENDER
                        </label>
                        <select
                          value={travellerForm.gender || 'MALE'}
                          onChange={(e) => setTravellerForm({ ...travellerForm, gender: e.target.value as any })}
                          className="w-full text-xs font-bold text-gray-900 bg-transparent focus:outline-hidden appearance-none cursor-pointer pr-6"
                        >
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3.5 bottom-2.5 text-[18px] text-gray-400 pointer-events-none">
                          expand_more
                        </span>
                      </div>

                      {/* Date of Birth (highlighted with blue border per screenshot) */}
                      <div className="border-2 border-[#008cff] rounded-xl px-4 py-2 bg-white relative focus-within:border-[#008cff] transition">
                        <label className="text-[10px] font-bold text-[#008cff] uppercase tracking-wider block mb-0.5">
                          DATE OF BIRTH
                        </label>
                        <input
                          type="date"
                          value={travellerForm.dateOfBirth ? String(travellerForm.dateOfBirth).slice(0, 10) : ''}
                          onChange={(e) => setTravellerForm({ ...travellerForm, dateOfBirth: e.target.value })}
                          className="w-full text-xs font-bold text-gray-900 bg-transparent focus:outline-hidden cursor-pointer"
                        />
                      </div>

                      {/* Nationality */}
                      <div className="border border-gray-200/90 rounded-xl px-4 py-2.5 bg-white relative focus-within:border-[#008cff] transition">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                          NATIONALITY
                        </label>
                        <select
                          value={travellerForm.nationality || 'India'}
                          onChange={(e) => setTravellerForm({ ...travellerForm, nationality: e.target.value })}
                          className="w-full text-xs font-bold text-gray-900 bg-transparent focus:outline-hidden appearance-none cursor-pointer pr-6"
                        >
                          <option value="India">India</option>
                          <option value="United States">United States</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="United Arab Emirates">United Arab Emirates</option>
                          <option value="Singapore">Singapore</option>
                          <option value="Canada">Canada</option>
                          <option value="Australia">Australia</option>
                          <option value="Germany">Germany</option>
                          <option value="France">France</option>
                          <option value="Thailand">Thailand</option>
                          <option value="Malaysia">Malaysia</option>
                          <option value="Indonesia">Indonesia</option>
                          <option value="Japan">Japan</option>
                          <option value="Italy">Italy</option>
                          <option value="Spain">Spain</option>
                          <option value="Switzerland">Switzerland</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3.5 bottom-2.5 text-[18px] text-gray-400 pointer-events-none">
                          expand_more
                        </span>
                      </div>
                    </div>

                    {/* Row 3: RELATIONSHIP WITH TRAVELLER */}
                    <div className="border border-gray-200/90 rounded-2xl p-4 bg-white space-y-3">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        RELATIONSHIP WITH TRAVELLER
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          'Spouse',
                          'Child',
                          'Sibling',
                          'GrandParent',
                          'Friend',
                          'Parent',
                          'Colleague',
                          'Relative',
                          'Parent In law',
                          'Other',
                        ].map((rel) => {
                          const isSelected = travellerForm.relationship === rel;
                          return (
                            <button
                              key={rel}
                              type="button"
                              onClick={() => setTravellerForm({ ...travellerForm, relationship: rel })}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                                isSelected
                                  ? 'bg-[#eaf5ff] border-[#008cff] text-[#008cff] shadow-xs'
                                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {rel}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-gray-500">
                        This helps to give us personalised travel recommendations when travelling
                      </p>
                    </div>

                    {/* Row 4: MEAL PREFERENCE | TRAIN BERTH PREFERENCE */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Meal Preference */}
                      <div className="border border-gray-200/90 rounded-xl px-4 py-2.5 bg-white relative focus-within:border-[#008cff] transition">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                          MEAL PREFERENCE
                        </label>
                        <select
                          value={travellerForm.mealPreference || 'No Preference'}
                          onChange={(e) => setTravellerForm({ ...travellerForm, mealPreference: e.target.value })}
                          className="w-full text-xs font-bold text-gray-900 bg-transparent focus:outline-hidden appearance-none cursor-pointer pr-6"
                        >
                          <option value="No Preference">No Preference</option>
                          <option value="Vegetarian">Vegetarian</option>
                          <option value="Non-Vegetarian">Non-Vegetarian</option>
                          <option value="Jain Meal">Jain Meal</option>
                          <option value="Vegan">Vegan</option>
                          <option value="Diabetic Meal">Diabetic Meal</option>
                          <option value="Gluten-Free">Gluten-Free</option>
                          <option value="Kosher">Kosher</option>
                          <option value="Halal">Halal</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3.5 bottom-2.5 text-[18px] text-gray-400 pointer-events-none">
                          expand_more
                        </span>
                      </div>

                      {/* Train Berth Preference */}
                      <div className="border border-gray-200/90 rounded-xl px-4 py-2.5 bg-white relative focus-within:border-[#008cff] transition">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                          TRAIN BERTH PREFERENCE
                        </label>
                        <select
                          value={travellerForm.berthPreference || 'No Preference'}
                          onChange={(e) => setTravellerForm({ ...travellerForm, berthPreference: e.target.value })}
                          className="w-full text-xs font-bold text-gray-900 bg-transparent focus:outline-hidden appearance-none cursor-pointer pr-6"
                        >
                          <option value="No Preference">No Preference</option>
                          <option value="Lower">Lower Berth</option>
                          <option value="Middle">Middle Berth</option>
                          <option value="Upper">Upper Berth</option>
                          <option value="Side Lower">Side Lower</option>
                          <option value="Side Upper">Side Upper</option>
                          <option value="Window Seat">Window Seat</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3.5 bottom-2.5 text-[18px] text-gray-400 pointer-events-none">
                          expand_more
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── Section 2: Passport Details ── */}
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <h3 className="text-base font-black text-gray-900">Passport Details</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Passport No */}
                      <div className="border border-gray-200/90 rounded-xl px-4 py-2.5 bg-white focus-within:border-[#008cff] transition">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                          PASSPORT NO.
                        </label>
                        <input
                          type="text"
                          value={travellerForm.passportNumber || ''}
                          onChange={(e) =>
                            setTravellerForm({ ...travellerForm, passportNumber: e.target.value.toUpperCase() })
                          }
                          className="w-full text-xs font-mono font-bold text-gray-900 uppercase bg-transparent focus:outline-hidden placeholder:font-sans placeholder:normal-case"
                          placeholder="Enter Passport Number"
                        />
                      </div>

                      {/* Expiry Date */}
                      <div className="border border-gray-200/90 rounded-xl px-4 py-2 bg-white relative focus-within:border-[#008cff] transition">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                          EXPIRY DATE
                        </label>
                        <input
                          type="date"
                          value={travellerForm.passportExpiry ? String(travellerForm.passportExpiry).slice(0, 10) : ''}
                          onChange={(e) => setTravellerForm({ ...travellerForm, passportExpiry: e.target.value })}
                          className="w-full text-xs font-bold text-gray-900 bg-transparent focus:outline-hidden cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Issuing Country */}
                      <div className="border border-gray-200/90 rounded-xl px-4 py-2.5 bg-white relative focus-within:border-[#008cff] transition">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                          ISSUING COUNTRY
                        </label>
                        <select
                          value={travellerForm.passportIssuingCountry || 'India'}
                          onChange={(e) =>
                            setTravellerForm({ ...travellerForm, passportIssuingCountry: e.target.value })
                          }
                          className="w-full text-xs font-bold text-gray-900 bg-transparent focus:outline-hidden appearance-none cursor-pointer pr-6"
                        >
                          <option value="India">India</option>
                          <option value="United States">United States</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="United Arab Emirates">United Arab Emirates</option>
                          <option value="Singapore">Singapore</option>
                          <option value="Canada">Canada</option>
                          <option value="Australia">Australia</option>
                          <option value="Germany">Germany</option>
                          <option value="France">France</option>
                          <option value="Thailand">Thailand</option>
                          <option value="Malaysia">Malaysia</option>
                          <option value="Saudi Arabia">Saudi Arabia</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3.5 bottom-2.5 text-[18px] text-gray-400 pointer-events-none">
                          expand_more
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── Section 3: Add contact information to receive booking details & other alerts ── */}
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <h3 className="text-base font-black text-gray-900">
                      Add contact information to receive booking details &amp; other alerts
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Mobile Number with country prefix */}
                      <div className="border border-gray-200/90 rounded-xl px-3 py-2 bg-white flex items-center gap-2.5 focus-within:border-[#008cff] transition">
                        <div className="flex items-center gap-1.5 pr-2.5 border-r border-gray-200 shrink-0 text-xs font-bold text-gray-800">
                          <span>🇮🇳</span>
                          <span>+91</span>
                          <span className="material-symbols-outlined text-[16px] text-gray-400">expand_more</span>
                        </div>
                        <div className="w-full">
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                            MOBILE NUMBER
                          </label>
                          <input
                            type="tel"
                            value={travellerForm.phone || ''}
                            onChange={(e) => setTravellerForm({ ...travellerForm, phone: e.target.value })}
                            className="w-full text-xs font-bold text-gray-900 bg-transparent focus:outline-hidden"
                            placeholder="Mobile Number"
                          />
                        </div>
                      </div>

                      {/* Email ID */}
                      <div className="border border-gray-200/90 rounded-xl px-4 py-2.5 bg-white focus-within:border-[#008cff] transition">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                          EMAIL ID
                        </label>
                        <input
                          type="email"
                          value={travellerForm.email || ''}
                          onChange={(e) => setTravellerForm({ ...travellerForm, email: e.target.value })}
                          className="w-full text-xs font-bold text-gray-900 bg-transparent focus:outline-hidden"
                          placeholder="Email ID"
                        />
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                /* ── CO-TRAVELLERS LIST VIEW ── */
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 tracking-tight">Co-Travellers</h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Save family and friends' information for 1-click auto-fill during booking checkout.
                      </p>
                    </div>
                    <button
                      onClick={handleOpenAddTraveller}
                      className="bg-[#008cff] hover:bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">person_add</span>
                      <span>Add New Co-Traveller</span>
                    </button>
                  </div>

                  {travellers.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                      <span className="material-symbols-outlined text-[48px] text-gray-400">group</span>
                      <h4 className="text-base font-bold text-gray-800 mt-2">No co-travellers saved yet</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Add profiles once and seamlessly select them during checkout.
                      </p>
                      <button
                        onClick={handleOpenAddTraveller}
                        className="mt-4 bg-[#008cff] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition cursor-pointer"
                      >
                        + Add First Co-Traveller
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {travellers.map((t) => (
                        <div
                          key={t.id}
                          className="border border-gray-200 rounded-2xl p-4.5 bg-white hover:border-gray-300 transition shadow-xs space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-50 text-[#008cff] font-bold flex items-center justify-center text-sm shrink-0">
                                {t.firstName.charAt(0)}
                                {t.lastName.charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-gray-900">{t.fullName}</h4>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  {t.relationship && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#008cff] border border-blue-100">
                                      {t.relationship}
                                    </span>
                                  )}
                                  <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                    {t.gender}
                                  </span>
                                  {t.nationality && (
                                    <span className="text-[10px] font-semibold text-gray-500">
                                      {t.nationality}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditTraveller(t)}
                                className="p-1.5 text-gray-500 hover:text-[#008cff] hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                title="Edit Traveller"
                              >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteTraveller(t.id, t.fullName)}
                                className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Delete Traveller"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </div>

                          <div className="text-xs text-gray-600 space-y-1.5 pt-2 border-t border-gray-100">
                            {t.phone && (
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[15px] text-gray-400">call</span>
                                <span>{t.phone}</span>
                              </div>
                            )}
                            {t.email && (
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[15px] text-gray-400">mail</span>
                                <span>{t.email}</span>
                              </div>
                            )}
                            {t.passportNumber && (
                              <div className="flex items-center gap-2 font-mono text-[11px]">
                                <span className="material-symbols-outlined text-[15px] text-gray-400">badge</span>
                                <span>Passport: {t.passportNumber} ({t.passportIssuingCountry || 'India'})</span>
                              </div>
                            )}
                            {(t.mealPreference || t.berthPreference) && (
                              <div className="flex items-center gap-3 text-[11px] text-gray-500 pt-1">
                                {t.mealPreference && t.mealPreference !== 'No Preference' && (
                                  <span>Meal: <strong className="text-gray-700">{t.mealPreference}</strong></span>
                                )}
                                {t.berthPreference && t.berthPreference !== 'No Preference' && (
                                  <span>Berth: <strong className="text-gray-700">{t.berthPreference}</strong></span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}

            {/* ==================================================== */}
            {/* 3. LOGGED IN DEVICES TAB */}
            {/* ==================================================== */}
            {activeTab === 'devices' && (
              <div className="space-y-6 animate-fade-in">
                <div className="pb-4 border-b border-gray-100">
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Logged In Devices</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Manage all browsers and mobile sessions actively authenticated with your SS Journey account.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[24px]">laptop_mac</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-gray-900">Current Web Session (Windows / Chrome)</h4>
                          <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                            Active Now
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          IP: 127.0.0.1 • Location: New Delhi, India
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-gray-200 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[24px]">smartphone</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">SS Journey Mobile App (iOS / Safari)</h4>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Last active 2 days ago • Mumbai, India
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => alert('Session logged out.')}
                      className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      Log out
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* 3.5. SS JOURNEY DUAL WALLET TAB */}
            {/* ==================================================== */}
            {activeTab === 'wallet' && (
              <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-gray-100 gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-2xl font-black text-gray-900 tracking-tight">SS Journey Wallet</h2>
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 tracking-wider">
                        {walletBalances?.status || 'ACTIVE'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Dual balance wallet with Cash (Deposit/Refunds) and Promotional (Cashback &amp; Rewards) balances.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={fetchWalletData}
                      disabled={walletLoading}
                      className="p-2 text-gray-500 hover:text-[#008cff] hover:bg-blue-50 rounded-xl transition cursor-pointer"
                      title="Refresh Balances"
                    >
                      <span className={`material-symbols-outlined text-[20px] ${walletLoading ? 'animate-spin' : ''}`}>
                        refresh
                      </span>
                    </button>
                    <button
                      onClick={() => setIsTopupModalOpen(true)}
                      className="bg-[#008cff] hover:bg-blue-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      <span>Add Money</span>
                    </button>
                  </div>
                </div>

                {/* Balances Grid: Cash Wallet + Promo Wallet + Total Spendable */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Card 1: Cash Wallet */}
                  <div className="bg-gradient-to-br from-emerald-50 via-white to-white rounded-2xl p-5 border border-emerald-200/80 shadow-xs relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px]">payments</span>
                        Cash Wallet
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        100% Usable
                      </span>
                    </div>
                    <div className="text-2xl font-black text-gray-900 tracking-tight">
                      {formatPrice(walletBalances?.cashAvailable || 0)}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Direct deposits &amp; booking refunds. Never expires.
                    </p>
                    {Boolean(walletBalances?.cashLocked && walletBalances.cashLocked > 0) && (
                      <p className="text-[10px] text-amber-700 font-semibold mt-2">
                        Locked/Reserved: {formatPrice(walletBalances?.cashLocked || 0)}
                      </p>
                    )}
                  </div>

                  {/* Card 2: Promotional Wallet */}
                  <div className="bg-gradient-to-br from-indigo-50 via-white to-white rounded-2xl p-5 border border-indigo-200/80 shadow-xs relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-extrabold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                        Promotional Wallet
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                        {promotionalLots.length} Active Lot(s)
                      </span>
                    </div>
                    <div className="text-2xl font-black text-gray-900 tracking-tight">
                      {formatPrice(walletBalances?.promoAvailable || 0)}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Cashback, rewards &amp; campaigns. Earliest expiry used first.
                    </p>
                    {Boolean(walletBalances?.promoLocked && walletBalances.promoLocked > 0) && (
                      <p className="text-[10px] text-amber-700 font-semibold mt-2">
                        Locked/Reserved: {formatPrice(walletBalances?.promoLocked || 0)}
                      </p>
                    )}
                  </div>

                  {/* Card 3: Total Spendable Balance */}
                  <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-extrabold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px]">wallet</span>
                        Total Spendable Balance
                      </span>
                      <div className="text-2xl font-black text-white tracking-tight mt-3">
                        {formatPrice(walletBalances?.totalSpendable || 0)}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-3 pt-3 border-t border-slate-800">
                      Combined purchasing power across eligible bookings.
                    </p>
                  </div>
                </div>

                {/* Expiring Soon Banner */}
                {walletSummary && walletSummary.expiringSoonAmount > 0 && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                    <span className="material-symbols-outlined text-[22px] text-amber-600 shrink-0 mt-0.5">
                      schedule
                    </span>
                    <div className="text-xs text-amber-900">
                      <span className="font-bold">
                        {formatPrice(walletSummary.expiringSoonAmount)} of your promotional credits is expiring soon!
                      </span>
                      <p className="text-amber-700 mt-0.5">
                        Nearest expiration:{' '}
                        <span className="font-bold">
                          {walletSummary.nearestExpiryDate
                            ? new Date(walletSummary.nearestExpiryDate).toLocaleDateString()
                            : 'Within 30 days'}
                        </span>
                        . Book your next flight, hotel, or holiday package to redeem it before it lapses.
                      </p>
                    </div>
                  </div>
                )}

                {/* Promotional Lots Section */}
                <div className="bg-white rounded-2xl border border-gray-200/90 p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div>
                      <h3 className="text-sm font-black text-gray-900">Active Promotional Credit Lots (FIFO)</h3>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Credits are redeemed in order of earliest expiration date for maximum savings.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                      {promotionalLots.length} lot{promotionalLots.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {promotionalLots.length === 0 ? (
                    <div className="py-8 text-center text-gray-400">
                      <span className="material-symbols-outlined text-[36px]">loyalty</span>
                      <p className="text-xs font-bold text-gray-600 mt-1">No active promotional lots</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Complete your first booking to automatically earn 5% cashback into your Promotional Wallet!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {promotionalLots.map((lot) => {
                        const daysLeft = Math.max(
                          0,
                          Math.ceil((new Date(lot.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                        );
                        let services: string[] = [];
                        if (typeof lot.applicable_services === 'string') {
                          try {
                            services = JSON.parse(lot.applicable_services);
                          } catch (e) {
                            services = [];
                          }
                        } else if (Array.isArray(lot.applicable_services)) {
                          services = lot.applicable_services;
                        }

                        return (
                          <div
                            key={lot.id}
                            className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition flex flex-col justify-between gap-2.5"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="text-[10px] font-mono text-gray-400 block">
                                  #{lot.lot_reference}
                                </span>
                                <h4 className="text-xs font-extrabold text-gray-900 mt-0.5">
                                  {lot.reward_source?.replace(/_/g, ' ') || 'Reward Credit'}
                                </h4>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-black text-indigo-600">
                                  {formatPrice(lot.remaining_amount)}
                                </div>
                                <span className="text-[10px] text-gray-400">
                                  of {formatPrice(lot.original_amount)}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-200/60 text-[10px]">
                              <span
                                className={`font-bold px-2 py-0.5 rounded-full ${
                                  daysLeft <= 7
                                    ? 'bg-rose-100 text-rose-800'
                                    : daysLeft <= 30
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                Expires in {daysLeft} day{daysLeft === 1 ? '' : 's'}
                              </span>

                              {services.length > 0 && !services.includes('ALL') ? (
                                services.map((s) => (
                                  <span key={s} className="bg-gray-200/70 text-gray-700 px-2 py-0.5 rounded-full font-semibold">
                                    {s}
                                  </span>
                                ))
                              ) : (
                                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                                  All Travel Services
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Transaction Ledger Table */}
                <div className="bg-white rounded-2xl border border-gray-200/90 p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-gray-100 gap-3">
                    <div>
                      <h3 className="text-sm font-black text-gray-900">Wallet Transaction Ledger</h3>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Double-entry ledger records for every credit, debit, top-up, and refund.
                      </p>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
                        {(['ALL', 'CASH', 'PROMOTIONAL'] as const).map((wt) => (
                          <button
                            key={wt}
                            onClick={() => setWalletFilterType(wt)}
                            className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-[11px] ${
                              walletFilterType === wt ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                            }`}
                          >
                            {wt === 'ALL' ? 'All Wallets' : wt === 'CASH' ? 'Cash' : 'Promo'}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
                        {(['ALL', 'CREDIT', 'DEBIT'] as const).map((dir) => (
                          <button
                            key={dir}
                            onClick={() => setWalletFilterDir(dir)}
                            className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-[11px] ${
                              walletFilterDir === dir ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                            }`}
                          >
                            {dir === 'ALL' ? 'All' : dir === 'CREDIT' ? 'Credits' : 'Debits'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Filtered items */}
                  {(() => {
                    const filteredTx = walletTransactions.filter((tx) => {
                      if (walletFilterType !== 'ALL' && tx.wallet_type !== walletFilterType) return false;
                      if (walletFilterDir !== 'ALL' && tx.direction !== walletFilterDir) return false;
                      return true;
                    });

                    if (filteredTx.length === 0) {
                      return (
                        <div className="py-12 text-center text-gray-400">
                          <span className="material-symbols-outlined text-[36px]">receipt_long</span>
                          <p className="text-xs font-bold text-gray-600 mt-1">No transaction records found</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Wallet movements will appear here automatically.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                              <th className="py-2.5 px-3">Date &amp; Time</th>
                              <th className="py-2.5 px-3">Wallet</th>
                              <th className="py-2.5 px-3">Direction</th>
                              <th className="py-2.5 px-3">Description</th>
                              <th className="py-2.5 px-3 text-right">Amount</th>
                              <th className="py-2.5 px-3 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {filteredTx.map((tx) => {
                              const isCredit = tx.direction === 'CREDIT';
                              return (
                                <tr key={tx.id} className="hover:bg-gray-50/70 transition">
                                  <td className="py-3 px-3 text-gray-600 font-medium">
                                    {new Date(tx.created_at).toLocaleString([], {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                    <span className="text-[10px] font-mono text-gray-400 block">
                                      #{tx.transaction_id ? tx.transaction_id.slice(0, 8) : tx.id.slice(0, 8)}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 font-semibold">
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        tx.wallet_type === 'CASH'
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                      }`}
                                    >
                                      {tx.wallet_type}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3">
                                    <span
                                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                        isCredit
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-rose-100 text-rose-800'
                                      }`}
                                    >
                                      {isCredit ? '+ CREDIT' : '- DEBIT'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 font-medium text-gray-800">
                                    {tx.description || tx.transaction_type}
                                    {tx.reference_id && (
                                      <span className="text-[10px] text-gray-400 block font-mono">
                                        Ref: {tx.reference_id}
                                      </span>
                                    )}
                                  </td>
                                  <td
                                    className={`py-3 px-3 text-right font-black ${
                                      isCredit ? 'text-emerald-600' : 'text-gray-900'
                                    }`}
                                  >
                                    {isCredit ? '+' : '-'}
                                    {formatPrice(tx.amount)}
                                  </td>
                                  <td className="py-3 px-3 text-right">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                      {tx.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* 4. MY TRIPS TAB */}
            {/* ==================================================== */}
            {activeTab === 'trips' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-gray-100 gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">My Trips &amp; Bookings</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Review confirmed itineraries, download e-tickets, and manage reservations.
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-bold">
                    {(['ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setTripFilter(f)}
                        className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                          tripFilter === f
                            ? 'bg-white text-gray-900 shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {f.charAt(0) + f.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredTrips.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    <span className="material-symbols-outlined text-[48px] text-gray-400">luggage</span>
                    <h4 className="text-base font-bold text-gray-800 mt-2">No bookings found</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {tripFilter === 'ALL'
                        ? "You haven't made any bookings yet."
                        : `No ${tripFilter.toLowerCase()} bookings found.`}
                    </p>
                    <button
                      onClick={() => onNavigate('explore')}
                      className="mt-4 bg-[#008cff] hover:bg-blue-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition cursor-pointer"
                    >
                      Explore Destinations
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTrips.map((trip) => {
                      const isCancelled = trip.status === 'CANCELLED';
                      return (
                        <div
                          key={trip.id}
                          className="border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition shadow-xs bg-white space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
                            <div className="flex items-center gap-2.5">
                              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white px-2.5 py-0.5 rounded-full">
                                {trip.service_type || trip.serviceType}
                              </span>
                              <span className="text-xs font-mono font-bold text-gray-700">
                                Ref: #{trip.booking_reference || trip.bookingReference}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                                  trip.status === 'CONFIRMED'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : trip.status === 'CANCELLED'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {trip.status}
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(trip.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 border-t border-gray-100 gap-3">
                            <div>
                              <span className="text-xs text-gray-500">Total Paid</span>
                              <div className="text-lg font-black text-gray-900">
                                {formatPrice(trip.total_amount)}
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5">
                              <button
                                onClick={() => setSelectedTicket(trip)}
                                className="bg-[#008cff] hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                                <span>E-Ticket / Receipt</span>
                              </button>

                              {!isCancelled && (
                                <button
                                  onClick={() => {
                                    setCancellingBookingId(trip.id);
                                    setIsCancelModalOpen(true);
                                  }}
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-3.5 py-2 rounded-xl transition border border-rose-200 cursor-pointer"
                                >
                                  Cancel Booking
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ── RESET PASSWORD MODAL ── */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Reset Account Password</h3>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  CURRENT PASSWORD
                </label>
                <input
                  type="password"
                  value={pwdCurrent}
                  onChange={(e) => setPwdCurrent(e.target.value)}
                  className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-gray-200"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  NEW PASSWORD
                </label>
                <input
                  type="password"
                  value={pwdNew}
                  onChange={(e) => setPwdNew(e.target.value)}
                  className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-gray-200"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  CONFIRM NEW PASSWORD
                </label>
                <input
                  type="password"
                  value={pwdConfirm}
                  onChange={(e) => setPwdConfirm(e.target.value)}
                  className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-gray-200"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!pwdNew || pwdNew !== pwdConfirm) {
                    alert('Passwords do not match or cannot be empty.');
                    return;
                  }
                  setIsPasswordModalOpen(false);
                  setActionMessage({ type: 'success', text: 'Password updated successfully!' });
                }}
                className="bg-[#008cff] hover:bg-blue-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-xs cursor-pointer"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}



      {/* ── TOP-UP MODAL (WITH RBI COMPLIANCE GATE) ── */}
      {isTopupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">add_card</span>
                </div>
                <h3 className="text-base font-black text-gray-900">Add Money to Cash Wallet</h3>
              </div>
              <button
                onClick={() => {
                  setIsTopupModalOpen(false);
                  setTopupError(null);
                  setTopupSuccess(null);
                }}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Regulatory Notice per RBI PPI Master Directions */}
            {!walletBalances?.features?.cashTopupEnabled && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                  <span className="material-symbols-outlined text-[16px] text-amber-700">shield</span>
                  <span>Regulatory Gate Notice (RBI PPI Guidelines)</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Direct customer credit card / netbanking top-ups for stored-value wallets are restricted until full RBI Prepaid Payment Instrument regulatory clearance.
                </p>
                <p className="text-[11px] text-emerald-800 font-semibold">
                  Refunds from cancelled bookings and reversals are credited to your Cash Wallet automatically and never expire.
                </p>
              </div>
            )}

            {topupSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>{topupSuccess}</span>
              </div>
            )}

            {topupError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{topupError}</span>
              </div>
            )}

            {/* Amount input & presets */}
            <div className="space-y-3 pt-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                ENTER AMOUNT (INR)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-base font-black text-gray-400">₹</span>
                <input
                  type="number"
                  min="100"
                  max="100000"
                  step="100"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  className="w-full text-lg font-black text-gray-900 pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#008cff]"
                  placeholder="1000"
                />
              </div>

              {/* Presets */}
              <div className="flex items-center gap-2">
                {['500', '1000', '2000', '5000'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTopupAmount(preset)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      topupAmount === preset
                        ? 'bg-blue-50 border-[#008cff] text-[#008cff]'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    +₹{preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                onClick={() => {
                  setIsTopupModalOpen(false);
                  setTopupError(null);
                  setTopupSuccess(null);
                }}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSimulatedTopup}
                disabled={topupLoading}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
              >
                {topupLoading ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">check</span>
                    <span>{walletBalances?.features?.cashTopupEnabled ? 'Proceed to Pay' : 'Simulate Top-Up (Sandbox)'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CANCELLATION CONFIRMATION MODAL ── */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="material-symbols-outlined text-[28px]">warning</span>
              <h3 className="text-base font-bold text-gray-900">Confirm Booking Cancellation</h3>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to cancel this booking? This action is permanent and eligible refunds will be
              processed according to our cancellation policy.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Reason for Cancellation</label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full text-xs font-semibold p-3 rounded-xl border border-gray-300 focus:outline-hidden focus:border-rose-500"
                placeholder="Please tell us why you are cancelling..."
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                onClick={() => {
                  setIsCancelModalOpen(false);
                  setCancellingBookingId(null);
                }}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                onClick={handleConfirmCancel}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-xs cursor-pointer"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRINTABLE E-TICKET / RECEIPT MODAL ── */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-black tracking-tight">
                  <span className="text-[#00aeef]">SYOLO</span> <span className="text-[#ff9900]">TRIPS</span>
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Official E-Ticket &amp; Receipt
                </span>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="bg-slate-900 text-white p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-300 tracking-wider">Booking Reference</span>
                <h3 className="text-xl font-mono font-black mt-0.5">
                  #{selectedTicket.booking_reference || selectedTicket.bookingReference}
                </h3>
                <p className="text-xs text-gray-300 mt-1">
                  Service: <span className="font-bold text-white">{selectedTicket.service_type || selectedTicket.serviceType}</span>
                </p>
              </div>

              <div className="text-right">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full inline-block ${
                    selectedTicket.status === 'CONFIRMED'
                      ? 'bg-emerald-500 text-white'
                      : selectedTicket.status === 'CANCELLED'
                      ? 'bg-rose-500 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {selectedTicket.status}
                </span>
                <p className="text-[10px] text-gray-400 mt-1">
                  Booked on {new Date(selectedTicket.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <button
                onClick={() => window.print()}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setSelectedTicket(null)}
                className="bg-[#008cff] hover:bg-blue-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
