import React, { useState, useEffect } from 'react';
import {
  createBookingApi,
  payDemoBookingApi,
  // createRazorpayOrderApi,
  // verifyRazorpayPaymentApi,
  searchFlightsApi,
  searchHotelsApi,
  searchTrainsApi,
  searchBusesApi,
  searchCabsApi,
  searchPackagesApi,
  getCurrentUserApi,
  UserProfile,
  validateCouponApi,
  CouponValidateResult,
  getSavedTravellersApi,
  SavedTraveller,
  getWalletQuoteApi,
  applyWalletToBookingApi,
  releaseWalletReservationApi,
  WalletQuoteResponse,
} from '../services/api';
import { useCurrency } from '../context/CurrencyContext';

export interface WebCheckoutItem {
  serviceType: 'FLIGHT' | 'HOTEL' | 'TRAIN' | 'BUS' | 'CAB' | 'PACKAGE' | 'ACTIVITY' | 'VISA' | 'INSURANCE';
  itemId?: string;
  title: string;
  subtitle: string;
  routeInfo?: string;
  badge?: string;
  dates?: string;
  pricing: {
    baseAmount: number;
    taxes: number;
    discount?: number;
    insurance?: number;
    serviceFee?: number;
  };
  details?: Record<string, any>;
  passengers?: Array<{
    name: string;
    type: string;
    email: string;
    phone: string;
  }>;
}

// ─── Mock Fallback Booking Data ──────────────────────────
const defaultBookingData = {
  flight: {
    airline: 'Japan Airlines',
    airlineCode: 'JAL',
    flightNumber: 'JL 002',
    aircraft: 'Boeing 787-9 Dreamliner',
    outbound: {
      date: 'Mon, Oct 14, 2026',
      departure: '08:30',
      arrival: '14:45+1',
      from: { code: 'SFO', name: 'San Francisco Intl.' },
      to: { code: 'HND', name: 'Tokyo Haneda' },
      duration: '11h 15m',
      stops: 'Non-stop',
      cabin: 'Economy',
      baggage: '2 × 23kg checked + 1 carry-on',
    },
    return: {
      date: 'Mon, Oct 28, 2026',
      departure: '17:30',
      arrival: '11:45',
      from: { code: 'HND', name: 'Tokyo Haneda' },
      to: { code: 'SFO', name: 'San Francisco Intl.' },
      duration: '9h 15m',
      stops: 'Non-stop',
      cabin: 'Economy',
      baggage: '2 × 23kg checked + 1 carry-on',
    },
  },
  hotel: {
    name: 'Le Grand Hôtel du Palais Royal',
    location: '1st Arrondissement, Paris',
    checkIn: 'Mon, Nov 04, 2026',
    checkOut: 'Mon, Nov 11, 2026',
    nights: 7,
    room: 'Deluxe King Suite with City View',
    guests: '2 Adults',
    amenities: ['Free Breakfast', 'Pool', 'Spa', 'Wifi'],
    rating: 9.4,
    ratingLabel: 'Exceptional',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0E7RHXytjncZWInVu6Jq1inHh-1PungrJj2Yv_ETg17I3Vdx3cR5Z7ZTi2m4DDgb5GqvXyA7PbaAEK-uwhm2d-Q_aZ2qYCIwfI2VI1WUoRx-FDwvXPuA42b1Dp2YpYykOhxVDLALrn8zE9hAB65y3O2vcgR6qBucn3zVbsXWxhsw1W7PxBliKjK8VuZkGaANoDpBWRxSK_6WfetLziszlKj_o_2uGIPgxlJ6omW82YtShD3anwuq6',
  },
  pricing: {
    flightBase: 64890,
    flightTaxes: 8400,
    hotelBase: 28200,
    hotelNights: 7,
    hotelTaxes: 19500,
    bundleDiscount: -31500,
    insurance: 3999,
    serviceFee: 0,
  },
  travellers: [
    { name: 'John Doe', type: 'Adult', passport: '•••••1234', email: 'john@example.com', phone: '+91 98765 43210' },
  ],
};

interface BookingCheckoutPageProps {
  onNavigate?: (screen: 'explore' | 'flights' | 'hotels' | 'checkout' | 'trips') => void;
  bookingItem?: WebCheckoutItem | null;
  currentUser?: UserProfile | null;
}

