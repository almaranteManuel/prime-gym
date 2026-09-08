## 1. Objetivo

Este documento define las convenciones de desarrollo del proyecto.

Todos los cambios deben mantener coherencia con la arquitectura existente.

---

## 2. Monorepo

El proyecto utiliza workspaces:

```text
apps/
├── api/
└── frontend/

packages/
└── shared/
```

Cada aplicación debe mantener responsabilidades independientes.

---

## 3. TypeScript

Usar:

```json
{
  "strict": true
}
```

No utilizar `any` salvo casos excepcionales documentados.

Preferir tipos explícitos en:

* APIs públicas.
* Servicios.
* DTOs.
* Funciones reutilizables.

Permitir inferencia cuando mejore la legibilidad.

---

## 4. Naming

Utilizar nombres descriptivos.

Ejemplos:

```text
member.service.ts
member.controller.ts
member.routes.ts
member.schema.ts
```

Evitar:

```text
utils2.ts
helpers.ts
stuff.ts
data.ts
```

cuando no describan claramente la responsabilidad.

---

## 5. Backend architecture

Mantener:

```text
Route
  ↓
Controller
  ↓
Service
  ↓
Repository/Prisma
```

No colocar lógica de negocio en:

```text
routes
```

No colocar lógica HTTP en:

```text
services
```

Ejemplo:

```ts
// Controller
const member = await memberService.createMember(input);

return res.status(201).json(member);
```

El service debe contener la regla de negocio.

---

## 6. Controllers

Los controllers deben ser pequeños.

Responsabilidades:

1. Obtener input.
2. Validarlo o recibirlo ya validado.
3. Invocar service.
4. Transformar resultado a HTTP.

Evitar controllers enormes.

---

## 7. Services

Los services contienen lógica de negocio.

Deben poder probarse sin necesidad de iniciar Express.

Ejemplo:

```ts
export async function createMember(input: CreateMemberInput) {
  // business logic
}
```

Evitar:

```ts
export async function createMember(req, res) {
  // ...
}
```

---

## 8. Prisma

Mantener un único cliente Prisma centralizado.

No crear:

```ts
new PrismaClient()
```

en múltiples módulos.

Centralizar la configuración en:

```text
apps/api/src/config/
```

---

## 9. DTOs

Separar:

```text
Database models
```

de:

```text
API contracts
```

No devolver automáticamente todos los campos de una entidad de base de datos.

Especialmente evitar exponer:

* Password hashes.
* Internal identifiers no necesarios.
* Campos administrativos.
* Información sensible.

Los DTOs pueden vivir en `packages/shared` cuando sean utilizados por frontend y backend.

---

## 10. Shared package

Ejemplo:

```ts
export interface Member {
  id: string;
  name: string;
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

Los tipos compartidos representan contratos.

No convertir `shared` en un contenedor genérico de código.

---

## 11. API client

Las llamadas HTTP del frontend deben centralizarse.

Ejemplo:

```text
services/
├── api.ts
└── members.service.ts
```

`api.ts` configura la instancia HTTP.

`members.service.ts` contiene operaciones específicas.

Los componentes no deberían construir URLs manualmente.

---

## 12. Environment variables

Frontend:

```env
VITE_API_URL=http://localhost:3000
```

Backend:

```env
DATABASE_URL=...
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

Nunca utilizar secrets en variables `VITE_*`.

Todo `VITE_*` puede terminar expuesto al navegador.

---

## 13. React

Preferir componentes pequeños y composables.

Evitar componentes que:

* Hagan llamadas HTTP.
* Contengan demasiada lógica.
* Gestionen múltiples responsabilidades.
* Manipulen directamente infraestructura.

Separar:

```text
UI
state
data fetching
business logic
```

cuando la complejidad lo justifique.

---

## 14. PWA

Mantener la configuración de `vite-plugin-pwa` centralizada en:

```text
vite.config.ts
```

Utilizar:

```text
generateSW
```

salvo que exista una necesidad real de comportamiento personalizado del Service Worker.

Revisar cuidadosamente cualquier modificación de caching.

---

## 15. Async / error handling

Toda operación async debe contemplar errores.

Evitar:

```ts
try {
  await operation();
} catch {
}
```

sin manejar el error.

No utilizar catch vacíos.

---

## 16. Formatting

Mantener formato consistente.

Si el proyecto utiliza ESLint/Prettier, respetar la configuración existente.

No introducir estilos diferentes en archivos individuales.

---

## 17. Testing

Cada nueva funcionalidad debe considerar tests.

### Unit

Para lógica aislada:

```text
services
utilities
validators
hooks
```

### Integration

Para interacción entre componentes del sistema:

```text
Express + services + database
```

### E2E

Para flujos reales:

```text
Browser
  ↓
Frontend
  ↓
API
  ↓
Database
```

---

## 18. Testability

Evitar código difícil de probar.

Preferir dependencias explícitas y funciones pequeñas.

No hacer que los tests dependan del estado accidental de una base de datos compartida.

---

## 19. Git

Commits pequeños y descriptivos.

Ejemplos:

```text
feat: add member registration
fix: validate member email
test: add member service tests
refactor: extract api client
```

No incluir:

```text
passwords
.env
database dumps
build artifacts
node_modules
```

---

## 20. Pull request / finalización

Antes de considerar terminada una tarea:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Si existen tests E2E:

```bash
npm run test:e2e
```

Si un comando no existe, utilizar el equivalente definido por el workspace.

Documentar cualquier comando que no pueda ejecutarse.

---

## 21. Cambios de schema

Los cambios en Prisma deben incluir:

* Actualización de schema.
* Migración cuando corresponda.
* Actualización de tipos.
* Tests afectados.
* Revisión de compatibilidad.

No modificar solamente TypeScript para ocultar un problema de schema.

---

## 22. Regla general

Preferir código aburrido, explícito y mantenible antes que abstracciones innecesarias.

La complejidad debe estar justificada por una necesidad real.
