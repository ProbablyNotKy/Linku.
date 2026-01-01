"""
Supabase JWT authentication middleware for FastAPI.
Verifies JWTs issued by Supabase Auth using JWKS for ES256 tokens.
"""
import os
import jwt
import httpx
from jwt import PyJWKClient
from typing import Optional, Set
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")
SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL", os.environ.get("SUPABASE_URL", ""))
ADMIN_EMAILS_RAW = os.environ.get("ADMIN_EMAILS", "")

# JWKS client for ES256 token verification
_jwks_client: Optional[PyJWKClient] = None

def get_jwks_client() -> Optional[PyJWKClient]:
    """Get or create the JWKS client for Supabase token verification."""
    global _jwks_client
    if _jwks_client is None and SUPABASE_URL:
        jwks_url = f"{SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
        try:
            _jwks_client = PyJWKClient(jwks_url)
            print(f"[Auth] JWKS client initialized for: {jwks_url}")
        except Exception as e:
            print(f"[Auth] Failed to initialize JWKS client: {e}")
    return _jwks_client

if not SUPABASE_JWT_SECRET and not SUPABASE_URL:
    print("[Auth] Warning: Neither SUPABASE_JWT_SECRET nor SUPABASE_URL set. Authentication will fail.")
elif SUPABASE_URL:
    print(f"[Auth] Using JWKS from Supabase URL for ES256 token verification")
    get_jwks_client()  # Initialize on startup
elif SUPABASE_JWT_SECRET:
    print(f"[Auth] SUPABASE_JWT_SECRET configured (length: {len(SUPABASE_JWT_SECRET)})")

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
        # Get the token header to determine which algorithm to use
        token_header = jwt.get_unverified_header(credentials.credentials)
        algorithm = token_header.get("alg", "HS256")
        
        if algorithm == "ES256":
            # Use JWKS for ES256 tokens
            jwks_client = get_jwks_client()
            if not jwks_client:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="JWKS client not configured for ES256 tokens"
                )
            signing_key = jwks_client.get_signing_key_from_jwt(credentials.credentials)
            decoded_token = jwt.decode(
                credentials.credentials,
                signing_key.key,
                algorithms=["ES256"],
                audience="authenticated",
                options={"verify_aud": True}
            )
        else:
            # Fall back to HS256 with shared secret
            if not SUPABASE_JWT_SECRET:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="JWT secret not configured for HS256 tokens"
                )
            decoded_token = jwt.decode(
                credentials.credentials,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
                options={"verify_aud": True}
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
        # Log more details for debugging
        print(f"[Auth] JWT decode failed: {type(e).__name__}: {str(e)}")
        try:
            # Try to decode without verification to see the header
            unverified = jwt.decode(credentials.credentials, options={"verify_signature": False})
            print(f"[Auth] Token header algorithm: {jwt.get_unverified_header(credentials.credentials)}")
        except Exception:
            pass
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
