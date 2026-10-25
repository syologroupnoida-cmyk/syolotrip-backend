import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from backend.app.main import app
from backend.app.core.database import get_db
import backend.app.models  # Ensure all models are registered on Base.metadata
from backend.app.models.base import Base
from backend.app.core.security import create_access_token, hash_password
from backend.app.models.user import User, UserRole

from sqlalchemy.pool import StaticPool

# In-memory SQLite async engine for fast, isolated test runs
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def prepare_database():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    from backend.app.core.rate_limit import limiter
    limiter.reset()
    yield
    limiter.reset()



async def override_get_db():
    async with TestSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture
async def db_session():
    async with TestSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


from sqlalchemy import select

@pytest_asyncio.fixture
async def test_customer(db_session: AsyncSession) -> User:
    email = "testcustomer@example.com"
    query = select(User).where(User.email == email)
    res = await db_session.execute(query)
    user = res.scalar_one_or_none()
    if not user:
        user = User(
            email=email,
            full_name="Alice Customer",
            phone="+91 99999 88888",
            hashed_password=hash_password("Customer123!"),
            role=UserRole.CUSTOMER.value,
            is_active=True,
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def customer_headers(test_customer: User) -> dict:
    token = create_access_token(subject=str(test_customer.id), role=test_customer.role)
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def test_admin(db_session: AsyncSession) -> User:
    email = "testadmin@example.com"
    query = select(User).where(User.email == email)
    res = await db_session.execute(query)
    user = res.scalar_one_or_none()
    if not user:
        user = User(
            email=email,
            full_name="Bob Admin",
            phone="+91 99999 77777",
            hashed_password=hash_password("Admin123!"),
            role=UserRole.ADMIN.value,
            is_active=True,
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def admin_headers(test_admin: User) -> dict:
    token = create_access_token(subject=str(test_admin.id), role=test_admin.role)
    return {"Authorization": f"Bearer {token}"}
