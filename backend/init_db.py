"""
init_db.py - Script de inicialización de base de datos y datos semilla.

Crea las tablas de PostgreSQL y genera automáticamente:
  1. Usuario Administrador por defecto (admin / admin123)
  2. Usuario Vendedor por defecto (vendedor / vendedor123)
  3. Configuración inicial del IVA (15.00% Ecuador)
  4. Proveedores con catálogo de productos ofrecidos (semilla)
  5. Productos de inventario + registros contables de compra

ChuPetLove Backend - Tienda de Mascotas (Ecuador)
"""

import logging
from sqlalchemy.orm import Session
from .database import SessionLocal, engine, Base
from .models import (
    User, UserRole, SystemConfig, Provider, Product,
    ProductCategory, PetType, ProviderProductItem, InventoryPurchase
)
from .security import hash_password

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init_db():
    """
    Inicializa la base de datos creando las tablas y los registros semilla.
    Es idempotente: solo crea los datos si no existen previamente.
    """
    # Crear todas las tablas definidas en los modelos
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        # ------------------------------------------
        # 1. Usuario Administrador por defecto
        # ------------------------------------------
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            logger.info("✅ Creando usuario Administrador por defecto (admin / admin123)...")
            admin_user = User(
                username="admin",
                email="admin@chupetlove.ec",
                password_hash=hash_password("admin123"),
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(admin_user)

        # ------------------------------------------
        # 2. Usuario Vendedor por defecto
        # ------------------------------------------
        vendedor_user = db.query(User).filter(User.username == "vendedor").first()
        if not vendedor_user:
            logger.info("✅ Creando usuario Vendedor por defecto (vendedor / vendedor123)...")
            vendedor_user = User(
                username="vendedor",
                email="vendedor@chupetlove.ec",
                password_hash=hash_password("vendedor123"),
                role=UserRole.VENDEDOR,
                is_active=True
            )
            db.add(vendedor_user)

        # ------------------------------------------
        # 3. Usuario Cliente por defecto
        # ------------------------------------------
        cliente_user = db.query(User).filter(User.username == "cliente").first()
        if not cliente_user:
            logger.info("✅ Creando usuario Cliente por defecto (cliente / cliente123)...")
            cliente_user = User(
                username="cliente",
                email="cliente@chupetlove.ec",
                password_hash=hash_password("cliente123"),
                role=UserRole.CLIENTE,
                is_active=True
            )
            db.add(cliente_user)

        maria_user = db.query(User).filter(User.username == "maria_ecuador").first()
        if not maria_user:
            logger.info("✅ Creando usuario Cliente (maria_ecuador / cliente123)...")
            maria_user = User(
                username="maria_ecuador",
                email="maria@gmail.com",
                password_hash=hash_password("cliente123"),
                role=UserRole.CLIENTE,
                is_active=True
            )
            db.add(maria_user)

        # ------------------------------------------
        # 4. Configuración del IVA de Ecuador
        # ------------------------------------------
        config = db.query(SystemConfig).first()
        if not config:
            logger.info("✅ Creando configuración de IVA dinámico por defecto (15.00%)...")
            config = SystemConfig(id=1, iva_percentage=15.00)
            db.add(config)

        db.commit()

        # ------------------------------------------
        # 4. Proveedores semilla con catálogo de productos ofrecidos
        # ------------------------------------------
        if db.query(Provider).count() == 0:
            logger.info("✅ Insertando proveedores semilla con catálogos de productos...")
            prov1 = Provider(
                name="Importadora PetEcuador S.A.",
                contact_name="Juan Pérez",
                phone="0991234567",
                email="ventas@petecuador.ec",
                address="Quito Norte, Av. Amazonas N32-89",
                default_cost=10.00
            )
            prov2 = Provider(
                name="Distribuidora Mascotas del Valle",
                contact_name="María López",
                phone="0987654321",
                email="contacto@mascotasvalle.ec",
                address="Cumbayá, Av. Interoceánica Km 14",
                default_cost=10.00
            )
            db.add_all([prov1, prov2])
            db.commit()
            db.refresh(prov1)
            db.refresh(prov2)

            # ------------------------------------------
            # 4b. Catálogo de productos ofrecidos por cada proveedor
            # ------------------------------------------
            logger.info("✅ Insertando catálogo de productos ofrecidos por proveedores...")
            offered_products_prov1 = [
                # ── PERROS ──
                ProviderProductItem(provider_id=prov1.id, name="Croquetas ProPlan Adulto Raza Mediana (3kg)", category=ProductCategory.ALIMENTOS, pet_type=PetType.PERROS, cost_price=18.50, description="Alimento premium balanceado para perros adultos de raza mediana"),
                ProviderProductItem(provider_id=prov1.id, name="Cama Mullida Térmica Donut XL", category=ProductCategory.ACCESORIOS, pet_type=PetType.PERROS, cost_price=22.00, description="Cama térmica acogedora para perros grandes"),
                # ── GATOS ──
                ProviderProductItem(provider_id=prov1.id, name="Comida Húmeda Whiskas Filetes en Salsa (85g)", category=ProductCategory.ALIMENTOS, pet_type=PetType.GATOS, cost_price=0.90, description="Comida húmeda en salsa para gatos adultos"),
                # ── HAMSTERS ──
                ProviderProductItem(provider_id=prov1.id, name="Alimento Nutri-Crunch Semillas Hámster (500g)", category=ProductCategory.ALIMENTOS, pet_type=PetType.HAMSTERS, cost_price=3.50, description="Mezcla de semillas nutritivas para hámsters"),
                ProviderProductItem(provider_id=prov1.id, name="Casita de Madera con Techo Desmontable", category=ProductCategory.ACCESORIOS, pet_type=PetType.HAMSTERS, cost_price=7.00, description="Refugio de madera natural para hámsters"),
                # ── CONEJOS ──
                ProviderProductItem(provider_id=prov1.id, name="Heno de Alfalfa Orgánico Premium (1kg)", category=ProductCategory.ALIMENTOS, pet_type=PetType.CONEJOS, cost_price=4.80, description="Heno orgánico de alta calidad para conejos"),
            ]

            offered_products_prov2 = [
                # ── PERROS ──
                ProviderProductItem(provider_id=prov2.id, name="Juguete Cuerda Resistente Mordedora", category=ProductCategory.JUGUETES, pet_type=PetType.PERROS, cost_price=4.20, description="Juguete de cuerda durable para perros"),
                # ── GATOS ──
                ProviderProductItem(provider_id=prov2.id, name="Rascador Torre Multinivel con Hamaca", category=ProductCategory.ACCESORIOS, pet_type=PetType.GATOS, cost_price=32.00, description="Torre rascadora con múltiples niveles y hamaca"),
                ProviderProductItem(provider_id=prov2.id, name="Pluma Interactiva Láser con Movimiento", category=ProductCategory.JUGUETES, pet_type=PetType.GATOS, cost_price=6.00, description="Juguete interactivo con pluma y láser"),
                # ── HAMSTERS ──
                ProviderProductItem(provider_id=prov2.id, name="Rueda Silenciosa de Ejercicio Acrílica", category=ProductCategory.JUGUETES, pet_type=PetType.HAMSTERS, cost_price=5.50, description="Rueda silenciosa transparente para hámsters"),
                # ── CONEJOS ──
                ProviderProductItem(provider_id=prov2.id, name="Túnel de Juego Plegable 3 Vías", category=ProductCategory.JUGUETES, pet_type=PetType.CONEJOS, cost_price=8.00, description="Túnel de juego plegable con tres entradas"),
                ProviderProductItem(provider_id=prov2.id, name="Arnés Ajustable con Correa para Paseo", category=ProductCategory.ACCESORIOS, pet_type=PetType.CONEJOS, cost_price=5.50, description="Arnés suave ajustable con correa para conejos"),
            ]

            db.add_all(offered_products_prov1 + offered_products_prov2)
            db.commit()

            # Refrescar para obtener IDs
            for item in offered_products_prov1 + offered_products_prov2:
                db.refresh(item)

            # ------------------------------------------
            # 5. Productos del inventario (creados desde el catálogo del proveedor)
            #    + Registros contables de compra inicial
            # ------------------------------------------
            if db.query(Product).count() == 0:
                logger.info("✅ Insertando productos de inventario con registros contables...")

                # Datos de productos: (offered_product_ref, sale_price, stock)
                inventory_seed = [
                    # Proveedor 1
                    (offered_products_prov1[0], 24.99, 12),  # Croquetas ProPlan
                    (offered_products_prov1[1], 34.50, 3),   # Cama Mullida
                    (offered_products_prov1[2], 1.75, 24),   # Comida Whiskas
                    (offered_products_prov1[3], 6.20, 10),   # Alimento Hamster
                    (offered_products_prov1[4], 12.50, 6),   # Casita Madera
                    (offered_products_prov1[5], 8.50, 14),   # Heno Alfalfa
                    # Proveedor 2
                    (offered_products_prov2[0], 7.99, 15),   # Juguete Cuerda
                    (offered_products_prov2[1], 49.90, 2),   # Rascador Torre
                    (offered_products_prov2[2], 11.50, 8),   # Pluma Interactiva
                    (offered_products_prov2[3], 9.99, 2),    # Rueda Silenciosa
                    (offered_products_prov2[4], 14.99, 5),   # Túnel Juego
                    (offered_products_prov2[5], 10.99, 4),   # Arnés Correa
                ]

                for offered_item, sale_price, stock in inventory_seed:
                    # Crear producto en inventario
                    product = Product(
                        name=offered_item.name,
                        category=offered_item.category,
                        pet_type=offered_item.pet_type,
                        cost_price=float(offered_item.cost_price),
                        sale_price=sale_price,
                        stock=stock,
                        provider_id=offered_item.provider_id
                    )
                    db.add(product)
                    db.flush()

                    # Registrar compra contable inicial
                    purchase = InventoryPurchase(
                        provider_id=offered_item.provider_id,
                        product_id=product.id,
                        product_name=offered_item.name,
                        quantity=stock,
                        unit_cost=float(offered_item.cost_price),
                        total_cost=round(float(offered_item.cost_price) * stock, 2)
                    )
                    db.add(purchase)

                db.commit()

        logger.info("🎉 Inicialización de base de datos ChuPetLove completada exitosamente.")

    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error al inicializar la base de datos: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
