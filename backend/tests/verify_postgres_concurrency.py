"""
Standalone PostgreSQL Concurrency and Atomic Reservation Verifier
Verifies SEC-05, SEC-06, and SEC-07 against real PostgreSQL transactions using asyncpg.
Creates and destroys a disposable test database 'traveler_test_phase2'.
"""

import asyncio
import uuid
import sys
import asyncpg
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

from backend.app.core.config import settings
from backend.app.core.database import Base
from backend.app.models.user import User, UserRole
from backend.app.models.travel import Flight, Bus
from backend.app.models.coupon import Coupon
from backend.app.models.booking import Booking, BookingStatus
from backend.app.schemas.booking import BookingCreateRequest, BookingItemCreate, PassengerSchema, BookingCancelRequest
from backend.app.services.booking_service import BookingService
from backend.app.core.security import hash_password
from fastapi import HTTPException


TEST_DB_NAME = "traveler_test_phase2"


async def setup_disposable_db(root_url: str):
    conn = await asyncpg.connect(root_url)
    try:
        exists = await conn.fetchval(f"SELECT 1 FROM pg_database WHERE datname = '{TEST_DB_NAME}'")
        if exists:
            # Terminate active connections and drop
            await conn.execute(f"""
                SELECT pg_terminate_backend(pid)
                FROM pg_stat_activity
                WHERE datname = '{TEST_DB_NAME}' AND pid <> pg_backend_pid();
            """)
            await conn.execute(f"DROP DATABASE {TEST_DB_NAME};")
        await conn.execute(f"CREATE DATABASE {TEST_DB_NAME};")
        print(f"[OK] Created disposable PostgreSQL test database: {TEST_DB_NAME}")
    finally:
        await conn.close()


async def teardown_disposable_db(root_url: str):
    conn = await asyncpg.connect(root_url)
    try:
        await conn.execute(f"""
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = '{TEST_DB_NAME}' AND pid <> pg_backend_pid();
        """)
        await conn.execute(f"DROP DATABASE {TEST_DB_NAME};")
        print(f"[OK] Cleaned up and dropped disposable PostgreSQL database: {TEST_DB_NAME}")
    finally:
        await conn.close()


