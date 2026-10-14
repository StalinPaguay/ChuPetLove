"""
routers/orders.py - Checkout, Validación de Pagos, Facturación PDF y Consulta de Órdenes.

Endpoints:
  - POST  /api/orders/checkout            → Checkout (cálculo IVA, descuento de stock)
  - POST  /api/orders/upload-proof        → Subir captura/comprobante de pago
  - PATCH /api/orders/{id}/status         → [Admin/Vendedor] Validar pago → "pagado"
  - GET   /api/orders/{id}/invoice        → Descargar factura PDF (solo si estado = pagado)
  - GET   /api/orders                     → Listar órdenes (filtradas por rol)
  - GET   /api/orders/{id}               → Detalle de una orden

ChuPetLove Backend - Tienda de Mascotas (Ecuador)
"""

import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response, Query, UploadFile, File, status
from sqlalchemy.orm import Session, joinedload

try:
    from ..database import get_db
    from ..models import (
        Order,
        OrderItem,
        Product,
        SystemConfig,
        UserCard,
        User,
        UserRole,
        PaymentMethod,
        PaymentStatus
    )
    from ..schemas import (
        CheckoutRequest,
        OrderStatusUpdate,
        OrderResponse,
        OrderItemResponse
    )
    from ..security import get_current_user, require_roles
    from ..pdf_generator import generate_invoice_pdf
except (ImportError, ValueError):
    from database import get_db
    from models import (
        Order,
        OrderItem,
        Product,
        SystemConfig,
        UserCard,
        User,
        UserRole,
        PaymentMethod,
        PaymentStatus
    )
    from schemas import (
        CheckoutRequest,
        OrderStatusUpdate,
        OrderResponse,
        OrderItemResponse
    )
    from security import get_current_user, require_roles
    from pdf_generator import generate_invoice_pdf

router = APIRouter(prefix="/api/orders", tags=["Órdenes, Checkout y Facturación"])

# Directorio para almacenar comprobantes de pago subidos
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "payment_proofs")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def get_current_iva(db: Session) -> float:
    """Obtiene el porcentaje del IVA vigente en el sistema (por defecto 15% para Ecuador)."""
    config = db.query(SystemConfig).first()
    if not config:
        return 15.00
    return float(config.iva_percentage)


# ==========================================
# 1. SUBIDA DE COMPROBANTE DE PAGO (IMAGEN)
# ==========================================

@router.post(
    "/upload-proof",
    summary="Subir captura/comprobante de pago (imagen)",
    status_code=status.HTTP_201_CREATED
)
async def upload_payment_proof(
    file: UploadFile = File(..., description="Imagen de la captura de pantalla de la transacción"),
    current_user: User = Depends(get_current_user)
):
    """
    Permite al cliente subir la captura de pantalla del comprobante de pago.
    Retorna la ruta del archivo para usarla en el checkout.
    """
    # Validar que sea una imagen
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de archivo no permitido. Aceptados: {', '.join(allowed_types)}"
        )

    # Limitar tamaño a 5MB
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo excede el tamaño máximo permitido (5MB)"
        )

    # Guardar con nombre único y extensión segura
    allowed_extensions = {"jpg", "jpeg", "png", "webp"}
    raw_ext = (file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "jpg").lower()
    extension = raw_ext if raw_ext in allowed_extensions else "jpg"
    unique_name = f"{uuid.uuid4().hex}.{extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    with open(file_path, "wb") as f:
        f.write(contents)

    return {
        "filename": unique_name,
        "filepath": f"uploads/payment_proofs/{unique_name}",
        "message": "Comprobante de pago subido exitosamente"
    }


# ==========================================
# 2. ENDPOINT DE CHECKOUT (REALIZAR PEDIDO)
# ==========================================

