from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserResponse
from app.security.deps import get_current_user
from app.security.jwt import create_access_token
from app.services.auth_service import authenticate_user, register_user

router = APIRouter(prefix='/auth', tags=['auth'])


@router.post('/register', response_model=AuthResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = register_user(db, payload.email, payload.password)
    token = create_access_token(user.id, user.email, user.role)
    return AuthResponse(access_token=token)


@router.post('/login', response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = authenticate_user(db, payload.email, payload.password)
    token = create_access_token(user.id, user.email, user.role)
    return AuthResponse(access_token=token)


@router.get('/me', response_model=UserResponse)
def me(user=Depends(get_current_user)) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        role=user.role,
        subscription_tier=user.subscription_tier,
        created_at=user.created_at,
    )


@router.post('/logout')
def logout() -> dict:
    return {'ok': True, 'note': 'JWT logout is client-side placeholder for MVP'}