async def run_postgres_verification():
    base_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
    root_url = base_url.rsplit("/", 1)[0] + "/postgres"
    test_db_url = base_url.rsplit("/", 1)[0] + f"/{TEST_DB_NAME}"
    async_test_db_url = f"postgresql+asyncpg://{test_db_url.split('://', 1)[1]}"

    await setup_disposable_db(root_url)

    engine = create_async_engine(
        async_test_db_url,
        pool_size=10,
        max_overflow=5,
        echo=False,
    )
    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    try:
        # Create all tables in disposable db
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("[OK] Initialized PostgreSQL schema in disposable database")

        # 1. Seed initial data
        async with session_factory() as session:
            user1 = User(
                email="alice_pg@example.com",
                full_name="Alice PG",
                phone="+91 91111 00001",
                hashed_password=hash_password("Pass123!"),
                role=UserRole.CUSTOMER.value,
                is_active=True,
            )
            user2 = User(
                email="bob_pg@example.com",
                full_name="Bob PG",
                phone="+91 91111 00002",
                hashed_password=hash_password("Pass123!"),
                role=UserRole.CUSTOMER.value,
                is_active=True,
            )
            flight = Flight(
                airline="IndiGo",
                airline_code="6E",
                flight_number="6E 505",
                aircraft="A321neo",
                origin_code="DEL",
                origin_name="Indira Gandhi Intl",
                origin_city="New Delhi",
                origin_country="India",
                destination_code="BLR",
                destination_name="Kempegowda Intl",
                destination_city="Bengaluru",
                destination_country="India",
                departure_time="06:00",
                arrival_time="08:45",
                duration_minutes=165,
                stops=0,
                cabin_class="ECONOMY",
                available_seats=1,  # Contention target: exactly 1 seat!
                base_fare=4500.0,
                taxes=550.0,
                total_price=5050.0,
                currency="INR",
                is_simulated=True,
                is_active=True,
            )
            bus_full = Bus(
                operator_name="Zingbus",
                bus_type="AC Sleeper",
                from_city="Delhi",
                to_city="Manali",
                boarding_point="Majnu Ka Tilla",
                dropping_point="Private Bus Stand",
                departure_time="20:00",
                arrival_time="08:00+1",
                duration_minutes=720,
                available_seats=0,  # Zero seats for rollback test
                base_fare=1500.0,
                currency="INR",
                is_simulated=True,
                is_active=True,
            )
            coupon = Coupon(
                code="PG_SINGLE_USE",
                description="PostgreSQL concurrency coupon test",
                discount_type="FLAT",
                discount_value=500.0,
                min_order_amount=1000.0,
                usage_limit=1,
                times_used=0,
                service_type="FLIGHT",
                is_active=True,
            )
            session.add_all([user1, user2, flight, bus_full, coupon])
            await session.commit()
            flight_id = flight.id
            bus_id = bus_full.id
            coupon_id = coupon.id
            user1_obj = user1
            user2_obj = user2
        print("[OK] Seeded PostgreSQL test data")

        # -------------------------------------------------------------------
        # Test 1: SEC-06 - PostgreSQL Real Concurrent Contention on Final Seat
        # -------------------------------------------------------------------
        results = []

        async def book_seat(user_obj, email):
            async with session_factory() as s:
                svc = BookingService(s)
                req = BookingCreateRequest(
                    service_type="FLIGHT",
                    contact_email=email,
                    contact_phone="+91 91111 00003",
                    items=[BookingItemCreate(item_type="FLIGHT", item_reference_id=str(flight_id), quantity=1)],
                    passengers=[PassengerSchema(first_name="Contender", last_name="Passenger")],
                )
                try:
                    booking = await svc.create_booking(req, current_user=user_obj)
                    await s.commit()
                    return ("SUCCESS", booking)
                except HTTPException as e:
                    return ("HTTP_ERROR", e.status_code, e.detail)

        # Run both tasks concurrently across separate PostgreSQL connections
        r1, r2 = await asyncio.gather(
            book_seat(user1_obj, "alice_pg@example.com"),
            book_seat(user2_obj, "bob_pg@example.com"),
        )

        statuses = [r1[0], r2[0]]
        assert "SUCCESS" in statuses, f"Expected 1 successful booking, got: {r1}, {r2}"
        assert "HTTP_ERROR" in statuses, f"Expected 1 failed booking, got: {r1}, {r2}"

        failed_result = r1 if r1[0] == "HTTP_ERROR" else r2
        assert failed_result[1] == 409, f"Expected HTTP 409 Conflict, got: {failed_result}"

        # Verify PostgreSQL available_seats is exactly 0
        async with session_factory() as s:
            f_res = (await s.execute(select(Flight).where(Flight.id == flight_id))).scalar_one()
            assert f_res.available_seats == 0, f"Available seats should be 0, got {f_res.available_seats}"
        print("[PASS] SEC-06: Real PostgreSQL concurrent booking contention correctly allocated 1 seat and returned 409 Conflict without negative inventory")

        # -------------------------------------------------------------------
        # Test 2: SEC-06 - Multi-item Atomic Rollback on Failure
        # -------------------------------------------------------------------
        # Reset flight seats to 5
        async with session_factory() as s:
            f_res = (await s.execute(select(Flight).where(Flight.id == flight_id))).scalar_one()
            f_res.available_seats = 5
            await s.commit()

        async with session_factory() as s:
            svc = BookingService(s)
            req = BookingCreateRequest(
                service_type="COMBO",
                contact_email="combo@example.com",
                contact_phone="+91 91111 00004",
                items=[
                    BookingItemCreate(item_type="FLIGHT", item_reference_id=str(flight_id), quantity=1),
                    BookingItemCreate(item_type="BUS", item_reference_id=str(bus_id), quantity=1),  # 0 available!
                ],
                passengers=[PassengerSchema(first_name="Combo", last_name="Passenger")],
            )
            try:
                await svc.create_booking(req, current_user=user1_obj)
                assert False, "Should have failed due to bus seat unavailability"
            except HTTPException as e:
                assert e.status_code == 409

        # Flight seats must remain 5 (atomic rollback succeeded)
        async with session_factory() as s:
            f_res = (await s.execute(select(Flight).where(Flight.id == flight_id))).scalar_one()
            assert f_res.available_seats == 5, f"Flight seats must remain 5, got {f_res.available_seats}"
        print("[PASS] SEC-06: Multi-item atomic rollback on failure preserved inventory consistency in PostgreSQL")

        # -------------------------------------------------------------------
        # Test 3: SEC-07 - PostgreSQL Real Concurrent Coupon Contention
        # -------------------------------------------------------------------
        async def redeem_coupon(user_obj, email):
            async with session_factory() as s:
                svc = BookingService(s)
                req = BookingCreateRequest(
                    service_type="FLIGHT",
                    contact_email=email,
                    contact_phone="+91 91111 00005",
                    promo_code="PG_SINGLE_USE",
                    items=[BookingItemCreate(item_type="FLIGHT", item_reference_id=str(flight_id), quantity=1)],
                    passengers=[PassengerSchema(first_name="Coupon", last_name="Passenger")],
                )
                try:
                    booking = await svc.create_booking(req, current_user=user_obj)
                    await s.commit()
                    return ("SUCCESS", booking)
                except HTTPException as e:
                    return ("HTTP_ERROR", e.status_code, e.detail)

        c1, c2 = await asyncio.gather(
            redeem_coupon(user1_obj, "alice_pg@example.com"),
            redeem_coupon(user2_obj, "bob_pg@example.com"),
        )
        c_statuses = [c1[0], c2[0]]
        assert "SUCCESS" in c_statuses, f"Expected 1 coupon booking success, got: {c1}, {c2}"
        assert "HTTP_ERROR" in c_statuses, f"Expected 1 coupon booking rejection, got: {c1}, {c2}"

        # Verify coupon times_used in PostgreSQL is exactly 1 (not 2!)
        async with session_factory() as s:
            c_res = (await s.execute(select(Coupon).where(Coupon.id == coupon_id))).scalar_one()
            assert c_res.times_used == 1, f"Coupon times_used must be 1, got {c_res.times_used}"
        print("[PASS] SEC-07: Real PostgreSQL concurrent coupon contention enforced usage_limit = 1 atomically")

        # -------------------------------------------------------------------
        # Test 4: SEC-05 - Restoration on Cancellation
        # -------------------------------------------------------------------
        successful_booking = c1[1] if c1[0] == "SUCCESS" else c2[1]
        async with session_factory() as s:
            svc = BookingService(s)
            cancel_req = BookingCancelRequest(reason="PostgreSQL verification cancellation")
            booking_owner = user1_obj if str(user1_obj.id) == str(successful_booking.user_id) else user2_obj
            cancelled = await svc.cancel_booking(
                booking_id_or_ref=str(successful_booking.id),
                req=cancel_req,
                current_user=booking_owner,
            )
            await s.commit()
            assert cancelled.status == "CANCELLED"

        # Verify seats restored to 5 and coupon times_used restored to 0
        async with session_factory() as s:
            f_after = (await s.execute(select(Flight).where(Flight.id == flight_id))).scalar_one()
            assert f_after.available_seats == 5, f"Flight seats should be restored to 5, got {f_after.available_seats}"

            c_after = (await s.execute(select(Coupon).where(Coupon.id == coupon_id))).scalar_one()
            assert c_after.times_used == 0, f"Coupon times_used should be restored to 0, got {c_after.times_used}"
        print("[PASS] SEC-05 & SEC-07: Cancellation restored flight inventory and coupon usage in PostgreSQL")

        print("\n=======================================================")
        print("ALL REAL POSTGRESQL CONCURRENCY & SECURITY CHECKS PASSED!")
        print("=======================================================\n")

    finally:
        await engine.dispose()
        await teardown_disposable_db(root_url)


if __name__ == "__main__":
    asyncio.run(run_postgres_verification())
