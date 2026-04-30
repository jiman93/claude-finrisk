from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import settings

router = APIRouter(prefix="/api/admin/auth", tags=["auth"])

_ALGORITHM = "HS256"
_TOKEN_HOURS = 8


def _secret() -> str:
    # Derive a stable secret from the admin password so no extra env var is needed.
    return settings.admin_password + "-finrisk-jwt-secret"


def _create_token() -> str:
    exp = datetime.now(tz=timezone.utc) + timedelta(hours=_TOKEN_HOURS)
    return jwt.encode({"sub": "admin", "exp": exp}, _secret(), algorithm=_ALGORITHM)


def verify_token(token: str) -> None:
    """Raise HTTPException 401 if token is invalid or expired."""
    try:
        jwt.decode(token, _secret(), algorithms=[_ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


class LoginRequest(BaseModel):
    password: str


class LoginResponse(BaseModel):
    token: str


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest) -> LoginResponse:
    if not settings.admin_password:
        raise HTTPException(status_code=503, detail="Admin password not configured")
    if not secrets.compare_digest(body.password, settings.admin_password):
        raise HTTPException(status_code=401, detail="Incorrect password")
    return LoginResponse(token=_create_token())
