# 📋 Plan de Implementación del Backend — HAMMER

> Documento de referencia para la división de trabajo del backend entre 4 desarrolladores.

---

## Stack Tecnológico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Runtime | **Node.js + Express** | Consistencia con el equipo JS/TS, rápido de implementar |
| Lenguaje | **TypeScript** | Tipado fuerte, consistencia con el frontend |
| Base de Datos | **PostgreSQL** | Relacional, soporte ACID para transacciones de subastas |
| ORM | **Prisma** | Migraciones automáticas, tipado generado, excelente DX |
| Autenticación | **JWT + bcrypt** | Stateless, ideal para apps mobile |
| Tiempo Real | **Socket.io** | Pujas en vivo, bidireccional |
| Storage | **Cloudinary o AWS S3** | Imágenes de artículos y documentos |
| Validación | **Zod** | Schemas con tipado TypeScript |
| Testing | **Jest + Supertest** | Tests unitarios + integración |

---

## Estructura del Proyecto

```
backend/
├── prisma/
│   └── schema.prisma              # Modelos de base de datos
├── src/
│   ├── app.ts                     # Configuración de Express
│   ├── server.ts                  # Entry point + Socket.io
│   ├── config/
│   │   ├── database.ts
│   │   ├── env.ts
│   │   └── socket.ts
│   ├── middlewares/
│   │   ├── auth.ts                # Verificación de JWT
│   │   ├── errorHandler.ts        # Manejo global de errores
│   │   ├── validateRequest.ts     # Validación con Zod
│   │   └── categoryGuard.ts       # Validación de categoría de usuario
│   ├── modules/
│   │   ├── auth/                  # 👤 PERSONA 1
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.schema.ts     # Zod schemas
│   │   │   └── auth.test.ts
│   │   ├── users/                 # 👤 PERSONA 1
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.routes.ts
│   │   │   ├── users.schema.ts
│   │   │   └── users.test.ts
│   │   ├── auctions/              # 👤 PERSONA 2
│   │   │   ├── auctions.controller.ts
│   │   │   ├── auctions.service.ts
│   │   │   ├── auctions.routes.ts
│   │   │   ├── auctions.schema.ts
│   │   │   └── auctions.test.ts
│   │   ├── bids/                  # 👤 PERSONA 2
│   │   │   ├── bids.controller.ts
│   │   │   ├── bids.service.ts
│   │   │   ├── bids.routes.ts
│   │   │   ├── bids.schema.ts
│   │   │   └── bids.test.ts
│   │   ├── items/                 # 👤 PERSONA 3
│   │   │   ├── items.controller.ts
│   │   │   ├── items.service.ts
│   │   │   ├── items.routes.ts
│   │   │   ├── items.schema.ts
│   │   │   └── items.test.ts
│   │   ├── payments/              # 👤 PERSONA 3
│   │   │   ├── payments.controller.ts
│   │   │   ├── payments.service.ts
│   │   │   ├── payments.routes.ts
│   │   │   ├── payments.schema.ts
│   │   │   └── payments.test.ts
│   │   └── notifications/         # 👤 PERSONA 4
│   │       ├── notifications.controller.ts
│   │       ├── notifications.service.ts
│   │       ├── notifications.routes.ts
│   │       ├── notifications.schema.ts
│   │       └── notifications.test.ts
│   ├── shared/
│   │   ├── types/
│   │   ├── utils/
│   │   └── constants/
│   └── docs/
│       └── api-contracts.md       # Contratos de API compartidos
├── package.json
├── tsconfig.json
├── .env.example
└── docker-compose.yml             # PostgreSQL + Redis (opcional)
```

---

## 👤 Persona 1 — Autenticación & Usuarios

### Responsabilidad
Todo lo relacionado con identidad, registro, login, perfil y documentación del usuario.

### Módulos: `auth/` + `users/`

### Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Registro de usuario |
| `POST` | `/api/auth/login` | Login con JWT |
| `POST` | `/api/auth/forgot-password` | Solicitar reset de contraseña |
| `POST` | `/api/auth/reset-password` | Resetear contraseña con token |
| `POST` | `/api/auth/refresh-token` | Renovar JWT |
| `GET` | `/api/users/me` | Perfil del usuario autenticado |
| `PUT` | `/api/users/me` | Editar perfil |
| `POST` | `/api/users/me/documents` | Subir documento (frente/dorso) |
| `GET` | `/api/users/me/documents` | Estado de verificación de documentos |
| `GET` | `/api/users/me/stats` | Estadísticas del usuario |
| `GET` | `/api/users/me/category` | Categoría actual del usuario |

### Modelo de Datos

```prisma
model User {
  id              String       @id @default(uuid())
  firstName       String
  lastName        String
  email           String       @unique
  passwordHash    String
  country         String
  address         String
  category        UserCategory @default(COMUN)
  isApproved      Boolean      @default(false)
  documentFront   String?
  documentBack    String?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  bids            Bid[]
  paymentMethods  PaymentMethod[]
  itemSubmissions ItemSubmission[]
  notifications   Notification[]
}

enum UserCategory {
  COMUN
  ESPECIAL
  PLATA
  ORO
  PLATINO
}
```

### Reglas de Negocio
- La categoría del usuario determina a qué subastas puede acceder
- Un usuario necesita documentos verificados + medio de pago para pujar
- El sistema de categorías debe poder consultarse desde otros módulos

### Funciones Exportadas (para otros módulos)
```typescript
getUserById(id: string): Promise<User>
getUserCategory(id: string): Promise<UserCategory>
```

---

## 👤 Persona 2 — Subastas & Pujas (Core + Real-Time)

### Responsabilidad
La lógica central del negocio — creación y gestión de subastas, pujas en tiempo real con Socket.io.

### Módulos: `auctions/` + `bids/`

### Endpoints REST

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/auctions` | Listar subastas (filtro por status, categoría) |
| `GET` | `/api/auctions/:id` | Detalle de subasta con items |
| `GET` | `/api/auctions/upcoming` | Próximas subastas |
| `GET` | `/api/auctions/active` | Subastas en vivo |
| `POST` | `/api/auctions/:id/bids` | Realizar una puja |
| `GET` | `/api/auctions/:id/bids` | Historial de pujas de subasta |
| `GET` | `/api/users/me/bids` | Historial personal de pujas |

### Eventos Socket.io (Real-Time)

#### Cliente → Servidor
| Evento | Descripción |
|--------|-------------|
| `auction:join` | Unirse a sala de subasta |
| `auction:leave` | Salir de sala |
| `bid:place` | Realizar puja en tiempo real |

#### Servidor → Cliente
| Evento | Descripción |
|--------|-------------|
| `bid:new` | Nueva puja recibida |
| `auction:item_changed` | Se pasó al siguiente ítem |
| `auction:item_sold` | Ítem adjudicado |
| `auction:ended` | Subasta finalizada |
| `auction:countdown` | Timer del martillero |

### Modelo de Datos

```prisma
model Auction {
  id               String          @id @default(uuid())
  name             String
  date             DateTime
  time             String
  category         AuctionCategory
  currency         Currency
  auctioneer       String
  location         String
  status           AuctionStatus   @default(UPCOMING)
  currentItemIndex Int             @default(0)
  createdAt        DateTime        @default(now())

  items            AuctionItem[]
  bids             Bid[]
}

model Bid {
  id         String   @id @default(uuid())
  amount     Float
  timestamp  DateTime @default(now())

  auctionId  String
  auction    Auction     @relation(fields: [auctionId], references: [id])
  itemId     String
  item       AuctionItem @relation(fields: [itemId], references: [id])
  userId     String
  user       User        @relation(fields: [userId], references: [id])
}

enum AuctionStatus {
  UPCOMING
  ACTIVE
  COMPLETED
}

enum AuctionCategory {
  COMUN
  ESPECIAL
  PLATA
  ORO
  PLATINO
}

