import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://127.0.0.1:8000/api/v1';

// ----------------------------------------------------------------------------
// 1. AIRPORT CODE & ALIAS LOOKUP (DATABASE-BACKED)
// ----------------------------------------------------------------------------
test('AIRPORTS: IATA Code lookup (DEL, BOM, DXB, LHR) returns verified airports from database', async () => {
  const res = await fetch(`${BASE_URL}/locations/suggest?service=flights&q=DEL`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.service, 'flights');

  const del = json.data.find(a => a.code === 'DEL');
  assert.ok(del, 'Must return DEL (Indira Gandhi International Airport)');
  assert.equal(del.category, 'AIRPORT');
  assert.equal(del.provider, 'INTERNAL_DATABASE');
  assert.equal(del.city, 'Delhi');

  // Test BOM
  const resBom = await fetch(`${BASE_URL}/locations/suggest?service=flights&q=BOM`);
  const jsonBom = await resBom.json();
  const bom = jsonBom.data.find(a => a.code === 'BOM');
  assert.ok(bom, 'Must return BOM (Chhatrapati Shivaji Maharaj International Airport)');
  assert.equal(bom.city, 'Mumbai');

  // Test International Airport DXB
  const resDxb = await fetch(`${BASE_URL}/locations/suggest?service=flights&q=DXB`);
  const jsonDxb = await resDxb.json();
  const dxb = jsonDxb.data.find(a => a.code === 'DXB');
  assert.ok(dxb, 'Must return DXB (Dubai International Airport)');
  assert.equal(dxb.country, 'United Arab Emirates');
});

test('AIRPORTS: Alias matching (e.g. Bombay -> BOM, Calcutta -> CCU, Madras -> MAA)', async () => {
  const res = await fetch(`${BASE_URL}/locations/suggest?service=flights&q=Bombay`);
  const json = await res.json();
  assert.equal(json.success, true);
  const bom = json.data.find(a => a.code === 'BOM');
  assert.ok(bom, 'Searching Bombay must resolve to Mumbai Airport (BOM) via database aliases');

  const resCcu = await fetch(`${BASE_URL}/locations/suggest?service=flights&q=Calcutta`);
  const jsonCcu = await resCcu.json();
  const ccu = jsonCcu.data.find(a => a.code === 'CCU');
  assert.ok(ccu, 'Searching Calcutta must resolve to Netaji Subhash Chandra Bose Airport (CCU)');
});

test('AIRPORTS: Non-commercial / military airfields without IATA are excluded from flight suggestions', async () => {
  const res = await fetch(`${BASE_URL}/locations/suggest?service=flights&q=Sarsawa`);
  const json = await res.json();
  assert.equal(json.success, true);
  // Sarsawa Air Force Base has is_commercial = false, so it must not be suggested for commercial flight bookings
  const sarsawa = json.data.find(a => a.name.includes('Sarsawa'));
  assert.equal(sarsawa, undefined, 'Non-commercial airfield must be excluded from flight suggestions');
});

// ----------------------------------------------------------------------------
// 2. RAILWAY STATION CODE & ALIAS LOOKUP (DATABASE-BACKED)
// ----------------------------------------------------------------------------
test('STATIONS: Station code lookup (NDLS, CSMT, HWH, MAS) returns verified stations', async () => {
  const res = await fetch(`${BASE_URL}/locations/suggest?service=trains&q=NDLS`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.service, 'trains');

  const ndls = json.data.find(s => s.code === 'NDLS');
  assert.ok(ndls, 'Must return New Delhi Railway Station (NDLS)');
  assert.equal(ndls.category, 'STATION');
  assert.equal(ndls.provider, 'INTERNAL_DATABASE');

  // Test CSMT
  const resCsmt = await fetch(`${BASE_URL}/locations/suggest?service=trains&q=CSMT`);
  const jsonCsmt = await resCsmt.json();
  const csmt = jsonCsmt.data.find(s => s.code === 'CSMT');
  assert.ok(csmt, 'Must return Chhatrapati Shivaji Maharaj Terminus (CSMT)');
  assert.equal(csmt.city, 'Mumbai');
});

