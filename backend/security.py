"""
security.py - Módulo de seguridad: Bcrypt, JWT y dependencias de autenticación RBAC.

ChuPetLove Backend - Tienda de Mascotas (Ecuador)
"""

import os
import secrets
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, List
import jwt
import bcrypt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

try:
    from .database import get_db
    from .models import User, UserRole
    from .schemas import TokenData
except (ImportError, ValueError):
    from database import get_db
    from models import User, UserRole
    from schemas import TokenData

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()
logger = logging.getLogger("chupetlove.security")

# ==========================================
# CONFIGURACIÓN JWT (ISO/IEC 25010 - Seguridad)
# ==========================================
_env_secret = os.getenv("SECRET_KEY")
if not _env_secret:
    logger.warning(
        "⚠️  SECRET_KEY no está definida en las variables de entorno. "
        "Usando clave generada aleatoriamente. Configure SECRET_KEY en .env para producción."
    )
    SECRET_KEY = secrets.token_urlsafe(64)
else:
    SECRET_KEY = _env_secret

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login/form")


# ==========================================
# HASHING DE CONTRASEÑAS CON BCRYPT NATIVO
# ==========================================

def hash_password(password: str) -> str:
    """
    Genera el hash bcrypt de la contraseña.
    Bcrypt trunca automáticamente a 72 bytes para seguridad.
    """
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica la contraseña en texto plano contra el hash almacenado en la base de datos."""
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        return bcrypt.checkpw(pwd_bytes, hashed_password.encode("utf-8"))
    except Exception:
        return False


# ==========================================
# TOKENS JWT (CON ROL INCLUIDO)
# ==========================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Genera un token JWT firmado con expiración.
    El payload incluye: sub (username), user_id, role, exp, iat.
    """
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decodifica y valida la firma de un token JWT."""
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


# ==========================================
# DEPENDENCIAS DE AUTENTICACIÓN Y ROLES (RBAC)
# ==========================================

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Valida el token JWT y retorna el usuario autenticado.
    Verifica que el usuario exista y esté activo en la base de datos.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales de acceso",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_id: int = payload.get("user_id")
        role_str: str = payload.get("role")
        if username is None or user_id is None or role_str is None:
            raise credentials_exception
        token_data = TokenData(sub=username, user_id=user_id, role=UserRole(role_str))
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La sesión ha expirado por seguridad (ISO 25010). Por favor inicie sesión nuevamente.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (jwt.PyJWTError, ValueError):
        raise credentials_exception

    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La cuenta de usuario se encuentra desactivada"
        )
    return user


def require_roles(allowed_roles: List[UserRole]):
    """
    Fábrica de dependencias para restringir endpoints por rol.
    Uso: Depends(require_roles([UserRole.ADMIN, UserRole.VENDEDOR]))
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado. Roles permitidos: {[r.value for r in allowed_roles]}"
            )
        return current_user
    return role_checker