@router.post(
    "/checkout",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Realizar pedido (Checkout con cálculo de IVA y descuento automático de stock)"
)
def checkout(
    checkout_data: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Procesa la compra del usuario:
    1. Verifica la existencia y el **stock suficiente** de cada producto.
    2. Calcula subtotal, aplica el **IVA dinámico vigente** en Ecuador y obtiene el total.
    3. **Resta automáticamente** las cantidades compradas del stock de cada producto.
    4. Procesa el pago:
       - **efectivo**: crea la orden en estado `pendiente_validacion`.
       - **tarjeta**: registra los datos de la tarjeta (Banco Pichincha) y/o comprobante,
         quedando en `pendiente_validacion`.
    """
    if not checkout_data.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La orden debe contener al menos un producto"
        )

    # Si el pago es con tarjeta, verificar que se provean datos de la tarjeta o comprobante
    if checkout_data.payment_method == PaymentMethod.TARJETA:
        if not checkout_data.card_info and not checkout_data.payment_proof_image:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Para pago con tarjeta debe enviar los datos de la tarjeta del Banco Pichincha o la imagen del comprobante de transacción"
            )

    try:
        subtotal_accumulated = 0.0
        order_items_to_create = []
        products_to_update = []

        # 1. Validar productos y verificar stock disponible
        for item_in in checkout_data.items:
            product = db.query(Product).filter(Product.id == item_in.product_id).first()
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"El producto con ID {item_in.product_id} no existe"
                )

            if product.stock < item_in.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Stock insuficiente para '{product.name}'. Solicitado: {item_in.quantity}, Disponible: {product.stock}"
                )

            unit_price = float(product.sale_price)
            line_total = unit_price * item_in.quantity
            subtotal_accumulated += line_total

            # Restar stock automáticamente
            product.stock -= item_in.quantity
            products_to_update.append(product)

            order_items_to_create.append({
                "product_id": product.id,
                "quantity": item_in.quantity,
                "unit_price": unit_price
            })

        # 2. Calcular IVA dinámico vigente
        iva_percentage = get_current_iva(db)
        iva_applied = subtotal_accumulated * (iva_percentage / 100.0)
        total = subtotal_accumulated + iva_applied

        # 3. Registrar tarjeta de Banco Pichincha si aplica
        if checkout_data.payment_method == PaymentMethod.TARJETA and checkout_data.card_info:
            card = UserCard(
                user_id=current_user.id,
                card_number=checkout_data.card_info.card_number,
                card_holder_name=checkout_data.card_info.card_holder_name.strip().upper(),
                user_ci=checkout_data.card_info.user_ci.strip()
            )
            db.add(card)

        # 4. Crear la Órden de Compra (siempre en pendiente_validacion)
        new_order = Order(
            user_id=current_user.id,
            payment_method=checkout_data.payment_method,
            payment_status=PaymentStatus.PENDIENTE_VALIDACION,
            subtotal=round(subtotal_accumulated, 2),
            iva_applied=round(iva_applied, 2),
            total=round(total, 2),
            payment_proof_image=checkout_data.payment_proof_image
        )

        db.add(new_order)
        db.flush()  # Obtener el ID generado para la orden

        # 5. Crear los ítems asociados a la orden
        for item_data in order_items_to_create:
            order_item = OrderItem(
                order_id=new_order.id,
                product_id=item_data["product_id"],
                quantity=item_data["quantity"],
                unit_price=item_data["unit_price"]
            )
            db.add(order_item)

        db.commit()
        db.refresh(new_order)

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al procesar la orden. No se realizó ningún cargo."
        )

    # Recargar relaciones para respuesta formateada
    order_res = db.query(Order).options(
        joinedload(Order.user),
        joinedload(Order.items).joinedload(OrderItem.product)
    ).filter(Order.id == new_order.id).first()

    return _build_order_response(order_res)


# ==========================================
# 3. VALIDACIÓN DE PAGOS (ADMIN Y VENDEDOR)
# ==========================================

@router.patch(
    "/{order_id}/status",
    response_model=OrderResponse,
    summary="[Admin/Vendedor] Validar pago de la orden (pendiente_validacion → pagado)"
)
def update_order_status(
    order_id: int,
    status_in: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.VENDEDOR]))
):
    """
    Endpoint de Validación exclusivo para Administradores y Vendedores.
    Permite cambiar el estado de pago de `pendiente_validacion` a `pagado`.
    Una vez marcada como `pagado`, la factura PDF queda habilitada para descarga.
    """
    order = db.query(Order).options(
        joinedload(Order.user),
        joinedload(Order.items).joinedload(OrderItem.product)
    ).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Órden no encontrada"
        )

    # Validar transición de estado válida
    if order.payment_status == PaymentStatus.PAGADO and status_in.payment_status == PaymentStatus.PAGADO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta orden ya fue validada como 'pagado'"
        )

    order.payment_status = status_in.payment_status
    db.commit()
    db.refresh(order)

    return _build_order_response(order)


# ==========================================
# 4. GENERACIÓN DE FACTURA EN PDF
# ==========================================

@router.get(
    "/{order_id}/invoice",
    summary="Descargar factura/recibo digital en PDF (disponible solo cuando estado = pagado)"
)
@router.get(
    "/{order_id}/invoice-pdf",
    summary="Descargar factura/recibo digital en PDF (Alias)"
)
def download_invoice_pdf(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Genera y descarga la Factura en PDF para una orden.
    - Solo disponible cuando el estado de pago es `pagado`.
    - Clientes pueden descargar sus propias facturas.
    - Administradores y Vendedores pueden descargar cualquier factura.
    El PDF incluye desglose de productos, subtotal, IVA aplicado y total.
    """
    order = db.query(Order).options(
        joinedload(Order.user),
        joinedload(Order.items).joinedload(OrderItem.product)
    ).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Órden no encontrada"
        )

    # Validar permisos: clientes solo ven sus propias órdenes
    if current_user.role == UserRole.CLIENTE and order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permiso para descargar la factura de esta orden"
        )

    # Verificar que el pago esté validado ("pagado")
    if order.payment_status != PaymentStatus.PAGADO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La factura está bloqueada. El pago aún se encuentra en estado 'pendiente_validacion'. "
                   "Un Administrador o Vendedor debe validar el pago primero."
        )

    iva_percentage = get_current_iva(db)
    pdf_bytes = generate_invoice_pdf(order, iva_percentage)

    filename = f"Factura_ChuPetLove_COMP-{order.id:06d}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


