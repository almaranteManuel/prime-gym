## 1. Overview

Prime Gym es una aplicación web orientada a la gestión de un gimnasio.

El proyecto utiliza una arquitectura de monorepo con separación entre:

* Frontend.
* Backend.
* Contratos compartidos.
* Persistencia.

Arquitectura general:

```text
┌─────────────────────────────┐
│          Browser            │
│                             │
│ React + Vite + TypeScript   │
│             │               │
│             │ HTTP          │
└─────────────┼───────────────┘
              │
              ▼
┌─────────────────────────────┐
│           API               │
│                             │
│ Express + TypeScript        │
│                             │
│ Routes                      │
│   ↓                         │
│ Controllers                 │
│   ↓                         │
│ Services                    │
│   ↓                         │
│ Prisma                      │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│        PostgreSQL           │
└─────────────────────────────┘

        ▲
        │
        │ contracts/types
        │
┌───────┴─────────────────────┐
│       packages/shared       │
└─────────────────────────────┘
```

---

# 2. Repository structure

```text
prime-gym/
│
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   │
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── controllers/
│   │   │   ├── middlewares/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   └── ...
│   │   │
│   │   └── package.json
│   │
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── services/
│       │   └── ...
│       │
│       ├── vite.config.ts
│       └── package.json
│
├── packages/
│   └── shared/
│       ├── src/
│       │   └── index.ts
│       └── package.json
│
├── AGENT.md
├── ARCHITECTURE.md
├── SECURITY.md
├── DEVELOPER.md
├── TESTER.md
├── package.json
└── tsconfig.json
```

---

# 3. Monorepo

El repositorio utiliza npm workspaces.

Los workspaces principales son:

```text
apps/api
apps/frontend
packages/shared
```

Cada workspace mantiene sus propias dependencias.

Las dependencias compartidas deben declararse explícitamente donde sean utilizadas.

Evitar depender accidentalmente de dependencias instaladas por otro workspace.

---

# 4. Backend architecture

El backend utiliza arquitectura por capas.

```text
HTTP
 ↓
Routes
 ↓
Controllers
 ↓
Services
 ↓
Data Access
 ↓
Prisma
 ↓
PostgreSQL
```

Cada capa tiene una responsabilidad específica.

---

# 5. Routes

Ubicación:

```text
apps/api/src/routes/
```

Responsabilidad:

* Definir endpoints.
* Asociar endpoints con controllers.
* Aplicar middleware correspondiente.

Ejemplo:

```text
GET /api/members
POST /api/members
GET /api/members/:id
PATCH /api/members/:id
DELETE /api/members/:id
```

Las rutas no deben implementar reglas de negocio.

---

# 6. Controllers

Ubicación:

```text
apps/api/src/controllers/
```

Responsabilidad:

* Recibir request.
* Obtener parámetros.
* Invocar servicios.
* Generar response HTTP.
* Delegar manejo de errores al middleware correspondiente.

Un controller no debe conocer detalles innecesarios de PostgreSQL.

Ejemplo conceptual:

```text
HTTP Request
     ↓
Controller
     ↓
memberService.create()
     ↓
Response
```

---

# 7. Services

Ubicación:

```text
apps/api/src/services/
```

Los services contienen la lógica de negocio.

Ejemplos:

```text
member.service.ts
membership.service.ts
payment.service.ts
attendance.service.ts
```

Los services no deben depender directamente de:

```text
req
res
Express
```

Esto permite probarlos de forma aislada.

---

# 8. Data access

Prisma es la capa principal de acceso a PostgreSQL.

El cliente debe centralizarse en:

```text
apps/api/src/config/
```

No crear múltiples instancias innecesarias de `PrismaClient`.

Si el sistema alcanza una complejidad que justifique repositorios explícitos, se podrán introducir posteriormente.

No crear una capa repository únicamente por seguir un patrón si no aporta valor.

---

# 9. Prisma

El schema principal se encuentra en:

```text
apps/api/prisma/schema.prisma
```

Prisma representa la estructura de persistencia.

Los modelos de Prisma no deben utilizarse automáticamente como contratos públicos de la API.

La base de datos y la API tienen responsabilidades diferentes.

---

# 10. Database models vs API DTOs

Esta separación es importante.

### Prisma model

Representa persistencia.

Ejemplo conceptual:

```ts
Member {
  id
  name
  email
  passwordHash
  createdAt
}
```

### API DTO

Representa lo que la API permite enviar o recibir.

Ejemplo:

```ts
MemberResponse {
  id
  name
  email
}
```

`passwordHash` nunca debería formar parte de una respuesta pública.

Los DTOs permiten modificar la base de datos sin romper necesariamente el contrato de la API.

---

# 11. Shared package

Ubicación:

```text
packages/shared/
```

Contiene contratos utilizados por múltiples aplicaciones.

Puede incluir:

* Interfaces.
* Types.
* DTOs.
* Enums.
* API contracts.
* Tipos de respuestas.

Ejemplo:

```ts
export interface Member {
  id: string;
  name: string;
  email: string;
}
```

Frontend:

```ts
import type { Member } from "@prime-gym/shared";
```

Backend:

```ts
import type { Member } from "@prime-gym/shared";
```

---

# 12. Qué NO pertenece a shared

No colocar:

```text
Prisma Client
Express
React components
Browser APIs
Node.js APIs
Database queries
Secrets
Environment configuration
```

El paquete shared debe permanecer independiente de infraestructura.

---

# 13. Frontend architecture

El frontend utiliza:

```text
React
Vite
TypeScript
```

y se distribuye como SPA.

Estructura inicial:

```text
src/
├── components/
├── pages/
├── services/
├── hooks/
├── types/
└── ...
```

