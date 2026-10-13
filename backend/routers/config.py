"""
routers/config.py - Configuración del Sistema (IVA dinámico Ecuador).

Endpoints:
  - GET  /api/config/iva → Obtener IVA vigente (público)
  - PUT  /api/config/iva → [Admin] Modificar el porcentaje de IVA

ChuPetLove Backend - Tienda de Mascotas (Ecuador)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import SystemConfig, User, UserRole
from ..schemas import SystemConfigUpdate, SystemConfigResponse
from ..security import require_roles

router = APIRouter(prefix="/api/config", tags=["Configuración del Sistema (IVA)"])


def get_or_create_system_config(db: Session) -> SystemConfig:
    """Obtiene el registro de configuración del sistema o crea el registro inicial si no existe."""
    config = db.query(SystemConfig).first()
    if not config:
        config = SystemConfig(id=1, iva_percentage=15.00)  # IVA por defecto en Ecuador (15%)
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


@router.get(
    "/iva",
    response_model=SystemConfigResponse,
    summary="Obtener el porcentaje de IVA vigente (Ecuador)"
)
def get_iva_config(db: Session = Depends(get_db)):
    """Retorna el porcentaje de IVA configurado actualmente en el sistema."""
    return get_or_create_system_config(db)


@router.put(
    "/iva",
    response_model=SystemConfigResponse,
    summary="[Admin] Modificar dinámicamente el porcentaje de IVA"
)
def update_iva_config(
    config_in: SystemConfigUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """
    Endpoint exclusivo para Administradores.
    Permite cambiar dinámicamente el porcentaje del IVA
    (ej: pasar de 15.00% a 12.00% o cualquier valor legal vigente en Ecuador).
    """
    config = get_or_create_system_config(db)
    config.iva_percentage = config_in.iva_percentage

    db.commit()
    db.refresh(config)
    return config