enum Currency {
  ARS
  USD
}
```

### Reglas de Negocio
- Un usuario solo puede pujar si su categoría ≥ la categoría de la subasta
- Cada puja debe ser mayor que la puja actual
- Cuando el martillero adjudica un ítem → notificación al ganador y al dueño
- Al finalizar todos los ítems, la subasta pasa a `COMPLETED`

### Funciones Exportadas
```typescript
getAuctionById(id: string): Promise<Auction>
```

---

## 👤 Persona 3 — Artículos & Medios de Pago

### Responsabilidad
Gestión de artículos (envío para venta, inspección, catálogo) y medios de pago de usuarios.

### Módulos: `items/` + `payments/`

### Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/items/submit` | Enviar artículo para venta |
| `GET` | `/api/items/my-submissions` | Mis artículos enviados + estado |
| `GET` | `/api/items/:id` | Detalle de un artículo |
| `PUT` | `/api/items/:id/status` | (Admin) Cambiar estado |
| `GET` | `/api/items/catalog` | Catálogo de artículos |
| `GET` | `/api/users/me/purchases` | Artículos ganados en subastas |
| `GET` | `/api/users/me/sales` | Artículos vendidos |
| `GET` | `/api/payments/methods` | Listar medios de pago |
| `POST` | `/api/payments/methods` | Agregar medio de pago |
| `PUT` | `/api/payments/methods/:id` | Editar medio de pago |
| `DELETE` | `/api/payments/methods/:id` | Eliminar medio de pago |
| `POST` | `/api/payments/methods/:id/verify` | (Admin) Verificar medio de pago |

### Modelo de Datos

```prisma
model AuctionItem {
  id          String   @id @default(uuid())
  itemNumber  String
  name        String
  description String
  basePrice   Float
  currentBid  Float
  images      String[]
  artist      String?
  date        String?
  history     String?
  sold        Boolean  @default(false)
  winnerId    String?

  ownerId     String
  auctionId   String
  auction     Auction  @relation(fields: [auctionId], references: [id])
  bids        Bid[]
}

model ItemSubmission {
  id                 String           @id @default(uuid())
  itemName           String
  description        String
  images             String[]
  artistInfo         String?
  historicalInfo     String?
  ownershipConfirmed Boolean          @default(false)
  status             SubmissionStatus @default(PENDING)
  rejectionReason    String?
  basePrice          Float?
  commission         Float?
  auctionDate        DateTime?

  userId             String
  user               User             @relation(fields: [userId], references: [id])
  createdAt          DateTime         @default(now())
}

model PaymentMethod {
  id       String            @id @default(uuid())
  type     PaymentMethodType
  verified Boolean           @default(false)
  details  String
  amount   Float?

  userId   String
  user     User              @relation(fields: [userId], references: [id])
}

enum SubmissionStatus {
  PENDING
  INSPECTING
  ACCEPTED
  REJECTED
}

enum PaymentMethodType {
  BANK_ACCOUNT
  CREDIT_CARD
  CERTIFIED_CHECK
}
```

### Reglas de Negocio
- Mínimo 6 imágenes para enviar un artículo
- El usuario debe confirmar propiedad del artículo
- Los expertos determinan el precio base y comisión
- Medios de pago deben ser verificados antes de poder pujar

### Funciones Exportadas
```typescript
hasVerifiedPayment(userId: string): Promise<boolean>
```

---

## 👤 Persona 4 — Notificaciones, Infraestructura & Integración

### Responsabilidad
Sistema de notificaciones, infraestructura compartida, middlewares, CI/CD y testing de integración.

### Módulo: `notifications/` + `shared/` + `config/`

### Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/notifications` | Listar notificaciones del usuario |
| `PUT` | `/api/notifications/:id/read` | Marcar como leída |
| `PUT` | `/api/notifications/read-all` | Marcar todas como leídas |
| `DELETE` | `/api/notifications/:id` | Eliminar notificación |
| `GET` | `/api/notifications/unread-count` | Cantidad de no leídas |

### Modelo de Datos

