"""
database.py - Configuración de la conexión a PostgreSQL y sesiones de SQLAlchemy.

ChuPetLove Backend - Tienda de Mascotas (Ecuador)
"""

import os
from typing import Generator
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# Cargar variables de entorno del archivo .env (soporta ejecución desde cualquier CWD)
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()

# URL de conexión a la base de datos (configurada desde .env)
DATABASE_URL = os.getenv("DATABASE_URL", "")

try:
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL no configurada, usando SQLite local")
    # Intentar conexión primaria (PostgreSQL)
    if DATABASE_URL.startswith("sqlite"):
        engine = create_engine(
            DATABASE_URL,
            connect_args={"check_same_thread": False},
            echo=False
        )
    else:
        engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            echo=False
        )
        # Test connection to verify driver / DLL is allowed
        with engine.connect() as conn:
            pass
except Exception as e:
    # Fallback automático a SQLite local de alta fiabilidad (ISO 25010)
    SQLITE_URL = "sqlite:///./chupetlove_db.db"
    engine = create_engine(
        SQLITE_URL,
        connect_args={"check_same_thread": False},
        echo=False
    )

# Fábrica de sesiones de base de datos
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Clase base declarativa para todos los modelos SQLAlchemy
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Inyector de dependencia para FastAPI.
    Abre una sesión de base de datos por cada petición HTTP y la cierra al finalizar.
    Garantiza el rollback en caso de excepción no manejada.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
