"""
CLI Command to create or promote an Administrator account in SS Journey.
Usage:
    python -m backend.create_admin --email admin@example.com --name "Super Admin" --password "SecurePass123"
"""

import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import argparse
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.core.database import AsyncSessionLocal
from backend.app.core.security import hash_password
from backend.app.models.user import User, UserRole


async def create_or_promote_admin(email: str, name: str, password: str):
    email = email.lower().strip()
    async with AsyncSessionLocal() as session:
        query = select(User).where(User.email == email)
        result = await session.execute(query)
        user = result.scalar_one_or_none()

        if user:
            user.role = UserRole.ADMIN.value
            user.is_active = True
            if password:
                user.hashed_password = hash_password(password)
            if name:
                user.full_name = name
            await session.commit()
            print(f"[SUCCESS] User '{email}' was promoted to ADMINISTRATOR role.")
        else:
            if not password:
                print("[ERROR] Password is required when creating a new administrator.")
                sys.exit(1)
            new_admin = User(
                email=email,
                full_name=name or "Administrator",
                hashed_password=hash_password(password),
                role=UserRole.ADMIN.value,
                is_active=True,
                is_verified=True,
            )
            session.add(new_admin)
            await session.commit()
            print(f"[SUCCESS] New Administrator '{email}' created successfully.")


def main():
    parser = argparse.ArgumentParser(description="Create or promote an SS Journey Administrator.")
    parser.add_argument("--email", required=True, help="Administrator email address")
    parser.add_argument("--name", default="Administrator", help="Administrator full name")
    parser.add_argument("--password", required=True, help="Secure password for administrator")

    args = parser.parse_args()
    asyncio.run(create_or_promote_admin(args.email, args.name, args.password))


if __name__ == "__main__":
    main()
