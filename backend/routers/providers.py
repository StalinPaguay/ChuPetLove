"""
routers/providers.py - CRUD completo de Proveedores con Catálogo de Productos Ofrecidos.

Endpoints:
  - GET    /api/providers                              → Listar proveedores (Admin/Vendedor)
  - GET    /api/providers/{id}                         → Detalle de proveedor (Admin/Vendedor)
  - GET    /api/providers/{id}/offered-products        → Catálogo de productos del proveedor
  - POST   /api/providers                              → Crear proveedor con catálogo (Admin/Vendedor)
  - PUT    /api/providers/{id}                         → Actualizar proveedor y catálogo (Admin/Vendedor)
  - DELETE /api/providers/{id}                         → Eliminar proveedor (Admin)

ChuPetLove Backend - Tienda de Mascotas (Ecuador)
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

try:
    from ..database import get_db
    from ..models import Provider, ProviderProductItem, User, UserRole
    from ..schemas import (
        ProviderCreate,
        ProviderUpdate,
        ProviderResponse,
        ProviderProductItemResponse,
        ProviderProductItemCreate,
        ProviderProductItemUpdate
    )
    from ..security import require_roles
except (ImportError, ValueError):
    from database import get_db
    from models import Provider, ProviderProductItem, User, UserRole
    from schemas import (
        ProviderCreate,
        ProviderUpdate,
        ProviderResponse,
        ProviderProductItemResponse,
        ProviderProductItemCreate,
        ProviderProductItemUpdate
    )
    from security import require_roles

router = APIRouter(prefix="/api/providers", tags=["Gestión de Proveedores"])


def _load_provider_full(db: Session, provider_id: int):
    """Carga un proveedor con todas sus relaciones (productos inventario + catálogo ofrecido)."""
    return db.query(Provider).options(
        joinedload(Provider.products),
        joinedload(Provider.offered_products)
    ).filter(Provider.id == provider_id).first()


@router.get(
    "",
    response_model=List[ProviderResponse],
    summary="Listar todos los proveedores con sus productos abastecidos y catálogo ofrecido"
)
def list_providers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.VENDEDOR]))
):
    """Obtiene la lista de proveedores con detalle de productos abastecidos, catálogo ofrecido y costos predeterminados."""
    providers = db.query(Provider).options(
        joinedload(Provider.products),
        joinedload(Provider.offered_products)
    ).offset(skip).limit(limit).all()
    return providers


@router.get(
    "/{provider_id}",
    response_model=ProviderResponse,
    summary="Obtener un proveedor por su ID"
)
def get_provider(
    provider_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.VENDEDOR]))
):
    """Obtiene el detalle de un proveedor por ID incluyendo su catálogo de productos ofrecidos."""
    provider = _load_provider_full(db, provider_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proveedor no encontrado"
        )
    return provider


@router.get(
    "/{provider_id}/offered-products",
    response_model=List[ProviderProductItemResponse],
    summary="Obtener catálogo de productos ofrecidos por un proveedor específico"
)
def get_provider_offered_products(
    provider_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.VENDEDOR]))
):
    """
    Retorna la lista de productos predeterminados que ofrece un proveedor.
    Se usa como fuente de datos para el Select/menú desplegable al crear un producto de inventario.
    """
    provider = db.query(Provider).filter(Provider.id == provider_id).first()
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proveedor no encontrado"
        )

    items = db.query(ProviderProductItem).filter(
        ProviderProductItem.provider_id == provider_id
    ).all()
    return items


@router.post(
    "",
    response_model=ProviderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="[Admin] Crear un nuevo proveedor con catálogo de productos ofrecidos"
)
def create_provider(
    provider_in: ProviderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """Crea un nuevo proveedor en el sistema, opcionalmente con su catálogo de productos ofrecidos (Solo Admin)."""
    existing_provider = db.query(Provider).filter(Provider.name == provider_in.name).first()
    if existing_provider:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un proveedor registrado con ese nombre"
        )

    # Crear el proveedor sin los offered_products
    provider_data = provider_in.model_dump(exclude={"offered_products"})
    new_provider = Provider(**provider_data)
    db.add(new_provider)
    db.flush()

    # Crear los productos ofrecidos si se proporcionaron
    if provider_in.offered_products:
        for item_data in provider_in.offered_products:
            item = ProviderProductItem(
                provider_id=new_provider.id,
                name=item_data.name,
                pet_type=item_data.pet_type,
                category=item_data.category,
                cost_price=item_data.cost_price,
                description=item_data.description
            )
            db.add(item)

    db.commit()

    return _load_provider_full(db, new_provider.id)


@router.put(
    "/{provider_id}",
    response_model=ProviderResponse,
    summary="[Admin] Actualizar datos de un proveedor y su catálogo"
)
def update_provider(
    provider_id: int,
    provider_in: ProviderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """Actualiza la información de un proveedor existente. Si se envía offered_products, reemplaza el catálogo (Solo Admin)."""
    provider = db.query(Provider).filter(Provider.id == provider_id).first()
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proveedor no encontrado"
        )

    update_data = provider_in.model_dump(exclude_unset=True, exclude={"offered_products"})
    for field, value in update_data.items():
        setattr(provider, field, value)

    # Si se envían offered_products, reemplazar el catálogo completo
    if provider_in.offered_products is not None:
        # Eliminar los productos ofrecidos actuales
        db.query(ProviderProductItem).filter(
            ProviderProductItem.provider_id == provider_id
        ).delete(synchronize_session=False)

        # Crear los nuevos
        for item_data in provider_in.offered_products:
            item = ProviderProductItem(
                provider_id=provider_id,
                name=item_data.name,
                pet_type=item_data.pet_type,
                category=item_data.category,
                cost_price=item_data.cost_price,
                description=item_data.description
            )
            db.add(item)

    db.commit()

    return _load_provider_full(db, provider.id)


# ==========================================
# CRUD INDIVIDUAL DE PRODUCTOS OFRECIDOS POR PROVEEDOR
# ==========================================

@router.post(
    "/{provider_id}/offered-products",
    response_model=ProviderProductItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="[Admin] Agregar un producto al catálogo de un proveedor"
)
def add_offered_product(
    provider_id: int,
    item_in: ProviderProductItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """Agrega un nuevo producto al catálogo de productos ofrecidos por el proveedor (Solo Admin)."""
    provider = db.query(Provider).filter(Provider.id == provider_id).first()
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proveedor no encontrado"
        )

    item = ProviderProductItem(
        provider_id=provider_id,
        name=item_in.name,
        pet_type=item_in.pet_type,
        category=item_in.category,
        cost_price=item_in.cost_price,
        description=item_in.description
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete(
    "/{provider_id}/offered-products/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="[Admin] Eliminar un producto del catálogo del proveedor"
)
def delete_offered_product(
    provider_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """Elimina un producto del catálogo ofrecido por el proveedor (Solo Admin)."""
    item = db.query(ProviderProductItem).filter(
        ProviderProductItem.id == item_id,
        ProviderProductItem.provider_id == provider_id
    ).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto del catálogo del proveedor no encontrado"
        )
    db.delete(item)
    db.commit()
    return None


@router.delete(
    "/{provider_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="[Admin] Eliminar un proveedor"
)
def delete_provider(
    provider_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """Elimina un proveedor (solo disponible para Administradores)."""
    provider = db.query(Provider).filter(Provider.id == provider_id).first()
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proveedor no encontrado"
        )

    db.delete(provider)
    db.commit()
    return None
