import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.user import User


@pytest.mark.asyncio
async def test_cross_platform_inventory_sync_admin_to_web_and_mobile(
    async_client: AsyncClient,
    admin_headers: dict,
):
    """
    1. Admin creates/updates inventory in PostgreSQL.
    2. Customer web and mobile endpoints return the exact live inventory.
    3. Admin deactivates/removes inventory, verifying public search hides it.
    """
    # 1. Admin creates Hotel inventory
    hotel_res = await async_client.post(
        "/api/v1/admin/hotels",
        headers=admin_headers,
        json={
            "name": "Pipeline5 Grand Mirage Resort",
            "property_type": "HOTEL",
            "star_rating": 5,
            "address": "Candolim Beach Road",
            "city": "Goa",
            "country": "India",
            "price_per_night": 12500.0,
            "taxes_and_fees": 1500.0,
            "currency": "INR",
            "rating_score": 4.9,
            "rating_label": "Exceptional",
            "review_count": 520,
            "rooms": [
                {
                    "room_type": "Ocean View Royal Suite",
                    "price_per_night": 14000.0,
                    "max_occupancy": 3,
                    "total_rooms": 10,
                    "available_rooms": 8,
                }
            ],
            "amenities": ["Infinity Pool", "Private Beach", "Breakfast Buffet", "Free High-Speed WiFi"],
            "is_active": True,
        },
    )
    assert hotel_res.status_code == 201
    hotel_data = hotel_res.json()["data"]
    hotel_id = hotel_data["id"]
    room_id = hotel_data["rooms"][0]["id"]
    assert hotel_data["name"] == "Pipeline5 Grand Mirage Resort"

    # 2. Customer Web & Mobile search displays the exact hotel
    web_search = await async_client.get(
        "/api/v1/hotels",
        params={"city": "Goa"},
    )
    assert web_search.status_code == 200
    hotels_list = web_search.json()["data"]["items"]
    matched_hotel = next((h for h in hotels_list if h["id"] == hotel_id), None)
    assert matched_hotel is not None
    assert matched_hotel["name"] == "Pipeline5 Grand Mirage Resort"
    assert matched_hotel["starting_price"] == 12500.0
    assert len(matched_hotel["rooms"]) == 1
    assert matched_hotel["rooms"][0]["id"] == room_id
    assert matched_hotel["rooms"][0]["available_rooms"] == 8

    # 3. Admin updates Hotel room price & availability
    update_res = await async_client.patch(
        f"/api/v1/admin/inventory/hotels/{hotel_id}",
        headers=admin_headers,
        json={
            "price_per_night": 13900.0,
            "rooms": [
                {
                    "id": room_id,
                    "room_type": "Ocean View Royal Suite",
                    "price_per_night": 15500.0,
                    "max_occupancy": 3,
                    "total_rooms": 10,
                    "available_rooms": 5,
                }
            ],
        },
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["price_per_night"] == 13900.0

    # 4. Customer search reflects updated price and availability
    web_search_updated = await async_client.get(
        "/api/v1/hotels",
        params={"city": "Goa"},
    )
    hotels_updated = web_search_updated.json()["data"]["items"]
    matched_updated = next((h for h in hotels_updated if h["id"] == hotel_id), None)
    assert matched_updated is not None
    assert matched_updated["starting_price"] == 13900.0
    assert matched_updated["rooms"][0]["available_rooms"] == 5

    # 5. Admin deactivates the hotel -> public search no longer shows it
    deact_res = await async_client.patch(
        f"/api/v1/admin/inventory/hotels/{hotel_id}",
        headers=admin_headers,
        json={"is_active": False},
    )
    assert deact_res.status_code == 200

    web_search_deact = await async_client.get(
        "/api/v1/hotels",
        params={"city": "Goa"},
    )
    hotels_deact = web_search_deact.json()["data"]["items"]
    assert not any(h["id"] == hotel_id for h in hotels_deact)


@pytest.mark.asyncio
async def test_end_to_end_booking_consistency_and_my_trips(
    async_client: AsyncClient,
    admin_headers: dict,
    customer_headers: dict,
    test_customer: User,
):
    """
    1. Create a flight item.
    2. Validate and apply coupon SSJFLY on booking.
    3. Book item and verify booking reference, amounts, service types.
    4. Process demo payment.
    5. Verify booking appears in customer's My Trips AND admin bookings list with identical IDs.
    """
    # 1. Admin creates a Flight
    flight_res = await async_client.post(
        "/api/v1/admin/flights",
        headers=admin_headers,
        json={
            "airline": "SS Journey Skyways",
            "airline_code": "SSJ",
            "flight_number": "SSJ 501",
            "aircraft": "Boeing 787 Dreamliner",
            "origin_code": "DEL",
            "origin_name": "Indira Gandhi International",
            "origin_city": "Delhi",
            "origin_country": "India",
            "destination_code": "GOI",
            "destination_name": "Dabolim Airport",
            "destination_city": "Goa",
            "destination_country": "India",
            "departure_time": "07:30",
            "arrival_time": "10:00",
            "duration_minutes": 150,
            "stops": 0,
            "cabin_class": "ECONOMY",
            "available_seats": 20,
            "base_fare": 6000.0,
            "taxes": 800.0,
            "total_price": 6800.0,
            "currency": "INR",
        },
    )
    assert flight_res.status_code == 201
    flight_data = flight_res.json()["data"]
    flight_id = flight_data["id"]

    # 2. Admin creates coupon SSJFLY
    await async_client.post(
        "/api/v1/admin/coupons",
        headers=admin_headers,
        json={
            "code": "SSJFLY",
            "discount_type": "PERCENTAGE",
            "discount_value": 10.0,
            "max_discount_amount": 1000.0,
            "min_order_amount": 3000.0,
            "service_type": "FLIGHT",
            "description": "10% off up to ₹1,000 on flights",
            "is_active": True,
        },
    )

    # 3. Coupon validation
    val_res = await async_client.post(
        "/api/v1/coupons/validate",
        json={"code": "SSJFLY", "order_amount": 6000.0, "service_type": "FLIGHT"},
    )
    assert val_res.status_code == 200
    val_data = val_res.json()["data"]
    assert val_data["valid"] is True
    discount = val_data["discount_amount"]
    assert discount > 0

    # 3. Create booking with coupon code
    booking_res = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json={
            "service_type": "FLIGHT",
            "contact_email": test_customer.email,
            "contact_phone": "+91 98765 11111",
            "promo_code": "SSJFLY",
            "has_insurance": False,
            "items": [
                {
                    "item_type": "FLIGHT",
                    "item_reference_id": str(flight_id),
                    "quantity": 1,
                }
            ],
            "passengers": [
                {
                    "title": "Mr",
                    "first_name": "Alexander",
                    "last_name": "Vanderbilt",
                    "passenger_type": "ADULT",
                    "gender": "MALE",
                }
            ],
        },
    )
    assert booking_res.status_code == 201
    booking_data = booking_res.json()["data"]
    booking_id = booking_data["id"]
    booking_ref = booking_data["booking_reference"]
    assert booking_ref.startswith("SSJ-")
    assert booking_data["status"] == "PENDING"
    assert booking_data["service_type"] == "FLIGHT"
    expected_total = 6800.0 - discount
    assert booking_data["total_amount"] == expected_total

    # 4. Simulated Demo Payment
    pay_res = await async_client.post(
        "/api/v1/payments/demo",
        headers=customer_headers,
        json={
            "booking_id": booking_id,
            "payment_method": "UPI",
            "simulate_failure": False,
        },
    )
    assert pay_res.status_code == 200
    assert pay_res.json()["data"]["status"] == "SUCCESS"
    assert pay_res.json()["data"]["is_demo"] is True

    # 5. Customer My Trips check
    trips_res = await async_client.get(
        "/api/v1/bookings/my-trips",
        headers=customer_headers,
    )
    assert trips_res.status_code == 200
    my_trips = trips_res.json()["data"]
    customer_trip = next((t for t in my_trips if t["id"] == booking_id), None)
    assert customer_trip is not None
    assert customer_trip["booking_reference"] == booking_ref
    assert customer_trip["status"] == "CONFIRMED"
    assert customer_trip["total_amount"] == expected_total

    # 6. Admin Bookings check
    admin_bookings_res = await async_client.get(
        "/api/v1/admin/bookings",
        headers=admin_headers,
    )
    assert admin_bookings_res.status_code == 200
    admin_bookings = admin_bookings_res.json()["data"]["items"]
    admin_trip = next((b for b in admin_bookings if b["id"] == booking_id), None)
    assert admin_trip is not None
    assert admin_trip["booking_reference"] == booking_ref
    assert admin_trip["status"] == "CONFIRMED"
    assert admin_trip["total_amount"] == expected_total
    assert admin_trip["contact_email"] == test_customer.email