La estructura podrá evolucionar hacia una organización por features si la aplicación aumenta considerablemente de tamaño.

No introducir esa complejidad prematuramente.

---

# 14. Components

Los components contienen UI reutilizable.

Ejemplos:

```text
Button
Modal
Input
Table
MemberCard
```

No deberían contener lógica de infraestructura.

---

# 15. Pages

Las pages representan pantallas de la aplicación.

Ejemplos:

```text
Dashboard
Members
MemberDetails
Attendance
Payments
Login
```

Las pages pueden coordinar componentes y servicios, pero la lógica compleja debe extraerse cuando sea necesario.

---

# 16. Services frontend

Ubicación:

```text
apps/frontend/src/services/
```

Responsabilidad:

* Comunicación HTTP.
* Configuración del cliente HTTP.
* Transformación de respuestas cuando sea necesario.

Ejemplo:

```text
services/
├── api.ts
├── members.service.ts
└── auth.service.ts
```

Los componentes no deben repetir manualmente:

```ts
fetch(`${API_URL}/api/...`)
```

en múltiples lugares.

---

# 17. API URL

La URL del backend se configura mediante:

```env
VITE_API_URL=http://localhost:3000
```

Las variables `VITE_*` se consideran públicas.

Nunca colocar secretos allí.

---

# 18. PWA

El frontend utiliza:

```text
vite-plugin-pwa
```

con estrategia:

```text
generateSW
```

El Service Worker se genera automáticamente.

La PWA debe proporcionar:

* Web App Manifest.
* Service Worker.
* Assets necesarios para instalación.
* Estrategia de caching apropiada.

---

# 19. PWA caching

Debe distinguirse entre:

### Static assets

Pueden cachearse agresivamente.

Ejemplos:

```text
JS
CSS
fonts
images
icons
```

### Dynamic/private data

Debe manejarse cuidadosamente.

Ejemplos:

```text
members
payments
attendance
authentication
```

No cachear respuestas privadas indiscriminadamente.

---

# 20. Configuration

La configuración específica de cada aplicación debe permanecer cerca de la aplicación correspondiente.

Backend:

```text
apps/api/.env
```

Frontend:

```text
apps/frontend/.env
```

Los archivos `.env.example` documentan variables necesarias sin incluir secretos.

---

# 21. Authentication

La autenticación será responsabilidad del backend.

El frontend puede almacenar el estado de sesión y mostrar/ocultar UI, pero:

> La autorización real siempre debe ejecutarse en backend.

La arquitectura debe permitir introducir:

```text
Authentication
        ↓
Authorization
        ↓
Business logic
```

sin duplicar las reglas de autorización entre frontend y backend.

---

# 22. Authorization

La autorización debe estar separada de la autenticación.

Ejemplo:

```text
Authenticated?
      ↓
Has permission?
      ↓
Execute operation
```

Nunca considerar suficiente ocultar una opción de UI.

---

# 23. Error handling

El backend debe tener un mecanismo centralizado de manejo de errores.

Arquitectura conceptual:

```text
Controller
    ↓
throws error
    ↓
Error middleware
    ↓
HTTP response
```

Los errores internos no deben exponerse directamente al cliente.

---

# 24. Validation

La validación de datos debe ocurrir en runtime.

Arquitectura recomendada:

```text
Request
 ↓
Validation
 ↓
Controller
 ↓
Service
```

TypeScript proporciona seguridad estática, pero no valida datos provenientes de HTTP.

---

# 25. API versioning

La API debe permitir evolución futura.

Inicialmente se puede utilizar:

```text
/api/...
```

Si el proyecto necesita breaking changes importantes, podrá introducirse:

```text
/api/v1/...
/api/v2/...
```

No versionar prematuramente sin necesidad.

---

# 26. Testing architecture

El proyecto utilizará tres niveles:

```text
Unit
Integration
E2E
```

### Unit

Lógica aislada.

### Integration

Interacción entre capas reales.

### E2E

Flujo completo desde el navegador.

La estrategia completa está definida en `TESTER.md`.

---

# 27. Security architecture

Las reglas de seguridad están definidas en:

```text
SECURITY.md
```

Las decisiones arquitectónicas deben respetar principios como:

* Least privilege.
* Input validation.
* Backend authorization.
* Secure error handling.
* Secret management.
* Defense in depth.

---

# 28. Evolución de la arquitectura

La arquitectura debe evolucionar según la complejidad real.

No introducir abstracciones anticipadamente.

Por ejemplo, no crear:

```text
Controller
Service
Repository
Factory
Adapter
Strategy
Provider
```

para una funcionalidad trivial si no existe una necesidad real.

La complejidad arquitectónica debe justificarse por:

* Escalabilidad.
* Testabilidad.
* Reutilización.
* Separación de responsabilidades.
* Necesidades reales del dominio.

---

# 29. Regla de dependencia

Las dependencias deben apuntar hacia capas de mayor abstracción.

Evitar que:

```text
Frontend
   ↓
Prisma
```

o:

```text
Controller
   ↓
PostgreSQL directamente
```

La comunicación debe respetar las capas definidas.

---

# 30. Decisiones arquitectónicas

Cuando una decisión importante cambie la arquitectura, documentarla aquí.

Ejemplo:

```text
## ADR-001 — Authentication strategy

Decision:
JWT + ...

Reason:
...

Consequences:
...
```

Para decisiones importantes puede incorporarse posteriormente una carpeta:

```text
docs/
└── adr/
```

---

# 31. Principio arquitectónico

Prime Gym debe mantenerse:

> Modular, tipado, seguro, testeable y suficientemente simple.

La arquitectura no es un objetivo en sí mismo.

Debe servir al software y al equipo, no al revés.