// ─── Component ───────────────────────────────────────────
export const BookingCheckoutPage: React.FC<BookingCheckoutPageProps> = ({ 
  onNavigate,
  bookingItem,
  currentUser,
}) => {
  const { formatPrice, currency } = useCurrency();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'card' | 'paypal' | 'apple'>('card');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [hasInsurance, setHasInsurance] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(currentUser || null);
  const [createdBooking, setCreatedBooking] = useState<any | null>(null);

  // Dual Wallet Checkout State
  const [walletQuote, setWalletQuote] = useState<WalletQuoteResponse | null>(null);
  const [usePromoWallet, setUsePromoWallet] = useState(true);
  const [useCashWallet, setUseCashWallet] = useState(true);
  const [activeReservationId, setActiveReservationId] = useState<string | null>(null);
  const [isLoadingWalletQuote, setIsLoadingWalletQuote] = useState(false);

  // Helper to ensure Razorpay Checkout script is loaded (commented out temporarily)
  /*
  const ensureRazorpayLoaded = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      if (typeof document === 'undefined') {
        resolve(false);
        return;
      }
      const existing = document.querySelector('script[src*="checkout.razorpay.com"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(true));
        existing.addEventListener('error', () => resolve(false));
        // If already loaded before listener
        if ((window as any).Razorpay) {
          resolve(true);
        }
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };
  */


  // Coupon / Promo Code state
  const [couponCode, setCouponCode] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidateResult | null>(null);

  const [traveler, setTraveler] = useState({
    title: 'Mr',
    firstName: '',
    lastName: '',
    gender: 'MALE',
    passengerType: 'ADULT',
    passportNumber: '',
    email: '',
    phone: '',
  });

  const [savedTravellers, setSavedTravellers] = useState<SavedTraveller[]>([]);

  const [confirmedBooking, setConfirmedBooking] = useState<{
    reference: string;
    email: string;
    total: number;
    serviceType: string;
    paymentMethodUsed?: string;
  } | null>(null);

  // myBiz Corporate Booking state
  const [isBizBooking, setIsBizBooking] = useState(false);
  const [bizCompanyName, setBizCompanyName] = useState('');
  const [bizGstin, setBizGstin] = useState('');
  const [bizCostCenter, setBizCostCenter] = useState('');

  // Prefill authenticated user information into traveler form
  useEffect(() => {
    const applyUser = (u: UserProfile) => {
      setUser(u);
      const nameParts = (u.fullName || (u as any).full_name || '').trim().split(' ');
      setTraveler(prev => ({
        ...prev,
        firstName: prev.firstName || nameParts[0] || '',
        lastName: prev.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Traveler'),
        email: prev.email || u.email || '',
        phone: prev.phone || u.phone || '',
      }));
    };

    if (currentUser) {
      applyUser(currentUser);
      getSavedTravellersApi().then((st) => setSavedTravellers(st)).catch(() => {});
    } else {
      getCurrentUserApi().then((u) => {
        if (u) {
          applyUser(u);
          getSavedTravellersApi().then((st) => setSavedTravellers(st)).catch(() => {});
        }
      });
    }
  }, [currentUser]);

  // Dynamic pricing calculations
  const isCustomItem = Boolean(bookingItem);
  const activeService = bookingItem?.serviceType || 'FLIGHT';

  const defaultP = defaultBookingData.pricing;
  const defaultFlightTotal = (defaultP.flightBase + defaultP.flightTaxes) * 2;
  const defaultHotelTotal = (defaultP.hotelBase * defaultP.hotelNights) + defaultP.hotelTaxes;
  const defaultSubtotal = defaultFlightTotal + defaultHotelTotal;

  const customBase = bookingItem?.pricing.baseAmount || 0;
  const customTaxes = bookingItem?.pricing.taxes || 0;
  const customDiscount = bookingItem?.pricing.discount || 0;
  const insurancePrice = bookingItem?.pricing.insurance ?? 499;
  const customInsurance = hasInsurance ? insurancePrice : 0;

  const preCouponTotal = isCustomItem
    ? Math.max(0, customBase + customTaxes - customDiscount + customInsurance)
    : Math.max(0, defaultSubtotal + defaultP.bundleDiscount + (hasInsurance ? defaultP.insurance : 0));

  const couponDiscount = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const grandTotal = Math.max(0, preCouponTotal - couponDiscount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true);
    setCouponError(null);
    try {
      const res = await validateCouponApi(couponCode.trim().toUpperCase(), preCouponTotal, activeService);
      if (res.valid) {
        setAppliedCoupon(res);
        setCouponError(null);
      } else {
        setAppliedCoupon(null);
        setCouponError(res.message || 'Coupon could not be applied');
      }
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponError(err.response?.data?.message || err.message || 'Failed to validate coupon code');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };

  const steps = [
    { num: 1, label: 'Review Itinerary' },
    { num: 2, label: 'Traveller Details' },
    { num: 3, label: 'Payment' },
  ];

  const isUuid = (str?: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str || '');
  const hasValidInventoryId = !bookingItem || isUuid(bookingItem.itemId);

  // Fetch wallet deduction quote when reaching payment step
  useEffect(() => {
    if (step >= 3 && grandTotal > 0 && user) {
      setIsLoadingWalletQuote(true);
      getWalletQuoteApi(activeService, grandTotal)
        .then((q) => setWalletQuote(q))
        .catch(() => setWalletQuote(null))
        .finally(() => setIsLoadingWalletQuote(false));
    }
  }, [step, grandTotal, activeService, user]);

  const maxEligiblePromo = walletQuote ? walletQuote.eligible.promoAmount : 0;
  const appliedPromo = usePromoWallet ? Math.min(maxEligiblePromo, grandTotal) : 0;
  const remainingAfterPromo = Math.max(0, grandTotal - appliedPromo);
  const maxEligibleCash = walletQuote ? walletQuote.eligible.cashAmount : 0;
  const appliedCash = useCashWallet ? Math.min(maxEligibleCash, remainingAfterPromo) : 0;
  const totalWalletDeduction = appliedPromo + appliedCash;
  const netPayableOnline = Math.max(0, grandTotal - totalWalletDeduction);

  const handleConfirmAndPay = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const serviceType = bookingItem?.serviceType || 'FLIGHT';
      let resolvedItemType: string = serviceType;
      if (serviceType === 'HOTEL') resolvedItemType = 'HOTEL_ROOM';

      let resolvedRefId = isUuid(bookingItem?.itemId) ? bookingItem?.itemId : undefined;

      // Ensure selections carry real database UUID; do not resolve missing selections to arbitrary seeded items
      if (bookingItem && !resolvedRefId) {
        throw new Error(
          `The selected ${serviceType.toLowerCase()} is missing a valid inventory ID (${bookingItem?.itemId || 'none'}). Booking cannot proceed.`
        );
      }

      // If user directly opened checkout without selecting an item, resolve real backend inventory ID
      if (!resolvedRefId) {
        if (serviceType === 'TRAIN') {
          const trains = await searchTrainsApi();
          resolvedRefId = trains[0]?.id;
        } else if (serviceType === 'BUS') {
          const buses = await searchBusesApi();
          resolvedRefId = buses[0]?.id;
        } else if (serviceType === 'CAB') {
          const cabs = await searchCabsApi();
          resolvedRefId = cabs[0]?.id;
        } else if (serviceType === 'PACKAGE') {
          const pkgs = await searchPackagesApi();
          resolvedRefId = pkgs[0]?.id;
        } else if (serviceType === 'HOTEL') {
          const hotels = await searchHotelsApi();
          resolvedRefId = hotels[0]?.rooms?.[0]?.id || hotels[0]?.id;
        } else {
          const flights = await searchFlightsApi();
          resolvedRefId = flights[0]?.id;
        }
      }

      if (!resolvedRefId || !isUuid(resolvedRefId)) {
        throw new Error(`No verified database inventory found for service ${serviceType}. Please check inventory or retry.`);
      }

      let bookingToPay = createdBooking;

      const uName = user?.fullName || (user as any)?.full_name || '';
      const firstName = traveler.firstName.trim() || uName.split(' ')[0] || 'John';
      const lastName = traveler.lastName.trim() || (uName.split(' ').slice(1).join(' ')) || 'Doe';
      const contactEmail = traveler.email.trim() || user?.email || 'customer@ssjourney.com';
      const contactPhone = traveler.phone.trim() || user?.phone || '+919876543210';

      // 1. Create booking in PostgreSQL if not already created in this checkout session
      if (!bookingToPay) {
        const booking = await createBookingApi({
          service_type: serviceType,
          guest_name: user ? undefined : `${firstName} ${lastName}`,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          has_insurance: hasInsurance,
          promo_code: appliedCoupon ? appliedCoupon.code : (isBizBooking ? 'WELCOME' : undefined),
          items: [
            {
              item_type: resolvedItemType,
              item_reference_id: resolvedRefId,
              quantity: 1,
              meta_data: {
                ...(bookingItem?.details || {}),
                ...(isBizBooking ? {
                  is_biz: true,
                  company_name: bizCompanyName,
                  gstin: bizGstin,
                  cost_center: bizCostCenter,
                } : {}),
              },
            },
          ],
          passengers: [
            {
              title: traveler.title || 'Mr',
              first_name: firstName,
              last_name: lastName,
              passenger_type: traveler.passengerType || 'ADULT',
              gender: traveler.gender || 'MALE',
              passport_number: traveler.passportNumber ? traveler.passportNumber.trim() : undefined,
            },
          ],
        });

        bookingToPay = booking;
        setCreatedBooking(booking);
      }

      // 2. Razorpay Test Mode Gateway Integration (temporarily commented out)
      /*
      if (paymentMethod === 'razorpay') {
        const isLoaded = await ensureRazorpayLoaded();
        if (!isLoaded || !(window as any).Razorpay) {
          throw new Error('Razorpay Checkout SDK could not be loaded. Please check your network connection and retry.');
        }

        // Server-side order creation: computes payable amount from trusted DB records
        const orderData = await createRazorpayOrderApi({
          booking_id: bookingToPay.id,
          guest_token: bookingToPay.cancellation_token,
        });

        const rzpOptions = {
          key: orderData.key_id,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'SS Journey',
          description: `Booking #${orderData.booking_reference} (${orderData.service_type})`,
          order_id: orderData.order_id,
          prefill: {
            name: orderData.customer_name || `${firstName} ${lastName}`.trim(),
            email: orderData.customer_email || traveler.email,
            contact: orderData.customer_phone || traveler.phone,
          },
          notes: {
            booking_id: orderData.booking_id,
            booking_reference: orderData.booking_reference,
            service_type: orderData.service_type,
          },
          theme: {
            color: '#00627d',
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
              setErrorMessage('Razorpay checkout was dismissed before payment. Your booking remains pending and you can retry safely.');
            },
          },
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            try {
              setIsProcessing(true);
              setErrorMessage(null);

              // Server-side payment verification using official HMAC-SHA256 signature verification
              const verifyRes = await verifyRazorpayPaymentApi({
                booking_id: bookingToPay.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                guest_token: bookingToPay.cancellation_token,
              });

              if (verifyRes.status === 'SUCCESS' || verifyRes.success) {
                setConfirmedBooking({
                  reference: bookingToPay.booking_reference,
                  email: bookingToPay.contact_email,
                  total: Number(bookingToPay.total_amount),
                  serviceType: bookingToPay.service_type,
                  paymentMethodUsed: 'Razorpay Test Mode',
                });
                setIsConfirmed(true);
                setErrorMessage(null);
              } else {
                setErrorMessage(verifyRes.message || 'Payment verification failed on the server. Please contact support.');
              }
            } catch (vErr: any) {
              console.error('Razorpay verification error:', vErr);
              const vDetail =
                vErr.response?.data?.detail ||
                vErr.message ||
                'Payment verification failed. Your booking status could not be confirmed.';
              setErrorMessage(vDetail);
            } finally {
              setIsProcessing(false);
            }
          },
        };

        const rzp = new (window as any).Razorpay(rzpOptions);
        rzp.on('payment.failed', (resp: any) => {
          setIsProcessing(false);
          setErrorMessage(
            `Payment declined: ${resp.error?.description || resp.error?.reason || 'Transaction failed in Razorpay Test Mode'}. You can retry.`
          );
        });
        rzp.open();
        return;
      }
      */


      // 2. Reserve Wallet Funds if applied
      let reservationIdToCommit: string | undefined = undefined;
      if (totalWalletDeduction > 0) {
        try {
          const resRes = await applyWalletToBookingApi(bookingToPay.id, appliedCash, appliedPromo);
          reservationIdToCommit = resRes.reservationId;
          setActiveReservationId(resRes.reservationId);
        } catch (resErr: any) {
          throw new Error(resErr.response?.data?.message || 'Failed to reserve wallet funds. Please check balance.');
        }
      }

      // 3. Payment via Backend Endpoint (Supports full wallet payments with 0 gateway charge)
      const payRes = await payDemoBookingApi({
        booking_id: bookingToPay.id,
        payment_method: netPayableOnline === 0 ? 'WALLET' : paymentMethod === 'card' ? 'CREDIT_CARD' : paymentMethod === 'apple' ? 'APPLE_PAY' : 'UPI',
        simulate_failure: simulateFailure,
        card_last_four: '4242',
        reservation_id: reservationIdToCommit,
      });

      if (payRes.status !== 'SUCCESS') {
        throw new Error(
          payRes.gateway_response?.reason ||
          'Payment was declined. You can retry safely.'
        );
      }

      // Mark Confirmed only when API confirms outcome
      setConfirmedBooking({
        reference: bookingToPay.booking_reference,
        email: bookingToPay.contact_email,
        total: Number(bookingToPay.total_amount),
        serviceType: bookingToPay.service_type,
        paymentMethodUsed:
          netPayableOnline === 0
            ? 'SS Journey Wallet (100%)'
            : totalWalletDeduction > 0
            ? `Split Payment (Wallet + ${paymentMethod.toUpperCase()})`
            : 'Demo Simulator',
      });
      setIsConfirmed(true);
      setErrorMessage(null);
    } catch (err: any) {
      console.error('Checkout error:', err);
      if (activeReservationId) {
        releaseWalletReservationApi(activeReservationId, 'Checkout error').catch(() => {});
        setActiveReservationId(null);
      }
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'An error occurred while creating or paying for your reservation. Please verify details and retry.';
      setErrorMessage(detail);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isConfirmed) {
    return (
      <div className="w-full bg-background min-h-[70vh] py-space-xl flex items-center justify-center px-gutter">
        <div className="max-w-2xl w-full bg-surface-container-lowest rounded-2xl shadow-float p-space-xl text-center flex flex-col items-center gap-space-md border border-outline-variant/30">
          <div className="w-20 h-20 rounded-full bg-tertiary/15 text-tertiary flex items-center justify-center mb-space-xs">
            <span className="material-symbols-outlined text-[48px]">check_circle</span>
          </div>
          <span className="text-label-sm uppercase tracking-widest text-tertiary font-bold">Booking Confirmed!</span>
          <h2 className="text-display-hero text-on-surface tracking-tight">
            {bookingItem ? `Booking Confirmed: ${bookingItem.title}` : "You're going to Tokyo & Paris!"}
          </h2>
          <p className="text-body-lg text-on-surface-variant max-w-lg">
            Your booking reference is <strong className="text-primary font-mono text-headline-sm">{confirmedBooking?.reference || 'SSJ-849201'}</strong>. We have sent your confirmed e-tickets and reservation vouchers to <span className="text-on-surface font-semibold">{confirmedBooking?.email || 'customer@ssjourney.com'}</span>.
          </p>

          <div className="w-full bg-surface-container-low rounded-xl p-space-md text-left my-space-sm flex flex-col gap-space-sm">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-space-xs">
              <span className="text-label-md text-on-surface-variant">Service Type</span>
              <span className="text-label-md font-bold text-primary">{confirmedBooking?.serviceType || activeService}</span>
            </div>
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-space-xs">
              <span className="text-label-md text-on-surface-variant">Item / Route</span>
              <span className="text-label-md font-bold text-on-surface">{bookingItem?.title || 'Japan Airlines + Grand Hôtel'}</span>
            </div>
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-space-xs">
              <span className="text-label-md text-on-surface-variant">Booking Reference</span>
              <span className="text-label-md font-mono font-bold text-primary">{confirmedBooking?.reference || 'SSJ-849201'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-label-md text-on-surface-variant">Total Paid ({confirmedBooking?.paymentMethodUsed || 'Razorpay Test Mode'})</span>
              <span className="text-headline-sm font-bold text-primary tabular-nums">{formatPrice(confirmedBooking?.total || grandTotal)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-space-sm w-full mt-space-sm">
            <button 
              onClick={() => onNavigate?.('trips')}
              className="w-full sm:flex-1 bg-primary hover:bg-primary-container text-on-primary py-space-sm rounded-lg text-label-lg font-bold transition-all shadow-md flex items-center justify-center gap-space-xs"
            >
              <span className="material-symbols-outlined text-[18px]">luggage</span>
              <span>View in My Trips</span>
            </button>
            <button 
              onClick={() => onNavigate?.('explore')}
              className="w-full sm:flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface py-space-sm rounded-lg text-label-lg font-bold transition-all flex items-center justify-center gap-space-xs"
            >
              <span className="material-symbols-outlined text-[18px]">home</span>
              <span>Back to Explore Hub</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-background">
      {/* ── Progress Steps ── */}
      <section className="bg-surface-container-low border-b border-outline-variant/30">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-gutter py-3 sm:py-space-md">
          <div className="flex items-center justify-center gap-3 sm:gap-space-lg">
            {steps.map((s, i) => (
              <React.Fragment key={s.num}>
                <div className="flex items-center gap-1.5 sm:gap-space-sm cursor-pointer" onClick={() => setStep(s.num as 1 | 2 | 3)}>
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-label-lg font-bold transition-colors ${
                    step >= s.num ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
                  }`}>
                    {step > s.num ? (
                      <span className="material-symbols-outlined text-[16px] sm:text-[18px]">check</span>
                    ) : s.num}
                  </div>
                  <span className={`text-xs sm:text-label-lg ${step >= s.num ? 'text-primary font-bold' : 'text-on-surface-variant'} hidden sm:inline`}>{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-8 sm:w-16 h-[2px] ${step > s.num ? 'bg-primary' : 'bg-outline-variant/40'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main Content ── */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-gutter py-4 sm:py-space-lg pb-28 lg:pb-space-lg">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          {/* ── LEFT: Details ── */}
          <div className="lg:col-span-8 flex flex-col gap-space-md">
            {/* Step 1: Itinerary Review */}
            {step >= 1 && (
              <>
                {bookingItem ? (
                  /* Dynamic Service Review Card */
                  <div className="bg-surface-container-lowest rounded-xl shadow-card overflow-hidden border border-outline-variant/30">
                    <div className="bg-primary/5 border-b border-outline-variant/20 px-space-md py-space-sm flex items-center justify-between">
                      <div className="flex items-center gap-space-sm">
                        <span className="material-symbols-outlined text-primary text-[22px]">
                          {bookingItem.serviceType === 'TRAIN' ? 'train' :
                           bookingItem.serviceType === 'BUS' ? 'directions_bus' :
                           bookingItem.serviceType === 'CAB' ? 'local_taxi' :
                           bookingItem.serviceType === 'PACKAGE' ? 'beach_access' : 'travel'}
                        </span>
                        <span className="text-label-lg text-on-surface font-bold">{bookingItem.title}</span>
                        <span className="text-label-md text-on-surface-variant">{bookingItem.dates || 'Upcoming Trip'}</span>
                      </div>
                      <span className="bg-tertiary/10 text-tertiary text-label-sm px-space-sm py-0.5 rounded-full font-bold">
                        {bookingItem.badge || 'Confirmed'}
                      </span>
                    </div>

                    <div className="p-space-md flex flex-col gap-space-md">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                        <div>
                          <h3 className="text-headline-sm text-on-surface font-bold">{bookingItem.title}</h3>
                          <p className="text-body-md text-on-surface-variant font-medium">{bookingItem.subtitle}</p>
                        </div>
                        <div className="sm:text-right">
                          <span className="text-headline-md text-primary font-bold tabular-nums">
                            {formatPrice(bookingItem.pricing.baseAmount)}
                          </span>
                          <span className="text-body-sm text-on-surface-variant block">Base Fare</span>
                        </div>
                      </div>

                      {bookingItem.routeInfo && (
                        <div className="bg-surface-container-low rounded-lg p-space-sm flex items-center gap-space-sm text-body-md text-on-surface font-semibold border border-outline-variant/30">
                          <span className="material-symbols-outlined text-primary text-[18px]">alt_route</span>
                          <span>{bookingItem.routeInfo}</span>
                        </div>
                      )}

                      {bookingItem.details && Object.keys(bookingItem.details).length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm text-body-sm text-on-surface-variant pt-space-xs">
                          {Object.entries(bookingItem.details).map(([k, v]) => (
                            <div key={k} className="bg-surface-container-low rounded-lg p-2.5 border border-outline-variant/20">
                              <span className="text-[11px] uppercase tracking-wider text-on-surface-variant/80 block font-semibold">
                                {k.replace(/_/g, ' ')}
                              </span>
                              <span className="font-bold text-on-surface text-label-md">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Flight Outbound */}
                    <div className="bg-surface-container-lowest rounded-xl shadow-card overflow-hidden">
                      <div className="bg-primary/5 border-b border-outline-variant/20 px-space-md py-space-sm flex items-center justify-between">
                        <div className="flex items-center gap-space-sm">
                          <span className="material-symbols-outlined text-primary text-[20px]">flight_takeoff</span>
                          <span className="text-label-lg text-on-surface font-bold">Outbound Flight</span>
                          <span className="text-label-md text-on-surface-variant">{defaultBookingData.flight.outbound.date}</span>
                        </div>
                        <span className="bg-tertiary/10 text-tertiary text-label-sm px-space-sm py-0.5 rounded-full font-bold">Confirmed</span>
                      </div>
                      <div className="p-space-md">
                        <div className="flex items-center gap-space-md mb-space-sm">
                          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0">
                            <span className="text-label-lg text-primary font-bold">{defaultBookingData.flight.airlineCode}</span>
                          </div>
                          <div>
                            <span className="text-label-lg text-on-surface font-bold">{defaultBookingData.flight.airline}</span>
                            <span className="text-label-sm text-on-surface-variant block">{defaultBookingData.flight.flightNumber} · {defaultBookingData.flight.aircraft}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-space-lg justify-between">
                          <div className="text-center">
                            <span className="text-headline-md text-on-surface font-bold tabular-nums block">{defaultBookingData.flight.outbound.departure}</span>
                            <span className="text-label-lg text-on-surface font-bold">{defaultBookingData.flight.outbound.from.code}</span>
                            <span className="text-body-sm text-on-surface-variant block">{defaultBookingData.flight.outbound.from.name}</span>
                          </div>
                          <div className="flex flex-col items-center flex-1 max-w-[250px]">
                            <span className="text-label-sm text-on-surface-variant">{defaultBookingData.flight.outbound.duration}</span>
                            <div className="w-full flex items-center gap-1 my-1">
                              <div className="h-[2px] flex-1 bg-outline-variant" />
                              <span className="material-symbols-outlined text-primary text-[16px]">flight</span>
                              <div className="h-[2px] flex-1 bg-outline-variant" />
                            </div>
                            <span className="text-label-sm text-tertiary font-bold">{defaultBookingData.flight.outbound.stops}</span>
                          </div>
                          <div className="text-center">
                            <span className="text-headline-md text-on-surface font-bold tabular-nums block">{defaultBookingData.flight.outbound.arrival}</span>
                            <span className="text-label-lg text-on-surface font-bold">{defaultBookingData.flight.outbound.to.code}</span>
                            <span className="text-body-sm text-on-surface-variant block">{defaultBookingData.flight.outbound.to.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-space-md mt-space-sm text-body-sm text-on-surface-variant flex-wrap">
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">airline_seat_recline_extra</span>{defaultBookingData.flight.outbound.cabin}</span>
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">luggage</span>{defaultBookingData.flight.outbound.baggage}</span>
                        </div>
                      </div>
                    </div>

                    {/* Flight Return */}
                    <div className="bg-surface-container-lowest rounded-xl shadow-card overflow-hidden">
                      <div className="bg-primary/5 border-b border-outline-variant/20 px-space-md py-space-sm flex items-center justify-between">
                        <div className="flex items-center gap-space-sm">
                          <span className="material-symbols-outlined text-primary text-[20px]">flight_land</span>
                          <span className="text-label-lg text-on-surface font-bold">Return Flight</span>
                          <span className="text-label-md text-on-surface-variant">{defaultBookingData.flight.return.date}</span>
                        </div>
                        <span className="bg-tertiary/10 text-tertiary text-label-sm px-space-sm py-0.5 rounded-full font-bold">Confirmed</span>
                      </div>
                      <div className="p-space-md">
                        <div className="flex items-center gap-space-md mb-space-sm">
                          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0">
                            <span className="text-label-lg text-primary font-bold">{defaultBookingData.flight.airlineCode}</span>
                          </div>
                          <div>
                            <span className="text-label-lg text-on-surface font-bold">{defaultBookingData.flight.airline}</span>
                            <span className="text-label-sm text-on-surface-variant block">{defaultBookingData.flight.flightNumber} · {defaultBookingData.flight.aircraft}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-space-lg justify-between">
                          <div className="text-center">
                            <span className="text-headline-md text-on-surface font-bold tabular-nums block">{defaultBookingData.flight.return.departure}</span>
                            <span className="text-label-lg text-on-surface font-bold">{defaultBookingData.flight.return.from.code}</span>
                            <span className="text-body-sm text-on-surface-variant block">{defaultBookingData.flight.return.from.name}</span>
                          </div>
                          <div className="flex flex-col items-center flex-1 max-w-[250px]">
                            <span className="text-label-sm text-on-surface-variant">{defaultBookingData.flight.return.duration}</span>
                            <div className="w-full flex items-center gap-1 my-1">
                              <div className="h-[2px] flex-1 bg-outline-variant" />
                              <span className="material-symbols-outlined text-primary text-[16px] rotate-180">flight</span>
                              <div className="h-[2px] flex-1 bg-outline-variant" />
                            </div>
                            <span className="text-label-sm text-tertiary font-bold">{defaultBookingData.flight.return.stops}</span>
                          </div>
                          <div className="text-center">
                            <span className="text-headline-md text-on-surface font-bold tabular-nums block">{defaultBookingData.flight.return.arrival}</span>
                            <span className="text-label-lg text-on-surface font-bold">{defaultBookingData.flight.return.to.code}</span>
                            <span className="text-body-sm text-on-surface-variant block">{defaultBookingData.flight.return.to.name}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Hotel Booking Card */}
                    <div className="bg-surface-container-lowest rounded-xl shadow-card overflow-hidden">
                      <div className="bg-primary/5 border-b border-outline-variant/20 px-space-md py-space-sm flex items-center justify-between">
                        <div className="flex items-center gap-space-sm">
                          <span className="material-symbols-outlined text-primary text-[20px]">hotel</span>
                          <span className="text-label-lg text-on-surface font-bold">Hotel Stay</span>
                          <span className="text-label-md text-on-surface-variant">{defaultBookingData.hotel.nights} nights</span>
                        </div>
                        <span className="bg-tertiary/10 text-tertiary text-label-sm px-space-sm py-0.5 rounded-full font-bold">Reserved</span>
                      </div>
                      <div className="p-space-md flex flex-col md:flex-row gap-space-md">
                        <div className="w-full md:w-48 h-36 rounded-lg overflow-hidden flex-shrink-0">
                          <img src={defaultBookingData.hotel.img} alt={defaultBookingData.hotel.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 flex flex-col gap-space-xs">
                          <h3 className="text-headline-sm text-on-surface font-bold">{defaultBookingData.hotel.name}</h3>
                          <div className="flex items-center gap-space-xs text-body-sm text-on-surface-variant">
                            <span className="material-symbols-outlined text-[14px]">location_on</span>
                            <span>{defaultBookingData.hotel.location}</span>
                          </div>
                          <div className="flex items-center gap-space-sm">
                            <span className="bg-tertiary text-on-tertiary px-space-sm py-space-xs rounded-lg text-label-lg font-bold tabular-nums">{defaultBookingData.hotel.rating}</span>
                            <span className="text-label-lg text-on-surface font-bold">{defaultBookingData.hotel.ratingLabel}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-space-sm text-body-sm text-on-surface-variant mt-space-xs">
                            <div className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">calendar_today</span>Check-in: {defaultBookingData.hotel.checkIn}</div>
                            <div className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">calendar_month</span>Check-out: {defaultBookingData.hotel.checkOut}</div>
                            <div className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">bed</span>{defaultBookingData.hotel.room}</div>
                            <div className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">group</span>{defaultBookingData.hotel.guests}</div>
                          </div>
                          <div className="flex items-center gap-space-xs flex-wrap mt-space-xs">
                            {defaultBookingData.hotel.amenities.map((a, i) => (
                              <span key={i} className="bg-surface-container text-on-surface-variant text-label-sm px-space-sm py-0.5 rounded-full">{a}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Step 2: Traveller Details & Corporate myBiz Options */}
            {step >= 2 && (
              <div className="space-y-space-md">
                <div className="bg-surface-container-lowest rounded-xl shadow-card overflow-hidden">
                  <div className="bg-primary/5 border-b border-outline-variant/20 px-space-md py-space-sm flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-space-sm">
                      <span className="material-symbols-outlined text-primary text-[20px]">person</span>
                      <span className="text-label-lg text-on-surface font-bold">Traveller & Contact Details</span>
                    </div>
                    {user ? (
                      <span className="text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Signed in as {user.email} (Linked to My Trips)
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold bg-surface-container-high text-on-surface-variant px-2.5 py-0.5 rounded-full">
                        Guest Checkout (Enter contact details below)
                      </span>
                    )}
                  </div>
                  <div className="p-space-md">
                    {/* Quick selection from Saved Travellers */}
                    {savedTravellers.length > 0 && (
                      <div className="mb-4 p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl">
                        <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5 mb-2">
                          <span className="material-symbols-outlined text-[16px] text-[#008cff]">bolt</span>
                          <span>Auto-fill from Saved Travellers:</span>
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {savedTravellers.map((st) => (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => {
                                setTraveler((prev) => ({
                                  ...prev,
                                  title: st.title || 'Mr',
                                  firstName: st.firstName,
                                  lastName: st.lastName,
                                  gender: st.gender || 'MALE',
                                  passengerType: st.passengerType || 'ADULT',
                                  passportNumber: st.passportNumber || prev.passportNumber,
                                  phone: st.phone || prev.phone,
                                  email: st.email || prev.email,
                                }));
                              }}
                              className="px-3 py-1.5 bg-white hover:bg-blue-50 text-gray-800 hover:text-[#008cff] border border-gray-300 hover:border-[#008cff] rounded-lg text-xs font-semibold transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[14px] text-[#008cff]">person</span>
                              <span>{st.title} {st.firstName} {st.lastName}</span>
                              <span className="text-[10px] text-gray-500 uppercase bg-gray-100 px-1.5 py-0.2 rounded font-bold">
                                {st.passengerType}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-6 gap-space-md">
                      <div className="sm:col-span-1">
                        <label className="text-label-md text-on-surface-variant block mb-1">Title</label>
                        <select
                          value={traveler.title}
                          onChange={(e) => setTraveler({ ...traveler, title: e.target.value })}
                          className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-space-sm py-space-sm text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all"
                        >
                          <option value="Mr">Mr</option>
                          <option value="Mrs">Mrs</option>
                          <option value="Ms">Ms</option>
                          <option value="Dr">Dr</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-label-md text-on-surface-variant block mb-1">First Name *</label>
                        <input
                          type="text"
                          value={traveler.firstName}
                          onChange={(e) => setTraveler({ ...traveler, firstName: e.target.value })}
                          placeholder="e.g. John"
                          required
                          className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-space-sm py-space-sm text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="text-label-md text-on-surface-variant block mb-1">Last Name *</label>
                        <input
                          type="text"
                          value={traveler.lastName}
                          onChange={(e) => setTraveler({ ...traveler, lastName: e.target.value })}
                          placeholder="e.g. Doe"
                          required
                          className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-space-sm py-space-sm text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-label-md text-on-surface-variant block mb-1">Gender</label>
                        <select
                          value={traveler.gender}
                          onChange={(e) => setTraveler({ ...traveler, gender: e.target.value })}
                          className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-space-sm py-space-sm text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all"
                        >
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-label-md text-on-surface-variant block mb-1">Passenger Type</label>
                        <select
                          value={traveler.passengerType}
                          onChange={(e) => setTraveler({ ...traveler, passengerType: e.target.value })}
                          className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-space-sm py-space-sm text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all"
                        >
                          <option value="ADULT">Adult (12+ yrs)</option>
                          <option value="CHILD">Child (2-12 yrs)</option>
                          <option value="INFANT">Infant (under 2 yrs)</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-label-md text-on-surface-variant block mb-1">Passport / ID No.</label>
                        <input
                          type="text"
                          value={traveler.passportNumber}
                          onChange={(e) => setTraveler({ ...traveler, passportNumber: e.target.value })}
                          placeholder="Optional"
                          className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-space-sm py-space-sm text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all uppercase font-mono"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="text-label-md text-on-surface-variant block mb-1">Contact Email *</label>
                        <input
                          type="email"
                          value={traveler.email}
                          onChange={(e) => setTraveler({ ...traveler, email: e.target.value })}
                          placeholder="traveler@example.com"
                          required
                          className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-space-sm py-space-sm text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="text-label-md text-on-surface-variant block mb-1">Contact Phone *</label>
                        <input
                          type="tel"
                          value={traveler.phone}
                          onChange={(e) => setTraveler({ ...traveler, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          required
                          className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-space-sm py-space-sm text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all tabular-nums"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── myBiz Corporate Travel & GST Invoicing ── */}
                <div className="bg-surface-container-lowest rounded-xl shadow-card overflow-hidden border border-amber-300/70">
                  <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border-b border-amber-200/60 px-space-md py-space-sm flex items-center justify-between">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-6 h-6 rounded-md bg-amber-500 text-white flex items-center justify-center font-black text-xs">
                        B
                      </div>
                      <span className="text-label-lg text-on-surface font-bold">
                        myBiz Corporate Booking & GST Invoicing
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-black bg-amber-500/20 text-amber-800 px-2 py-0.5 rounded border border-amber-500/30">
                      Input Tax Credit
                    </span>
                  </div>

                  <div className="p-space-md space-y-3">
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isBizBooking}
                        onChange={(e) => setIsBizBooking(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-label-md font-semibold text-on-surface">
                        Book as myBiz corporate travel & get GST tax invoice (Claim up to 18% ITC)
                      </span>
                    </label>

                    {isBizBooking && (
                      <div className="pt-2 border-t border-outline-variant/20 grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
                        <div>
                          <label className="text-label-sm text-on-surface-variant block mb-1 font-semibold">
                            Company Name <span className="text-error">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Acme Tech Pvt Ltd"
                            value={bizCompanyName}
                            onChange={(e) => setBizCompanyName(e.target.value)}
                            className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-space-sm py-1.5 text-body-sm text-on-surface focus:border-amber-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-label-sm text-on-surface-variant block mb-1 font-semibold">
                            Company GSTIN <span className="text-error">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 27AAAAA0000A1Z5"
                            value={bizGstin}
                            onChange={(e) => setBizGstin(e.target.value.toUpperCase())}
                            className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-space-sm py-1.5 text-body-sm text-on-surface uppercase focus:border-amber-500 outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-label-sm text-on-surface-variant block mb-1 font-semibold">
                            Cost Center / Dept
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Engineering / Sales"
                            value={bizCostCenter}
                            onChange={(e) => setBizCostCenter(e.target.value)}
                            className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-space-sm py-1.5 text-body-sm text-on-surface focus:border-amber-500 outline-none"
                          />
                        </div>

                        <div className="sm:col-span-3 bg-amber-50/70 border border-amber-200/60 rounded-lg p-2.5 flex items-center justify-between text-[11px] text-amber-900">
                          <span className="flex items-center gap-1.5">
                            <span className="font-bold">✔ Assured GST Tax Invoice:</span> Will be automatically filed into your company myBiz dashboard.
                          </span>
                          <span className="font-bold text-emerald-700">Policy Compliant</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {step >= 3 && (
              <div className="bg-surface-container-lowest rounded-xl shadow-card overflow-hidden">
                <div className="bg-primary/5 border-b border-outline-variant/20 px-space-md py-space-sm flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-primary text-[20px]">payment</span>
                  <span className="text-label-lg text-on-surface font-bold">Payment Method</span>
                </div>
                <div className="p-space-md flex flex-col gap-space-md">
                  {/* SS Journey Dual Wallet Split Option */}
                  {user && walletQuote && (walletQuote.balances.cashAvailable > 0 || walletQuote.balances.promoAvailable > 0) && (
                    <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white border border-blue-200/80 rounded-2xl p-4 space-y-3.5">
                      <div className="flex items-center justify-between pb-2.5 border-b border-blue-200/60">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#008cff] text-[22px]">account_balance_wallet</span>
                          <div>
                            <h4 className="text-sm font-black text-gray-900">SS Journey Dual Wallet</h4>
                            <p className="text-[11px] text-gray-500">
                              Apply saved balances to pay less online {isLoadingWalletQuote && '· Recalculating...'}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-black text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
                          {formatPrice((walletQuote.balances.cashAvailable || 0) + (walletQuote.balances.promoAvailable || 0))} Available
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {/* Option 1: Promotional Wallet */}
                        {walletQuote.balances.promoAvailable > 0 && (
                          <label className="flex items-start justify-between p-3 rounded-xl border border-indigo-200/60 bg-white hover:bg-indigo-50/30 transition cursor-pointer">
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={usePromoWallet}
                                onChange={(e) => setUsePromoWallet(e.target.checked)}
                                className="w-4 h-4 rounded text-[#008cff] focus:ring-[#008cff] mt-0.5 cursor-pointer"
                              />
                              <div>
                                <span className="text-xs font-bold text-gray-900 block">
                                  Use Promotional Wallet
                                </span>
                                <span className="text-[11px] text-gray-500 block mt-0.5">
                                  Eligible for this booking: <strong>{formatPrice(walletQuote.eligible.promoAmount)}</strong> (Earliest-expiring FIFO)
                                </span>
                              </div>
                            </div>
                            <span className="text-xs font-black text-indigo-600">
                              -{formatPrice(appliedPromo)}
                            </span>
                          </label>
                        )}

                        {/* Option 2: Cash Wallet */}
                        {walletQuote.balances.cashAvailable > 0 && (
                          <label className="flex items-start justify-between p-3 rounded-xl border border-emerald-200/60 bg-white hover:bg-emerald-50/30 transition cursor-pointer">
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={useCashWallet}
                                onChange={(e) => setUseCashWallet(e.target.checked)}
                                className="w-4 h-4 rounded text-[#008cff] focus:ring-[#008cff] mt-0.5 cursor-pointer"
                              />
                              <div>
                                <span className="text-xs font-bold text-gray-900 block">
                                  Use Cash Wallet
                                </span>
                                <span className="text-[11px] text-gray-500 block mt-0.5">
                                  Refundable &amp; stored value. Available: <strong>{formatPrice(walletQuote.balances.cashAvailable)}</strong>
                                </span>
                              </div>
                            </div>
                            <span className="text-xs font-black text-emerald-600">
                              -{formatPrice(appliedCash)}
                            </span>
                          </label>
                        )}
                      </div>

                      {/* Split summary banner */}
                      <div className="p-3 bg-white rounded-xl border border-blue-200/50 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                          <span>Total Wallet Applied: <strong>-{formatPrice(totalWalletDeduction)}</strong></span>
                        </div>
                        <div className="font-bold text-gray-900">
                          Remaining to Pay: <span className="text-[#008cff] font-black">{formatPrice(netPayableOnline)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Method Tabs */}
                  <div className="flex flex-wrap items-center gap-space-sm">
                    {([
                      // { id: 'razorpay' as const, label: 'Razorpay Test Mode', badge: 'Cards · UPI · Netbanking', icon: 'verified_user' },
                      { id: 'card' as const, label: 'Demo Card Simulation', badge: 'Instant Sim', icon: 'credit_card' },
                      { id: 'paypal' as const, label: 'Demo UPI / Wallet', badge: 'Instant Sim', icon: 'account_balance_wallet' },
                    ]).map(pm => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id)}
                        className={`flex items-center gap-space-xs px-space-md py-space-sm rounded-lg text-label-md transition-all border ${
                          paymentMethod === pm.id
                            ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                            : 'border-outline-variant/30 text-on-surface-variant hover:border-primary/50'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">{pm.icon}</span>
                        <div className="flex flex-col text-left">
                          <span>{pm.label}</span>
                          <span className="text-[11px] font-normal opacity-75">{pm.badge}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Razorpay Test Mode Gateway Details (temporarily commented out)
                  {paymentMethod === 'razorpay' && (
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-space-md flex flex-col gap-space-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-[20px]">lock</span>
                          <span className="text-label-md font-bold text-primary">Razorpay Official Standard Checkout</span>
                        </div>
                        <span className="text-[11px] font-mono uppercase bg-primary/15 text-primary px-2 py-0.5 rounded-full font-bold">
                          Test Mode Sandbox
                        </span>
                      </div>
                      <p className="text-body-sm text-on-surface-variant">
                        Clicking <strong>Confirm & Pay</strong> creates a verified server-side order and opens the official Razorpay Checkout modal with safe test mode. No actual money will be charged.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-outline-variant/20 text-body-xs text-on-surface-variant">
                        <div className="bg-surface-container-low p-2 rounded-lg">
                          <strong className="text-on-surface block mb-0.5">Test Cards</strong>
                          <span className="font-mono text-[11px]">4111 2222 3333 4444</span>
                          <span className="block text-[10px] text-on-surface-variant/80">Any valid future date & OTP 123456</span>
                        </div>
                        <div className="bg-surface-container-low p-2 rounded-lg">
                          <strong className="text-on-surface block mb-0.5">Test UPI ID</strong>
                          <span className="font-mono text-[11px]">success@razorpay</span>
                          <span className="block text-[10px] text-on-surface-variant/80">Instant test authorization</span>
                        </div>
                        <div className="bg-surface-container-low p-2 rounded-lg">
                          <strong className="text-on-surface block mb-0.5">Netbanking</strong>
                          <span className="font-mono text-[11px]">SBI, HDFC, ICICI</span>
                          <span className="block text-[10px] text-on-surface-variant/80">Select test bank and confirm</span>
                        </div>
                      </div>
                    </div>
                  )}
                  */}

                  {/* Card Form for Demo Simulator */}
                  {paymentMethod === 'card' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                      <div className="md:col-span-2">
                        <label className="text-label-md text-on-surface-variant block mb-1">Card Number</label>
                        <input type="text" placeholder="1234 5678 9012 3456" className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-space-sm py-space-sm text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all tabular-nums" />
                      </div>
                      <div>
                        <label className="text-label-md text-on-surface-variant block mb-1">Expiry Date</label>
                        <input type="text" placeholder="MM / YY" className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-space-sm py-space-sm text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all" />
                      </div>
                      <div>
                        <label className="text-label-md text-on-surface-variant block mb-1">CVV</label>
                        <input type="text" placeholder="•••" className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-space-sm py-space-sm text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all" />
                      </div>
                    </div>
                  )}

                  {/* Demo Payment Notice & Testing Simulation Toggle */}
                  {paymentMethod !== 'razorpay' && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex flex-col gap-2 mt-2">
                      <div className="flex items-center gap-2 text-label-md font-bold text-amber-800 dark:text-amber-400">
                        <span className="material-symbols-outlined text-[18px]">info</span>
                        <span>Demo Payment Simulator</span>
                      </div>
                      <p className="text-body-sm text-on-surface-variant">
                        This checkout executes simulated authorization via <code>POST /api/v1/payments/demo</code> without calling external payment gateways.
                      </p>
                      <label className="flex items-center gap-2 cursor-pointer pt-1 text-label-sm text-on-surface font-semibold">
                        <input
                          type="checkbox"
                          checked={simulateFailure}
                          onChange={(e) => setSimulateFailure(e.target.checked)}
                          className="rounded accent-rose-600 w-4 h-4"
                        />
                        <span className="text-rose-600 dark:text-rose-400">Simulate Payment Failure (Test error handling & retry without duplicate booking)</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Pricing Summary (Sticky) ── */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 flex flex-col gap-space-md">
              <div className="bg-surface-container-lowest rounded-xl shadow-card p-space-md flex flex-col gap-space-sm">
                <h3 className="text-headline-sm text-on-surface font-bold">Booking Summary</h3>

                {isCustomItem ? (
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex items-center gap-space-xs text-label-lg text-on-surface font-bold">
                      <span className="material-symbols-outlined text-[16px] text-primary">
                        {activeService === 'TRAIN' ? 'train' :
                         activeService === 'BUS' ? 'directions_bus' :
                         activeService === 'CAB' ? 'local_taxi' :
                         activeService === 'PACKAGE' ? 'luggage' :
                         activeService === 'HOTEL' ? 'hotel' : 'flight'}
                      </span>
                      <span>{bookingItem?.title || activeService}</span>
                    </div>
                    <div className="flex justify-between text-body-sm text-on-surface-variant">
                      <span>Base Fare / Price</span>
                      <span className="tabular-nums">{formatPrice(customBase)}</span>
                    </div>
                    <div className="flex justify-between text-body-sm text-on-surface-variant">
                      <span>Taxes &amp; GST (18%)</span>
                      <span className="tabular-nums">{formatPrice(customTaxes)}</span>
                    </div>
                    {customDiscount > 0 && (
                      <div className="flex justify-between text-body-sm text-tertiary">
                        <span>Promotional Discount</span>
                        <span className="tabular-nums">-{formatPrice(customDiscount)}</span>
                      </div>
                    )}
                    {hasInsurance && (
                      <div className="flex justify-between text-body-sm text-on-surface-variant">
                        <span>Trip Protection</span>
                        <span className="tabular-nums">{formatPrice(customInsurance)}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Flight Pricing */}
                    <div className="flex flex-col gap-space-xs">
                      <div className="flex items-center gap-space-xs text-label-lg text-on-surface font-bold">
                        <span className="material-symbols-outlined text-[16px] text-primary">flight</span>
                        <span>Flights (Round Trip)</span>
                      </div>
                      <div className="flex justify-between text-body-sm text-on-surface-variant">
                        <span>Base fare × 2</span>
                        <span className="tabular-nums">{formatPrice(defaultP.flightBase * 2)}</span>
                      </div>
                      <div className="flex justify-between text-body-sm text-on-surface-variant">
                        <span>Taxes &amp; fees</span>
                        <span className="tabular-nums">{formatPrice(defaultP.flightTaxes * 2)}</span>
                      </div>
                    </div>

                    <div className="h-[1px] bg-outline-variant/20" />

                    {/* Hotel Pricing */}
                    <div className="flex flex-col gap-space-xs">
                      <div className="flex items-center gap-space-xs text-label-lg text-on-surface font-bold">
                        <span className="material-symbols-outlined text-[16px] text-primary">hotel</span>
                        <span>Hotel ({defaultP.hotelNights} nights)</span>
                      </div>
                      <div className="flex justify-between text-body-sm text-on-surface-variant">
                        <span>{formatPrice(defaultP.hotelBase)}/night × {defaultP.hotelNights}</span>
                        <span className="tabular-nums">{formatPrice(defaultP.hotelBase * defaultP.hotelNights)}</span>
                      </div>
                      <div className="flex justify-between text-body-sm text-on-surface-variant">
                        <span>Taxes &amp; resort fee</span>
                        <span className="tabular-nums">{formatPrice(defaultP.hotelTaxes)}</span>
                      </div>
                    </div>

                    <div className="h-[1px] bg-outline-variant/20" />

                    {/* Bundle Discount */}
                    <div className="flex justify-between text-body-sm">
                      <span className="text-tertiary font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">discount</span>
                        Bundle Discount
                      </span>
                      <span className="text-tertiary font-bold tabular-nums">{defaultP.bundleDiscount < 0 ? '-' : ''}{formatPrice(Math.abs(defaultP.bundleDiscount))}</span>
                    </div>

                    {/* Travel Insurance */}
                    <label className="flex justify-between text-body-sm text-on-surface-variant cursor-pointer items-center">
                      <span className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={hasInsurance}
                          onChange={(e) => setHasInsurance(e.target.checked)}
                          className="accent-primary rounded"
                        />
                        <span className="material-symbols-outlined text-[14px]">health_and_safety</span>
                        Travel Insurance
                      </span>
                      <span className="tabular-nums">{formatPrice(defaultP.insurance)}</span>
                    </label>
                  </>
                )}

                {appliedCoupon && (
                  <div className="flex justify-between text-body-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">local_offer</span>
                      Coupon ({appliedCoupon.code})
                    </span>
                    <span className="tabular-nums">-{formatPrice(appliedCoupon.discount_amount)}</span>
                  </div>
                )}

                {/* Promo Code Input */}
                <div className="pt-2 pb-1 border-t border-outline-variant/20">
                  {!appliedCoupon ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Promo code (e.g. SSJOURNEY)"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1 uppercase font-mono text-xs bg-surface-container-low border border-outline-variant/50 rounded-lg px-2.5 py-2 text-on-surface focus:border-primary outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={!couponCode.trim() || isValidatingCoupon}
                        className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg text-xs font-bold disabled:opacity-50 transition cursor-pointer"
                      >
                        {isValidatingCoupon ? 'Checking...' : 'Apply'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                        <span className="material-symbols-outlined text-[16px]">verified</span>
                        <span>Code <strong>{appliedCoupon.code}</strong> (-{formatPrice(appliedCoupon.discount_amount)})</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-xs text-rose-500 hover:text-rose-700 font-semibold underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  {couponError && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1">{couponError}</p>
                  )}
                </div>

                <div className="h-[1px] bg-outline-variant/20" />

                {/* Wallet Deductions in Summary */}
                {totalWalletDeduction > 0 && (
                  <div className="flex flex-col gap-1 py-1 bg-blue-50/50 p-2.5 rounded-lg border border-blue-200/50 text-body-sm">
                    {appliedPromo > 0 && (
                      <div className="flex justify-between text-indigo-700 font-semibold">
                        <span>Promotional Wallet Applied</span>
                        <span className="tabular-nums font-bold">-{formatPrice(appliedPromo)}</span>
                      </div>
                    )}
                    {appliedCash > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>Cash Wallet Applied</span>
                        <span className="tabular-nums font-bold">-{formatPrice(appliedCash)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Grand Total / Net Payable */}
                <div className="flex justify-between items-baseline">
                  <span className="text-headline-sm text-on-surface font-bold">
                    {totalWalletDeduction > 0 ? 'Net Payable Online' : 'Total'}
                  </span>
                  <div className="text-right">
                    <span className="text-headline-lg text-on-surface font-bold tabular-nums block">
                      {formatPrice(netPayableOnline)}
                    </span>
                    {totalWalletDeduction > 0 && (
                      <span className="text-[11px] text-gray-400 line-through block">
                        Original Total: {formatPrice(grandTotal)}
                      </span>
                    )}
                    {currency !== 'INR' && (
                      <span className="text-[11px] text-on-surface-variant font-medium block">
                        (approx. ₹{netPayableOnline.toLocaleString('en-IN')})
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-tertiary/10 text-tertiary text-label-sm px-space-sm py-space-xs rounded-lg flex items-center gap-space-xs font-bold">
                  <span className="material-symbols-outlined text-[16px]">savings</span>
                  <span>
                    {netPayableOnline === 0
                      ? '100% of this reservation is covered by your SS Journey Wallet!'
                      : isCustomItem
                      ? `Instant confirmation with 100% verified provider.`
                      : `You save ${formatPrice(Math.abs(defaultP.bundleDiscount) + totalWalletDeduction)} on this booking!`}
                  </span>
                </div>

                {/* Terms & CTA */}
                <label className="flex items-start gap-space-sm cursor-pointer mt-space-xs">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={() => setAgreeTerms(!agreeTerms)}
                    className="accent-primary rounded w-4 h-4 mt-0.5"
                  />
                  <span className="text-body-sm text-on-surface-variant">
                    I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a>, <a href="#" className="text-primary hover:underline">Cancellation Policy</a>, and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
                  </span>
                </label>

                {errorMessage && (
                  <div className="bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 rounded-xl p-space-sm flex items-start gap-2.5 text-body-sm">
                    <span className="material-symbols-outlined text-rose-600 text-[20px] mt-0.5 flex-shrink-0">error</span>
                    <div className="flex-1">
                      <p className="font-bold text-rose-800 dark:text-rose-300">Transaction Failed</p>
                      <p className="mt-0.5">{errorMessage}</p>
                      {createdBooking && (
                        <p className="text-[12px] opacity-80 mt-1.5 font-medium">
                          Note: Reservation <strong>#{createdBooking.booking_reference}</strong> was initialized in Pending status. Click Retry below to safely pay without creating a duplicate booking.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {!hasValidInventoryId && (
                  <div className="bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 rounded-xl p-space-sm flex items-start gap-2.5 text-body-sm">
                    <span className="material-symbols-outlined text-amber-600 text-[20px] mt-0.5 flex-shrink-0">warning</span>
                    <div>
                      <p className="font-bold">Invalid Inventory Record</p>
                      <p className="mt-0.5">This listing does not carry a verified database UUID. Booking is disabled to prevent data corruption.</p>
                    </div>
                  </div>
                )}

                {step < 3 ? (
                  <button
                    disabled={!hasValidInventoryId}
                    onClick={() => setStep((step + 1) as 1 | 2 | 3)}
                    className="w-full bg-primary hover:bg-primary-container disabled:opacity-50 disabled:cursor-not-allowed text-on-primary py-space-md rounded-lg text-headline-sm font-bold transition-all shadow-md flex items-center justify-center gap-space-sm"
                  >
                    <span>Continue</span>
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </button>
                ) : (
                  <button
                    disabled={!agreeTerms || isProcessing || !hasValidInventoryId}
                    onClick={handleConfirmAndPay}
                    className={`w-full py-space-md rounded-lg text-headline-sm font-bold transition-all shadow-md flex items-center justify-center gap-space-sm ${
                      !agreeTerms || isProcessing || !hasValidInventoryId
                        ? 'bg-outline-variant/30 text-on-surface-variant/50 cursor-not-allowed'
                        : 'bg-primary hover:bg-primary-container text-on-primary shadow-lg hover:shadow-xl cursor-pointer'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                        <span>Processing Payment...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[20px]">lock</span>
                        <span>
                          {netPayableOnline === 0
                            ? 'Confirm & Pay ₹0 via Wallet'
                            : createdBooking
                            ? `Retry Payment · Ref: ${createdBooking.booking_reference}`
                            : `Confirm & Pay ${formatPrice(netPayableOnline)}`}
                        </span>
                      </>
                    )}
                  </button>
                )}

                {/* Security badges */}
                <div className="flex items-center justify-center gap-space-md text-label-sm text-on-surface-variant mt-space-xs">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-tertiary">lock</span>SSL Encrypted</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-tertiary">verified_user</span>PCI Compliant</span>
                </div>
              </div>

              {/* Need Help */}
              <div className="bg-surface-container-lowest rounded-xl shadow-card p-space-md flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-primary text-[24px]">support_agent</span>
                <div className="flex-1">
                  <span className="text-label-lg text-on-surface font-bold block">Need help?</span>
                  <span className="text-body-sm text-on-surface-variant">24/7 support available</span>
                </div>
                <button 
                  type="button"
                  onClick={() => alert('SS Journey 24/7 Support\nPhone: +91 1800 123 4567\nEmail: support@ssjourney.com\nLive Help: 24/7 Priority Agent Assistance')}
                  className="bg-surface-container hover:bg-surface-container-high text-primary px-space-md py-space-xs rounded-lg text-label-lg transition-colors cursor-pointer"
                >
                  Contact Us
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Sticky Bottom Checkout Bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/30 px-4 py-3 shadow-2xl flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Grand Total</span>
          <span className="text-xl font-black text-primary tabular-nums">{formatPrice(grandTotal)}</span>
        </div>
        {step < 3 ? (
          <button
            type="button"
            disabled={!hasValidInventoryId}
            onClick={() => setStep((step + 1) as 1 | 2 | 3)}
            className="px-5 py-2.5 bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary rounded-xl text-sm font-bold shadow-md transition active:scale-95 flex items-center gap-1.5"
          >
            <span>Continue</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={!agreeTerms || isProcessing || !hasValidInventoryId}
            onClick={handleConfirmAndPay}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition active:scale-95 flex items-center gap-1.5 ${
              !agreeTerms || isProcessing || !hasValidInventoryId
                ? 'bg-outline-variant/30 text-on-surface-variant/50 cursor-not-allowed'
                : 'bg-primary hover:bg-primary-container text-on-primary shadow-lg cursor-pointer'
            }`}
          >
            {isProcessing ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">lock</span>
                <span>Pay {formatPrice(grandTotal)}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
