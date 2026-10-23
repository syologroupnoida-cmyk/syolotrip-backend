import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_admin_inventory_flight_lifecycle_and_customer_search(
    async_client: AsyncClient,
    admin_headers: dict,
):
    # 1. Admin creates a new Flight
    create_res = await async_client.post(
        "/api/v1/admin/flights",
        headers=admin_headers,
        json={
            "airline": "Vistara Express",
            "airline_code": "UK",
            "flight_number": "UK 999",
            "aircraft": "A320neo",
            "origin_code": "DEL",
            "origin_name": "Indira Gandhi Intl",
            "origin_city": "New Delhi",
            "origin_country": "India",
            "destination_code": "BOM",
            "destination_name": "Chhatrapati Shivaji Intl",
            "destination_city": "Mumbai",
            "destination_country": "India",
            "departure_time": "09:00",
            "arrival_time": "11:15",
            "duration_minutes": 135,
            "stops": 0,
            "cabin_class": "ECONOMY",
            "available_seats": 25,
            "base_fare": 5500.0,
            "taxes": 750.0,
            "total_price": 6250.0,
            "currency": "INR",
        },
    )
    assert create_res.status_code == 201
    flight_data = create_res.json()["data"]
    flight_id = flight_data["id"]
    assert flight_data["flight_number"] == "UK 999"

    # 2. Verify Flight is discovered in customer public search
    search_res = await async_client.get(
        "/api/v1/flights",
        params={"from_code": "DEL", "to_code": "BOM"},
    )
    assert search_res.status_code == 200
    items = search_res.json()["data"]["items"]
    matched = [f for f in items if f["flight_number"] == "UK 999"]
    assert len(matched) == 1
    assert matched[0]["total_price"] == 6250.0
    assert matched[0]["available_seats"] == 25

    # 3. Admin updates Flight price and seats
    patch_res = await async_client.patch(
        f"/api/v1/admin/inventory/flights/{flight_id}",
        headers=admin_headers,
        json={
            "total_price": 7100.0,
            "base_fare": 6300.0,
            "available_seats": 18,
            "is_active": True,
        },
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["data"]["total_price"] == 7100.0
    assert patch_res.json()["data"]["available_seats"] == 18

    # 4. Verify updated values reflect immediately in customer search
    search_after_update = await async_client.get(
        "/api/v1/flights",
        params={"from_code": "DEL", "to_code": "BOM"},
    )
    items_after = search_after_update.json()["data"]["items"]
    matched_after = [f for f in items_after if f["flight_number"] == "UK 999"]
    assert len(matched_after) == 1
    assert matched_after[0]["total_price"] == 7100.0
    assert matched_after[0]["available_seats"] == 18

    # 5. Admin deactivates / deletes the inventory item
    del_res = await async_client.delete(
        f"/api/v1/admin/inventory/flights/{flight_id}",
        headers=admin_headers,
    )
    assert del_res.status_code == 200

    # 6. Verify deactivated flight is no longer returned in customer search
    search_after_del = await async_client.get(
        "/api/v1/flights",
        params={"from_code": "DEL", "to_code": "BOM"},
    )
    items_after_del = search_after_del.json()["data"]["items"]
    assert not any(f["id"] == flight_id for f in items_after_del)


@pytest.mark.asyncio
async def test_admin_user_status_toggle_and_self_protection(
    async_client: AsyncClient,
    admin_headers: dict,
    customer_headers: dict,
):
    # Retrieve customer ID from current profile
    profile_res = await async_client.get("/api/v1/auth/me", headers=customer_headers)
    assert profile_res.status_code == 200
    customer_id = profile_res.json()["data"]["id"]

    # Retrieve admin ID from current profile
    admin_prof = await async_client.get("/api/v1/auth/me", headers=admin_headers)
    assert admin_prof.status_code == 200
    admin_id = admin_prof.json()["data"]["id"]

    # 1. Admin deactivates customer account
    deactivate_res = await async_client.patch(
        f"/api/v1/admin/users/{customer_id}/status",
        headers=admin_headers,
        json={"is_active": False},
    )
    assert deactivate_res.status_code == 200
    assert deactivate_res.json()["data"]["is_active"] is False

    # 2. Admin reactivates customer account
    activate_res = await async_client.patch(
        f"/api/v1/admin/users/{customer_id}/status",
        headers=admin_headers,
        json={"is_active": True},
    )
    assert activate_res.status_code == 200
    assert activate_res.json()["data"]["is_active"] is True

    # 3. Prevent admin self-deactivation
    self_deact_res = await async_client.patch(
        f"/api/v1/admin/users/{admin_id}/status",
        headers=admin_headers,
        json={"is_active": False},
    )
    assert self_deact_res.status_code == 400
    assert "cannot deactivate their own account" in self_deact_res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_coupon_lifecycle_admin_crud_and_validation(
    async_client: AsyncClient,
    admin_headers: dict,
    customer_headers: dict,
):
    # 1. Admin creates a new coupon: FESTIVE20 (20% off, max 1000 INR, min 2000 INR order, FLIGHT only)
    code = "FESTIVE20"
    create_res = await async_client.post(
        "/api/v1/admin/coupons",
        headers=admin_headers,
        json={
            "code": code,
            "title": "Festive 20% Flight Discount",
            "description": "Get 20% off on domestic flights",
            "discount_type": "PERCENTAGE",
            "discount_value": 20.0,
            "max_discount_amount": 1000.0,
            "min_order_amount": 2000.0,
            "service_type": "FLIGHT",
            "is_active": True,
        },
    )
    assert create_res.status_code == 201
    coupon_data = create_res.json()["data"]
    coupon_id = coupon_data["id"]
    assert coupon_data["code"] == code

    # 2. Public active coupons includes the coupon
    active_res = await async_client.get("/api/v1/coupons/active?service_type=FLIGHT")
    assert active_res.status_code == 200
    codes = [c["code"] for c in active_res.json()["data"]]
    assert code in codes

    # 3. Test Validate API - order below min_order_amount fails
    val_low = await async_client.post(
        "/api/v1/coupons/validate",
        json={"code": code, "order_amount": 1500.0, "service_type": "FLIGHT"},
    )
    assert val_low.status_code == 200
    assert val_low.json()["data"]["valid"] is False
    assert "minimum booking amount" in val_low.json()["data"]["message"].lower()

    # 4. Test Validate API - wrong service type fails
    val_wrong_service = await async_client.post(
        "/api/v1/coupons/validate",
        json={"code": code, "order_amount": 5000.0, "service_type": "HOTEL"},
    )
    assert val_wrong_service.status_code == 200
    assert val_wrong_service.json()["data"]["valid"] is False
    assert "valid only for flight" in val_wrong_service.json()["data"]["message"].lower()

    # 5. Test Validate API - valid FLIGHT order caps at max_discount_amount
    # 20% of 6000 is 1200, but cap is 1000
    val_ok = await async_client.post(
        "/api/v1/coupons/validate",
        json={"code": code, "order_amount": 6000.0, "service_type": "FLIGHT"},
    )
    assert val_ok.status_code == 200
    assert val_ok.json()["data"]["valid"] is True
    assert val_ok.json()["data"]["discount_amount"] == 1000.0

    # 6. Admin deactivates the coupon
    deact_res = await async_client.patch(
        f"/api/v1/admin/coupons/{coupon_id}",
        headers=admin_headers,
        json={"is_active": False},
    )
    assert deact_res.status_code == 200
    assert deact_res.json()["data"]["is_active"] is False

    # 7. Validate deactivated coupon fails
    val_inactive = await async_client.post(
        "/api/v1/coupons/validate",
        json={"code": code, "order_amount": 6000.0, "service_type": "FLIGHT"},
    )
    assert val_inactive.status_code == 200
    assert val_inactive.json()["data"]["valid"] is False
    assert "inactive" in val_inactive.json()["data"]["message"].lower()

    # 8. Admin deletes the coupon
    del_res = await async_client.delete(
        f"/api/v1/admin/coupons/{coupon_id}",
        headers=admin_headers,
    )
    assert del_res.status_code == 200
