import React, { useState, useEffect } from 'react';
import { getMyTripsApi, cancelBookingApi, getCurrentUserApi, UserProfile } from '../services/api';

interface MyTripsPageProps {
  onNavigate: (screen: 'explore' | 'flights' | 'hotels' | 'checkout' | 'trips') => void;
  onOpenAuth: () => void;
}

export const MyTripsPage: React.FC<MyTripsPageProps> = ({ onNavigate, onOpenAuth }) => {
  const [trips, setTrips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);

  const fetchTrips = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const currentUser = await getCurrentUserApi();
      setUser(currentUser);
      if (!currentUser) {
        setIsLoading(false);
        return;
      }
      const data = await getMyTripsApi();
      setTrips(data);
    } catch (err: any) {
      console.warn('Failed to load trips', err);
      setErrorMsg(err.response?.data?.detail || 'Unable to fetch your trips. Please ensure you are logged in.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleCancelBooking = async (bookingId: string) => {
    const reason = window.prompt('Please provide a reason for cancellation:', 'Change of travel plans');
    if (reason === null) return; // user clicked cancel

    setCancellingId(bookingId);
    setActionSuccess(null);
    try {
      await cancelBookingApi(bookingId, reason || 'User requested cancellation');
      setActionSuccess('Booking has been cancelled successfully.');
      await fetchTrips();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to cancel booking.');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 px-3 py-1 rounded-full text-label-sm font-bold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />Confirmed</span>;
      case 'PENDING_PAYMENT':
        return <span className="bg-amber-500/10 text-amber-600 border border-amber-500/30 px-3 py-1 rounded-full text-label-sm font-bold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" />Payment Pending</span>;
      case 'CANCELLED':
        return <span className="bg-rose-500/10 text-rose-600 border border-rose-500/30 px-3 py-1 rounded-full text-label-sm font-bold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" />Cancelled</span>;
      default:
        return <span className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full text-label-sm font-bold">{status}</span>;
    }
  };

  if (!user && !isLoading) {
    return (
      <div className="w-full bg-background min-h-[60vh] py-16 px-gutter flex items-center justify-center">
        <div className="max-w-md w-full bg-surface-container-lowest rounded-2xl shadow-float p-8 text-center border border-outline-variant/30 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[36px]">luggage</span>
          </div>
          <h2 className="text-display-hero text-on-surface text-2xl font-bold">Sign In to View Trips</h2>
          <p className="text-body-md text-on-surface-variant">
            Log in to your SS Journey account to view e-tickets, upcoming bookings, and manage cancellations.
          </p>
          <button
            onClick={onOpenAuth}
            className="w-full bg-[#f28c1c] hover:bg-[#e57a0e] text-white py-3 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 mt-2"
          >
            <span className="material-symbols-outlined text-[20px]">login</span>
            <span>Sign In / Register</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-background min-h-[70vh] py-10 px-gutter">
      <div className="max-w-[1100px] mx-auto">
        {/* Title banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-outline-variant/20 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-on-surface tracking-tight flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[32px]">luggage</span>
              <span>My Trips & Bookings</span>
            </h1>
            <p className="text-body-md text-on-surface-variant mt-1">
              Manage your confirmed journeys, download vouchers, and review cancellation policies.
            </p>
          </div>
          <button
            onClick={() => onNavigate('explore')}
            className="self-start sm:self-auto bg-primary text-on-primary hover:bg-primary-container font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 text-label-lg"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Book New Trip</span>
          </button>
        </div>

        {actionSuccess && (
          <div className="mt-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 rounded-xl p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-600">check_circle</span>
            <span className="font-semibold text-body-md">{actionSuccess}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-6 bg-rose-500/10 border border-rose-500/30 text-rose-700 rounded-xl p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-rose-600">error</span>
            <span className="font-semibold text-body-md">{errorMsg}</span>
          </div>
        )}

        {/* Trips list */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined animate-spin text-[36px] text-primary">progress_activity</span>
            <span className="text-body-md text-on-surface-variant font-medium">Loading your travel history...</span>
          </div>
        ) : trips.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 mt-8 p-8">
            <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[40px]">flight_takeoff</span>
            </div>
            <h3 className="text-headline-sm font-bold text-on-surface">No Bookings Found</h3>
            <p className="text-body-md text-on-surface-variant max-w-md">
              You haven't booked any flights, hotels, or packages yet. Plan your next unforgettable journey with SS Journey today!
            </p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => onNavigate('flights')}
                className="bg-primary text-on-primary font-bold px-5 py-2.5 rounded-xl shadow transition-all hover:bg-primary-container"
              >
                Search Flights
              </button>
              <button
                onClick={() => onNavigate('hotels')}
                className="bg-surface-container hover:bg-surface-container-high text-on-surface font-bold px-5 py-2.5 rounded-xl transition-all"
              >
                Find Hotels
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 mt-8">
            {trips.map((booking) => (
              <div 
                key={booking.id}
                className="bg-surface-container-lowest rounded-2xl shadow-card border border-outline-variant/30 overflow-hidden hover:border-primary/40 transition-all"
              >
                {/* Header */}
                <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-label-md font-bold uppercase tracking-wider text-on-surface-variant">Ref:</span>
                    <span className="font-mono font-bold text-headline-sm text-primary tracking-wide">
                      {booking.booking_reference}
                    </span>
                    <span className="text-white/20">|</span>
                    <span className="text-body-sm text-on-surface-variant">
                      Booked {new Date(booking.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(booking.status)}
                    <span className="text-headline-sm font-extrabold text-on-surface tabular-nums">
                      ₹{Number(booking.total_amount ?? booking.total_price ?? 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Items & Travellers */}
                <div className="p-6 flex flex-col md:flex-row gap-6 justify-between items-start">
                  <div className="flex-1 space-y-4">
                    {booking.items && booking.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="material-symbols-outlined text-[20px]">
                            {item.item_type === 'FLIGHT' ? 'flight' : item.item_type === 'HOTEL' ? 'hotel' : 'luggage'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-body-lg text-on-surface">{item.title}</h4>
                          {item.subtitle && (
                            <p className="text-body-sm text-on-surface-variant">{item.subtitle}</p>
                          )}
                          <p className="text-label-sm text-on-surface-variant mt-1">
                            Type: <strong className="text-on-surface">{item.item_type}</strong> · Quantity: {item.quantity} · Price: ₹{Number(item.total_price).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Passenger names */}
                    {booking.passengers && booking.passengers.length > 0 && (
                      <div className="pt-3 border-t border-outline-variant/15 flex items-center gap-2 text-body-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px]">groups</span>
                        <span>Passengers:</span>
                        <span className="font-semibold text-on-surface">
                          {booking.passengers.map((p: any) => `${p.first_name} ${p.last_name}`).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row md:flex-col gap-2 w-full md:w-48 flex-shrink-0">
                    <button
                      onClick={() => alert(`E-Ticket for ${booking.booking_reference}\nSent to: ${booking.contact_email}\nStatus: ${booking.status}`)}
                      className="w-full bg-surface-container hover:bg-surface-container-high text-primary font-bold py-2.5 px-4 rounded-xl text-label-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                      <span>View Receipt</span>
                    </button>

                    {booking.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={cancellingId === booking.id}
                        className="w-full border border-rose-300 hover:bg-rose-500/10 text-rose-600 font-bold py-2.5 px-4 rounded-xl text-label-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {cancellingId === booking.id ? (
                          <>
                            <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                            <span>Cancelling...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[18px]">cancel</span>
                            <span>Cancel Trip</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
