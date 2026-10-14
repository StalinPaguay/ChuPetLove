"""
auth.py - Router de Autenticación, Registro y Gestión de Usuarios.

Endpoints:
  - POST /api/auth/register       → Registro público (solo clientes)
  - POST /api/auth/login          → Login JSON (todos los roles)
  - POST /api/auth/login/form     → Login Form Data (Swagger UI)
  - GET  /api/auth/me             → Perfil del usuario autenticado
  - POST /api/auth/admin/users    → [Admin] Crear usuario con cualquier rol
  - GET  /api/auth/admin/users    → [Admin] Listar todos los usuarios
  - PATCH /api/auth/admin/users/{id}/status → [Admin] Activar/Desactivar usuario
  - DELETE /api/auth/admin/users/{id}       → [Admin] Eliminar usuario

ChuPetLove Backend - Tienda de Mascotas (Ecuador)
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

try:
    from .database import get_db
    from .models import User, UserRole, Order
    from .schemas import (
        UserRegister,
        UserAdminCreate,
        UserAdminUpdate,
        UserLogin,
        UserResponse,
        UserUpdateStatus,
        Token
    )
    from .security import (
        hash_password,
        verify_password,
        create_access_token,
        get_current_user,
        require_roles
    )
except (ImportError, ValueError):
    from database import get_db
    from models import User, UserRole, Order
    from schemas import (
        UserRegister,
        UserAdminCreate,
        UserAdminUpdate,
        UserLogin,
        UserResponse,
        UserUpdateStatus,
        Token
    )
    from security import (
        hash_password,
        verify_password,
        create_access_token,
        get_current_user,
        require_roles
    )

router = APIRouter(prefix="/api/auth", tags=["Autenticación y Usuarios"])


# ==========================================
# 1. REGISTRO PÚBLICO (EXCLUSIVO CLIENTES)
# ==========================================

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registro libre de nuevos clientes"
)
@router.post(
    "/register-client",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registro libre de nuevos clientes (Alias)"
)
def register_client(user_in: UserRegister, db: Session = Depends(get_db)):
    """
    Permite el registro público de nuevos usuarios con solo usuario y contraseña.
    **Nota:** Por seguridad, este endpoint asigna automáticamente el rol **CLIENTE**.
    """
    if not user_in.username or not user_in.username.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Todos los campos son obligatorios. El nombre de usuario no puede estar vacío."
        )

    if not user_in.password or not user_in.password.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Todos los campos son obligatorios. La contraseña no puede estar vacía."
        )

    # Normalizar username en minúsculas y sin espacios
    clean_username = user_in.username.strip().lower()

    if len(clean_username) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario debe tener al menos 3 caracteres."
        )

    if len(user_in.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe tener al menos 6 caracteres."
        )

    clean_email = user_in.email.strip().lower() if user_in.email else f"{clean_username}@chupetlove.ec"

    # Verificar si el username o email ya existen (case-insensitive)
    existing_user = db.query(User).filter(
        or_(
            func.lower(User.username) == clean_username,
            func.lower(User.email) == clean_email
        )
    ).first()

    if existing_user:
        if existing_user.username.lower() == clean_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre de usuario ya se encuentra registrado. Por favor elija otro nombre."
            )
        if existing_user.email.lower() == clean_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo electrónico ya se encuentra registrado."
            )

    # Crear nuevo cliente con contraseña hasheada en Bcrypt
    new_user = User(
        username=clean_username,
        email=clean_email,
        password_hash=hash_password(user_in.password),
        role=UserRole.CLIENTE,  # Rol forzado a CLIENTE
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# ==========================================
# 2. INICIO DE SESIÓN (LOGIN - JWT)
# ==========================================

@router.post(
    "/login",
    response_model=Token,
    summary="Inicio de sesión y obtención de token JWT (JSON)"
)
def login(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Autentica al usuario verificando la contraseña con Bcrypt.
    Acepta cuerpo JSON (`UserLogin`) por Nombre de Usuario o Correo Electrónico (insensible a mayúsculas/minúsculas).
    Retorna un token JWT que incluye el Rol del usuario.
    """
    ident = login_data.username_or_email or login_data.username
    if not ident or not ident.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Todos los campos son obligatorios. Ingrese su usuario o correo."
        )

    if not login_data.password or not login_data.password.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Todos los campos son obligatorios. Ingrese su contraseña."
        )

    return _process_login(ident.strip(), login_data.password, db)


