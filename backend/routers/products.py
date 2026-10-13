"""
routers/products.py - CRUD de Productos, Alertas de Stock Bajo, Reabastecimiento y Registro Contable.

Endpoints:
  - GET    /api/products/alerts/low-stock     → [Admin/Vendedor] Alertas stock <= 3
  - GET    /api/products/purchases            → [Admin] Historial de compras a proveedores
  - GET    /api/products/purchases/summary    → [Admin] Resumen financiero de compras
  - GET    /api/products                      → Catálogo público con filtros
  - GET    /api/products/{id}                 → Detalle de producto
  - POST   /api/products                      → [Admin/Vendedor] Crear producto desde catálogo proveedor
  - PUT    /api/products/{id}                 → [Admin/Vendedor] Actualizar producto
  - PATCH  /api/products/{id}/restock         → [Admin/Vendedor] Reabastecer stock
  - DELETE /api/products/{id}                 → [Admin] Eliminar producto

ChuPetLove Backend - Tienda de Mascotas (Ecuador)
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from ..database import get_db
from ..models import (
    Product, Provider, ProviderProductItem, InventoryPurchase,
    ProductCategory, PetType, User, UserRole
)
from ..schemas import (
    ProductCreate,
    ProductCreateLegacy,
    ProductUpdate,
    ProductRestock,
    ProductResponse,
    LowStockAlertResponse,
    InventoryPurchaseResponse
)
from ..security import require_roles, get_current_user

router = APIRouter(prefix="/api/products", tags=["Gestión de Productos e Inventario"])


# ==========================================
# 1. ALERTAS DE STOCK BAJO (Stock <= 3)
# ==========================================

@router.get(
    "/alerts/low-stock",
    response_model=List[LowStockAlertResponse],
    summary="[Admin/Vendedor] Alertas de productos con stock bajo (<= 3 unidades)"
)
def get_low_stock_alerts(
    threshold: int = Query(default=3, ge=0, description="Umbral para alerta de stock bajo (por defecto <= 3)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.VENDEDOR]))
):
    """
    Consulta lógica que detecta y retorna los productos cuyo stock sea menor o igual
    al umbral especificado (por defecto **3 unidades**).
    Permite a Administradores y Vendedores anticipar reabastecimientos con los proveedores.
    """
    low_stock_products = db.query(Product).options(
        joinedload(Product.provider)
    ).filter(Product.stock <= threshold).order_by(Product.stock.asc()).all()

    alerts = []
    for product in low_stock_products:
        provider_name = product.provider.name if product.provider else "Sin Proveedor"

        if product.stock == 0:
            alert_msg = "🔴 AGOTADO: No quedan unidades disponibles en inventario."
        elif product.stock <= 1:
            alert_msg = f"🔴 CRÍTICO: Queda solo {product.stock} unidad(es) disponible(s)."
        else:
            alert_msg = f"🟡 ADVERTENCIA: Stock bajo con {product.stock} unidades restantes."

        alerts.append(
            LowStockAlertResponse(
                id=product.id,
                name=product.name,
                category=product.category,
                pet_type=product.pet_type,
                stock=product.stock,
                sale_price=float(product.sale_price),
                provider_name=provider_name,
                alert_message=alert_msg
            )
        )

    return alerts


# ==========================================
# 2. HISTORIAL Y RESUMEN DE COMPRAS A PROVEEDORES (CONTABILIDAD)
# ==========================================

@router.get(
    "/purchases",
    response_model=List[InventoryPurchaseResponse],
    summary="[Admin] Historial contable de todas las compras de inventario a proveedores"
)
def list_inventory_purchases(
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """Retorna el historial completo de compras de inventario a proveedores (registro contable exclusivo Admin)."""
    purchases = db.query(InventoryPurchase).order_by(
        InventoryPurchase.purchase_date.desc()
    ).offset(skip).limit(limit).all()
    return purchases


@router.get(
    "/purchases/summary",
    summary="[Admin] Resumen financiero total de compras a proveedores"
)
def get_purchases_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """
    Retorna el costo total acumulado de todas las compras a proveedores.
    Este valor alimenta el indicador 'Costo de Proveedores' del Dashboard Financiero.
    """
    result = db.query(
        func.coalesce(func.sum(InventoryPurchase.total_cost), 0).label("total_supplier_cost"),
        func.count(InventoryPurchase.id).label("total_purchases"),
        func.coalesce(func.sum(InventoryPurchase.quantity), 0).label("total_units_purchased")
    ).first()

    return {
        "total_supplier_cost": float(result.total_supplier_cost),
        "total_purchases": int(result.total_purchases),
        "total_units_purchased": int(result.total_units_purchased)
    }


# ==========================================
# 3. CATÁLOGO / LISTADO DE PRODUCTOS
# ==========================================

@router.get(
    "",
    response_model=List[ProductResponse],
    summary="Listar catálogo de productos con filtros"
)
def list_products(
    category: Optional[ProductCategory] = Query(None, description="Filtrar por categoría (Alimentos, Accesorios, Juguetes)"),
    pet_type: Optional[PetType] = Query(None, description="Filtrar por tipo de mascota (Perros, Gatos, Hamsters, Conejos)"),
    search: Optional[str] = Query(None, description="Búsqueda por nombre de producto"),
    provider_id: Optional[int] = Query(None, description="Filtrar por ID de proveedor"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Catálogo completo de productos (acceso público).
    Soporta filtrado por Categoría, Tipo de Mascota, Búsqueda de texto y Proveedor.
    """
    query = db.query(Product).options(joinedload(Product.provider))

    if category:
        query = query.filter(Product.category == category)
    if pet_type:
        query = query.filter(Product.pet_type == pet_type)
    if provider_id:
        query = query.filter(Product.provider_id == provider_id)
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))

    products = query.offset(skip).limit(limit).all()
    return products


