"""
Supabase JWT authentication middleware for FastAPI.
Verifies JWTs issued by Supabase Auth.
"""
import os
import jwt
from typing import Optional, Set
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")
ADMIN_EMAILS_RAW = os.environ.get("ADMIN_EMAILS", "")

if not SUPABASE_JWT_SECRET:
    print("[Auth] Warning: SUPABASE_JWT_SECRET not set. Authentication will fail.")

def get_admin_emails() -> Set[str]:
    """Get set of admin emails from environment variable (comma-separated)."""
    if not ADMIN_EMAILS_RAW:
        return set()
    return {email.strip().lower() for email in ADMIN_EMAILS_RAW.split(",") if email.strip()}


class AuthUser(BaseModel):
    """Authenticated user from JWT claims."""
    user_id: str
    email: Optional[str] = None
    role: Optional[str] = None


# HTTPBearer for extracting the token
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> AuthUser:
    """
    Dependency that verifies JWT and returns the authenticated user.
    Raises 401 if token is missing/invalid/expired.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": 'Bearer realm="auth_required"'},
        )
    
    if not SUPABASE_JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server authentication not configured"
        )
    
    try:
        decoded_token = jwt.decode(
            credentials.credentials,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        
        user_id = decoded_token.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID"
            )
        
        return AuthUser(
            user_id=user_id,
            email=decoded_token.get("email"),
            role=decoded_token.get("role")
        )
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidAudienceError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token audience"
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}"
        )


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Optional[AuthUser]:
    """
    Dependency that optionally returns the authenticated user.
    Returns None if no token provided (for public routes that may benefit from auth).
    """
    if credentials is None:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None


async def require_admin(
    user: AuthUser = Depends(get_current_user)
) -> AuthUser:
    """
    Dependency that requires admin role.
    Checks if user's email is in the ADMIN_EMAILS environment variable.
    """
    admin_emails = get_admin_emails()
    user_email = (user.email or "").lower()
    
    if admin_emails and user_email in admin_emails:
        return user
    
    if user.role in ("admin", "service_role"):
        return user
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Admin access required. Contact the administrator to request access."
    )


def is_admin(user: AuthUser) -> bool:
    """Check if a user has admin privileges."""
    admin_emails = get_admin_emails()
    user_email = (user.email or "").lower()
    
    if admin_emails and user_email in admin_emails:
        return True
    
    if user.role in ("admin", "service_role"):
        return True
    
    return False
