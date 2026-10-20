# SS Journey Mobile (Expo + React Native)

A mobile travel booking application crafted with **Expo SDK 57** (`~57.0.30`), **React Native**, and TypeScript, accurately replicating the Stitch design system.

---

## 📱 Implemented Mobile Screens (from Stitch)

1. **Mobile - Explore & Search** (`src/screens/ExploreScreen.tsx`):
   - Wanderlust banner with greeting and Eco Pilot carbon-neutral status.
   - Mode switcher pills (Flights, Hotels, Packages).
   - Compact Interactive Booking Card with animated origin/destination route swap.
   - Live Fare Watch banner with real-time drop alerts, savings pill, and trend sparkline.
   - Recent inquiries quick-fill chips (`SFO → HND`, `LAX → CDG`, `JFK → FCO`).
   - Popular Escapes horizontal carousel with weather chips, wishlist favoriting, and quick flight actions.
   - 25% Off Bundle promotion gradient banner and live concierge & price guarantee perks.

2. **Mobile - Flight Results** (`src/screens/FlightResultsScreen.tsx`):
   - Route summary bar with quick edit trigger and live price alert switch toggle.
   - Interactive filter pills (`Non-stop only`, `Under $900`, `Morning Dep.`, `ANA & JAL`, `Baggage Included`).
   - 3-Segment quick-sort comparison tabs (`Best $895`, `Cheapest $740`, `Fastest $940`).
   - Comprehensive Flight Cards: airline details, departure/arrival terminals, flight duration connector timeline, amenity badges, and taxes breakdown.
   - Seamless "Select" CTA that transitions directly into the checkout summary.

3. **Mobile - Hotel Listings** (`src/screens/HotelListingsScreen.tsx`):
   - Sticky search summary capsule with date, guest counts, and quick filter adjustments.
   - **Interactive Map View Toggle**: switch instantly between card feed and stylized interactive map view with price markers and docked preview card.
   - Filter pills carousel (`Free Cancellation`, `4★ & 5★`, `Breakfast Included`, `Shinjuku / Shibuya`, etc.).
   - Hotel Cards: 16:10 aspect ratio imagery with wishlist heart button, ratings badges (e.g. `9.4 Exceptional`), amenity micro-tags, cancellation notices, and nightly vs total price breakdown.

4. **Mobile - Booking & Checkout Flow** (`src/screens/CheckoutScreen.tsx`):
   - 3-Step progress indicator (Step 2 of 3: Traveler & Payment).
   - Expandable trip combo summary drawer (Tokyo Discovery flight + hotel snippet with complete itemized discounts).
   - Primary traveler identity form (Passport number, date of birth, frequent flyer loyalty program).
   - Flight add-ons with interactive **Seat Selection Modal** (Boeing 787-9 forward cabin visual layout).
   - Travel Guard Protection toggle that dynamically recalculates totals in real-time.
   - Payment method selector (Credit Card, Apple Pay / Google Pay, UPI).
   - Confirmed booking **Celebration Modal** (`BookingSuccessModal`) with booking reference (`BMT-849201`) and boarding summary.

---

## 🚀 How to Run Locally

### Start Expo Dev Server
```bash
# In apps/mobile/
npm run start

# Or from the repository root:
npm run dev:mobile
```

### Launch on Platforms
- **Web Browser Preview**:
  ```bash
  npm run mobile:web
  ```
- **Android Emulator / Device**:
  ```bash
  npm run android
  ```
- **iOS Simulator / Expo Go**:
  ```bash
  npm run ios
  ```
- **Typecheck**:
  ```bash
  npm run typecheck
  ```
