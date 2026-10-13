"""
main.py - Punto de entrada de la aplicación FastAPI ChuPetLove.

Configura:
  - Lifespan (inicialización de BD y datos semilla al arrancar)
  - CORS middleware para integración con el frontend
  - Registro de todos los routers de la API
  - Servicio de archivos estáticos (comprobantes de pago)

ChuPetLove Backend - Tienda de Mascotas (Ecuador)
"""

import os
import logging
from contextlib import asynccontextmanager
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest
from starlette.responses import Response as StarletteResponse
from fastapi import FastAPI, Request, status, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import engine, Base
from .init_db import init_db
from .auth import router as auth_router
from .routers.providers import router as providers_router
from .routers.products import router as products_router
from .routers.config import router as config_router
from .routers.orders import router as orders_router
from .routers.cards import router as cards_router

logger = logging.getLogger("chupetlove")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicialización de tablas y datos semilla al arrancar el servidor."""
    init_db()
    yield


app = FastAPI(
    title="ChuPetLove API",
    description=(
        "Backend completo para la tienda de mascotas **ChuPetLove** (Ecuador).\n\n"
        "Incluye: Autenticación JWT + Bcrypt, RBAC por roles, CRUD de Proveedores y Productos,\n"
        "Control de Inventario con alertas de stock bajo, Checkout con IVA dinámico,\n"
        "Pagos (Efectivo y Tarjeta Banco Pichincha), y Facturación PDF."
    ),
    version="1.0.0",
    lifespan=lifespan
)

# ==========================================
# GESTIÓN GLOBAL DE EXCEPCIONES (ISO/IEC 25010)
# ==========================================

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Formatea los errores de validación de esquemas Pydantic en mensajes claros y legibles en español.
    """
    errors = exc.errors()
    messages = []
    for err in errors:
        loc = " -> ".join(str(l) for l in err.get("loc", []) if l != "body")
        msg = err.get("msg", "Dato inválido")
        # Limpiar prefijos de Pydantic
        if msg.startswith("Value error, "):
            msg = msg.replace("Value error, ", "")
        field_name = loc if loc else "campo"
        messages.append(f"{field_name}: {msg}" if loc else msg)
    
    clean_detail = ". ".join(messages)
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "detail": clean_detail,
            "status_code": status.HTTP_400_BAD_REQUEST,
            "error_type": "ValidationError"
        }
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Garantiza estructura consistente para todas las excepciones HTTP."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "status_code": exc.status_code
        },
        headers=exc.headers
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """
    Captura fallos no controlados del servidor, evitando pantallas en blanco y fuga de trazas.
    """
    logger.error(f"❌ Error no controlado en {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Ha ocurrido un error interno en el servidor. Por favor, intente nuevamente más tarde.",
            "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "error_type": "InternalServerError"
        }
    )

# ==========================================
# MIDDLEWARE DE SEGURIDAD (ISO/IEC 25010 Security)
# ==========================================

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Inyecta cabeceras de seguridad HTTP en todas las respuestas."""
    async def dispatch(self, request: StarletteRequest, call_next) -> StarletteResponse:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Configuración de CORS para integración Frontend/Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# Directorio de archivos subidos (comprobantes de pago)
UPLOADS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Registro de Routers
app.include_router(auth_router)
app.include_router(providers_router)
app.include_router(products_router)
app.include_router(config_router)
app.include_router(orders_router)
app.include_router(cards_router)


@app.get("/", tags=["Health Check"])
def root():
    """Endpoint raíz para verificar el estado de la API."""
    return {
        "status": "online",
        "app": "ChuPetLove Backend API",
        "version": "1.0.0",
        "docs": "/docs"
    }
