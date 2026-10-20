from fastapi import APIRouter
from backend.app.api.v1.endpoints import (
    health,
    auth,
    flights,
    hotels,
    buses,
    packages,
    bookings,
    payments,
    admin,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(flights.router)
api_router.include_router(hotels.router)
api_router.include_router(buses.router)
api_router.include_router(packages.router)
api_router.include_router(bookings.router)
api_router.include_router(payments.router)
api_router.include_router(admin.router)
