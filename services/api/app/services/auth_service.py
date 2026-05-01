from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.entities import User, UserProfile
from app.security.password import hash_password, verify_password


def register_user(db: Session, email: str, password: str) -> User:
    existing = db.scalar(select(User).where(User.email == email.lower()))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    user = User(email=email.lower(), password_hash=hash_password(password), role="user")
    profile = UserProfile(user=user)
    db.add_all([user, profile])
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = db.scalar(select(User).where(User.email == email.lower()))
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return user
