"""
models.py - Modelos relacionales de SQLAlchemy para PostgreSQL.

Tablas:
  - users: Usuarios con roles (admin, vendedor, cliente).
  - providers: Proveedores de productos.
  - products: Catálogo de productos (Alimentos, Accesorios, Juguetes) x (Perros, Gatos, Hamsters, Conejos).
  - system_config: Configuración global del sistema (IVA dinámico Ecuador).
  - orders: Órdenes de compra con métodos de pago y estados.
  - order_items: Ítems detallados de cada orden.
  - user_cards: Tarjetas de Banco Pichincha registradas por los clientes.

ChuPetLove Backend - Tienda de Mascotas (Ecuador)
"""

import enum
from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Numeric,
    DateTime,
    Boolean,
    ForeignKey,
    Enum as SQLEnum,
    func
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from .database import Base


# ==========================================
# ENUMERACIONES (ENUMS) PARA EL SISTEMA
# ==========================================

class UserRole(str, enum.Enum):
    """Roles disponibles en el sistema ChuPetLove."""
    ADMIN = "admin"
    VENDEDOR = "vendedor"
    CLIENTE = "cliente"


class ProductCategory(str, enum.Enum):
    """Categorías de productos de la tienda."""
    ALIMENTOS = "Alimentos"
    ACCESORIOS = "Accesorios"
    JUGUETES = "Juguetes"


class PetType(str, enum.Enum):
    """Tipos de mascota objetivo para cada producto."""
    PERROS = "Perros"
    GATOS = "Gatos"
    HAMSTERS = "Hamsters"
    CONEJOS = "Conejos"


class PaymentMethod(str, enum.Enum):
    """Métodos de pago aceptados por la tienda."""
    EFECTIVO = "efectivo"
    TARJETA = "tarjeta"


class PaymentStatus(str, enum.Enum):
    """Estados posibles del pago de una orden."""
    PENDIENTE_VALIDACION = "pendiente_validacion"
    PAGADO = "pagado"


# ==========================================
# MODELOS DE BASE DE DATOS
# ==========================================

class User(Base):
    """Modelo para gestión de Usuarios (Admins, Vendedores, Clientes)."""
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole, name="user_role_enum"),
        default=UserRole.CLIENTE,
        nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relaciones
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="user", cascade="all, delete-orphan")
    cards: Mapped[List["UserCard"]] = relationship("UserCard", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, username='{self.username}', role='{self.role}')>"


class Provider(Base):
    """Modelo para Proveedores de productos."""
    __tablename__ = "providers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    contact_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    default_cost: Mapped[Optional[float]] = mapped_column(
        Numeric(10, 2),
        default=10.00,
        nullable=True,
        comment="Precio de costo base predeterminado del proveedor"
    )

    # Relaciones
    products: Mapped[List["Product"]] = relationship("Product", back_populates="provider")
    offered_products: Mapped[List["ProviderProductItem"]] = relationship(
        "ProviderProductItem",
        back_populates="provider",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Provider(id={self.id}, name='{self.name}')>"


class ProviderProductItem(Base):
    """Modelo de productos predeterminados que comercializa y ofrece un proveedor específico."""
    __tablename__ = "provider_products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    provider_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("providers.id", ondelete="CASCADE"),
        nullable=False
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    pet_type: Mapped[PetType] = mapped_column(
        SQLEnum(PetType, name="pet_type_enum"),
        nullable=False
    )
    category: Mapped[ProductCategory] = mapped_column(
        SQLEnum(ProductCategory, name="product_category_enum"),
        nullable=False
    )
    cost_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    image_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relaciones
    provider: Mapped["Provider"] = relationship("Provider", back_populates="offered_products")

    def __repr__(self) -> str:
        return f"<ProviderProductItem(id={self.id}, name='{self.name}', cost={self.cost_price})>"


class InventoryPurchase(Base):
    """Registro contable de adquisiciones / compras de inventario a proveedores."""
    __tablename__ = "inventory_purchases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    provider_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("providers.id", ondelete="SET NULL"),
        nullable=True
    )
    product_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True
    )
    product_name: Mapped[str] = mapped_column(String(150), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_cost: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    total_cost: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    purchase_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relaciones
    provider: Mapped[Optional["Provider"]] = relationship("Provider")
    product: Mapped[Optional["Product"]] = relationship("Product")

    def __repr__(self) -> str:
        return f"<InventoryPurchase(id={self.id}, product='{self.product_name}', qty={self.quantity}, total={self.total_cost})>"


class Product(Base):
    """Modelo para Productos del inventario."""
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    category: Mapped[ProductCategory] = mapped_column(
        SQLEnum(ProductCategory, name="product_category_enum"),
        nullable=False
    )
    pet_type: Mapped[PetType] = mapped_column(
        SQLEnum(PetType, name="pet_type_enum"),
        nullable=False
    )
    cost_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    sale_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Clave Foránea a Proveedor
    provider_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("providers.id", ondelete="SET NULL"),
        nullable=True
    )

    # Relaciones
    provider: Mapped[Optional["Provider"]] = relationship("Provider", back_populates="products")
    order_items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="product")

    def __repr__(self) -> str:
        return f"<Product(id={self.id}, name='{self.name}', stock={self.stock})>"