# ==========================================
# 5. CONSULTA Y LISTADO DE ÓRDENES
# ==========================================

@router.get(
    "",
    response_model=List[OrderResponse],
    summary="Listar órdenes (Clientes ven sus compras; Admin/Vendedor ven todas)"
)
def list_orders(
    payment_status: Optional[PaymentStatus] = Query(None, description="Filtrar por estado del pago"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista las órdenes según el rol del usuario autenticado."""
    query = db.query(Order).options(
        joinedload(Order.user),
        joinedload(Order.items).joinedload(OrderItem.product)
    )

    # Si es cliente, solo ve sus propias órdenes
    if current_user.role == UserRole.CLIENTE:
        query = query.filter(Order.user_id == current_user.id)

    if payment_status:
        query = query.filter(Order.payment_status == payment_status)

    orders = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()

    return [_build_order_response(o) for o in orders]


@router.get(
    "/{order_id}",
    response_model=OrderResponse,
    summary="Obtener detalle de una orden por ID"
)
def get_order_by_id(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtiene el detalle completo de una orden."""
    order = db.query(Order).options(
        joinedload(Order.user),
        joinedload(Order.items).joinedload(OrderItem.product)
    ).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Órden no encontrada"
        )

    if current_user.role == UserRole.CLIENTE and order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permiso para acceder a esta orden"
        )

    return _build_order_response(order)


# ==========================================
# FUNCIÓN AUXILIAR DE FORMATEO
# ==========================================

def _build_order_response(order: Order) -> OrderResponse:
    """Transforma el objeto ORM de orden a la estructura del esquema OrderResponse."""
    item_responses = []
    for item in order.items:
        prod_name = item.product.name if item.product else f"Producto #{item.product_id}"
        item_responses.append(
            OrderItemResponse(
                id=item.id,
                product_id=item.product_id,
                product_name=prod_name,
                quantity=item.quantity,
                unit_price=float(item.unit_price),
                line_total=round(item.quantity * float(item.unit_price), 2)
            )
        )

    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        username=order.user.username if order.user else "Cliente",
        payment_method=order.payment_method,
        payment_status=order.payment_status,
        subtotal=float(order.subtotal),
        iva_applied=float(order.iva_applied),
        total=float(order.total),
        payment_proof_image=order.payment_proof_image,
        created_at=order.created_at,
        items=item_responses
    )