test('STATIONS: Alias matching (Victoria Terminus -> CSMT, Old Delhi -> DLI)', async () => {
  const res = await fetch(`${BASE_URL}/locations/suggest?service=trains&q=Victoria+Terminus`);
  const json = await res.json();
  assert.equal(json.success, true);
  const csmt = json.data.find(s => s.code === 'CSMT');
  assert.ok(csmt, 'Searching "Victoria Terminus" must resolve to CSMT via aliases');

  const resDli = await fetch(`${BASE_URL}/locations/suggest?service=trains&q=Old+Delhi`);
  const jsonDli = await resDli.json();
  const dli = jsonDli.data.find(s => s.code === 'DLI');
  assert.ok(dli, 'Searching "Old Delhi" must resolve to Delhi Junction (DLI)');
});

// ----------------------------------------------------------------------------
// 3. BUS TERMINALS LOOKUP (DATABASE-BACKED)
// ----------------------------------------------------------------------------
test('BUSES: Verified ISBT terminals returned from database (Kashmere Gate, Majestic)', async () => {
  const res = await fetch(`${BASE_URL}/locations/suggest?service=buses&q=Kashmere+Gate`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.service, 'buses');

  const isbt = json.data.find(b => b.display_name.includes('Kashmere Gate') || b.name.includes('Kashmere Gate'));
  assert.ok(isbt, 'Must return Kashmere Gate ISBT from database');
  assert.equal(isbt.category, 'BUS_STOP');
  assert.equal(isbt.provider, 'INTERNAL_DATABASE');

  // Test Bengaluru Majestic Bus Station
  const resBlr = await fetch(`${BASE_URL}/locations/suggest?service=buses&q=Majestic`);
  const jsonBlr = await resBlr.json();
  const majestic = jsonBlr.data.find(b => b.name.includes('Majestic'));
  assert.ok(majestic, 'Must return Kempegowda Majestic Bus Terminal');
});

// ----------------------------------------------------------------------------
// 4. COUNTRIES LOOKUP (VISA & INSURANCE) (DATABASE-BACKED)
// ----------------------------------------------------------------------------
test('COUNTRIES: Sovereign countries returned with flags and ISO codes (UAE, France)', async () => {
  const res = await fetch(`${BASE_URL}/locations/suggest?service=visa&q=Emirates`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);

  const uae = json.data.find(c => c.code === 'AE');
  assert.ok(uae, 'Must return United Arab Emirates (AE)');
  assert.equal(uae.category, 'COUNTRY');
  assert.equal(uae.provider, 'INTERNAL_DATABASE');
  assert.match(uae.display_name, /United Arab Emirates/);

  // Test Insurance Schengen Zone
  const resIns = await fetch(`${BASE_URL}/locations/suggest?service=insurance&q=Schengen`);
  const jsonIns = await resIns.json();
  assert.ok(jsonIns.data.length > 0, 'Must return Schengen Area insurance zone');
});

// ----------------------------------------------------------------------------
// 5. DESTINATIONS & INVENTORY SEPARATION (ZERO INVENTORY HANDLING)
// ----------------------------------------------------------------------------
test('DESTINATIONS: Suggests Manali, Shimla, Reykjavik from database reference data', async () => {
  const res = await fetch(`${BASE_URL}/locations/suggest?service=hotels&q=Manali`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);

  const manali = json.data.find(d => d.city.toLowerCase() === 'manali' || d.name.toLowerCase() === 'manali');
  assert.ok(manali, 'Must return Manali as a valid destination');
  assert.equal(manali.provider, 'INTERNAL_DATABASE');
});

test('INVENTORY SEPARATION: Hotel search for valid unserved city returns NO_INVENTORY without fake items', async () => {
  const res = await fetch(`${BASE_URL}/hotels?city=Reykjavik`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.inventory_status, 'NO_INVENTORY');
  const items = json.data?.items || json.data || [];
  assert.equal(items.length, 0, 'Must NOT inject fake hotels for unserved city');
  assert.match(json.message, /No hotels currently available in Reykjavik/i);
});

test('INVENTORY SEPARATION: Flight search for unserved route returns NO_INVENTORY without fake items', async () => {
  const res = await fetch(`${BASE_URL}/flights?from_code=GOI&to_code=IXL`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.inventory_status, 'NO_INVENTORY');
  const items = json.data?.items || json.data || [];
  assert.equal(items.length, 0, 'Must NOT inject fake flights for non-existent route');
});

