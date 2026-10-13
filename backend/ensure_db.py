"""
ensure_db.py - Script independiente para crear la base de datos PostgreSQL si no existe.

Ejecutar antes del primer arranque del servidor:
  python -m backend.ensure_db

ChuPetLove Backend - Tienda de Mascotas (Ecuador)
"""

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

DB_NAME = "chupetlove_db"
DB_USER = "postgres"
DB_PASSWORD = "1751050913"
DB_HOST = "localhost"
DB_PORT = 5432

try:
    conn = psycopg2.connect(
        dbname="postgres",
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    cur.execute(f"SELECT 1 FROM pg_database WHERE datname = '{DB_NAME}'")
    exists = cur.fetchone()
    if not exists:
        cur.execute(f"CREATE DATABASE {DB_NAME}")
        print(f"✅ Base de datos '{DB_NAME}' creada exitosamente en PostgreSQL.")
    else:
        print(f"ℹ️  Base de datos '{DB_NAME}' ya existe en PostgreSQL.")
    cur.close()
    conn.close()
except Exception as e:
    print(f"❌ Error de conexión con PostgreSQL: {e}")
