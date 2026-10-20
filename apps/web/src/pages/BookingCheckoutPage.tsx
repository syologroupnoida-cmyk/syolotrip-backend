import React, { useState } from 'react';
import { createBookingApi, payDemoBookingApi, searchFlightsApi } from '../services/api';

// ─── Mock Booking Data ───────────────────────────────────
const bookingData = {
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
    { name: 'John Doe', type: 'Adult', passport: '•••••1234', email: 'john@example.com', phone: '+1 (555) 123-4567' },
  ],
};

interface BookingCheckoutPageProps {
  onNavigate?: (screen: 'explore' | 'flights' | 'hotels' | 'checkout' | 'trips') => void;
}

// ─── Component ───────────────────────────────────────────
export const BookingCheckoutPage: React.FC<BookingCheckoutPageProps> = ({ onNavigate }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'apple'>('card');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    reference: string;
    email: string;
    total: number;
  } | null>(null);

  const p = bookingData.pricing;
  const flightTotal = (p.flightBase + p.flightTaxes) * 2; // round trip
  const hotelTotal = (p.hotelBase * p.hotelNights) + p.hotelTaxes;
  const subtotal = flightTotal + hotelTotal;
  const grandTotal = subtotal + p.bundleDiscount + p.insurance + p.serviceFee;

  const steps = [
    { num: 1, label: 'Review Itinerary' },
    { num: 2, label: 'Traveller Details' },
    { num: 3, label: 'Payment' },
  ];

  const handleConfirmAndPay = async () => {
    setIsProcessing(true);
    try {
      const flights = await searchFlightsApi();
      const flightId = flights.length > 0 ? flights[0].id : 'FL-001';
      
      const booking = await createBookingApi({
        service_type: 'FLIGHT',
        contact_email: 'customer@ssjourney.com',
        contact_phone: '+919876543210',
        has_insurance: true,
        items: [
          {
            item_type: 'FLIGHT',
            item_reference_id: flightId,
            quantity: 1,
            meta_data: { cabin_class: 'ECONOMY', seat_preference: 'WINDOW' }
          }
        ],
        passengers: [
          {
            title: 'Mr',
            first_name: 'John',
            last_name: 'Doe',
            passenger_type: 'ADULT',
            passport_number: 'J1234567'
          }
        ]
      });

      await payDemoBookingApi({
        booking_id: booking.id,
        payment_method: paymentMethod === 'card' ? 'CREDIT_CARD' : 'UPI',
        card_last_four: '4242'
      });

      setConfirmedBooking({
        reference: booking.booking_reference,
        email: booking.contact_email,
        total: Number(booking.total_price)
      });
      setIsConfirmed(true);
    } catch (err) {
      console.warn('Booking API error during checkout demo, falling back gracefully', err);
      setConfirmedBooking({
        reference: 'SSJ-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        email: 'customer@ssjourney.com',
        total: grandTotal
      });
      setIsConfirmed(true);
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
          <h2 className="text-display-hero text-on-surface tracking-tight">You're going to Tokyo & Paris!</h2>
          <p className="text-body-lg text-on-surface-variant max-w-lg">
            Your booking reference is <strong className="text-primary font-mono text-headline-sm">{confirmedBooking?.reference || 'SSJ-849201'}</strong>. We have sent your e-tickets and reservation vouchers to <span className="text-on-surface font-semibold">{confirmedBooking?.email || 'customer@ssjourney.com'}</span>.
          </p>

          <div className="w-full bg-surface-container-low rounded-xl p-space-md text-left my-space-sm flex flex-col gap-space-sm">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-space-xs">
              <span className="text-label-md text-on-surface-variant">Itinerary</span>
              <span className="text-label-md font-bold text-on-surface">Japan Airlines + Grand Hôtel</span>
            </div>
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-space-xs">
              <span className="text-label-md text-on-surface-variant">Booking Reference</span>
              <span className="text-label-md font-mono font-bold text-primary">{confirmedBooking?.reference || 'SSJ-849201'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-label-md text-on-surface-variant">Total Paid (Demo Payment)</span>
              <span className="text-headline-sm font-bold text-primary tabular-nums">₹{(confirmedBooking?.total || grandTotal).toLocaleString('en-IN')}</span>
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
        <div className="max-w-[1280px] mx-auto px-gutter py-space-md">
          <div className="flex items-center justify-center gap-space-lg">
            {steps.map((s, i) => (
              <React.Fragment key={s.num}>
                <div className="flex items-center gap-space-sm cursor-pointer" onClick={() => setStep(s.num as 1 | 2 | 3)}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-label-lg font-bold transition-colors ${
                    step >= s.num ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
                  }`}>
                    {step > s.num ? (
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    ) : s.num}
                  </div>
                  <span className={`text-label-lg ${step >= s.num ? 'text-primary font-bold' : 'text-on-surface-variant'} hidden sm:inline`}>{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-16 h-[2px] ${step > s.num ? 'bg-primary' : 'bg-outline-variant/40'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main Content ── */}
      <div className="max-w-[1280px] mx-auto px-gutter py-space-lg">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          {/* ── LEFT: Details ── */}
          <div className="lg:col-span-8 flex flex-col gap-space-md">
            {/* Step 1: Itinerary Review */}
            {step >= 1 && (
              <>
                {/* Flight Outbound */}
                <div className="bg-surface-container-lowest rounded-xl shadow-card overflow-hidden">
                  <div className="bg-primary/5 border-b border-outline-variant/20 px-space-md py-space-sm flex items-center justify-between">
                    <div className="flex items-center gap-space-sm">
                      <span className="material-symbols-outlined text-primary text-[20px]">flight_takeoff</span>
                      <span className="text-label-lg text-on-surface font-bold">Outbound Flight</span>
                      <span className="text-label-md text-on-surface-variant">{bookingData.flight.outbound.date}</span>
                    </div>
                    <span className="bg-tertiary/10 text-tertiary text-label-sm px-space-sm py-0.5 rounded-full font-bold">Confirmed</span>
                  </div>
                  <div className="p-space-md">
                    <div className="flex items-center gap-space-md mb-space-sm">
                      <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0">
                        <span className="text-label-lg text-primary font-bold">{bookingData.flight.airlineCode}</span>
                      </div>
                      <div>
                        <span className="text-label-lg text-on-surface font-bold">{bookingData.flight.airline}</span>
                        <span className="text-label-sm text-on-surface-variant block">{bookingData.flight.flightNumber} · {bookingData.flight.aircraft}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-lg justify-between">
                      <div className="text-center">
                        <span className="text-headline-md text-on-surface font-bold tabular-nums block">{bookingData.flight.outbound.departure}</span>
                        <span className="text-label-lg text-on-surface font-bold">{bookingData.flight.outbound.from.code}</span>
                        <span className="text-body-sm text-on-surface-variant block">{bookingData.flight.outbound.from.name}</span>
                      </div>
                      <div className="flex flex-col items-center flex-1 max-w-[250px]">
                        <span className="text-label-sm text-on-surface-variant">{bookingData.flight.outbound.duration}</span>
                        <div className="w-full flex items-center gap-1 my-1">
                          <div className="h-[2px] flex-1 bg-outline-variant" />
                          <span className="material-symbols-outlined text-primary text-[16px]">flight</span>
                          <div className="h-[2px] flex-1 bg-outline-variant" />
                        </div>
                        <span className="text-label-sm text-tertiary font-bold">{bookingData.flight.outbound.stops}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-headline-md text-on-surface font-bold tabular-nums block">{bookingData.flight.outbound.arrival}</span>
                        <span className="text-label-lg text-on-surface font-bold">{bookingData.flight.outbound.to.code}</span>
                        <span className="text-body-sm text-on-surface-variant block">{bookingData.flight.outbound.to.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-md mt-space-sm text-body-sm text-on-surface-variant flex-wrap">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">airline_seat_recline_extra</span>{bookingData.flight.outbound.cabin}</span>
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">luggage</span>{bookingData.flight.outbound.baggage}</span>
                    </div>
                  </div>
                </div>

                {/* Flight Return */}
                <div className="bg-surface-container-lowest rounded-xl shadow-card overflow-hidden">
                  <div className="bg-primary/5 border-b border-outline-variant/20 px-space-md py-space-sm flex items-center justify-between">
                    <div className="flex items-center gap-space-sm">
                      <span className="material-symbols-outlined text-primary text-[20px]">flight_land</span>
                      <span className="text-label-lg text-on-surface font-bold">Return Flight</span>
                      <span className="text-label-md text-on-surface-variant">{bookingData.flight.return.date}</span>
                    </div>
                    <span className="bg-tertiary/10 text-tertiary text-label-sm px-space-sm py-0.5 rounded-full font-bold">Confirmed</span>
                  </div>
                  <div className="p-space-md">
                    <div className="flex items-center gap-space-md mb-space-sm">
                      <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0">
                        <span className="text-label-lg text-primary font-bold">{bookingData.flight.airlineCode}</span>
                      </div>
                      <div>
                        <span className="text-label-lg text-on-surface font-bold">{bookingData.flight.airline}</span>
                        <span className="text-label-sm text-on-surface-variant block">{bookingData.flight.flightNumber} · {bookingData.flight.aircraft}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-lg justify-between">
                      <div className="text-center">
                        <span className="text-headline-md text-on-surface font-bold tabular-nums block">{bookingData.flight.return.departure}</span>
                        <span className="text-label-lg text-on-surface font-bold">{bookingData.flight.return.from.code}</span>
                        <span className="text-body-sm text-on-surface-variant block">{bookingData.flight.return.from.name}</span>
                      </div>
                      <div className="flex flex-col items-center flex-1 max-w-[250px]">
                        <span className="text-label-sm text-on-surface-variant">{bookingData.flight.return.duration}</span>
                        <div className="w-full flex items-center gap-1 my-1">
                          <div className="h-[2px] flex-1 bg-outline-variant" />
                          <span className="material-symbols-outlined text-primary text-[16px] rotate-180">flight</span>
                          <div className="h-[2px] flex-1 bg-outline-variant" />
                        </div>
                        <span className="text-label-sm text-tertiary font-bold">{bookingData.flight.return.stops}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-headline-md text-on-surface font-bold tabular-nums block">{bookingData.flight.return.arrival}</span>
                        <span className="text-label-lg text-on-surface font-bold">{bookingData.flight.return.to.code}</span>
                        <span className="text-body-sm text-on-surface-variant block">{bookingData.flight.return.to.name}</span>
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
                      <span className="text-label-md text-on-surface-variant">{bookingData.hotel.nights} nights</span>
                    </div>
                    <span className="bg-tertiary/10 text-tertiary text-label-sm px-space-sm py-0.5 rounded-full font-bold">Reserved</span>
                  </div>
                  <div className="p-space-md flex flex-col md:flex-row gap-space-md">
                    <div className="w-full md:w-48 h-36 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={bookingData.hotel.img} alt={bookingData.hotel.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col gap-space-xs">
                      <h3 className="text-headline-sm text-on-surface font-bold">{bookingData.hotel.name}</h3>
                      <div className="flex items-center gap-space-xs text-body-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                        <span>{bookingData.hotel.location}</span>
                      </div>
                      <div className="flex items-center gap-space-sm">
                        <span className="bg-tertiary text-on-tertiary px-space-sm py-space-xs rounded-lg text-label-lg font-bold tabular-nums">{bookingData.hotel.rating}</span>
                        <span className="text-label-lg text-on-surface font-bold">{bookingData.hotel.ratingLabel}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-space-sm text-body-sm text-on-surface-variant mt-space-xs">
                        <div className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">calendar_today</span>Check-in: {bookingData.hotel.checkIn}</div>
                        <div className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">calendar_month</span>Check-out: {bookingData.hotel.checkOut}</div>
                        <div className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">bed</span>{bookingData.hotel.room}</div>
                        <div className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">group</span>{bookingData.hotel.guests}</div>
                      </div>
                      <div className="flex items-center gap-space-xs flex-wrap mt-space-xs">
                        {bookingData.hotel.amenities.map((a, i) => (
                          <span key={i} className="bg-surface-container text-on-surface-variant text-label-sm px-space-sm py-0.5 rounded-full">{a}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Traveller Details */}
            {step >= 2 && (
              <div className="bg-surface-container-lowest rounded-xl shadow-card overflow-hidden">
                <div className="bg-primary/5 border-b border-outline-variant/20 px-space-md py-space-sm flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-primary text-[20px]">person</span>
                  <span className="text-label-lg text-on-surface font-bold">Traveller Information</span>
                </div>
                <div className="p-space-md">
                  {bookingData.travellers.map((t, i) => (
                    <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                      <div>
                        <label className="text-label-md text-on-surface-variant block mb-1">Full Name (as on passport)</label>
                        <input type="text" defaultValue={t.name} className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-space-sm py-space-sm text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all" />
                      </div>
                      <div>
                        <label className="text-label-md text-on-surface-variant block mb-1">Passport Number</label>
                        <input type="text" defaultValue={t.passport} className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-space-sm py-space-sm text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all" />
                      </div>
                      <div>
                        <label className="text-label-md text-on-surface-variant block mb-1">Email Address</label>
                        <input type="email" defaultValue={t.email} className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-space-sm py-space-sm text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all" />
                      </div>
                      <div>
                        <label className="text-label-md text-on-surface-variant block mb-1">Phone Number</label>
                        <input type="tel" defaultValue={t.phone} className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-space-sm py-space-sm text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all" />
                      </div>
                    </div>
                  ))}
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
                  {/* Payment Method Tabs */}
                  <div className="flex items-center gap-space-sm">
                    {([
                      { id: 'card' as const, label: 'Credit / Debit Card', icon: 'credit_card' },
                      { id: 'paypal' as const, label: 'PayPal', icon: 'account_balance_wallet' },
                      { id: 'apple' as const, label: 'Apple Pay', icon: 'phone_iphone' },
                    ]).map(pm => (
                      <button
                        key={pm.id}
                        onClick={() => setPaymentMethod(pm.id)}
                        className={`flex items-center gap-space-xs px-space-md py-space-sm rounded-lg text-label-lg transition-all border ${
                          paymentMethod === pm.id
                            ? 'border-primary bg-primary/5 text-primary font-bold'
                            : 'border-outline-variant/30 text-on-surface-variant hover:border-primary/50'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">{pm.icon}</span>
                        <span>{pm.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Card Form */}
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
                      <div className="md:col-span-2">
                        <label className="text-label-md text-on-surface-variant block mb-1">Cardholder Name</label>
                        <input type="text" placeholder="JOHN DOE" className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-space-sm py-space-sm text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all" />
                      </div>
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

                {/* Flight Pricing */}
                <div className="flex flex-col gap-space-xs">
                  <div className="flex items-center gap-space-xs text-label-lg text-on-surface font-bold">
                    <span className="material-symbols-outlined text-[16px] text-primary">flight</span>
                    <span>Flights (Round Trip)</span>
                  </div>
                  <div className="flex justify-between text-body-sm text-on-surface-variant">
                    <span>Base fare × 2</span>
                    <span className="tabular-nums">₹{(p.flightBase * 2).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-body-sm text-on-surface-variant">
                    <span>Taxes & fees</span>
                    <span className="tabular-nums">₹{(p.flightTaxes * 2).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="h-[1px] bg-outline-variant/20" />

                {/* Hotel Pricing */}
                <div className="flex flex-col gap-space-xs">
                  <div className="flex items-center gap-space-xs text-label-lg text-on-surface font-bold">
                    <span className="material-symbols-outlined text-[16px] text-primary">hotel</span>
                    <span>Hotel ({p.hotelNights} nights)</span>
                  </div>
                  <div className="flex justify-between text-body-sm text-on-surface-variant">
                    <span>₹{p.hotelBase.toLocaleString('en-IN')}/night × {p.hotelNights}</span>
                    <span className="tabular-nums">₹{(p.hotelBase * p.hotelNights).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-body-sm text-on-surface-variant">
                    <span>Taxes & resort fee</span>
                    <span className="tabular-nums">₹{p.hotelTaxes.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="h-[1px] bg-outline-variant/20" />

                {/* Bundle Discount */}
                <div className="flex justify-between text-body-sm">
                  <span className="text-tertiary font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">discount</span>
                    Bundle Discount
                  </span>
                  <span className="text-tertiary font-bold tabular-nums">{p.bundleDiscount < 0 ? '-' : ''}₹{Math.abs(p.bundleDiscount).toLocaleString('en-IN')}</span>
                </div>

                {/* Travel Insurance */}
                <div className="flex justify-between text-body-sm text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">health_and_safety</span>
                    Travel Insurance
                  </span>
                  <span className="tabular-nums">₹{p.insurance.toLocaleString('en-IN')}</span>
                </div>

                <div className="h-[1px] bg-outline-variant/20" />

                {/* Grand Total */}
                <div className="flex justify-between items-baseline">
                  <span className="text-headline-sm text-on-surface font-bold">Total</span>
                  <span className="text-headline-lg text-on-surface font-bold tabular-nums">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>

                <div className="bg-tertiary/10 text-tertiary text-label-sm px-space-sm py-space-xs rounded-lg flex items-center gap-space-xs font-bold">
                  <span className="material-symbols-outlined text-[16px]">savings</span>
                  <span>You save ₹{Math.abs(p.bundleDiscount).toLocaleString('en-IN')} with this bundle!</span>
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

                {step < 3 ? (
                  <button
                    onClick={() => setStep((step + 1) as 1 | 2 | 3)}
                    className="w-full bg-primary hover:bg-primary-container text-on-primary py-space-md rounded-lg text-headline-sm font-bold transition-all shadow-md flex items-center justify-center gap-space-sm"
                  >
                    <span>Continue</span>
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </button>
                ) : (
                  <button
                    disabled={!agreeTerms || isProcessing}
                    onClick={handleConfirmAndPay}
                    className={`w-full py-space-md rounded-lg text-headline-sm font-bold transition-all shadow-md flex items-center justify-center gap-space-sm ${
                      agreeTerms && !isProcessing
                        ? 'bg-secondary-container hover:bg-secondary text-on-secondary cursor-pointer'
                        : 'bg-surface-container-high text-on-surface-variant cursor-not-allowed opacity-70'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                        <span>Processing Demo Payment...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[20px]">lock</span>
                        <span>Confirm & Pay ₹{grandTotal.toLocaleString('en-IN')}</span>
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
    </div>
  );
};