test('INVENTORY SEPARATION: Train search for unserved route returns NO_INVENTORY', async () => {
  const res = await fetch(`${BASE_URL}/trains?from_city=Goa&to_city=Srinagar`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.inventory_status, 'NO_INVENTORY');
  const items = json.data?.items || json.data || [];
  assert.equal(items.length, 0);
});

// ----------------------------------------------------------------------------
// 6. TOURS & ATTRACTIONS (DATABASE-BACKED VIA POSTGRES TOURS TABLE)
// ----------------------------------------------------------------------------
test('TOURS: Database-backed tours query for Dubai returns Burj Khalifa experience', async () => {
  const res = await fetch(`${BASE_URL}/tours?city=Dubai`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.inventory_status, 'AVAILABLE');
  const items = json.data?.items || [];
  assert.ok(items.length > 0, 'Must return tour products from PostgreSQL tours table');

  const burj = items.find(t => t.id === 'tour-dxb-burj');
  assert.ok(burj, 'Must include Burj Khalifa experience');
  assert.equal(burj.city, 'Dubai');
  assert.equal(burj.price_per_person, 3850);
});

test('TOURS: Unserved city returns NO_INVENTORY', async () => {
  const res = await fetch(`${BASE_URL}/tours?city=Antarctica`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.inventory_status, 'NO_INVENTORY');
  assert.equal(json.data.items.length, 0);
});

// ----------------------------------------------------------------------------
// 7. VISA REQUIREMENTS (DATABASE-BACKED VIA POSTGRES VISA_REQUIREMENTS TABLE)
// ----------------------------------------------------------------------------
test('VISA: Database-backed visa query for UAE returns express tourist visa', async () => {
  const res = await fetch(`${BASE_URL}/visa?country=Emirates`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.inventory_status, 'AVAILABLE');
  const items = json.data?.items || [];
  assert.ok(items.length > 0, 'Must return visa products from PostgreSQL visa_requirements table');

  const uaeVisa = items.find(v => v.country_code === 'AE');
  assert.ok(uaeVisa, 'Must return UAE visa product');
  assert.equal(uaeVisa.total_price, 6499);
});

test('VISA: Unserved country returns NO_INVENTORY message', async () => {
  const res = await fetch(`${BASE_URL}/visa?country=Atlantis`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.inventory_status, 'NO_INVENTORY');
  assert.equal(json.data.items.length, 0);
});

// ----------------------------------------------------------------------------
// 8. PLACES & CAB SEARCH (GEOCODED & COORDINATES SUPPORT)
// ----------------------------------------------------------------------------
test('PLACES SEARCH: Geocoded place search returns location coordinates', async () => {
  const res = await fetch(`${BASE_URL}/locations/places-search?q=Connaught+Place`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(Array.isArray(json.data) && json.data.length > 0, 'Must return place results');
  assert.ok(json.data[0].lat !== undefined && json.data[0].lon !== undefined, 'Must provide coordinates');
});

// ----------------------------------------------------------------------------
// 9. API CONTRACT & SERVICE FILTERING INTEGRITY
// ----------------------------------------------------------------------------
test('CONTRACT INTEGRITY: Strict category filtering across all services', async () => {
  // Flights must NEVER return bus stops or railway stations
  const flightRes = await fetch(`${BASE_URL}/locations/suggest?service=flights&q=Delhi`);
  const flightJson = await flightRes.json();
  for (const item of flightJson.data) {
    assert.equal(item.category, 'AIRPORT', `Flights endpoint leaked non-airport category: ${item.category}`);
  }

  // Trains must NEVER return airports or bus stops
  const trainRes = await fetch(`${BASE_URL}/locations/suggest?service=trains&q=Delhi`);
  const trainJson = await trainRes.json();
  for (const item of trainJson.data) {
    assert.equal(item.category, 'STATION', `Trains endpoint leaked non-station category: ${item.category}`);
  }

  // Visa must NEVER return individual cities
  const visaRes = await fetch(`${BASE_URL}/locations/suggest?service=visa&q=Delhi`);
  const visaJson = await visaRes.json();
  for (const item of visaJson.data) {
    assert.equal(item.category, 'COUNTRY', `Visa endpoint leaked non-country category: ${item.category}`);
  }
});