class SystemConfig(Base):
    """Modelo para Configuración del Sistema (ej: IVA dinámico para Ecuador)."""
    __tablename__ = "system_config"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    iva_percentage: Mapped[float] = mapped_column(
        Numeric(5, 2),
        default=15.00,
        nullable=False,
        comment="Porcentaje de IVA vigente en Ecuador (ej: 15.00)"
    )

    def __repr__(self) -> str:
        return f"<SystemConfig(id={self.id}, iva_percentage={self.iva_percentage}%)>"


class Order(Base):
    """Modelo para Órdenes / Pedidos de compra."""
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Clave Foránea a Usuario
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False
    )

    payment_method: Mapped[PaymentMethod] = mapped_column(
        SQLEnum(PaymentMethod, name="payment_method_enum"),
        nullable=False
    )
    payment_status: Mapped[PaymentStatus] = mapped_column(
        SQLEnum(PaymentStatus, name="payment_status_enum"),
        default=PaymentStatus.PENDIENTE_VALIDACION,
        nullable=False
    )
    subtotal: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    iva_applied: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    total: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    payment_proof_image: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        comment="Ruta de la captura/comprobante de pago subido por el cliente"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relaciones
    user: Mapped["User"] = relationship("User", back_populates="orders")
    items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Order(id={self.id}, user_id={self.user_id}, total={self.total}, status='{self.payment_status}')>"


class OrderItem(Base):
    """Modelo para los Ítems o Detalles de una Órden."""
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Claves Foráneas
    order_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False
    )
    product_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False
    )

    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    # Relaciones
    order: Mapped["Order"] = relationship("Order", back_populates="items")
    product: Mapped["Product"] = relationship("Product", back_populates="order_items")

    def __repr__(self) -> str:
        return f"<OrderItem(id={self.id}, order_id={self.order_id}, product_id={self.product_id}, quantity={self.quantity})>"


class UserCard(Base):
    """Modelo para Tarjetas / Cuentas guardadas por usuarios (Banco Pichincha)."""
    __tablename__ = "user_cards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Clave Foránea a Usuario
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    card_number: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        comment="Número de tarjeta/cuenta validada de Banco Pichincha"
    )
    card_holder_name: Mapped[str] = mapped_column(String(100), nullable=False)
    user_ci: Mapped[str] = mapped_column(
        String(13),
        nullable=False,
        comment="Cédula de ciudadanía o RUC del titular (Ecuador)"
    )

    # Relaciones
    user: Mapped["User"] = relationship("User", back_populates="cards")

    def __repr__(self) -> str:
        return f"<UserCard(id={self.id}, user_id={self.user_id}, card_holder='{self.card_holder_name}')>"
