import React, { useState, useEffect } from 'react';
import {
  getCustomerDashboardSummaryApi,
  getCustomerProfileApi,
  updateCustomerProfileApi,
  getSavedTravellersApi,
  createSavedTravellerApi,
  updateSavedTravellerApi,
  deleteSavedTravellerApi,
  getCustomerPaymentsApi,
  getMyTripsApi,
  cancelBookingApi,
  CustomerDashboardSummary,
  CustomerProfileData,
  SavedTraveller,
  CustomerPaymentItem,
  UserProfile,
} from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { useWishlist, WishlistItem } from '../context/WishlistContext';
import { WebCheckoutItem } from './BookingCheckoutPage';

export type DashboardSubTab = 'overview' | 'trips' | 'wishlist' | 'travellers' | 'payments' | 'profile' | 'support';

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
  onInitiateCheckout,
  initialTab = 'overview',
  currentUser,
  onLogout,
}) => {
  const { formatPrice } = useCurrency();
  const { wishlist: wishlistItems, removeFromWishlist } = useWishlist();

  const [activeTab, setActiveTab] = useState<DashboardSubTab>(initialTab);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<CustomerDashboardSummary | null>(null);
  const [profile, setProfile] = useState<CustomerProfileData | null>(null);
  const [travellers, setTravellers] = useState<SavedTraveller[]>([]);
  const [payments, setPayments] = useState<CustomerPaymentItem[]>([]);
  const [trips, setTrips] = useState<any[]>([]);

  // Trips filter & cancellation state
  const [tripFilter, setTripFilter] = useState<'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('Change of travel plans');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile edit state
  const [profileForm, setProfileForm] = useState<Partial<CustomerProfileData>>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Traveller edit/modal state
  const [isTravellerModalOpen, setIsTravellerModalOpen] = useState(false);
  const [editingTraveller, setEditingTraveller] = useState<SavedTraveller | null>(null);
  const [travellerForm, setTravellerForm] = useState<Partial<SavedTraveller>>({
    title: 'Mr',
    firstName: '',
    lastName: '',
    gender: 'MALE',
    passengerType: 'ADULT',
    phone: '',
    email: '',
    passportNumber: '',
    nationality: 'Indian',
    mealPreference: '',
    seatPreference: '',
  });

  // Load initial data
  const loadDashboardData = async () => {
    setIsLoading(true);
    setActionMessage(null);
    try {
      const [sumData, profData, travData, payData, tripsData] = await Promise.allSettled([
        getCustomerDashboardSummaryApi(),
        getCustomerProfileApi(),
        getSavedTravellersApi(),
        getCustomerPaymentsApi(),
        getMyTripsApi(),
      ]);

      if (sumData.status === 'fulfilled') setSummary(sumData.value);
      if (profData.status === 'fulfilled') {
        setProfile(profData.value);
        setProfileForm({ ...profData.value });
      }
      if (travData.status === 'fulfilled') setTravellers(travData.value);
      if (payData.status === 'fulfilled') setPayments(payData.value);
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
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setActionMessage(null);
    try {
      const updated = await updateCustomerProfileApi(profileForm);
      setProfile(updated);
      setProfileForm({ ...updated });
      setActionMessage({ type: 'success', text: 'Profile updated successfully!' });
      // Refresh summary to update completion score
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

  // Handle Traveller Add / Update
  const handleOpenTravellerModal = (traveller?: SavedTraveller) => {
    if (traveller) {
      setEditingTraveller(traveller);
      setTravellerForm({ ...traveller });
    } else {
      setEditingTraveller(null);
      setTravellerForm({
        title: 'Mr',
        firstName: '',
        lastName: '',
        gender: 'MALE',
        passengerType: 'ADULT',
        phone: '',
        email: '',
        passportNumber: '',
        nationality: 'Indian',
        mealPreference: '',
        seatPreference: '',
      });
    }
    setIsTravellerModalOpen(true);
  };

  const handleSaveTraveller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!travellerForm.firstName || !travellerForm.lastName) {
      alert('First name and Last name are required');
      return;
    }
    try {
      if (editingTraveller) {
        await updateSavedTravellerApi(editingTraveller.id, travellerForm);
      } else {
        await createSavedTravellerApi(travellerForm);
      }
      setIsTravellerModalOpen(false);
      const updatedTravellers = await getSavedTravellersApi();
      setTravellers(updatedTravellers);
      setActionMessage({
        type: 'success',
        text: editingTraveller ? 'Traveller updated successfully!' : 'Traveller added successfully!',
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save traveller');
    }
  };

  const handleDeleteTraveller = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from saved travellers?`)) return;
    try {
      await deleteSavedTravellerApi(id);
      setTravellers((prev) => prev.filter((t) => t.id !== id));
      setActionMessage({ type: 'success', text: 'Traveller removed.' });
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

  // Filter trips
  const filteredTrips = trips.filter((t) => {
    if (tripFilter === 'ALL') return true;
    if (tripFilter === 'UPCOMING') return t.status === 'CONFIRMED' || t.status === 'PENDING';
    if (tripFilter === 'COMPLETED') return t.status === 'COMPLETED';
    if (tripFilter === 'CANCELLED') return t.status === 'CANCELLED';
    return true;
  });

  // Calculate greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const userDisplayName =
    profile?.fullName || currentUser?.fullName || profile?.email?.split('@')[0] || 'Traveler';

  if (isLoading && !summary && !profile) {
    return (
      <div className="w-full bg-[#f8fafc] min-h-[70vh] flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#008cff]/20 border-t-[#008cff] rounded-full animate-spin" />
          <p className="text-xs font-bold text-gray-500">Loading your SS Journey travel portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#f8fafc] min-h-[85vh] py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1300px] mx-auto">
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
              className="p-1 hover:bg-black/5 rounded-full transition"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}

        {/* Main Grid: Sidebar (3 cols) + Content (9 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ── LEFT SIDEBAR ── */}
          <aside className="lg:col-span-3 bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden sticky top-24">
            {/* User Profile Mini Badge */}
            <div className="p-5 bg-gradient-to-br from-[#1a2035] to-[#252e4b] text-white">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#00c988] to-teal-400 flex items-center justify-center text-lg font-black text-white shadow-md shrink-0">
                  {userDisplayName.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-bold text-sm text-white truncate">{userDisplayName}</h3>
                  <p className="text-xs text-gray-300 truncate mt-0.5">{profile?.email || currentUser?.email}</p>
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Verified Customer
                  </span>
                </div>
              </div>
            </div>

            {/* Nav Menu */}
            <nav className="p-3 space-y-1">
              {[
                { id: 'overview' as const, label: 'Overview', icon: 'dashboard', badge: null },
                { id: 'trips' as const, label: 'My Trips & Bookings', icon: 'luggage', badge: trips.length },
                { id: 'wishlist' as const, label: 'My Wishlist', icon: 'favorite', badge: wishlistItems.length },
                { id: 'travellers' as const, label: 'Saved Travellers', icon: 'group', badge: travellers.length },
                { id: 'payments' as const, label: 'Payment History', icon: 'credit_card', badge: payments.length },
                { id: 'profile' as const, label: 'Profile Settings', icon: 'manage_accounts', badge: null },
                { id: 'support' as const, label: 'Help & Support', icon: 'contact_support', badge: null },
              ].map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#008cff] text-white shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`material-symbols-outlined text-[20px] ${
                          isActive ? 'text-white' : 'text-gray-500'
                        }`}
                        style={item.id === 'wishlist' ? { fontVariationSettings: "'FILL' 1" } : {}}
                      >
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== null && item.badge > 0 && (
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                          isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              <div className="my-2 border-t border-gray-100" />

              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                <span>Sign Out</span>
              </button>
            </nav>
          </aside>

          {/* ── RIGHT MAIN CONTENT ── */}
          <main className="lg:col-span-9 space-y-6">
            {/* ==================================================== */}
            {/* TAB 1: OVERVIEW */}
            {/* ==================================================== */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Welcome Card & Profile Meter */}
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-[#1a2035] text-white p-6 sm:p-8 rounded-2xl shadow-md relative overflow-hidden">
                  <div className="relative z-10 max-w-xl">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-blue-200">
                      Customer Portal
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black mt-1">
                      {getGreeting()}, {userDisplayName}!
                    </h2>
                    <p className="text-xs sm:text-sm text-blue-100/90 mt-2 leading-relaxed">
                      Manage all your travel bookings, download confirmed e-tickets, organize saved co-travellers, and
                      review your transactions across SS Journey.
                    </p>

                    {/* Profile Meter */}
                    <div className="mt-5 pt-4 border-t border-white/20">
                      <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                        <span className="text-blue-100">Profile Completion</span>
                        <span className="text-emerald-300">
                          {summary?.metrics.profileCompletionPercent || 65}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full transition-all duration-500"
                          style={{
                            width: `${summary?.metrics.profileCompletionPercent || 65}%`,
                          }}
                        />
                      </div>
                      {(summary?.metrics.profileCompletionPercent || 65) < 100 && (
                        <button
                          onClick={() => setActiveTab('profile')}
                          className="mt-3 text-xs font-bold text-white bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition inline-flex items-center gap-1"
                        >
                          Complete Profile details →
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    {
                      label: 'Upcoming Trips',
                      value: summary?.metrics.upcomingTrips || 0,
                      icon: 'flight_takeoff',
                      color: 'text-blue-600',
                      bg: 'bg-blue-50',
                      onClick: () => {
                        setActiveTab('trips');
                        setTripFilter('UPCOMING');
                      },
                    },
                    {
                      label: 'Total Bookings',
                      value: summary?.metrics.totalBookings || trips.length,
                      icon: 'confirmation_number',
                      color: 'text-indigo-600',
                      bg: 'bg-indigo-50',
                      onClick: () => setActiveTab('trips'),
                    },
                    {
                      label: 'Saved in Wishlist',
                      value: summary?.metrics.wishlistCount || wishlistItems.length,
                      icon: 'favorite',
                      color: 'text-rose-600',
                      bg: 'bg-rose-50',
                      onClick: () => setActiveTab('wishlist'),
                    },
                    {
                      label: 'Saved Travellers',
                      value: summary?.metrics.savedTravellersCount || travellers.length,
                      icon: 'badge',
                      color: 'text-emerald-600',
                      bg: 'bg-emerald-50',
                      onClick: () => setActiveTab('travellers'),
                    },
                  ].map((m, idx) => (
                    <div
                      key={idx}
                      onClick={m.onClick}
                      className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className={`w-10 h-10 rounded-xl ${m.bg} ${m.color} flex items-center justify-center`}>
                          <span className="material-symbols-outlined text-[22px]">{m.icon}</span>
                        </span>
                        <span className="material-symbols-outlined text-gray-300 group-hover:text-gray-500 transition text-[18px]">
                          arrow_forward
                        </span>
                      </div>
                      <div className="text-2xl font-black text-gray-900 leading-none">{m.value}</div>
                      <p className="text-xs font-semibold text-gray-500 mt-1">{m.label}</p>
                    </div>
                  ))}
                </div>

                {/* Upcoming Trip Spotlight Card */}
                <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#008cff]">event_upcoming</span>
                      <span>Next Upcoming Journey</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('trips')}
                      className="text-xs font-bold text-[#008cff] hover:underline"
                    >
                      View All Trips →
                    </button>
                  </div>

                  {summary?.upcomingTrip ? (
                    <div className="bg-gradient-to-r from-blue-50/70 to-slate-50 border border-blue-100 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-[#008cff] text-white px-2.5 py-0.5 rounded-full">
                            {summary.upcomingTrip.serviceType}
                          </span>
                          <span className="text-xs font-mono font-bold text-gray-600">
                            Ref: #{summary.upcomingTrip.bookingReference}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-gray-900">
                          {summary.upcomingTrip.items?.[0]?.title ||
                            `${summary.upcomingTrip.serviceType} Booking`}
                        </h4>
                        <p className="text-xs text-gray-600 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-gray-400">calendar_month</span>
                          <span>
                            {summary.upcomingTrip.checkInDate ||
                              new Date(summary.upcomingTrip.createdAt).toLocaleDateString()}
                          </span>
                          {summary.upcomingTrip.guestName && (
                            <>
                              <span>•</span>
                              <span>Traveler: {summary.upcomingTrip.guestName}</span>
                            </>
                          )}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-lg font-black text-gray-900">
                            {formatPrice(summary.upcomingTrip.totalAmount)}
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {summary.upcomingTrip.status}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            const match = trips.find((t) => t.id === summary.upcomingTrip?.id);
                            if (match) setSelectedTicket(match);
                            else setActiveTab('trips');
                          }}
                          className="bg-[#008cff] hover:bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                          <span>View Ticket</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50/60 rounded-2xl border border-dashed border-gray-200">
                      <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 mx-auto flex items-center justify-center mb-2">
                        <span className="material-symbols-outlined text-[24px]">flight_takeoff</span>
                      </div>
                      <p className="text-sm font-bold text-gray-800">No upcoming trips scheduled</p>
                      <p className="text-xs text-gray-500 mt-1">Ready for your next adventure?</p>
                      <div className="flex items-center justify-center gap-3 mt-4">
                        <button
                          onClick={() => onNavigate('flights')}
                          className="bg-[#008cff] hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
                        >
                          Search Flights
                        </button>
                        <button
                          onClick={() => onNavigate('hotels')}
                          className="bg-white border border-gray-300 hover:border-gray-400 text-gray-800 text-xs font-bold px-4 py-2 rounded-xl transition"
                        >
                          Explore Hotels
                        </button>
                        <button
                          onClick={() => onNavigate('packages')}
                          className="bg-white border border-gray-300 hover:border-gray-400 text-gray-800 text-xs font-bold px-4 py-2 rounded-xl transition"
                        >
                          Holiday Packages
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Service Links Grid */}
                <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs">
                  <h3 className="text-base font-bold text-gray-900 mb-4">Explore SS Journey Travel Services</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                      { label: 'Flights', icon: 'flight', screen: 'flights', color: 'text-sky-500' },
                      { label: 'Hotels', icon: 'hotel', screen: 'hotels', color: 'text-indigo-500' },
                      { label: 'Villas', icon: 'villa', screen: 'explore', color: 'text-teal-500' },
                      { label: 'Packages', icon: 'beach_access', screen: 'packages', color: 'text-rose-500' },
                      { label: 'Trains', icon: 'train', screen: 'trains', color: 'text-emerald-500' },
                      { label: 'Buses', icon: 'directions_bus', screen: 'buses', color: 'text-purple-500' },
                      { label: 'Cabs', icon: 'local_taxi', screen: 'cabs', color: 'text-amber-500' },
                      { label: 'Tours', icon: 'tour', screen: 'explore', color: 'text-cyan-500' },
                      { label: 'Visa', icon: 'badge', screen: 'explore', color: 'text-violet-500' },
                      { label: 'Insurance', icon: 'health_and_safety', screen: 'explore', color: 'text-emerald-600' },
                    ].map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => onNavigate(s.screen)}
                        className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-100 hover:border-[#008cff]/30 hover:bg-blue-50/40 transition group"
                      >
                        <span className={`material-symbols-outlined text-[24px] ${s.color} group-hover:scale-110 transition-transform`}>
                          {s.icon}
                        </span>
                        <span className="text-xs font-semibold text-gray-700 mt-1.5">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* TAB 2: MY TRIPS & BOOKINGS */}
            {/* ==================================================== */}
            {activeTab === 'trips' && (
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-gray-900">My Trips & Bookings</h3>
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
                        className={`px-3 py-1.5 rounded-lg transition ${
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

                {/* Trips List */}
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
                      className="mt-4 bg-[#008cff] hover:bg-blue-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition"
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

                          {/* Items Details */}
                          <div className="space-y-2">
                            {(trip.items || []).map((item: any, iIdx: number) => (
                              <div key={iIdx} className="flex items-start justify-between gap-4">
                                <div>
                                  <h4 className="text-sm font-bold text-gray-900">{item.title}</h4>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {item.check_in_date && (
                                      <span>Dates: {item.check_in_date} {item.check_out_date ? `to ${item.check_out_date}` : ''}</span>
                                    )}
                                  </p>
                                </div>
                                <span className="text-xs font-bold text-gray-700">
                                  Qty: {item.quantity || 1}
                                </span>
                              </div>
                            ))}
                            {(!trip.items || trip.items.length === 0) && (
                              <p className="text-sm font-bold text-gray-800">
                                {trip.service_type || trip.serviceType} Reservation
                              </p>
                            )}
                          </div>

                          {/* Passengers Summary */}
                          {trip.passengers && trip.passengers.length > 0 && (
                            <div className="bg-gray-50 p-3 rounded-xl text-xs text-gray-700 flex flex-wrap items-center gap-2">
                              <span className="font-bold text-gray-500">Travelers:</span>
                              {trip.passengers.map((p: any, pIdx: number) => (
                                <span
                                  key={pIdx}
                                  className="bg-white px-2 py-0.5 rounded border border-gray-200 font-medium"
                                >
                                  {p.title} {p.first_name} {p.last_name} ({p.passenger_type})
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Total & Action Bar */}
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
                                className="bg-[#008cff] hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5"
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
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-3.5 py-2 rounded-xl transition border border-rose-200"
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

            {/* ==================================================== */}
            {/* TAB 3: WISHLIST */}
            {/* ==================================================== */}
            {activeTab === 'wishlist' && (
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs space-y-6">
                <div>
                  <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-rose-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                      favorite
                    </span>
                    <span>My Saved Wishlist</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Your shortlisted luxury hotels, holiday packages, and handpicked villas.
                  </p>
                </div>

                {wishlistItems.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    <span className="material-symbols-outlined text-[48px] text-rose-300">favorite_border</span>
                    <h4 className="text-base font-bold text-gray-800 mt-2">Your wishlist is empty</h4>
                    <p className="text-xs text-gray-500 mt-1">Explore stays and tap the heart icon to save them.</p>
                    <button
                      onClick={() => onNavigate('hotels')}
                      className="mt-4 bg-[#008cff] hover:bg-blue-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition"
                    >
                      Browse Hotels
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {wishlistItems.map((item: WishlistItem) => (
                      <div
                        key={item.id}
                        className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition bg-white flex flex-col justify-between"
                      >
                        <div className="relative h-44 overflow-hidden bg-gray-100">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {item.category}
                          </span>
                          <button
                            onClick={() => removeFromWishlist(item.id)}
                            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-rose-600 flex items-center justify-center shadow-xs transition"
                            title="Remove from wishlist"
                          >
                            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                              favorite
                            </span>
                          </button>
                        </div>

                        <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                              <span>{item.location || 'India'}</span>
                              {item.rating && (
                                <span className="font-bold text-amber-600 flex items-center gap-0.5">
                                  ★ {item.rating}
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{item.title}</h4>
                            {item.badge && <p className="text-xs text-blue-600 font-semibold">{item.badge}</p>}
                          </div>

                          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-gray-400 block leading-none">Starting from</span>
                              <span className="text-base font-black text-gray-900 leading-tight">
                                {formatPrice(item.price)}
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                if (onInitiateCheckout) {
                                  onInitiateCheckout({
                                    serviceType: (item.category as any) || 'HOTEL',
                                    itemId: item.id,
                                    title: item.title,
                                    subtitle: item.location || '',
                                    pricing: {
                                      baseAmount: item.price,
                                      taxes: Math.round(item.price * 0.12),
                                    },
                                  });
                                }
                              }}
                              className="bg-[#008cff] hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs"
                            >
                              Book Now
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ==================================================== */}
            {/* TAB 4: SAVED TRAVELLERS */}
            {/* ==================================================== */}
            {activeTab === 'travellers' && (
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-black text-gray-900">Saved Travellers</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Save family and friends' information for 1-click auto-fill during flight, hotel, and train checkout.
                    </p>
                  </div>

                  <button
                    onClick={() => handleOpenTravellerModal()}
                    className="bg-[#008cff] hover:bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                    <span>Add New Traveller</span>
                  </button>
                </div>

                {travellers.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    <span className="material-symbols-outlined text-[48px] text-gray-400">group</span>
                    <h4 className="text-base font-bold text-gray-800 mt-2">No saved travellers yet</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Add profiles once and seamlessly select them during checkout.
                    </p>
                    <button
                      onClick={() => handleOpenTravellerModal()}
                      className="mt-4 bg-[#008cff] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition"
                    >
                      + Add First Traveller
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
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#008cff] font-bold flex items-center justify-center text-sm">
                              {t.firstName.charAt(0)}
                              {t.lastName.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">{t.fullName}</h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                  {t.passengerType}
                                </span>
                                <span className="text-xs text-gray-500">{t.gender}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenTravellerModal(t)}
                              className="p-1.5 text-gray-500 hover:text-[#008cff] hover:bg-blue-50 rounded-lg transition"
                              title="Edit Traveller"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteTraveller(t.id, t.fullName)}
                              className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Delete Traveller"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </div>

                        <div className="text-xs text-gray-600 space-y-1 pt-2 border-t border-gray-100">
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
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[15px] text-gray-400">badge</span>
                              <span>Passport: {t.passportNumber}</span>
                            </div>
                          )}
                          {t.seatPreference && (
                            <div className="flex items-center gap-2 text-[11px] text-gray-500">
                              <span>Seat: {t.seatPreference}</span>
                              {t.mealPreference && <span>• Meal: {t.mealPreference}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ==================================================== */}
            {/* TAB 5: PAYMENT HISTORY */}
            {/* ==================================================== */}
            {activeTab === 'payments' && (
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs space-y-6">
                <div>
                  <h3 className="text-xl font-black text-gray-900">Payment & Transaction History</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Real transactions recorded for your account via cards, UPI, and simulated gateways.
                  </p>
                </div>

                {payments.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    <span className="material-symbols-outlined text-[48px] text-gray-400">receipt</span>
                    <h4 className="text-base font-bold text-gray-800 mt-2">No payment transactions found</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Payments made on confirmed bookings will automatically appear here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px] bg-gray-50/80">
                          <th className="p-3.5">Payment Reference</th>
                          <th className="p-3.5">Booking Details</th>
                          <th className="p-3.5">Method</th>
                          <th className="p-3.5">Date</th>
                          <th className="p-3.5">Amount</th>
                          <th className="p-3.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {payments.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50/60 transition">
                            <td className="p-3.5 font-mono font-bold text-gray-900">
                              {p.paymentReference}
                              {p.isDemo && (
                                <span className="ml-1.5 text-[9px] bg-amber-50 text-amber-700 font-sans px-1.5 py-0.5 rounded font-semibold border border-amber-200">
                                  Demo
                                </span>
                              )}
                            </td>
                            <td className="p-3.5">
                              <span className="font-bold text-gray-900 block">
                                #{p.booking?.bookingReference}
                              </span>
                              <span className="text-gray-500 text-[11px]">
                                {p.booking?.serviceType}
                              </span>
                            </td>
                            <td className="p-3.5 text-gray-700 font-medium">{p.paymentMethod}</td>
                            <td className="p-3.5 text-gray-500">
                              {new Date(p.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-3.5 font-black text-gray-900 text-sm">
                              {formatPrice(p.amount)}
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                                  p.status === 'SUCCESS' || p.status === 'PAID'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ==================================================== */}
            {/* TAB 6: PROFILE SETTINGS */}
            {/* ==================================================== */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs space-y-6">
                <div>
                  <h3 className="text-xl font-black text-gray-900">Profile Settings</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Update personal contact information, billing address, and emergency details.
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-6">
                  {/* Basic Personal Info */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Personal Information
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={profileForm.fullName || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                          className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#008cff] focus:ring-1 focus:ring-[#008cff]"
                          placeholder="e.g. Rahul Sharma"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          disabled
                          value={profile?.email || ''}
                          className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                        />
                        <span className="text-[10px] text-gray-400 mt-0.5 block">Email cannot be changed directly</span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                        <input
                          type="text"
                          value={profileForm.phone || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#008cff] focus:ring-1 focus:ring-[#008cff]"
                          placeholder="+91 98765 43210"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Gender</label>
                          <select
                            value={profileForm.gender || 'MALE'}
                            onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                            className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#008cff]"
                          >
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Date of Birth</label>
                          <input
                            type="date"
                            value={profileForm.dateOfBirth ? String(profileForm.dateOfBirth).slice(0, 10) : ''}
                            onChange={(e) => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
                            className="w-full text-xs font-semibold px-2 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#008cff]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Address Info */}
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Residential / Billing Address
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Street Address</label>
                        <input
                          type="text"
                          value={profileForm.address || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                          className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#008cff]"
                          placeholder="e.g. 402 Palm Grove Enclave, Sector 45"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">City</label>
                        <input
                          type="text"
                          value={profileForm.city || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                          className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#008cff]"
                          placeholder="e.g. Gurugram"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">State</label>
                          <input
                            type="text"
                            value={profileForm.state || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                            className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#008cff]"
                            placeholder="Haryana"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Pincode</label>
                          <input
                            type="text"
                            value={profileForm.pincode || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
                            className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#008cff]"
                            placeholder="122003"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Emergency Contact Information
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Contact Name</label>
                        <input
                          type="text"
                          value={profileForm.emergencyContactName || ''}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, emergencyContactName: e.target.value })
                          }
                          className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#008cff]"
                          placeholder="e.g. Priya Sharma (Spouse)"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Contact Phone</label>
                        <input
                          type="text"
                          value={profileForm.emergencyContactPhone || ''}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, emergencyContactPhone: e.target.value })
                          }
                          className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#008cff]"
                          placeholder="+91 98111 22334"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="bg-[#008cff] hover:bg-blue-600 disabled:opacity-50 text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow-md flex items-center gap-2"
                    >
                      {isSavingProfile ? (
                        <>
                          <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                          <span>Saving Profile...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[16px]">save</span>
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ==================================================== */}
            {/* TAB 7: HELP & SUPPORT */}
            {/* ==================================================== */}
            {activeTab === 'support' && (
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs space-y-6">
                <div>
                  <h3 className="text-xl font-black text-gray-900">SS Journey Help & Customer Support</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    We are here 24 hours a day, 7 days a week to ensure your journeys are seamless.
                  </p>
                </div>

                {/* 24x7 Help Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#008cff] text-white flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">call</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-gray-900">24x7 Toll Free Helpline</h4>
                      <p className="text-xs font-mono font-bold text-[#008cff] mt-0.5">1800-102-8747</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">+91 124 462 8747 (Direct)</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">mail</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-gray-900">Email Customer Desk</h4>
                      <p className="text-xs font-semibold text-emerald-700 mt-0.5">support@ssjourney.com</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Avg response time: &lt; 15 mins</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">chat</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-gray-900">Live Concierge Support</h4>
                      <p className="text-xs font-semibold text-indigo-700 mt-0.5">Instant Chat Help</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Available for active bookings</p>
                    </div>
                  </div>
                </div>

                {/* FAQ Accordions */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-sm font-bold text-gray-900">Frequently Asked Questions</h4>
                  {[
                    {
                      q: 'How do I cancel my booking and get a refund?',
                      a: 'You can cancel any confirmed booking directly from the "My Trips" tab. Simply click "Cancel Booking" next to your reservation. Eligible refunds are automatically processed back to your original payment method within 3 to 5 business days.',
                    },
                    {
                      q: 'Can I change my travel dates or flight times?',
                      a: 'Yes, date changes depend on airline and hotel supplier policies. For immediate modifications, contact our 24x7 support desk with your Booking Reference number.',
                    },
                    {
                      q: 'What documents are required during hotel check-in?',
                      a: 'All Indian citizens must present a valid government-issued photo ID (Aadhaar Card, Passport, Voter ID, or Driving License). Foreign nationals must present their original Passport and valid Indian Visa.',
                    },
                    {
                      q: 'How do saved travellers work?',
                      a: 'Saving traveler details in your SS Journey account lets you pre-fill passenger forms during checkout in just one click, without having to type passport numbers or date of birth repeatedly.',
                    },
                  ].map((faq, idx) => (
                    <details
                      key={idx}
                      className="group border border-gray-200 rounded-xl p-4 [&_summary::-webkit-details-marker]:hidden bg-white"
                    >
                      <summary className="flex items-center justify-between cursor-pointer font-bold text-xs text-gray-800">
                        <span>{faq.q}</span>
                        <span className="material-symbols-outlined text-[18px] text-gray-400 group-open:rotate-180 transition-transform">
                          expand_more
                        </span>
                      </summary>
                      <p className="text-xs text-gray-600 mt-3 leading-relaxed pt-2 border-t border-gray-100">
                        {faq.a}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ── ADD/EDIT TRAVELLER MODAL ── */}
      {isTravellerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                {editingTraveller ? 'Edit Traveller' : 'Add New Traveller'}
              </h3>
              <button
                onClick={() => setIsTravellerModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveTraveller} className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Title</label>
                  <select
                    value={travellerForm.title || 'Mr'}
                    onChange={(e) => setTravellerForm({ ...travellerForm, title: e.target.value })}
                    className="w-full text-xs font-semibold px-2.5 py-2 rounded-xl border border-gray-300"
                  >
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Ms">Ms</option>
                    <option value="Dr">Dr</option>
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Passenger Type</label>
                  <select
                    value={travellerForm.passengerType || 'ADULT'}
                    onChange={(e) =>
                      setTravellerForm({ ...travellerForm, passengerType: e.target.value as any })
                    }
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-gray-300"
                  >
                    <option value="ADULT">Adult (12+ yrs)</option>
                    <option value="CHILD">Child (2 - 12 yrs)</option>
                    <option value="INFANT">Infant (Under 2 yrs)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={travellerForm.firstName || ''}
                    onChange={(e) => setTravellerForm({ ...travellerForm, firstName: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#008cff]"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={travellerForm.lastName || ''}
                    onChange={(e) => setTravellerForm({ ...travellerForm, lastName: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-gray-300 focus:outline-hidden focus:border-[#008cff]"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Gender</label>
                  <select
                    value={travellerForm.gender || 'MALE'}
                    onChange={(e) =>
                      setTravellerForm({ ...travellerForm, gender: e.target.value as any })
                    }
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-gray-300"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={
                      travellerForm.dateOfBirth ? String(travellerForm.dateOfBirth).slice(0, 10) : ''
                    }
                    onChange={(e) => setTravellerForm({ ...travellerForm, dateOfBirth: e.target.value })}
                    className="w-full text-xs font-semibold px-2 py-2 rounded-xl border border-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={travellerForm.phone || ''}
                    onChange={(e) => setTravellerForm({ ...travellerForm, phone: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-gray-300"
                    placeholder="+91..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={travellerForm.email || ''}
                    onChange={(e) => setTravellerForm({ ...travellerForm, email: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-gray-300"
                    placeholder="traveler@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Passport Number</label>
                  <input
                    type="text"
                    value={travellerForm.passportNumber || ''}
                    onChange={(e) =>
                      setTravellerForm({ ...travellerForm, passportNumber: e.target.value })
                    }
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-gray-300"
                    placeholder="A1234567"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nationality</label>
                  <input
                    type="text"
                    value={travellerForm.nationality || 'Indian'}
                    onChange={(e) =>
                      setTravellerForm({ ...travellerForm, nationality: e.target.value })
                    }
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-gray-300"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsTravellerModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#008cff] hover:bg-blue-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-xs"
                >
                  {editingTraveller ? 'Update Traveller' : 'Save Traveller'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CANCELLATION CONFIRMATION MODAL ── */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
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
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                Keep Booking
              </button>
              <button
                onClick={handleConfirmCancel}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-xs"
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
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-black tracking-tight">
                  <span className="text-[#00aeef]">SYOLO</span> <span className="text-[#ff9900]">TRIPS</span>
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Official E-Ticket & Receipt
                </span>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Ticket Header */}
            <div className="bg-slate-900 text-white p-5 rounded-xl flex items-center justify-between">
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

            {/* Itinerary Items */}
            <div className="border border-gray-200 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Trip Breakdown</h4>
              {(selectedTicket.items || []).map((it: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-gray-900 block">{it.title}</span>
                    <span className="text-gray-500">
                      {it.check_in_date ? `Check-in: ${it.check_in_date}` : ''}
                      {it.check_out_date ? ` • Check-out: ${it.check_out_date}` : ''}
                    </span>
                  </div>
                  <span className="font-bold text-gray-900">{formatPrice(it.total_price || it.unit_price || 0)}</span>
                </div>
              ))}
            </div>

            {/* Travelers on Ticket */}
            {selectedTicket.passengers && selectedTicket.passengers.length > 0 && (
              <div className="border border-gray-200 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Passenger Manifest</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {selectedTicket.passengers.map((p: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      <span className="font-bold text-gray-900 block">
                        {p.title} {p.first_name} {p.last_name}
                      </span>
                      <span className="text-gray-500 text-[11px]">
                        Type: {p.passenger_type} {p.passport_number ? `• Passport: ${p.passport_number}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing Summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Base Fare & Platform Fees</span>
                <span>{formatPrice(selectedTicket.total_amount)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Taxes & Government Surcharges</span>
                <span>Included</span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between font-black text-sm text-gray-900">
                <span>Total Amount Paid</span>
                <span className="text-emerald-700">{formatPrice(selectedTicket.total_amount)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <button
                onClick={() => window.print()}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setSelectedTicket(null)}
                className="bg-[#008cff] hover:bg-blue-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition"
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
