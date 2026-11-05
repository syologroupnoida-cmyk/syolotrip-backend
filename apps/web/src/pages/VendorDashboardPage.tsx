import React, { useState, useEffect } from 'react';
import { ScreenType } from '../components/Header';
import { 
  Building2, 
  ShieldCheck, 
  PlusCircle, 
  Sliders, 
  Bell, 
  User, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Lock, 
  ArrowRight,
  ExternalLink,
  MapPin,
  PhoneCall,
  Sparkles
} from 'lucide-react';
import {
  getVendorDashboardApi,
  getVendorPropertiesApi,
  getVendorNotificationsApi,
  markVendorNotificationReadApi,
  createVendorPropertyApi,
  updateVendorProfileApi,
  VendorOverviewResponse,
  VendorPropertyCreatePayload,
} from '../services/api';

interface VendorDashboardPageProps {
  onNavigate: (screen: ScreenType) => void;
  onLogout: () => void;
}

export type VendorTab = 'overview' | 'list-property' | 'my-properties' | 'kyc' | 'profile' | 'notifications' | 'support';

export const VendorDashboardPage: React.FC<VendorDashboardPageProps> = ({ onNavigate, onLogout }) => {
  const [activeTab, setActiveTab] = useState<VendorTab>('overview');
  const [overview, setOverview] = useState<VendorOverviewResponse | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Property creation form state (for KYC-approved vendors)
  const [propName, setPropName] = useState('');
  const [propCity, setPropCity] = useState('');
  const [propState, setPropState] = useState('');
  const [propAddress, setPropAddress] = useState('');
  const [propPincode, setPropPincode] = useState('');
  const [propOverview, setPropOverview] = useState('');
  const [propStartingPrice, setPropStartingPrice] = useState('4500');
  const [propFeaturedImg, setPropFeaturedImg] = useState('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800');
  const [roomTypeName, setRoomTypeName] = useState('Deluxe Pine View Room');
  const [roomBedType, setRoomBedType] = useState('King Bed');
  const [roomMaxOccupancy, setRoomMaxOccupancy] = useState(2);
  const [roomPrice, setRoomPrice] = useState('4500');
  const [roomAvailable, setRoomAvailable] = useState(10);
  const [isSubmittingProperty, setIsSubmittingProperty] = useState(false);
  const [propertyFeedback, setPropertyFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile update form state
  const [editOwnerName, setEditOwnerName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    try {
      const [ovData, propData, notifData] = await Promise.allSettled([
        getVendorDashboardApi(),
        getVendorPropertiesApi(),
        getVendorNotificationsApi(),
      ]);

      if (ovData.status === 'fulfilled') {
        setOverview(ovData.value);
        if (ovData.value.vendor) {
          setEditOwnerName(ovData.value.vendor.owner_name || '');
          setEditCity(ovData.value.vendor.city || '');
          setEditState(ovData.value.vendor.state || '');
          setPropCity(ovData.value.vendor.city || '');
          setPropState(ovData.value.vendor.state || '');
        }
      }
      if (propData.status === 'fulfilled') {
        setProperties(propData.value);
      }
      if (notifData.status === 'fulfilled') {
        setNotifications(notifData.value);
      }
    } catch (err) {
      console.warn('Failed to load vendor dashboard:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isKYCApproved = overview?.vendor?.kyc_status === 'APPROVED';

  // Handle Property Submit
  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setPropertyFeedback(null);

    if (!isKYCApproved) {
      setPropertyFeedback({
        type: 'error',
        text: 'Property listing creation is locked. Your KYC must be approved by an administrator before you can list properties.',
      });
      return;
    }

    if (!propName.trim() || !propCity.trim() || !propAddress.trim() || !propOverview.trim()) {
      setPropertyFeedback({ type: 'error', text: 'Please fill in all mandatory property fields.' });
      return;
    }

    setIsSubmittingProperty(true);
    try {
      const payload: VendorPropertyCreatePayload = {
        name: propName.trim(),
        property_type: overview?.vendor?.property_type || 'HOTEL',
        star_rating: 4,
        city: propCity.trim(),
        state: propState.trim() || undefined,
        address: propAddress.trim(),
        pincode: propPincode.trim() || undefined,
        overview: propOverview.trim(),
        amenities: ['Free WiFi', 'Mountain View', 'Breakfast Included', 'Parking', 'Room Service'],
        featured_image: propFeaturedImg.trim(),
        starting_price: parseFloat(propStartingPrice) || 4500,
        rooms: [
          {
            room_type: roomTypeName.trim() || 'Deluxe Room',
            bed_type: roomBedType,
            max_occupancy: roomMaxOccupancy,
            price_per_night: parseFloat(roomPrice) || 4500,
            available_rooms: roomAvailable,
            amenities: ['WiFi', 'Air Conditioning', 'Flat-screen TV', 'Ensuite Bathroom'],
          },
        ],
      };

      await createVendorPropertyApi(payload);
      setPropertyFeedback({
        type: 'success',
        text: 'Property submitted successfully! It has been forwarded to the admin moderation queue for review.',
      });

      // Reload properties and reset
      const updatedProps = await getVendorPropertiesApi();
      setProperties(updatedProps);
      setPropName('');
      setPropAddress('');
      setPropOverview('');
      setActiveTab('my-properties');
    } catch (err: any) {
      setPropertyFeedback({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to submit property listing.',
      });
    } finally {
      setIsSubmittingProperty(false);
    }
  };

  // Handle Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setIsUpdatingProfile(true);
    try {
      await updateVendorProfileApi({
        owner_name: editOwnerName.trim(),
        phone: editPhone.trim() || undefined,
        city: editCity.trim(),
        state: editState.trim(),
      });
      setProfileMsg({ type: 'success', text: 'Vendor profile updated successfully.' });
      loadData();
    } catch (err: any) {
      setProfileMsg({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to update profile.',
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle Mark Notification Read
  const handleMarkNotifRead = async (id: string) => {
    try {
      await markVendorNotificationReadApi(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.warn('Failed to mark notification read:', err);
    }
  };

  const getKYCBadge = (status?: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>KYC APPROVED</span>
          </span>
        );
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5" />
            <span>KYC PENDING REVIEW</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>KYC REJECTED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-200 text-slate-800 border border-slate-300">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>KYC INCOMPLETE</span>
          </span>
        );
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 selection:bg-[#008cff] selection:text-white pb-20">
      {/* ── TOP NAV BAR ── */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#008cff] to-sky-400 flex items-center justify-center text-white shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight block leading-none">
                {overview?.vendor?.business_name || 'Vendor Extranet'}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                {overview?.vendor?.property_type || 'HOTEL'} &bull; {overview?.vendor?.city || 'India'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {getKYCBadge(overview?.vendor?.kyc_status)}

            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN LAYOUT GRID ── */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ── LEFT SIDEBAR TABS ── */}
          <aside className="lg:col-span-3 space-y-4 select-none">
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 space-y-1">
              {[
                { id: 'overview' as const, label: 'Dashboard Overview', icon: <Sliders className="w-4 h-4" /> },
                { 
                  id: 'list-property' as const, 
                  label: 'List New Property', 
                  icon: isKYCApproved ? <PlusCircle className="w-4 h-4 text-emerald-500" /> : <Lock className="w-4 h-4 text-slate-400" />,
                  badge: isKYCApproved ? null : 'LOCKED'
                },
                { 
                  id: 'my-properties' as const, 
                  label: 'My Properties', 
                  icon: <Building2 className="w-4 h-4" />,
                  count: properties.length 
                },
                { 
                  id: 'kyc' as const, 
                  label: 'KYC Verification', 
                  icon: <ShieldCheck className="w-4 h-4" />,
                  badge: overview?.vendor?.kyc_status === 'APPROVED' ? 'DONE' : 'PENDING'
                },
                { id: 'profile' as const, label: 'Vendor Profile', icon: <User className="w-4 h-4" /> },
                { 
                  id: 'notifications' as const, 
                  label: 'Notifications', 
                  icon: <Bell className="w-4 h-4" />,
                  count: unreadCount > 0 ? unreadCount : undefined 
                },
                { id: 'support' as const, label: 'Help & Support', icon: <PhoneCall className="w-4 h-4" /> },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
                      isActive 
                        ? 'bg-[#008cff] text-white shadow-sm' 
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {tab.icon}
                      <span>{tab.label}</span>
                    </div>
                    {tab.badge && (
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isActive 
                          ? 'bg-white/20 text-white' 
                          : tab.badge === 'LOCKED' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-[#008cff]'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Switch to Public Site */}
            <button
              type="button"
              onClick={() => onNavigate('explore')}
              className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-white border border-slate-200/80 text-xs font-bold text-slate-600 hover:text-[#008cff] hover:border-[#008cff] transition cursor-pointer shadow-xs"
            >
              <span>Back to Public Travel Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </aside>

          {/* ── RIGHT MAIN CONTENT ── */}
          <main className="lg:col-span-9 space-y-6">
            {/* ==================================================== */}
            {/* 1. OVERVIEW TAB */}
            {/* ==================================================== */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-fade-in">
                {/* Onboarding Checklist Banner */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        Vendor Onboarding Journey
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Complete all 3 onboarding milestones to publish your properties live on Syolo Travels.
                      </p>
                    </div>

                    <span className="text-xs font-black uppercase px-3 py-1.5 rounded-xl bg-blue-50 text-[#008cff] border border-blue-200/60 self-start sm:self-auto">
                      Step {isKYCApproved ? (properties.length > 0 ? '3 of 3' : '3 of 3 (Ready)') : '2 of 3'}
                    </span>
                  </div>

                  {/* 3 Step Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Step 1: Registration */}
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                          Step 1
                        </span>
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
                      </div>
                      <h3 className="text-sm font-bold text-emerald-950">Partner Registration</h3>
                      <p className="text-[11px] text-emerald-800">
                        Account created on official Syolo Travels extranet.
                      </p>
                    </div>

                    {/* Step 2: KYC */}
                    <div className={`p-4 rounded-2xl border space-y-2 ${
                      isKYCApproved 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                        : overview?.vendor?.kyc_status === 'PENDING_REVIEW'
                          ? 'bg-amber-50 border-amber-200 text-amber-950'
                          : 'bg-blue-50 border-blue-200 text-blue-950'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider">
                          Step 2
                        </span>
                        {isKYCApproved ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
                        ) : overview?.vendor?.kyc_status === 'PENDING_REVIEW' ? (
                          <Clock className="w-5 h-5 text-amber-600" />
                        ) : (
                          <ShieldCheck className="w-5 h-5 text-[#008cff]" />
                        )}
                      </div>
                      <h3 className="text-sm font-bold">KYC Verification</h3>
                      <p className="text-[11px] opacity-80">
                        {isKYCApproved 
                          ? 'KYC fully verified and approved by admin.' 
                          : overview?.vendor?.kyc_status === 'PENDING_REVIEW'
                            ? 'Submitted. Admin review in progress.'
                            : 'Upload ID, address & ownership documents.'}
                      </p>
                      {!isKYCApproved && overview?.vendor?.kyc_status !== 'PENDING_REVIEW' && (
                        <button
                          type="button"
                          onClick={() => onNavigate('vendor-kyc')}
                          className="mt-2 text-xs font-black text-[#008cff] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Complete KYC Now</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Step 3: Property Listing */}
                    <div className={`p-4 rounded-2xl border space-y-2 ${
                      !isKYCApproved 
                        ? 'bg-slate-50 border-slate-200 text-slate-400' 
                        : properties.length > 0
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                          : 'bg-blue-50 border-blue-200 text-blue-950'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider">
                          Step 3
                        </span>
                        {!isKYCApproved ? (
                          <Lock className="w-5 h-5 text-slate-400" />
                        ) : properties.length > 0 ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
                        ) : (
                          <PlusCircle className="w-5 h-5 text-[#008cff]" />
                        )}
                      </div>
                      <h3 className="text-sm font-bold">Property Listing</h3>
                      <p className="text-[11px] opacity-80">
                        {!isKYCApproved 
                          ? 'Strictly locked until KYC approval.' 
                          : properties.length > 0 
                            ? `${properties.length} property submitted for review.`
                            : 'Ready! Submit your room rates & photos.'}
                      </p>
                      {isKYCApproved && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('list-property')}
                          className="mt-2 text-xs font-black text-[#008cff] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>List Property</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Total Properties
                    </span>
                    <p className="text-3xl font-black text-slate-900">{properties.length}</p>
                    <span className="text-xs text-slate-500 block">Managed under this extranet</span>
                  </div>

                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Live &amp; Bookable
                    </span>
                    <p className="text-3xl font-black text-emerald-600">
                      {properties.filter((p) => p.publication_status === 'APPROVED').length}
                    </p>
                    <span className="text-xs text-slate-500 block">Active in customer search</span>
                  </div>

                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Pending Moderation
                    </span>
                    <p className="text-3xl font-black text-amber-600">
                      {properties.filter((p) => p.publication_status === 'SUBMITTED').length}
                    </p>
                    <span className="text-xs text-slate-500 block">Under admin quality review</span>
                  </div>
                </div>

                {/* Promotional Banner */}
                <div className="bg-gradient-to-r from-blue-900 via-[#008cff] to-blue-700 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
                  <div className="space-y-1 max-w-xl">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-black uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>New Partner Incentive</span>
                    </span>
                    <h3 className="text-xl font-black">0% Commission For Your First 30 Days!</h3>
                    <p className="text-xs text-blue-100">
                      Keep 100% of your earnings on all bookings completed during your first 30 days on Syolo Travels.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* 2. LIST PROPERTY TAB (STRICT GATE TESTED) */}
            {/* ==================================================== */}
            {activeTab === 'list-property' && (
              <div className="space-y-6 animate-fade-in">
                {/* ── STRICT GATE: IF KYC IS NOT APPROVED ── */}
                {!isKYCApproved ? (
                  <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200/80 text-center max-w-2xl mx-auto space-y-5">
                    <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-sm">
                      <Lock className="w-8 h-8" />
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        Property Listing is Locked
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
                        In accordance with travel platform regulations and RBI safety guidelines, you must obtain an approved KYC before you can add properties and receive bookings.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 font-medium inline-block text-left">
                      <p className="font-bold">Current KYC Status: {overview?.vendor?.kyc_status || 'KYC_INCOMPLETE'}</p>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        {overview?.vendor?.kyc_status === 'PENDING_REVIEW'
                          ? 'Your KYC documents are currently in review with our verification team. You will be notified once approved.'
                          : 'Please submit your identity, address, and property ownership proofs to unlock property creation.'}
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => onNavigate('vendor-kyc')}
                        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#008cff] hover:bg-blue-600 text-white font-black text-xs uppercase tracking-wider shadow-md hover:scale-105 transition cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Go to KYC Verification Screen</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── UNLOCKED: PROPERTY CREATION FORM ── */
                  <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200/80 space-y-8">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        Add New Property Listing
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Submit property details, photography, room categories, and base nightly rates for admin review.
                      </p>
                    </div>

                    {propertyFeedback && (
                      <div className={`p-4 rounded-2xl text-xs flex items-center gap-3 ${
                        propertyFeedback.type === 'success' 
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                          : 'bg-rose-50 border border-rose-200 text-rose-800'
                      }`}>
                        {propertyFeedback.type === 'success' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        )}
                        <span>{propertyFeedback.text}</span>
                      </div>
                    )}

                    <form onSubmit={handleCreateProperty} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            Property Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={propName}
                            onChange={(e) => setPropName(e.target.value)}
                            placeholder="e.g. Hilltop Pine Luxury Resort"
                            className="w-full text-xs font-bold px-3.5 py-3 rounded-xl border border-slate-200 bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            City / Destination *
                          </label>
                          <input
                            type="text"
                            required
                            value={propCity}
                            onChange={(e) => setPropCity(e.target.value)}
                            placeholder="e.g. Manali, Goa"
                            className="w-full text-xs font-bold px-3.5 py-3 rounded-xl border border-slate-200 bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            State
                          </label>
                          <input
                            type="text"
                            value={propState}
                            onChange={(e) => setPropState(e.target.value)}
                            placeholder="e.g. Himachal Pradesh"
                            className="w-full text-xs font-bold px-3.5 py-3 rounded-xl border border-slate-200 bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            Postal PIN Code
                          </label>
                          <input
                            type="text"
                            value={propPincode}
                            onChange={(e) => setPropPincode(e.target.value)}
                            placeholder="e.g. 175131"
                            className="w-full text-xs font-bold px-3.5 py-3 rounded-xl border border-slate-200 bg-white"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            Full Street Address *
                          </label>
                          <input
                            type="text"
                            required
                            value={propAddress}
                            onChange={(e) => setPropAddress(e.target.value)}
                            placeholder="e.g. Log Huts Road, Old Manali"
                            className="w-full text-xs font-bold px-3.5 py-3 rounded-xl border border-slate-200 bg-white"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            Property Overview &amp; Highlights *
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={propOverview}
                            onChange={(e) => setPropOverview(e.target.value)}
                            placeholder="Describe your property, scenic views, nearby attractions, and hospitality experience..."
                            className="w-full text-xs font-medium px-3.5 py-3 rounded-xl border border-slate-200 bg-white leading-relaxed"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            Featured Image URL *
                          </label>
                          <input
                            type="url"
                            required
                            value={propFeaturedImg}
                            onChange={(e) => setPropFeaturedImg(e.target.value)}
                            className="w-full text-xs font-mono px-3.5 py-3 rounded-xl border border-slate-200 bg-white"
                          />
                        </div>
                      </div>

                      {/* Room Tier Setup */}
                      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                          Primary Room Category
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Room Category Name
                            </label>
                            <input
                              type="text"
                              value={roomTypeName}
                              onChange={(e) => setRoomTypeName(e.target.value)}
                              placeholder="e.g. Deluxe Room"
                              className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Bed Configuration
                            </label>
                            <input
                              type="text"
                              value={roomBedType}
                              onChange={(e) => setRoomBedType(e.target.value)}
                              placeholder="e.g. 1 King Bed"
                              className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Price Per Night (₹)
                            </label>
                            <input
                              type="number"
                              value={roomPrice}
                              onChange={(e) => {
                                setRoomPrice(e.target.value);
                                setPropStartingPrice(e.target.value);
                              }}
                              className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-mono"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Max Guests / Occupancy
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={roomMaxOccupancy}
                              onChange={(e) => setRoomMaxOccupancy(Number(e.target.value))}
                              className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Available Units / Inventory
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={roomAvailable}
                              onChange={(e) => setRoomAvailable(Number(e.target.value))}
                              className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingProperty}
                        className="w-full py-4 rounded-2xl bg-[#008cff] hover:bg-blue-600 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isSubmittingProperty ? (
                          <span>Submitting Listing...</span>
                        ) : (
                          <>
                            <span>Submit Property for Admin Approval</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* ==================================================== */}
            {/* 3. MY PROPERTIES TAB */}
            {/* ==================================================== */}
            {activeTab === 'my-properties' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      My Property Listings
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Manage all properties registered under your partner account.
                    </p>
                  </div>

                  {isKYCApproved && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('list-property')}
                      className="px-4 py-2.5 rounded-xl bg-[#008cff] hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Add Property</span>
                    </button>
                  )}
                </div>

                {properties.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-4">
                    <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
                    <div>
                      <p className="text-base font-bold text-slate-800">No properties listed yet</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {isKYCApproved 
                          ? 'Click the button below to add your first hotel or villa listing.' 
                          : 'Complete your KYC verification first to unlock property creation.'}
                      </p>
                    </div>
                    {isKYCApproved ? (
                      <button
                        type="button"
                        onClick={() => setActiveTab('list-property')}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#008cff] text-white text-xs font-bold"
                      >
                        <span>List Your Property</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onNavigate('vendor-kyc')}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-bold"
                      >
                        <span>Submit KYC Documents</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {properties.map((prop) => (
                      <div 
                        key={prop.id}
                        className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={prop.featured_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200'}
                            alt={prop.name}
                            className="w-20 h-20 rounded-2xl object-cover shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-black text-slate-900">{prop.name}</h3>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                prop.publication_status === 'APPROVED'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : prop.publication_status === 'REJECTED'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}>
                                {prop.publication_status || 'SUBMITTED'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>{prop.address}, {prop.city}</span>
                            </p>
                            <p className="text-xs font-bold text-slate-900 mt-2">
                              Starting from ₹{prop.starting_price || 4500} / night
                            </p>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                          <span className="text-[11px] text-slate-400">
                            ID: {prop.id.slice(0, 8)}...
                          </span>
                          {prop.publication_status === 'APPROVED' && (
                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Live on Website</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ==================================================== */}
            {/* 4. KYC VERIFICATION TAB */}
            {/* ==================================================== */}
            {activeTab === 'kyc' && (
              <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200/80 space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      KYC Compliance &amp; Verification
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Platform safety, regulatory compliance, and payout bank verification.
                    </p>
                  </div>
                  {getKYCBadge(overview?.vendor?.kyc_status)}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Verification Checklist:
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>1. Personal &amp; Legal Entity Information</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>2. Government Identity Proof (PAN &amp; Aadhaar/Passport)</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>3. Address Verification (Electricity bill or Trade License)</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>4. Property Ownership Proof (Tax receipt or Lease Deed)</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>5. Verified Bank Account for Automated Payouts</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('vendor-kyc')}
                  className="px-6 py-3 rounded-xl bg-[#008cff] hover:bg-blue-600 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm cursor-pointer"
                >
                  {isKYCApproved ? 'Review Submitted KYC Documents' : 'Open Full KYC Submission Form'}
                </button>
              </div>
            )}

            {/* ==================================================== */}
            {/* 5. VENDOR PROFILE TAB */}
            {/* ==================================================== */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200/80 space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Vendor Extranet Profile
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Update your primary operational contact information.
                  </p>
                </div>

                {profileMsg && (
                  <div className={`p-4 rounded-2xl text-xs flex items-center gap-3 ${
                    profileMsg.type === 'success' 
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{profileMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-xl">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Business Legal Entity
                    </label>
                    <input
                      type="text"
                      disabled
                      value={overview?.vendor?.business_name || ''}
                      className="w-full text-xs font-bold px-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Owner / Authorized Representative Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editOwnerName}
                      onChange={(e) => setEditOwnerName(e.target.value)}
                      className="w-full text-xs font-bold px-3.5 py-3 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Operational Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full text-xs font-bold px-3.5 py-3 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        required
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        className="w-full text-xs font-bold px-3.5 py-3 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={editState}
                        onChange={(e) => setEditState(e.target.value)}
                        className="w-full text-xs font-bold px-3.5 py-3 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="py-3 px-6 rounded-xl bg-[#008cff] text-white text-xs font-bold uppercase tracking-wider hover:bg-blue-600 transition shadow-xs cursor-pointer"
                  >
                    {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </form>
              </div>
            )}

            {/* ==================================================== */}
            {/* 6. NOTIFICATIONS TAB */}
            {/* ==================================================== */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200/80 space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Partner Notifications
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    System alerts regarding your KYC verification, property approvals, and payouts.
                  </p>
                </div>

                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No notifications received yet.</p>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => !n.is_read && handleMarkNotifRead(n.id)}
                        className={`p-4 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-4 ${
                          n.is_read 
                            ? 'bg-white border-slate-200 text-slate-600' 
                            : 'bg-blue-50/60 border-blue-200 text-slate-900 font-bold'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black">{n.title}</span>
                            {!n.is_read && (
                              <span className="w-2 h-2 rounded-full bg-[#008cff]" />
                            )}
                          </div>
                          <p className="text-xs font-normal opacity-90">{n.message}</p>
                          <span className="text-[10px] text-slate-400 block">
                            {new Date(n.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ==================================================== */}
            {/* 7. HELP & SUPPORT TAB */}
            {/* ==================================================== */}
            {activeTab === 'support' && (
              <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200/80 space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Partner Support &amp; Assistance
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Our dedicated hotelier and homestay relationship team is available 24/7.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <PhoneCall className="w-6 h-6 text-[#008cff]" />
                    <h3 className="text-sm font-bold text-slate-900">Partner Helpline</h3>
                    <p className="text-xs text-slate-600 font-mono font-bold">+91 1800 123 4567</p>
                    <p className="text-[11px] text-slate-400">Toll-free priority partner line</p>
                  </div>

                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900">KYC Compliance Team</h3>
                    <p className="text-xs text-slate-600 font-mono font-bold">compliance@ssjourney.com</p>
                    <p className="text-[11px] text-slate-400">Direct desk for document verification</p>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
