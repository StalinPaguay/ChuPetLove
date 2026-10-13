"""
schemas.py - Esquemas Pydantic v2 para validación de entrada/salida de la API.

ChuPetLove Backend - Tienda de Mascotas (Ecuador)
"""

from datetime import datetime
from typing import Optional, List, Any
import re
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from .models import UserRole, ProductCategory, PetType, PaymentMethod, PaymentStatus


# ==========================================
# ESQUEMAS DE AUTENTICACIÓN Y REGISTRO
# ==========================================

class UserRegister(BaseModel):
    """Esquema para registro público de clientes (solo username y password requeridos)."""
    username: str = Field(..., min_length=3, max_length=50, description="Nombre de usuario único")
    password: str = Field(..., min_length=6, description="Contraseña de al menos 6 caracteres")
    email: Optional[EmailStr] = Field(None, description="Correo electrónico opcional")

    @field_validator('username')
    @classmethod
    def validate_username(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("El nombre de usuario no puede estar vacío ni contener solo espacios.")
        if len(clean) < 3:
            raise ValueError("El nombre de usuario debe contener al menos 3 caracteres.")
        return clean

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("La contraseña no puede estar vacía ni contener solo espacios.")
        if len(clean) < 6:
            raise ValueError("La contraseña debe tener una longitud mínima de 6 caracteres.")
        return v


class UserAdminCreate(BaseModel):
    """Esquema para que el Admin cree usuarios con cualquier rol (email opcional/automático)."""
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    email: Optional[EmailStr] = Field(None, description="Email opcional (se genera automáticamente si no se envía)")
    role: UserRole = Field(default=UserRole.VENDEDOR, description="Rol del usuario (admin, vendedor, cliente)")

    @field_validator('username')
    @classmethod
    def validate_admin_create_username(cls, v: str) -> str:
        clean = v.strip()
        if not clean or len(clean) < 3:
            raise ValueError("El nombre de usuario debe tener al menos 3 caracteres.")
        return clean

    @field_validator('password')
    @classmethod
    def validate_admin_create_password(cls, v: str) -> str:
        clean = v.strip()
        if not clean or len(clean) < 6:
            raise ValueError("La contraseña debe tener al menos 6 caracteres.")
        return v


class UserAdminUpdate(BaseModel):
    """Esquema para que el Administrador edite cualquier usuario existente."""
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    password: Optional[str] = Field(None, min_length=6, description="Nueva contraseña (opcional)")
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

    @field_validator('username')
    @classmethod
    def validate_admin_update_username(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            clean = v.strip()
            if not clean or len(clean) < 3:
                raise ValueError("El nombre de usuario debe tener al menos 3 caracteres.")
            return clean
        return v

    @field_validator('password')
    @classmethod
    def validate_admin_update_password(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            clean = v.strip()
            if clean and len(clean) < 6:
                raise ValueError("La nueva contraseña debe tener al menos 6 caracteres.")
            return clean
        return v


class UserLogin(BaseModel):
    """Esquema para inicio de sesión."""
    username: Optional[str] = Field(None, description="Nombre de usuario o correo")
    username_or_email: Optional[str] = Field(None, description="Nombre de usuario o correo")
    password: str = Field(..., description="Contraseña")

    @model_validator(mode='after')
    def check_credentials(self) -> 'UserLogin':
        ident = (self.username_or_email or self.username or "").strip()
        pwd = (self.password or "").strip()
        if not ident:
            raise ValueError("Todos los campos son obligatorios. Por favor ingrese su usuario o correo.")
        if not pwd:
            raise ValueError("Todos los campos son obligatorios. Por favor ingrese su contraseña.")
        return self


class UserUpdateStatus(BaseModel):
    """Esquema para activar/desactivar un usuario por parte del Admin."""
    is_active: bool = Field(..., description="Estado activo (True) o inactivo (False)")


class UserResponse(BaseModel):
    """Esquema de respuesta de usuario (sin información sensible)."""
    id: int
    username: str
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    """Esquema de respuesta al autenticarse exitosamente (JWT)."""
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    user_id: int
    username: str


class TokenData(BaseModel):
    """Payload contenido dentro del Token JWT."""
    sub: str
    user_id: int
    role: UserRole


# ==========================================
# ESQUEMAS DE CATÁLOGO DE PRODUCTOS DEL PROVEEDOR
# (Productos predeterminados que ofrece cada proveedor)
# ==========================================

class ProviderProductItemCreate(BaseModel):
    """Esquema para definir un producto que ofrece el proveedor."""
    name: str = Field(..., min_length=2, max_length=150, description="Nombre comercial del producto")
    pet_type: PetType = Field(..., description="Tipo de mascota objetivo")
    category: ProductCategory = Field(..., description="Categoría del producto")
    cost_price: float = Field(..., gt=0, description="Precio de costo fijo del proveedor")
    description: Optional[str] = Field(None, description="Descripción del producto")


class ProviderProductItemUpdate(BaseModel):
    """Esquema para actualizar un producto del catálogo del proveedor."""
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    pet_type: Optional[PetType] = None
    category: Optional[ProductCategory] = None
    cost_price: Optional[float] = Field(None, gt=0)
    description: Optional[str] = None


class ProviderProductItemResponse(BaseModel):
    """Esquema de respuesta de un producto del catálogo del proveedor."""
    id: int
    provider_id: int
    name: str
    pet_type: PetType
    category: ProductCategory
    cost_price: float
    description: Optional[str] = None

    class Config:
        from_attributes = True


# ==========================================
# ESQUEMAS DE PROVEEDORES (PROVIDERS)
# ==========================================

class ProviderProductSummary(BaseModel):
    """Resumen de producto abastecido por un proveedor."""
    id: int
    name: str
    category: ProductCategory
    pet_type: PetType
    cost_price: float
    sale_price: float
    stock: int

    class Config:
        from_attributes = True


class ProviderCreate(BaseModel):
    """Esquema para crear un proveedor con su catálogo de productos ofrecidos."""
    name: str = Field(..., min_length=2, max_length=100, description="Nombre o Razón Social del proveedor")
    contact_name: Optional[str] = Field(None, max_length=100, description="Nombre de la persona de contacto")
    phone: Optional[str] = Field(None, max_length=20, description="Teléfono de contacto")
    email: Optional[EmailStr] = Field(None, description="Correo electrónico del proveedor")
    address: Optional[str] = Field(None, description="Dirección física")
    default_cost: Optional[float] = Field(default=10.00, gt=0, description="Precio de costo base de abastecimiento")
    offered_products: Optional[List[ProviderProductItemCreate]] = Field(
        default=None,
        description="Lista de productos que ofrece este proveedor con sus precios de costo fijo"
    )


class ProviderUpdate(BaseModel):
    """Esquema para actualizar un proveedor y su catálogo de productos."""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    contact_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    default_cost: Optional[float] = Field(None, gt=0)
    offered_products: Optional[List[ProviderProductItemCreate]] = Field(
        default=None,
        description="Reemplaza la lista de productos ofrecidos (si se envía)"
    )


class ProviderResponse(BaseModel):
    """Esquema de respuesta de un proveedor con sus productos asociados y catálogo ofrecido."""
    id: int
    name: str
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    default_cost: Optional[float] = 10.00
    products: Optional[List[ProviderProductSummary]] = []
    offered_products: Optional[List[ProviderProductItemResponse]] = []

    class Config:
        from_attributes = True


# ==========================================
# ESQUEMAS DE PRODUCTOS (PRODUCTS)
# ==========================================

class ProductCreate(BaseModel):
    """Esquema para crear un producto en el inventario desde el catálogo de un proveedor."""
    provider_id: int = Field(..., description="ID del proveedor asociado (obligatorio)")
    provider_product_id: int = Field(..., description="ID del producto del catálogo del proveedor")
    sale_price: float = Field(..., gt=0, description="Precio de venta al público (PVP)")
    stock: int = Field(..., ge=0, description="Cantidad disponible en stock inicial")


class ProductCreateLegacy(BaseModel):
    """Esquema legacy para crear un producto con datos manuales (compatibilidad)."""
    name: str = Field(..., min_length=2, max_length=150, description="Nombre del producto")
    category: ProductCategory = Field(..., description="Categoría: Alimentos, Accesorios, Juguetes")
    pet_type: PetType = Field(..., description="Mascota objetivo: Perros, Gatos, Hamsters, Conejos")
    cost_price: float = Field(..., gt=0, description="Precio de costo (determinado por proveedor)")
    sale_price: float = Field(..., gt=0, description="Precio de venta al público (PVP)")
    stock: int = Field(..., ge=0, description="Cantidad disponible en stock")
    provider_id: Optional[int] = Field(None, description="ID del proveedor asociado")

    @field_validator('sale_price')
    def validate_sale_price(cls, v, values):
        if 'cost_price' in values.data and v <= values.data['cost_price']:
            raise ValueError('El precio de venta debe ser estrictamente mayor al precio de costo del proveedor para asegurar margen de ganancia.')
        return v


class ProductUpdate(BaseModel):
    """Esquema para actualizar un producto."""
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    category: Optional[ProductCategory] = None
    pet_type: Optional[PetType] = None
    cost_price: Optional[float] = Field(None, gt=0)
    sale_price: Optional[float] = Field(None, gt=0)
    stock: Optional[int] = Field(None, ge=0)
    provider_id: Optional[int] = None

    @field_validator('sale_price')
    def validate_sale_price(cls, v, values):
        if 'cost_price' in values.data and values.data['cost_price'] is not None and v <= values.data['cost_price']:
            raise ValueError('El precio de venta debe ser estrictamente mayor al precio de costo para asegurar margen de ganancia.')
        return v


class ProductRestock(BaseModel):
    """Esquema para reabastecer stock de un producto desde un proveedor."""
    quantity: int = Field(..., gt=0, description="Cantidad a reabastecer (debe ser mayor a 0)")


class ProductResponse(BaseModel):
    """Esquema de respuesta completo de producto."""
    id: int
    name: str
    category: ProductCategory
    pet_type: PetType
    cost_price: float
    sale_price: float
    stock: int
    provider_id: Optional[int] = None
    provider: Optional[ProviderResponse] = None

    class Config:
        from_attributes = True


class LowStockAlertResponse(BaseModel):
    """Esquema para alertas de stock bajo (stock <= 3)."""
    id: int
    name: str
    category: ProductCategory
    pet_type: PetType
    stock: int
    sale_price: float
    provider_name: Optional[str] = None
    alert_message: str

    class Config:
        from_attributes = True


# ==========================================
# ESQUEMAS DE REGISTRO CONTABLE (INVENTORY PURCHASES)
# ==========================================

class InventoryPurchaseResponse(BaseModel):
    """Esquema de respuesta para registros contables de compras de inventario."""
    id: int
    provider_id: Optional[int] = None
    product_id: Optional[int] = None
    product_name: str
    quantity: int
    unit_cost: float
    total_cost: float
    purchase_date: datetime

    class Config:
        from_attributes = True


# ==========================================
# ESQUEMAS DE CONFIGURACIÓN DEL SISTEMA (IVA)
# ==========================================

class SystemConfigUpdate(BaseModel):
    """Esquema para actualizar el porcentaje del IVA (Ecuador)."""
    iva_percentage: float = Field(..., ge=0, le=100, description="Porcentaje de IVA (ej: 15.00)")


class SystemConfigResponse(BaseModel):
    """Esquema de respuesta con la configuración vigente del sistema."""
    id: int
    iva_percentage: float

    class Config:
        from_attributes = True


# ==========================================
# ESQUEMAS DE TARJETAS DE USUARIO (BANCO PICHINCHA)
# ==========================================

class UserCardCreate(BaseModel):
    """Esquema para registrar o usar tarjeta de Banco Pichincha."""
    card_number: str = Field(
        ...,
        min_length=10,
        max_length=25,
        description="Número de tarjeta o cuenta Banco Pichincha"
    )
    card_holder_name: str = Field(
        ...,
        min_length=3,
        max_length=100,
        description="Nombre del titular de la cuenta/tarjeta"
    )
    user_ci: str = Field(
        ...,
        min_length=10,
        max_length=13,
        description="Cédula de ciudadanía o RUC del titular (Ecuador)"
    )

    @model_validator(mode='before')
    @classmethod
    def normalize_card_inputs(cls, data: Any) -> Any:
        if isinstance(data, dict):
            num = data.get('card_number') or data.get('cardNumber') or ''
            holder = data.get('card_holder_name') or data.get('cardholder_name') or data.get('cardHolderName') or ''
            ci = data.get('user_ci') or data.get('client_ci') or data.get('userCi') or ''
            return {
                **data,
                'card_number': re.sub(r'[\s\-]', '', str(num).strip()),
                'card_holder_name': str(holder).strip().upper(),
                'user_ci': str(ci).strip()
            }
        return data


class UserCardResponse(BaseModel):
    """
    Esquema de respuesta para tarjetas guardadas.
    Por estricta privacidad y confidencialidad (ISO/IEC 25010 y PCI-DSS),
    los números de tarjeta y datos de identificación se transmiten SIEMPRE
    enmascarados, protegiendo los datos bancarios y personales del cliente.
    """
    id: int
    user_id: int
    card_number: str
    masked_number: Optional[str] = None
    card_holder_name: str
    user_ci: str

    @model_validator(mode='after')
    def enforce_privacy_masking(self) -> 'UserCardResponse':
        """Enmascara el número de tarjeta y la cédula/RUC por normativa de privacidad."""
        # Enmascarar número de tarjeta
        raw = re.sub(r'\D', '', self.card_number or '')
        last4 = raw[-4:] if len(raw) >= 4 else '0000'
        masked = f"•••• •••• •••• {last4}"
        self.masked_number = masked
        self.card_number = masked

        # Enmascarar cédula/RUC (mostrar solo últimos 3 dígitos)
        raw_ci = re.sub(r'\D', '', self.user_ci or '')
        if len(raw_ci) >= 3:
            self.user_ci = f"{'•' * (len(raw_ci) - 3)}{raw_ci[-3:]}"

        return self

    class Config:
        from_attributes = True


# ==========================================
# ESQUEMAS DE ÓRDENES Y CHECKOUT
# ==========================================

class OrderItemCreate(BaseModel):
    """Esquema de ítem individual enviado durante el checkout."""
    product_id: int = Field(..., description="ID del producto a comprar")
    quantity: int = Field(..., gt=0, description="Cantidad a comprar (debe ser mayor a 0)")


class CheckoutRequest(BaseModel):
    """Esquema principal para realizar el Checkout de una compra."""
    items: List[OrderItemCreate] = Field(
        ...,
        min_length=1,
        description="Lista de productos a incluir en la orden"
    )
    payment_method: PaymentMethod = Field(
        ...,
        description="Método de pago: efectivo o tarjeta"
    )
    card_info: Optional[UserCardCreate] = Field(
        None,
        description="Requerido si payment_method es 'tarjeta' (datos de Banco Pichincha)"
    )
    payment_proof_image: Optional[str] = Field(
        None,
        description="Ruta o nombre del archivo de comprobante de pago subido"
    )


class OrderStatusUpdate(BaseModel):
    """Esquema para actualizar el estado de la orden por parte del Admin/Vendedor."""
    payment_status: PaymentStatus = Field(
        ...,
        description="Nuevo estado: pendiente_validacion o pagado"
    )


class OrderItemResponse(BaseModel):
    """Esquema de respuesta para ítems dentro de una orden."""
    id: int
    product_id: int
    product_name: Optional[str] = None
    quantity: int
    unit_price: float
    line_total: Optional[float] = None

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    """Esquema de respuesta completo de una Órden de compra."""
    id: int
    user_id: int
    username: Optional[str] = None
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    subtotal: float
    iva_applied: float
    total: float
    payment_proof_image: Optional[str] = None
    created_at: datetime
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True
