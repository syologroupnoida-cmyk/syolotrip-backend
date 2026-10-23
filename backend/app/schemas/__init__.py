from backend.app.schemas.common import ApiResponse, PaginatedResponse, PaginationMeta
from backend.app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    AuthTokenResponse,
    UserProfileResponse,
    AuthResponse,
)
from backend.app.schemas.flight import (
    FlightSearchParams,
    FlightCreate,
    FlightResponse,
    AirportSchema,
)
from backend.app.schemas.hotel import (
    HotelSearchParams,
    HotelCreate,
    HotelResponse,
    HotelRoomResponse,
)
from backend.app.schemas.bus import (
    BusSearchParams,
    BusCreate,
    BusResponse,
)
from backend.app.schemas.package import (
    PackageSearchParams,
    PackageCreate,
    PackageResponse,
)
from backend.app.schemas.booking import (
    PassengerSchema,
    BookingItemCreate,
    BookingCreateRequest,
    BookingCancelRequest,
    BookingResponse,
    BookingItemResponse,
    BookingStatusHistoryResponse,
)
from backend.app.schemas.payment import (
    PaymentCreateRequest,
    PaymentResponse,
)
from backend.app.schemas.admin import (
    DashboardStatsResponse,
    AuditLogResponse,
)
from backend.app.schemas.partner import (
    PartnerRegisterRequest,
    PartnerProfileUpdate,
    PartnerProfileResponse,
    PartnerPropertyCreate,
    PartnerPropertyUpdate,
    PartnerPropertyResponse,
    PartnerRoomCreate,
    PartnerRoomUpdate,
    DailyInventorySetRequest,
    DailyInventoryResponse,
    AdminPropertyReviewRequest,
)

__all__ = [
    "ApiResponse",
    "PaginatedResponse",
    "PaginationMeta",
    "UserRegisterRequest",
    "UserLoginRequest",
    "AuthTokenResponse",
    "UserProfileResponse",
    "AuthResponse",
    "FlightSearchParams",
    "FlightCreate",
    "FlightResponse",
    "AirportSchema",
    "HotelSearchParams",
    "HotelCreate",
    "HotelResponse",
    "HotelRoomResponse",
    "BusSearchParams",
    "BusCreate",
    "BusResponse",
    "PackageSearchParams",
    "PackageCreate",
    "PackageResponse",
    "PassengerSchema",
    "BookingItemCreate",
    "BookingCreateRequest",
    "BookingCancelRequest",
    "BookingResponse",
    "BookingItemResponse",
    "BookingStatusHistoryResponse",
    "PaymentCreateRequest",
    "PaymentResponse",
    "DashboardStatsResponse",
    "AuditLogResponse",
    "PartnerRegisterRequest",
    "PartnerProfileUpdate",
    "PartnerProfileResponse",
    "PartnerPropertyCreate",
    "PartnerPropertyUpdate",
    "PartnerPropertyResponse",
    "PartnerRoomCreate",
    "PartnerRoomUpdate",
    "DailyInventorySetRequest",
    "DailyInventoryResponse",
    "AdminPropertyReviewRequest",
]