@router.get(
    "/{product_id}",
    response_model=ProductResponse,
    summary="Obtener detalle de un producto por ID"
)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Obtiene el detalle completo de un producto por su ID."""
    product = db.query(Product).options(
        joinedload(Product.provider)
    ).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    return product


# ==========================================
# 4. GESTIÓN CRUD DE PRODUCTOS (ADMIN EXCLUSIVO)
# ==========================================

@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    summary="[Admin] Crear nuevo producto desde catálogo del proveedor"
)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """
    Crea un nuevo producto en el inventario seleccionando desde el catálogo del proveedor (Solo Admin).
    """
    # Verificar que el proveedor existe
    provider = db.query(Provider).filter(Provider.id == product_in.provider_id).first()
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El proveedor especificado no existe"
        )

    # Verificar que el producto ofrecido existe y pertenece al proveedor
    provider_product = db.query(ProviderProductItem).filter(
        ProviderProductItem.id == product_in.provider_product_id,
        ProviderProductItem.provider_id == product_in.provider_id
    ).first()
    if not provider_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El producto seleccionado no existe en el catálogo de este proveedor"
        )

    # Obtener datos del producto del catálogo del proveedor
    cost_price = float(provider_product.cost_price)

    # Validación estricta de negocio: PVP > Costo
    if product_in.sale_price <= cost_price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El precio de venta (${product_in.sale_price:.2f}) debe ser estrictamente mayor al precio de costo del proveedor (${cost_price:.2f}) para garantizar un margen de ganancia real."
        )

    # Crear el producto en inventario con datos del catálogo del proveedor
    new_product = Product(
        name=provider_product.name,
        category=provider_product.category,
        pet_type=provider_product.pet_type,
        cost_price=cost_price,
        sale_price=product_in.sale_price,
        stock=product_in.stock,
        provider_id=product_in.provider_id
    )
    db.add(new_product)
    db.flush()

    # Registrar la compra de inventario en el libro contable
    if product_in.stock > 0:
        purchase = InventoryPurchase(
            provider_id=product_in.provider_id,
            product_id=new_product.id,
            product_name=provider_product.name,
            quantity=product_in.stock,
            unit_cost=cost_price,
            total_cost=round(cost_price * product_in.stock, 2)
        )
        db.add(purchase)

    db.commit()
    db.refresh(new_product)

    # Cargar relación para la respuesta
    product_with_rel = db.query(Product).options(
        joinedload(Product.provider)
    ).filter(Product.id == new_product.id).first()

    return product_with_rel


@router.post(
    "/legacy",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    summary="[Admin] Crear producto (modo legacy/manual)"
)
def create_product_legacy(
    product_in: ProductCreateLegacy,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """
    Crea un nuevo producto con datos manuales (modo compatibilidad exclusivo Admin).
    """
    cost_price = product_in.cost_price

    # Si se asigna proveedor, verificar que exista y sincronizar costo predeterminado
    if product_in.provider_id:
        provider = db.query(Provider).filter(Provider.id == product_in.provider_id).first()
        if not provider:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="El proveedor especificado no existe"
            )
        if provider.default_cost and (not cost_price or cost_price == 0):
            cost_price = float(provider.default_cost)

    # Validación estricta de negocio: PVP > Costo
    if product_in.sale_price <= cost_price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El precio de venta (${product_in.sale_price:.2f}) debe ser estrictamente mayor al precio de costo del proveedor (${cost_price:.2f}) para garantizar un margen de ganancia real."
        )

    product_data = product_in.model_dump()
    product_data['cost_price'] = cost_price

    new_product = Product(**product_data)
    db.add(new_product)
    db.flush()

    # Registrar la compra de inventario en el libro contable
    if product_in.stock > 0:
        purchase = InventoryPurchase(
            provider_id=product_in.provider_id,
            product_id=new_product.id,
            product_name=product_in.name,
            quantity=product_in.stock,
            unit_cost=cost_price,
            total_cost=round(cost_price * product_in.stock, 2)
        )
        db.add(purchase)

    db.commit()
    db.refresh(new_product)

    # Cargar relación para la respuesta
    product_with_rel = db.query(Product).options(
        joinedload(Product.provider)
    ).filter(Product.id == new_product.id).first()

    return product_with_rel


@router.put(
    "/{product_id}",
    response_model=ProductResponse,
    summary="[Admin] Actualizar producto o PVP"
)
def update_product(
    product_id: int,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """Actualiza la información, precios o niveles de stock de un producto existente (Solo Admin)."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )

    effective_cost = product_in.cost_price if product_in.cost_price is not None else float(product.cost_price)
    effective_sale = product_in.sale_price if product_in.sale_price is not None else float(product.sale_price)

    if product_in.provider_id:
        provider = db.query(Provider).filter(Provider.id == product_in.provider_id).first()
        if not provider:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="El proveedor especificado no existe"
            )
        if product_in.cost_price is None and provider.default_cost:
            effective_cost = float(provider.default_cost)

    # Validación estricta de negocio: PVP > Costo
    if effective_sale <= effective_cost:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El precio de venta (${effective_sale:.2f}) debe ser estrictamente mayor al precio de costo del proveedor (${effective_cost:.2f}) para garantizar un margen de ganancia real."
        )

    update_data = product_in.model_dump(exclude_unset=True)
    if product_in.cost_price is None and product_in.provider_id:
        update_data['cost_price'] = effective_cost

    for field, value in update_data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)

    product_with_rel = db.query(Product).options(
        joinedload(Product.provider)
    ).filter(Product.id == product.id).first()

    return product_with_rel


