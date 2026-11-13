import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://127.0.0.1:8000/api/v1';

test('SERVICE 1 (Flights): Delhi returns airport suggestions only with IATA code DEL', async () => {
  const res = await fetch(`${BASE_URL}/locations/suggest?service=flights&q=Delhi`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(Array.isArray(json.data) && json.data.length > 0, 'Must return airport suggestions');

  // Verify all returned records are AIRPORT category with IATA codes
  for (const item of json.data) {
    assert.equal(item.category, 'AIRPORT', `Expected AIRPORT category, got ${item.category}`);
    assert.ok(item.code, 'Must have IATA code');
  }

  const del = json.data.find(a => a.code === 'DEL');
  assert.ok(del, 'Must include Indira Gandhi International Airport (DEL)');
  assert.match(del.display_name, /Delhi|Indira Gandhi/i);
});

test('SERVICE 1 (Flights): Airport code lookup (BOM, DXB) works and returns airport', async () => {
  const res = await fetch(`${BASE_URL}/locations/suggest?service=flights&q=BOM`);
  const json = await res.json();
  assert.equal(json.success, true);
  const bom = json.data.find(a => a.code === 'BOM');
  assert.ok(bom, 'Must find Mumbai airport via IATA code BOM');
  assert.equal(bom.category, 'AIRPORT');
});

test('SERVICE 1 (Flights): Non-existent flight route returns NO_INVENTORY without fake injection', async () => {
  const res = await fetch(`${BASE_URL}/flights?from_code=GOI&to_code=IXL`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.inventory_status, 'NO_INVENTORY');
  const items = json.data?.items || json.data || [];
  assert.equal(items.length, 0, 'Must NOT inject fake flights from other cities');
});

test('SERVICE 2 (Hotels): General destination accepts any valid city (e.g. Manali, Tokyo)', async () => {
  const res = await fetch(`${BASE_URL}/locations/suggest?service=hotels&q=Manali`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(json.data.length > 0, 'Must return location suggestions for Manali');

  const manali = json.data.find(d => d.display_name.toLowerCase().includes('manali'));
  assert.ok(manali, 'Must return Manali as a valid destination');
});

test('SERVICE 2 (Hotels): Valid city with no inventory returns NO_INVENTORY and 0 hotels', async () => {
  const res = await fetch(`${BASE_URL}/hotels?city=Reykjavik`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.inventory_status, 'NO_INVENTORY');
  const items = json.data?.items || json.data || [];
  assert.equal(items.length, 0, 'Must NOT fabricate hotel records for unserved city');
});

test('SERVICE 3 (Villas): Curated villas and clean 0-inventory response', async () => {
  const res = await fetch(`${BASE_URL}/villas?city=Reykjavik`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.inventory_status, 'NO_INVENTORY');
  const items = json.data?.items || json.data || [];
  assert.equal(items.length, 0, 'Must NOT fabricate villa records for unserved city');
});

test('SERVICE 4 (Holiday Packages): Package search with 0 matches returns NO_INVENTORY', async () => {
  const res = await fetch(`${BASE_URL}/packages?destination=Antarctica`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.inventory_status, 'NO_INVENTORY');
  const items = json.data?.items || json.data || [];
  assert.equal(items.length, 0, 'Must NOT fabricate package records for unserved destination');
});

test('SERVICE 5 (Trains): Delhi returns railway stations only with IRCTC codes', async () => {
  const res = await fetch(`${BASE_URL}/locations/suggest?service=trains&q=Delhi`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(json.data.length > 0, 'Must return train station suggestions');

  // Verify all items are STATION category
  for (const item of json.data) {
    assert.equal(item.category, 'STATION', `Expected STATION category, got ${item.category}`);
    assert.ok(item.code, 'Must have IRCTC station code');
  }

  const ndls = json.data.find(s => s.code === 'NDLS');
  assert.ok(ndls, 'Must include New Delhi Railway Station (NDLS)');
});

test('SERVICE 5 (Trains): Non-existent rail route returns NO_INVENTORY without fake trains', async () => {
  const res = await fetch(`${BASE_URL}/trains?from_city=Goa&to_city=Srinagar`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.inventory_status, 'NO_INVENTORY');
  const items = json.data?.items || json.data || [];
  assert.equal(items.length, 0, 'Must NOT fabricate trains for non-direct route');
});

test('SERVICE 6 (Buses): Returns verified bus terminals and stops', async () => {
  const res = await fetch(`${BASE_URL}/locations/suggest?service=buses&q=Delhi`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(json.data.length > 0, 'Must return bus terminal suggestions');

  const isbt = json.data.find(b => b.display_name.includes('Kashmere Gate') || b.display_name.includes('ISBT'));
  assert.ok(isbt, 'Must include Kashmere Gate ISBT or verified bus terminal');
});

test('SERVICE 7 (Cabs): Flexible address / place search with map coordinates', async () => {
  const res = await fetch(`${BASE_URL}/locations/suggest?service=cabs&q=Airport`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(json.data.length > 0, 'Must return place suggestions for cabs');
});

test('SERVICE 7 (Cabs): Places search endpoint returns geocoded results', async () => {
  const res = await fetch(`${BASE_URL}/locations/places-search?q=Connaught+Place`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(Array.isArray(json.data) && json.data.length > 0, 'Must return geocoded place search results');
});

test('SERVICE 8 (Tours): Curated attractions and experiences', async () => {
  const res = await fetch(`${BASE_URL}/tours?city=Dubai`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  const items = json.data?.items || json.data || [];
  assert.ok(items.length > 0, 'Must find experiences for Dubai');
  assert.match(items[0].title, /Burj Khalifa/i);
});

test('SERVICE 9 (Visa): Destination country accepts sovereign countries only', async () => {
  const res = await fetch(`${BASE_URL}/locations/suggest?service=visa&q=Emirates`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(json.data.length > 0, 'Must find sovereign country for UAE');
  assert.equal(json.data[0].category, 'COUNTRY');
  assert.match(json.data[0].display_name, /United Arab Emirates/i);
});

test('SERVICE 10 (Insurance): Destination shield zones and countries', async () => {
  const res = await fetch(`${BASE_URL}/locations/suggest?service=insurance&q=Schengen`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(json.data.length > 0, 'Must find Schengen Area insurance plan');
  assert.match(json.data[0].display_name, /Schengen/i);
});