@pytest.mark.asyncio
async def test_payment_failure_simulation_and_cancellation_flow(
    async_client: AsyncClient,
    admin_headers: dict,
    customer_headers: dict,
    test_customer: User,
):
    """
    Verify payment failure handling and subsequent cancellation behavior.
    """
    # 1. Admin creates a Bus
    bus_res = await async_client.post(
        "/api/v1/admin/buses",
        headers=admin_headers,
        json={
            "operator_name": "SS Express Sleeper",
            "bus_type": "AC Multi-Axle Sleeper",
            "from_city": "Mumbai",
            "to_city": "Goa",
            "departure_time": "21:00",
            "arrival_time": "07:30+1",
            "duration_minutes": 630,
            "available_seats": 30,
            "base_fare": 1800.0,
            "taxes": 180.0,
            "total_price": 1980.0,
            "rating": 4.8,
            "currency": "INR",
        },
    )
    assert bus_res.status_code == 201
    bus_id = bus_res.json()["data"]["id"]

    # 2. Customer creates booking
    create_res = await async_client.post(
        "/api/v1/bookings",
        headers=customer_headers,
        json={
            "service_type": "BUS",
            "contact_email": test_customer.email,
            "contact_phone": "+91 98765 22222",
            "items": [
                {
                    "item_type": "BUS",
                    "item_reference_id": str(bus_id),
                    "quantity": 1,
                }
            ],
            "passengers": [{"first_name": "Rohan", "last_name": "Sharma"}],
        },
    )
    assert create_res.status_code == 201
    booking_id = create_res.json()["data"]["id"]

    # 3. Simulate Payment Failure
    pay_fail = await async_client.post(
        "/api/v1/payments/demo",
        headers=customer_headers,
        json={
            "booking_id": booking_id,
            "payment_method": "CREDIT_CARD",
            "simulate_failure": True,
        },
    )
    assert pay_fail.status_code == 200
    assert pay_fail.json()["success"] is False
    assert pay_fail.json()["data"]["status"] == "FAILED"

    # 4. Cancel the booking
    cancel_res = await async_client.post(
        f"/api/v1/bookings/{booking_id}/cancel",
        headers=customer_headers,
        json={"reason": "Payment error and schedule conflict"},
    )
    assert cancel_res.status_code == 200
    assert cancel_res.json()["data"]["status"] == "CANCELLED"