# ==========================================
# 5. REABASTECIMIENTO DE STOCK (DESDE PROVEEDOR) + REGISTRO CONTABLE (SOLO ADMIN)
# ==========================================

@router.patch(
    "/{product_id}/restock",
    response_model=ProductResponse,
    summary="[Admin] Reabastecer stock de un producto (sumar unidades)"
)
def restock_product(
    product_id: int,
    restock_in: ProductRestock,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """
    Endpoint de reabastecimiento con el proveedor (Exclusivo Administrador).
    **Suma** la cantidad especificada al stock actual del producto.
    Registra la compra en el libro contable de InventoryPurchases.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )

    # Sumar las unidades recibidas del proveedor al stock actual
    product.stock += restock_in.quantity

    # Registrar la compra de reabastecimiento en el libro contable
    unit_cost = float(product.cost_price)
    purchase = InventoryPurchase(
        provider_id=product.provider_id,
        product_id=product.id,
        product_name=product.name,
        quantity=restock_in.quantity,
        unit_cost=unit_cost,
        total_cost=round(unit_cost * restock_in.quantity, 2)
    )
    db.add(purchase)

    db.commit()
    db.refresh(product)

    product_with_rel = db.query(Product).options(
        joinedload(Product.provider)
    ).filter(Product.id == product.id).first()

    return product_with_rel


# ==========================================
# 6. ELIMINAR PRODUCTO (SOLO ADMIN)
# ==========================================

@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="[Admin] Eliminar un producto del catálogo"
)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """Elimina un producto del catálogo (disponible únicamente para Administradores)."""
    from ..models import OrderItem
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )

    # Verificar integridad referencial: no eliminar si tiene órdenes asociadas
    has_orders = db.query(OrderItem).filter(OrderItem.product_id == product_id).first()
    if has_orders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar este producto porque tiene órdenes de compra asociadas. "
                   "Considere desactivarlo o reducir su stock a 0 en su lugar."
        )

    db.delete(product)
    db.commit()
    return None
