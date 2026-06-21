# 🔨 HAMMER — Plataforma de Subastas en Línea

> **TPO — Desarrollo de Aplicaciones 2**  
> App móvil de subastas en tiempo real construida con Expo (React Native) + Backend Node.js

---

## 📋 Descripción del Proyecto

HAMMER es una plataforma de subastas en línea que permite a los usuarios participar en subastas en vivo, pujar por artículos de arte, antigüedades y colecciones, y gestionar la venta de sus propios artículos. La aplicación soporta un sistema de categorías de usuario (Común, Especial, Plata, Oro, Platino) que determina el acceso a diferentes tipos de subastas.

### Funcionalidades Principales

- 🔐 **Autenticación y Registro** — Login, registro con verificación de documentos
- 🏛️ **Catálogo de Subastas** — Explorar subastas próximas, activas y finalizadas
- ⚡ **Subastas en Vivo** — Pujas en tiempo real con Socket.io
- 📦 **Envío de Artículos** — Proceso de consignación con aprobación de expertos
- 💳 **Medios de Pago** — Gestión de cuentas bancarias, tarjetas y cheques certificados
- 🔔 **Notificaciones** — Alertas de subastas ganadas/perdidas, aprobaciones, etc.
- 📊 **Métricas** — Estadísticas personales de pujas y compras
- 👤 **Perfil** — Gestión de datos personales y documentación

---

## 🏗️ Arquitectura del Proyecto

```
TPO_DA2/
├── APP_MOVIL_TPO/          # 📱 Frontend — Expo (React Native)
├── backend/                # ⚙️  Backend  — Node.js + Express + TypeScript (por crear)
├── docs/                   # 📄 Documentación del proyecto
│   └── BACKEND_PLAN.md     # Plan de implementación del backend
└── README.md               # Este archivo
```

---

## 📱 Frontend — App Móvil

### Stack Tecnológico

| Tecnología | Uso |
|-----------|-----|
| Expo / React Native | Framework móvil |
| TypeScript | Lenguaje |
| Expo Router | Navegación (file-based routing) |
| NativeWind (TailwindCSS) | Estilos |
| Lucide React Native | Iconografía |
| AsyncStorage | Persistencia local |

### Estructura del Frontend

```
APP_MOVIL_TPO/
├── app/
│   ├── (auth)/                 # Pantallas de autenticación
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── forgot-password.tsx
│   │   └── complete-registration.tsx
│   ├── (tabs)/                 # Pestañas principales
│   │   ├── index.tsx           # Home / Dashboard
│   │   ├── auctions.tsx        # Listado de subastas
│   │   ├── explore.tsx         # Explorar artículos
│   │   ├── sell.tsx            # Vender un artículo
│   │   ├── bids.tsx            # Mis pujas
│   │   └── profile.tsx         # Perfil del usuario
│   ├── auctions/
│   │   ├── [id].tsx            # Detalle de subasta
│   │   └── live/[id].tsx       # Subasta en vivo
│   ├── profile/
│   │   ├── edit.tsx            # Editar perfil
│   │   ├── metrics.tsx         # Métricas del usuario
│   │   ├── my-documents.tsx    # Documentos
│   │   ├── my-purchases.tsx    # Mis compras
│   │   ├── my-sales.tsx        # Mis ventas
│   │   └── payment-methods.tsx # Medios de pago
│   └── notifications.tsx       # Notificaciones
├── components/                 # Componentes reutilizables
├── context/                    # Providers (Auth, Notifications)
├── types/                      # Definiciones de TypeScript
├── data/                       # Datos mock (temporal)
└── hooks/                      # Custom hooks
```

### Iniciar el Frontend

```bash
cd APP_MOVIL_TPO
npm install
npx expo start
```

---

## ⚙️ Backend (En Desarrollo)

### Stack Tecnológico

| Tecnología | Uso |
|-----------|-----|
| Node.js + Express | Runtime + Framework HTTP |
| TypeScript | Lenguaje |
| PostgreSQL | Base de datos relacional |
| Prisma | ORM + Migraciones |
| JWT + bcrypt | Autenticación |
| Socket.io | Subastas en tiempo real |
| Zod | Validación de schemas |
| Jest + Supertest | Testing |

### Estructura del Backend

```
backend/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   ├── middlewares/
│   ├── modules/
│   │   ├── auth/           → Persona 1
│   │   ├── users/          → Persona 1
│   │   ├── auctions/       → Persona 2
│   │   ├── bids/           → Persona 2
│   │   ├── items/          → Persona 3
│   │   ├── payments/       → Persona 3
│   │   └── notifications/  → Persona 4
│   └── shared/
├── package.json
├── tsconfig.json
└── docker-compose.yml
```

> 📄 Ver **[docs/BACKEND_PLAN.md](docs/BACKEND_PLAN.md)** para el plan detallado de implementación y la división de tareas.

### Iniciar el Backend (una vez implementado)

```bash
cd backend
npm install
cp .env.example .env          # Configurar variables de entorno
docker-compose up -d          # Levantar PostgreSQL
npx prisma migrate dev        # Correr migraciones
npx prisma db seed            # Cargar datos de prueba
npm run dev                   # Iniciar servidor en modo desarrollo
```

---

## 👥 Equipo y División de Tareas

El backend se divide en **4 módulos independientes**, uno por persona:

| Persona | Módulos | Responsabilidad |
|---------|---------|----------------|
| **Persona 1** | `auth/` + `users/` | Autenticación, registro, perfil, documentos |
| **Persona 2** | `auctions/` + `bids/` | Subastas, pujas, real-time con Socket.io |
| **Persona 3** | `items/` + `payments/` | Artículos, consignación, medios de pago |
| **Persona 4** | `notifications/` + `infra` | Notificaciones, middlewares, CI/CD, deploy |

> 📄 Ver **[docs/BACKEND_PLAN.md](docs/BACKEND_PLAN.md)** para endpoints, modelos de BD y cronograma detallado.

---

## 🌿 Estrategia de Ramas (Git Flow)

```
main
├── develop
│   ├── feature/auth-users              → Persona 1
│   ├── feature/auctions-bids           → Persona 2
│   ├── feature/items-payments          → Persona 3
│   └── feature/notifications-infra     → Persona 4
```

### Reglas:
1. **Nunca pushear directo a `main`** — Siempre hacer PR desde `develop`
2. **Trabajar en feature branches** — Crear branch desde `develop`
3. **Pull Requests** — Mínimo 1 review antes de mergear
4. **Commits descriptivos** — Usar prefijos: `feat:`, `fix:`, `docs:`, `refactor:`

---

## 🚀 Quick Start (Proyecto Completo)

```bash
# 1. Clonar el repositorio
git clone https://github.com/kevinKfv/TPO_DA2.git
cd TPO_DA2

# 2. Iniciar el frontend
cd APP_MOVIL_TPO
npm install
npx expo start

# 3. Iniciar el backend (cuando esté listo)
cd ../backend
npm install
docker-compose up -d
npx prisma migrate dev
npm run dev
```

---

## 📄 Documentación

- [Plan de Backend (División de Tareas)](docs/BACKEND_PLAN.md)

---

## 📝 Licencia

Proyecto académico — TPO Desarrollo de Aplicaciones 2