@router.post(
    "/login/form",
    response_model=Token,
    summary="Inicio de sesión con Form Data (Swagger UI / OAuth2)"
)
def login_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Autenticación vía Form Data para Swagger UI (campo username y password)."""
    return _process_login(form_data.username, form_data.password, db)


def _process_login(identifier: str, password: str, db: Session) -> Token:
    """Lógica interna de autenticación y emisión de JWT (insensible a mayúsculas/minúsculas)."""
    clean_identifier = identifier.strip().lower()

    user = db.query(User).filter(
        or_(
            func.lower(User.username) == clean_identifier,
            func.lower(User.email) == clean_identifier
        )
    ).first()

    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos. Verifique sus datos e intente nuevamente.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La cuenta de usuario está desactivada. Contacte con el Administrador."
        )

    access_token = create_access_token(
        data={
            "sub": user.username,
            "user_id": user.id,
            "role": user.role.value
        }
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        username=user.username
    )


# ==========================================
# 3. PERFIL DEL USUARIO AUTENTICADO
# ==========================================

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Obtener perfil del usuario actualmente autenticado"
)
def get_my_profile(current_user: User = Depends(get_current_user)):
    """Retorna la información del usuario autenticado."""
    return current_user


# ==========================================
# 4. ENDPOINTS PROTEGIDOS (SOLO ADMINISTRADOR)
# ==========================================

@router.post(
    "/admin/users",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="[Admin] Crear cuenta con cualquier rol (Admin, Vendedor, Cliente)"
)
@router.post(
    "/users",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="[Admin] Crear cuenta con cualquier rol (Alias)"
)
def admin_create_user(
    user_in: UserAdminCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """
    Endpoint exclusivo para Administradores.
    Permite crear usuarios asignando explícitamente cualquier rol (**admin**, **vendedor**, **cliente**).
    El campo email es opcional y se auto-genera si no se provee.
    """
    clean_username = user_in.username.strip().lower()
    clean_email = user_in.email.strip().lower() if user_in.email else f"{clean_username}@chupetlove.ec"

    existing_user = db.query(User).filter(
        or_(
            func.lower(User.username) == clean_username,
            func.lower(User.email) == clean_email
        )
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario o correo electrónico ya existe en el sistema"
        )

    new_user = User(
        username=clean_username,
        email=clean_email,
        password_hash=hash_password(user_in.password),
        role=user_in.role,
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.put(
    "/admin/users/{user_id}",
    response_model=UserResponse,
    summary="[Admin] Editar completamente los datos de un usuario"
)
@router.put(
    "/users/{user_id}",
    response_model=UserResponse,
    summary="[Admin] Editar completamente los datos de un usuario (Alias)"
)
def admin_update_user(
    user_id: int,
    user_in: UserAdminUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """
    Permite al Administrador modificar nombre de usuario, contraseña, rol y estado activo.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    # Validar que un admin no se desactive o quite su propio rol de admin accidentalmente
    if admin_user.id == user_id:
        if user_in.is_active is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un administrador no puede desactivar su propia cuenta"
            )
        if user_in.role and user_in.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un administrador no puede remover su propio rol de Administrador"
            )

    # Si se actualiza username, verificar duplicados
    if user_in.username:
        clean_new_username = user_in.username.strip().lower()
        dup = db.query(User).filter(
            func.lower(User.username) == clean_new_username,
            User.id != user_id
        ).first()
        if dup:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre de usuario ya está en uso por otra cuenta"
            )
        user.username = clean_new_username

    # Si se envía nueva contraseña
    if user_in.password and user_in.password.strip():
        if len(user_in.password.strip()) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La nueva contraseña debe tener al menos 6 caracteres"
            )
        user.password_hash = hash_password(user_in.password.strip())

    if user_in.role is not None:
        user.role = user_in.role

    if user_in.is_active is not None:
        user.is_active = user_in.is_active

    db.commit()
    db.refresh(user)

    return user


@router.get(
    "/admin/users",
    response_model=List[UserResponse],
    summary="[Admin] Listar todos los usuarios del sistema"
)
@router.get(
    "/users",
    response_model=List[UserResponse],
    summary="[Admin] Listar todos los usuarios del sistema (Alias)"
)
def admin_list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """Lista todos los usuarios registrados en el sistema ChuPetLove."""
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.patch(
    "/admin/users/{user_id}/status",
    response_model=UserResponse,
    summary="[Admin] Activar o desactivar un usuario"
)
@router.patch(
    "/users/{user_id}/status",
    response_model=UserResponse,
    summary="[Admin] Activar o desactivar un usuario (Alias)"
)
def admin_update_user_status(
    user_id: int,
    status_in: UserUpdateStatus,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """
    Permite al Administrador activar o desactivar la cuenta de un usuario.
    Un administrador no puede desactivarse a sí mismo.
    """
    if admin_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un administrador no puede desactivar su propia cuenta"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    user.is_active = status_in.is_active
    db.commit()
    db.refresh(user)

    return user


@router.delete(
    "/admin/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="[Admin] Eliminar un usuario del sistema"
)
@router.delete(
    "/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="[Admin] Eliminar un usuario del sistema (Alias)"
)
def admin_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """
    Permite al Administrador eliminar un usuario por su ID.
    Un administrador no puede eliminarse a sí mismo.
    Usuarios con historial de órdenes no pueden eliminarse (deben desactivarse).
    """
    if admin_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un administrador no puede eliminarse a sí mismo"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    # Verificar integridad referencial: usuarios con órdenes no pueden eliminarse
    has_orders = db.query(Order).filter(Order.user_id == user_id).first()
    if has_orders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar este usuario porque tiene historial de órdenes. "
                   "Desactive la cuenta en su lugar para preservar la integridad de los datos."
        )

    db.delete(user)
    db.commit()
    return None
