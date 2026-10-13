# 🐾 ChuPetLove — Tienda Especializada para Mascotas (Ecuador)
### Plataforma Full-Stack de Comercio Electrónico, Facturación y Control Contable

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20+%20Vite-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![ISO/IEC 25010](https://img.shields.io/badge/Calidad-ISO%2FIEC%2025010%20(A%2B)-success?style=for-the-badge)](https://iso25000.com/index.php/normas-iso-25000/iso-25010)
[![Licencia](https://img.shields.io/badge/License-MIT-orange?style=for-the-badge)](LICENSE)

---

## 📌 Descripción del Proyecto

**ChuPetLove** es una solución integral de comercio electrónico diseñada para el mercado ecuatoriano. Integra un catálogo de alimentos, accesorios y juguetes para perros, gatos, hámsteres y conejos, control estricto de inventario por proveedor, billetera protegida para tarjetas de Banco Pichincha, validación de pagos por cajero, facturación electrónica en formato PDF y un panel contable financiero en tiempo real.

El sistema ha sido diseñado y auditado bajo los **8 pilares de la norma internacional de calidad de software ISO/IEC 25010**, garantizando el 100% de cumplimiento funcional, seguridad criptográfica y alta disponibilidad.

---

## 🚀 Arquitectura y Tecnologías

### 🔹 Backend
* **Lenguaje & Framework:** Python 3.14 + FastAPI (Clean Layered Architecture).
* **ORM & Base de Datos:** SQLAlchemy 2.0 con soporte nativo para **PostgreSQL** y fallback automático de alta disponibilidad a **SQLite**.
* **Seguridad Criptográfica:** Hashing de contraseñas con **Bcrypt** nativo (salt dinámico de 12 rondas) y tokens de acceso **JWT** (algoritmo HMAC-SHA256).
* **Facturación Digital:** Generador formal de facturas en PDF mediante **ReportLab**.
* **Validación de Datos:** Pydantic v2 con validaciones estrictas y formato de errores en español.

### 🔹 Frontend
* **Framework & Bundler:** React 18 + Vite (compilación optimizada).
* **Diseño & UX:** Vanilla CSS modular con paleta corporativa cálida (`#FF7A00` y `#2E7D32`), micro-animaciones, badges semafóricos y responsive design.
* **Iconografía:** Lucide React.
* **Cliente HTTP:** Fetch API centralizado con interceptor de tokens JWT, manejo de errores y soporte offline de contingencia.

---

## 👥 Matriz de Roles y Reglas de Negocio (RBAC)

| Funcionalidad / Módulo | 👤 Rol Cliente | 🏷️ Rol Vendedor (Cajero) | 👑 Rol Administrador (Jefe) |
|---|:---:|:---:|:---:|
| **Catálogo y Búsqueda de Productos** | ✅ Consulta | ✅ Consulta | ✅ Consulta |
| **Carrito & Pre-checkout con IVA** | ✅ Sí | ❌ No | ❌ No |
| **Billetera Privada (Banco Pichincha)** | ✅ Acceso Exclusivo | 🚫 Bloqueado (403) | 🚫 Bloqueado (403) |
| **Historial y Notificaciones de Pago** | ✅ Propias compras | ❌ No aplica | ❌ No aplica |
| **Descarga de Factura PDF** | ✅ Solo si está "Pagado" | ✅ Solo si está "Pagado" | ✅ Solo si está "Pagado" |
| **Validación de Pagos (Efectivo/Transferencia)** | ❌ Denegado (403) | ✅ Bandeja de Validación | ✅ Bandeja de Validación |
| **Alerta Visual de Stock Bajo ($\le$ 3)** | ❌ No visible | ✅ Alerta prioritaria | ✅ Alerta prioritaria |
| **Vistas de Productos y Proveedores** | ❌ No visible | 👁️ Solo Lectura (Sin CRUD) | ✏️ CRUD Completo |
| **Dashboard Financiero Contable** | ❌ No visible | ❌ No visible | ✅ Ecuación de Ganancia Neta |
| **Gestión Dinámica de IVA Nacional** | ❌ No visible | ❌ No visible | ✅ Sí (15%, 12%, etc.) |
| **CRUD de Cuentas de Acceso** | ❌ No visible | ❌ No visible | ✅ Solo usuario y clave |

---

## 📊 Ecuación Contable del Dashboard Financiero

El portal gerencial del Administrador calcula la rentabilidad real del negocio en base a los registros de compras a distribuidores y órdenes liquidadas:

$$\mathbf{Ganancia\ Neta\ Contable} = \mathbf{Ingresos\ por\ Ventas} - \mathbf{Compras\ a\ Proveedores\ (Egresos)}$$

* **Margen Comercial:** Refleja el porcentaje de utilidad neta sobre las ventas totales.
* **Regla de Negocio en Catálogo:** El Precio de Venta al Público (PVP) debe ser **estrictamente mayor** al precio de costo fijado por el proveedor ($\text{PVP} > \text{Costo}$).

---

## 💳 Cuenta Oficial para Transferencias

Para pagos mediante transferencia bancaria, el sistema despliega automáticamente la información corporativa autorizada:

* **Entidad Bancaria:** Banco Pichincha
* **Titular de la Cuenta:** Javier Eduardo Paredes Cabrera
* **Número de Cuenta:** `2202592175`
* **Cédula de Identidad (CI):** `1761062716`

---

## 🏆 Certificación de Calidad de Software ISO/IEC 25010

El sistema fue sometido a una auditoría automatizada integral con **24 pruebas de caja blanca y caja negra**, alcanzando una **calificación del 100% (A+)**:

1. **Adecuación Funcional:** Autenticación case-insensitive, checkout atómico con descuento de inventario y facturación PDF condicionada al estado pagado.
2. **Seguridad y Privacidad:** Tokens JWT HS256, roles RBAC estrictos y aislamiento absoluto de los datos financieros de tarjetas de crédito/débito.
3. **Fiabilidad:** Manejo robusto de excepciones (sin errores 500 no controlados), rollback en sobregiro de inventario y protección de claves foráneas.
4. **Usabilidad:** Interfaz reactiva en tonos naranja cálido y verde tierno, validación visual de cédula con algoritmo Módulo 10 y feedback con Toasts.
5. **Eficiencia de Desempeño:** Latencia promedio en consultas de catálogo de **1.62 ms** (umbral de exigencia < 100 ms).
6. **Compatibilidad:** Interoperabilidad REST JSON completa y soporte nativo UTF-8 para caracteres especiales y emojis (🐾).
7. **Mantenibilidad:** Separación desacoplada en capas (Models, Schemas, Routers, Security, Database), código limpio y 0 advertencias de linting.
8. **Portabilidad:** Variables de entorno desacopladas (`.env`) y fallback automático PostgreSQL / SQLite.

---

## 🛠️ Instalación y Ejecución Local

### Prerrequisitos
* **Python 3.11+** (probado con Python 3.14).
* **Node.js 18+** y npm.
* **PostgreSQL 14+** (opcional, el sistema incluye fallback SQLite transparente).

### 1. Clonar el Repositorio
```bash
git clone https://github.com/StalinPaguay/ChuPetLove.git
cd ChuPetLove
```

### 2. Configurar y Levantar el Backend
```bash
# Navegar a la carpeta backend
cd backend

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno (copiar plantilla)
cp .env.example .env

# (Opcional) Inicializar base de datos PostgreSQL
python ensure_db.py

# Iniciar el servidor API FastAPI
uvicorn main:app --reload --port 8000
```
> La documentación interactiva Swagger UI estará disponible en: **`http://localhost:8000/docs`**

### 3. Ejecutar las Pruebas de Auditoría ISO/IEC 25010
```bash
# Desde la carpeta backend
python test_audit_iso25010.py
```

### 4. Configurar y Levantar el Frontend
```bash
# Abrir una nueva terminal y navegar a la carpeta frontend
cd frontend

# Instalar dependencias de Node
npm install

# Iniciar servidor de desarrollo con Vite
npm run dev
```
> La aplicación web estará lista en: **`http://localhost:5173`**

---

## 🔑 Credenciales Demo Preconfiguradas

| Rol | Usuario | Contraseña | Acceso y Permisos |
|---|---|---|---|
| 👑 **Administrador** | `admin` | `admin123` | Dashboard gerencial, IVA dinámico, Usuarios, Proveedores |
| 🏷️ **Vendedor** | `vendedor` | `vendedor123` | Validación de pagos en caja, alertas de stock, catálogo solo lectura |
| 👤 **Cliente** | `maria_ecuador` | `cliente123` | Compras, carrito, billetera de tarjetas privada, descarga de PDF |

---

## 📜 Licencia

Proyecto desarrollado y certificado bajo la Licencia **MIT**. Todos los derechos reservados © 2026 ChuPetLove S.A.