```prisma
model Notification {
  id          String           @id @default(uuid())
  type        NotificationType
  title       String
  message     String
  read        Boolean          @default(false)
  auctionId   String?
  saleItemId  String?
  createdAt   DateTime         @default(now())

  userId      String
  user        User             @relation(fields: [userId], references: [id])
}

enum NotificationType {
  SUCCESS
  INFO
  WARNING
  AUCTION_WON
  AUCTION_LOST
  AUCTION_UPCOMING
  DOCUMENT_APPROVED
  DOCUMENT_REJECTED
  PRODUCT_APPROVED
  PRODUCT_REJECTED
  PAYMENT_APPROVED
  PAYMENT_REJECTED
  AUCTION_LIVE
  OFFER_RECEIVED
}
```

### Responsabilidades Adicionales (Infraestructura)

| Área | Tarea |
|------|-------|
| **Setup inicial** | `package.json`, `tsconfig.json`, `docker-compose.yml` |
| **Prisma schema** | Armar `schema.prisma` unificado con todos los modelos |
| **Middlewares** | `auth.ts`, `errorHandler.ts`, `validateRequest.ts`, `categoryGuard.ts` |
| **CI/CD** | GitHub Actions para lint + test + build |
| **Documentación** | Swagger/OpenAPI para todos los endpoints |
| **Seed data** | Script con datos de prueba |
| **Deploy** | Configuración de deploy (Railway / Render / Fly.io) |

### Funciones Exportadas
```typescript
createNotification(userId: string, data: NotificationInput): Promise<Notification>
```

---

## 🔗 Contratos entre Módulos

Para evitar bloqueos, cada persona expone **funciones de servicio** que otros pueden importar:

| Módulo | Función | Consumido por |
|--------|---------|---------------|
| `auth` | `getUserById(id)` | Subastas, Items, Notificaciones |
| `auth` | `getUserCategory(id)` | Subastas (validación de acceso) |
| `payments` | `hasVerifiedPayment(userId)` | Subastas (validación pre-puja) |
| `notifications` | `createNotification(userId, data)` | Subastas, Items, Auth |
| `auctions` | `getAuctionById(id)` | Notificaciones, Items |

---

## 📅 Cronograma Sugerido

### Semana 1: Fundación
| Persona | Tarea |
|---------|-------|
| P4 | Setup del proyecto, Prisma schema, middlewares, Docker |
| P1 | Auth: registro, login, JWT |
| P2 | CRUD de subastas (listar, detalle, filtros) |
| P3 | CRUD de items y submissions |

### Semana 2: Funcionalidades Core
| Persona | Tarea |
|---------|-------|
| P4 | Sistema de notificaciones + integración |
| P1 | Perfil, documentos, stats |
| P2 | Pujas REST + Socket.io real-time |
| P3 | Medios de pago + compras/ventas |

### Semana 3: Integración & Testing
| Persona | Tarea |
|---------|-------|
| Todos | Tests de integración, conectar frontend con backend |
| P4 | CI/CD, Swagger, seed data, deploy |

---

## 🌿 Estrategia de Ramas

```
main
├── develop
│   ├── feature/auth-users              → Persona 1
│   ├── feature/auctions-bids           → Persona 2
│   ├── feature/items-payments          → Persona 3
│   └── feature/notifications-infra     → Persona 4
```

### Reglas
1. **Nunca pushear directo a `main`** — Siempre hacer PR desde `develop`
2. **Trabajar en feature branches** — Crear branch desde `develop`
3. **Pull Requests** — Mínimo 1 review antes de mergear
4. **Commits descriptivos** — Usar prefijos: `feat:`, `fix:`, `docs:`, `refactor:`

---

## 🧪 Testing

### Tests por Persona
Cada persona escribe tests unitarios de su módulo (`*.test.ts`) usando Jest + Supertest.

### Tests de Integración
- Flujo completo: registrarse → verificar pago → pujar → ganar → notificación
- Tests de carga con Socket.io para subastas en vivo
- Correr todo con: `npm test`

### Verificación Manual
- Probar endpoints con Postman / Thunder Client
- Conectar el frontend Expo con el backend
- Validar cada flujo end-to-end
