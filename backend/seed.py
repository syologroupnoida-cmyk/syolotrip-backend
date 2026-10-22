import asyncio
import os
import sys

# Ensure repository root is on sys.path so 'backend.app' is always importable
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)

# Configure UTF-8 stdout for Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.core.database import AsyncSessionLocal
from backend.app.core.security import hash_password
from backend.app.models.user import User, UserRole
from backend.app.models.travel import Flight, Hotel, HotelRoom, Bus, HolidayPackage


async def seed_data():
    async with AsyncSessionLocal() as session:
        print("[SEED] Starting idempotent seed process for SS Journey...")

        # 1. Seed Users (Admin & Customer)
        admin_email = "admin@ssjourney.com"
        res = await session.execute(select(User).where(User.email == admin_email))
        admin_user = res.scalar_one_or_none()
        if not admin_user:
            admin_user = User(
                email=admin_email,
                full_name="Operations Admin",
                phone="+91 98765 43210",
                hashed_password=hash_password("Admin@123456"),
                role=UserRole.ADMIN.value,
                is_active=True,
                is_verified=True,
            )
            session.add(admin_user)
            print(f"  [+] Created default admin: {admin_email} (Password: Admin@123456)")
        else:
            print(f"  [*] Default admin already exists: {admin_email}")

        customer_email = "customer@ssjourney.com"
        res = await session.execute(select(User).where(User.email == customer_email))
        cust_user = res.scalar_one_or_none()
        if not cust_user:
            cust_user = User(
                email=customer_email,
                full_name="John Doe",
                phone="+91 98111 22233",
                hashed_password=hash_password("Customer@123456"),
                role=UserRole.CUSTOMER.value,
                is_active=True,
                is_verified=True,
            )
            session.add(cust_user)
            print(f"  [+] Created demo customer: {customer_email} (Password: Customer@123456)")
        else:
            print(f"  [*] Demo customer already exists: {customer_email}")

        # 2. Seed Flights
        demo_flights = [
            {
                "flight_number": "JL 002",
                "airline": "Japan Airlines",
                "airline_code": "JAL",
                "aircraft": "Boeing 787-9 Dreamliner",
                "origin_code": "SFO",
                "origin_name": "San Francisco International",
                "origin_city": "San Francisco",
                "origin_country": "USA",
                "destination_code": "HND",
                "destination_name": "Tokyo Haneda International",
                "destination_city": "Tokyo",
                "destination_country": "Japan",
                "departure_time": "08:30",
                "arrival_time": "14:45+1",
                "duration_minutes": 675,
                "stops": 0,
                "stops_info": "Non-stop",
                "cabin_class": "ECONOMY",
                "available_seats": 42,
                "base_fare": 64890.00,
                "taxes": 4200.00,
                "total_price": 69090.00,
                "currency": "INR",
                "baggage_info": "2 × 23kg checked",
                "emissions_kg": 287,
                "emissions_rating": "low",
                "tags": ["Lowest Fare", "Free Cancel", "Popular"],
            },
            {
                "flight_number": "UA 875",
                "airline": "United Airlines",
                "airline_code": "UA",
                "aircraft": "Boeing 777-300ER",
                "origin_code": "SFO",
                "origin_name": "San Francisco International",
                "origin_city": "San Francisco",
                "origin_country": "USA",
                "destination_code": "HND",
                "destination_name": "Tokyo Haneda International",
                "destination_city": "Tokyo",
                "destination_country": "Japan",
                "departure_time": "10:15",
                "arrival_time": "16:30+1",
                "duration_minutes": 675,
                "stops": 0,
                "stops_info": "Non-stop",
                "cabin_class": "ECONOMY",
                "available_seats": 28,
                "base_fare": 66800.00,
                "taxes": 4500.00,
                "total_price": 71300.00,
                "currency": "INR",
                "baggage_info": "2 × 23kg checked",
                "emissions_kg": 312,
                "emissions_rating": "medium",
                "tags": ["Wi-Fi Included"],
            },
            {
                "flight_number": "NH 107",
                "airline": "All Nippon Airways (ANA)",
                "airline_code": "NH",
                "aircraft": "Airbus A380 Flying Honu",
                "origin_code": "SFO",
                "origin_name": "San Francisco International",
                "origin_city": "San Francisco",
                "origin_country": "USA",
                "destination_code": "NRT",
                "destination_name": "Tokyo Narita International",
                "destination_city": "Tokyo",
                "destination_country": "Japan",
                "departure_time": "13:45",
                "arrival_time": "17:10+1",
                "duration_minutes": 625,
                "stops": 0,
                "stops_info": "Non-stop",
                "cabin_class": "ECONOMY",
                "available_seats": 19,
                "base_fare": 69500.00,
                "taxes": 4800.00,
                "total_price": 74300.00,
                "currency": "INR",
                "baggage_info": "2 × 23kg checked",
                "emissions_kg": 265,
                "emissions_rating": "low",
                "tags": ["Best Rated", "Eco-Certified"],
            },
            {
                "flight_number": "SQ 011",
                "airline": "Singapore Airlines",
                "airline_code": "SQ",
                "aircraft": "Airbus A350-900",
                "origin_code": "SFO",
                "origin_name": "San Francisco International",
                "origin_city": "San Francisco",
                "origin_country": "USA",
                "destination_code": "HND",
                "destination_name": "Tokyo Haneda International",
                "destination_city": "Tokyo",
                "destination_country": "Japan",
                "departure_time": "23:45",
                "arrival_time": "12:20+2",
                "duration_minutes": 935,
                "stops": 1,
                "stops_info": "1 stop · SIN (3h 40m)",
                "cabin_class": "ECONOMY",
                "available_seats": 15,
                "base_fare": 58900.00,
                "taxes": 3800.00,
                "total_price": 62700.00,
                "currency": "INR",
                "baggage_info": "2 × 23kg checked",
                "emissions_kg": 340,
                "emissions_rating": "medium",
                "tags": ["World's Best Airline", "Extra Legroom"],
            },
            {
                "flight_number": "AI 101",
                "airline": "Air India",
                "airline_code": "AI",
                "aircraft": "Airbus A350-900",
                "origin_code": "DEL",
                "origin_name": "Indira Gandhi International",
                "origin_city": "Delhi",
                "origin_country": "India",
                "destination_code": "BOM",
                "destination_name": "Chhatrapati Shivaji Maharaj Intl",
                "destination_city": "Mumbai",
                "destination_country": "India",
                "departure_time": "07:00",
                "arrival_time": "09:15",
                "duration_minutes": 135,
                "stops": 0,
                "stops_info": "Non-stop",
                "cabin_class": "ECONOMY",
                "available_seats": 65,
                "base_fare": 5450.00,
                "taxes": 850.00,
                "total_price": 6300.00,
                "currency": "INR",
                "baggage_info": "1 × 20kg checked + 1 carry-on",
                "emissions_kg": 110,
                "emissions_rating": "low",
                "tags": ["Frequent Flyer Preferred", "Hot Meal Included"],
            },
            {
                "flight_number": "6E 204",
                "airline": "IndiGo",
                "airline_code": "6E",
                "aircraft": "Airbus A321neo",
                "origin_code": "DEL",
                "origin_name": "Indira Gandhi International",
                "origin_city": "Delhi",
                "origin_country": "India",
                "destination_code": "BLR",
                "destination_name": "Kempegowda International",
                "destination_city": "Bengaluru",
                "destination_country": "India",
                "departure_time": "11:30",
                "arrival_time": "14:15",
                "duration_minutes": 165,
                "stops": 0,
                "stops_info": "Non-stop",
                "cabin_class": "ECONOMY",
                "available_seats": 80,
                "base_fare": 4990.00,
                "taxes": 750.00,
                "total_price": 5740.00,
                "currency": "INR",
                "baggage_info": "1 × 15kg checked + 7kg cabin",
                "emissions_kg": 125,
                "emissions_rating": "low",
                "tags": ["On-Time Champion", "Lowest Price"],
            },
        ]

        flight_count = 0
        for f_data in demo_flights:
            res = await session.execute(
                select(Flight).where(Flight.flight_number == f_data["flight_number"])
            )
            if not res.scalar_one_or_none():
                flight = Flight(**f_data, is_simulated=True, is_active=True)
                session.add(flight)
                flight_count += 1
        print(f"  [+] Added {flight_count} new flights (idempotent)")

        # 3. Seed Hotels with Rooms
        demo_hotels = [
            {
                "name": "Le Grand Hôtel du Palais Royal",
                "star_rating": 5,
                "guest_rating": 9.4,
                "rating_label": "Exceptional",
                "review_count": 1284,
                "address": "4 Rue de Valois",
                "city": "Paris",
                "country": "France",
                "neighborhood": "1st Arrondissement · 0.3 km to Louvre Museum",
                "overview": "Set in a historic 18th-century palace, offering intimate luxury adjacent to the Palais-Royal gardens.",
                "amenities": ["Free Breakfast", "Pool", "Spa", "Wifi", "Gym", "Concierge"],
                "tags": ["Free Cancellation", "Pay at Property", "Luxury"],
                "featured_image": "https://lh3.googleusercontent.com/aida-public/AB6AXuC0E7RHXytjncZWInVu6Jq1inHh-1PungrJj2Yv_ETg17I3Vdx3cR5Z7ZTi2m4DDgb5GqvXyA7PbaAEK-uwhm2d-Q_aZ2qYCIwfI2VI1WUoRx-FDwvXPuA42b1Dp2YpYykOhxVDLALrn8zE9hAB65y3O2vcgR6qBucn3zVbsXWxhsw1W7PxBliKjK8VuZkGaANoDpBWRxSK_6WfetLziszlKj_o_2uGIPgxlJ6omW82YtShD3anwuq6",
                "starting_price": 28200.00,
                "currency": "INR",
                "featured": True,
                "rooms": [
                    {
                        "room_type": "Deluxe King Suite with City View",
                        "bed_type": "King Bed",
                        "max_occupancy": 2,
                        "price_per_night": 28200.00,
                        "taxes_per_night": 2780.00,
                        "available_rooms": 4,
                        "amenities": ["Balcony View", "Marble Bath", "Nespresso Machine", "High-speed Wi-Fi"],
                    },
                    {
                        "room_type": "Palais Royal Terrace Suite",
                        "bed_type": "Super King Bed",
                        "max_occupancy": 3,
                        "price_per_night": 44500.00,
                        "taxes_per_night": 4100.00,
                        "available_rooms": 2,
                        "amenities": ["Private Terrace", "Butler Service", "VIP Lounge Access"],
                    },
                ],
            },
            {
                "name": "Hotel Gracery Shinjuku",
                "star_rating": 4,
                "guest_rating": 8.9,
                "rating_label": "Excellent",
                "review_count": 2150,
                "address": "1-19-1 Kabukicho, Shinjuku",
                "city": "Tokyo",
                "country": "Japan",
                "neighborhood": "Kabukicho, Shinjuku · 500m to Station",
                "overview": "Famous landmark hotel located in the bustling heart of Shinjuku featuring the iconic life-sized Godzilla head.",
                "amenities": ["Godzilla Terrace", "Japanese Breakfast", "Free Wi-Fi", "Laundry"],
                "tags": ["Free Cancellation", "Top Location", "Great Value"],
                "featured_image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=700&auto=format&fit=crop&q=80",
                "starting_price": 14900.00,
                "currency": "INR",
                "featured": True,
                "rooms": [
                    {
                        "room_type": "Standard Double Room (Non-Smoking)",
                        "bed_type": "Queen Bed",
                        "max_occupancy": 2,
                        "price_per_night": 14900.00,
                        "taxes_per_night": 1400.00,
                        "available_rooms": 8,
                        "amenities": ["Air Purifier", "Deep Soaking Tub", "City Skyline View"],
                    },
                ],
            },
            {
                "name": "Park Hyatt Tokyo",
                "star_rating": 5,
                "guest_rating": 9.4,
                "rating_label": "Exceptional",
                "review_count": 1420,
                "address": "3-7-1-2 Nishi-Shinjuku",
                "city": "Tokyo",
                "country": "Japan",
                "neighborhood": "Shinjuku · 1.2 km to Central Station",
                "overview": "An oasis of serene elegance high above the lively streets of Shinjuku with breathtaking views of Mount Fuji.",
                "amenities": ["Free High-speed Wi-Fi", "Indoor Sky Pool", "Club On The Park Spa", "New York Grill"],
                "tags": ["World Class Luxury", "Iconic Views"],
                "featured_image": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=700&auto=format&fit=crop&q=80",
                "starting_price": 28500.00,
                "currency": "INR",
                "featured": True,
                "rooms": [
                    {
                        "room_type": "Park View King Room",
                        "bed_type": "King Bed",
                        "max_occupancy": 2,
                        "price_per_night": 28500.00,
                        "taxes_per_night": 2800.00,
                        "available_rooms": 5,
                        "amenities": ["Panoramic Fuji View", "Deep Soaking Granite Tub", "Complimentary Evening Cocktails"],
                    },
                ],
            },
        ]

        hotel_count = 0
        for h_data in demo_hotels:
            res = await session.execute(select(Hotel).where(Hotel.name == h_data["name"]))
            if not res.scalar_one_or_none():
                rooms_data = h_data.pop("rooms")
                hotel = Hotel(**h_data, is_simulated=True, is_active=True)
                session.add(hotel)
                await session.flush()

                for r_data in rooms_data:
                    room = HotelRoom(**r_data, hotel_id=hotel.id, is_available=True)
                    session.add(room)
                hotel_count += 1
        print(f"  [+] Added {hotel_count} new hotels with room inventory (idempotent)")

        # 4. Seed Buses
        demo_buses = [
            {
                "operator_name": "Zingbus Electric Intercity",
                "bus_type": "Volvo 9600 Multi-Axle AC Sleeper",
                "from_city": "Delhi",
                "to_city": "Jaipur",
                "boarding_point": "Kashmere Gate ISBT",
                "dropping_point": "Sindhi Camp Bus Stand",
                "departure_time": "23:00",
                "arrival_time": "04:30+1",
                "duration_minutes": 330,
                "available_seats": 24,
                "base_fare": 950.00,
                "rating": 4.8,
                "currency": "INR",
            },
            {
                "operator_name": "SRS Travels Royal Club",
                "bus_type": "Scania Multi-Axle AC Sleeper",
                "from_city": "Mumbai",
                "to_city": "Goa",
                "boarding_point": "Borivali West",
                "dropping_point": "Panjim Bus Stand",
                "departure_time": "18:30",
                "arrival_time": "07:00+1",
                "duration_minutes": 750,
                "available_seats": 18,
                "base_fare": 1850.00,
                "rating": 4.6,
                "currency": "INR",
            },
        ]

        bus_count = 0
        for b_data in demo_buses:
            res = await session.execute(
                select(Bus).where(
                    Bus.operator_name == b_data["operator_name"],
                    Bus.from_city == b_data["from_city"],
                    Bus.to_city == b_data["to_city"],
                )
            )
            if not res.scalar_one_or_none():
                bus = Bus(**b_data, is_simulated=True, is_active=True)
                session.add(bus)
                bus_count += 1
        print(f"  [+] Added {bus_count} new buses (idempotent)")

        # 5. Seed Holiday Packages
        demo_packages = [
            {
                "title": "Tokyo & Kyoto Discovery: 10 Days Culture & Modernity",
                "destination": "Tokyo, Japan",
                "duration_days": 10,
                "duration_nights": 9,
                "overview": "Experience the neon dazzle of Tokyo alongside the tranquil shrines and bamboo groves of ancient Kyoto. Includes bullet train transfers, 4-star stays, and guided cultural tours.",
                "inclusions": [
                    "Roundtrip Flights Included",
                    "9 Nights 4-Star Accommodations",
                    "Shinkansen Bullet Train Pass",
                    "Daily Japanese Breakfast",
                    "Full-Day Guided Mt. Fuji Tour",
                ],
                "exclusions": ["Personal shopping expenses", "Visa processing fees"],
                "itinerary": [
                    {"day": 1, "title": "Arrival in Tokyo", "description": "Check-in at Hotel Gracery Shinjuku & welcome dinner"},
                    {"day": 2, "title": "Tokyo Highlights", "description": "Shibuya Crossing, Meiji Shrine & teamLab Planets"},
                    {"day": 3, "title": "Mt. Fuji & Hakone Excursion", "description": "Cable car ride and Lake Ashi sightseeing cruise"},
                    {"day": 4, "title": "Bullet Train to Kyoto", "description": "Arrive in Kyoto, explore Gion district at twilight"},
                    {"day": 5, "title": "Kyoto Temples & Bamboo Forest", "description": "Fushimi Inari Taisha and Arashiyama Bamboo Grove"},
                ],
                "price_per_person": 168000.00,
                "currency": "INR",
                "featured_image": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80",
                "rating": 4.9,
                "available_capacity": 15,
            },
            {
                "title": "Bali Bliss: Ubud Jungles & Seminyak Sunsets",
                "destination": "Bali, Indonesia",
                "duration_days": 7,
                "duration_nights": 6,
                "overview": "Escape into paradise with 3 nights in a private pool jungle villa in Ubud followed by 3 beachfront nights in vibrant Seminyak.",
                "inclusions": [
                    "Private Pool Villa in Ubud",
                    "Beach Resort in Seminyak",
                    "Daily Floating Breakfast",
                    "Mount Batur Sunrise Jeep Safari",
                    "Nusa Penida Island Day Tour",
                ],
                "exclusions": ["Travel insurance (optional add-on)"],
                "itinerary": [
                    {"day": 1, "title": "Welcome to Denpasar", "description": "Private transfer to Ubud Jungle Villa"},
                    {"day": 2, "title": "Tegalalang & Sacred Monkey Forest", "description": "Guided tour & coffee plantation tasting"},
                    {"day": 3, "title": "Seminyak Beach Vibes", "description": "Transfer to coastal resort, beach club sunset"},
                ],
                "price_per_person": 78500.00,
                "currency": "INR",
                "featured_image": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&auto=format&fit=crop&q=80",
                "rating": 4.85,
                "available_capacity": 20,
            },
        ]

        pkg_count = 0
        for p_data in demo_packages:
            res = await session.execute(
                select(HolidayPackage).where(HolidayPackage.title == p_data["title"])
            )
            if not res.scalar_one_or_none():
                pkg = HolidayPackage(**p_data, is_simulated=True, is_active=True)
                session.add(pkg)
                pkg_count += 1
        print(f"  [+] Added {pkg_count} new holiday packages (idempotent)")

        await session.commit()
        print("[SUCCESS] Database seed completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed_data())
