## 1. Propósito

Este archivo define las reglas generales que deben seguir todos los agentes de IA que trabajen en el repositorio Prime Gym.

Prime Gym es un monorepo TypeScript compuesto por:

* `apps/api` — Backend REST.
* `apps/frontend` — Frontend React/PWA.
* `packages/shared` — Contratos y tipos compartidos.
* PostgreSQL — Base de datos.
* Prisma — ORM.

Este documento define **cómo debe trabajar un agente**.

La arquitectura concreta del sistema está documentada en `ARCHITECTURE.md`.

Las reglas de seguridad están documentadas en `SECURITY.md`.

Las convenciones de desarrollo están documentadas en `DEVELOPER.md`.

La estrategia de testing está documentada en `TESTER.md`.

---

# 2. Prioridades

Ante cualquier cambio, priorizar en este orden:

1. Seguridad.
2. Corrección funcional.
3. Integridad de datos.
4. Tipado.
5. Testabilidad.
6. Mantenibilidad.
7. Simplicidad.
8. Performance cuando exista una necesidad real.

No sacrificar seguridad o integridad de datos por velocidad de implementación.

---

# 3. Antes de modificar código

Antes de realizar cambios:

1. Inspeccionar la estructura relevante.
2. Leer los archivos que participan en la funcionalidad.
3. Revisar tipos existentes.
4. Revisar tests existentes.
5. Revisar `ARCHITECTURE.md`.
6. Revisar `SECURITY.md` cuando el cambio involucre datos, autenticación, autorización, API o infraestructura.
7. Identificar dependencias entre frontend, backend y shared.
8. Determinar el cambio mínimo necesario.

No asumir que una funcionalidad debe implementarse de una determinada manera sin revisar primero el código existente.

---

# 4. No inventar arquitectura

No introducir:

* Nuevas capas.
* Nuevos patrones.
* Nuevos frameworks.
* Nuevos ORMs.
* Nuevas librerías.
* Nuevos sistemas de estado.
* Nuevos mecanismos de autenticación.

sin una razón técnica clara.

Si el cambio requiere una modificación arquitectónica importante, explicarla antes de implementarla.

---

# 5. Mantener el alcance

Resolver el problema solicitado.

No aprovechar una tarea para realizar:

* Refactors masivos.
* Renombrados globales innecesarios.
* Reestructuración completa del proyecto.
* Actualizaciones de dependencias no relacionadas.
* Cambios estéticos no solicitados.

Si se detecta una mejora importante pero fuera de alcance, documentarla como recomendación en lugar de implementarla automáticamente.

---

# 6. No ocultar problemas

Está prohibido solucionar errores mediante mecanismos destinados únicamente a silenciarlos.

Evitar:

```ts
as any
@ts-ignore
@ts-expect-error
eslint-disable
```

cuando solamente se utilizan para evitar corregir el problema real.

Si un workaround es realmente necesario, debe estar justificado.

---

# 7. TypeScript

El proyecto utiliza TypeScript estricto.

No introducir `any` sin justificación.

Preferir:

```ts
unknown
```

cuando un valor tenga tipo desconocido.

No duplicar tipos que ya existan en `packages/shared`.

TypeScript no sustituye la validación runtime.

---

# 8. Datos externos

Todo dato proveniente de fuera del código confiable debe considerarse no confiable.

Esto incluye:

* HTTP requests.
* Request body.
* Query parameters.
* Route parameters.
* Headers.
* Cookies.
* Variables de entorno.
* Datos provenientes del navegador.
* Datos provenientes de APIs externas.
* Datos provenientes de archivos.

Validar antes de utilizar.

---

# 9. Backend

Respetar la separación definida en `ARCHITECTURE.md`.

En términos generales:

```text
Route
  ↓
Controller
  ↓
Service
  ↓
Data access
  ↓
PostgreSQL
```

No colocar lógica de negocio en las rutas.

No colocar lógica HTTP en los services.

---

# 10. Frontend

Los componentes React no deben convertirse en contenedores de:

* Lógica de negocio compleja.
* Acceso directo repetido a la API.
* Manipulación de infraestructura.
* Lógica duplicada.

Utilizar los servicios y abstracciones existentes.

---

# 11. Shared

`packages/shared` debe contener contratos realmente compartidos.

No convertirlo en un "cajón de utilidades".

Antes de agregar algo a `shared`, preguntarse:

> ¿Lo necesitan realmente frontend y backend?

Si la respuesta es no, probablemente no pertenece allí.

---

# 12. Seguridad

Todos los agentes deben cumplir `SECURITY.md`.

Reglas fundamentales:

* Nunca confiar en el cliente.
* Nunca commitear secretos.
* Nunca exponer información sensible.
* Validar inputs.
* Aplicar autorización en backend.
* Utilizar mínimo privilegio.
* No filtrar errores internos.

---

# 13. Base de datos

No realizar modificaciones destructivas sin evaluar impacto.

No eliminar datos para resolver errores durante desarrollo sin comprender primero el problema.

Los cambios de schema deben mantenerse sincronizados con Prisma, migraciones, tipos y tests.

---

# 14. Tests

Toda funcionalidad relevante debe tener cobertura apropiada.

Seguir `TESTER.md`.

Un cambio no se considera completo si rompe:

* TypeScript.
* Lint.
* Tests.
* Build.

No modificar tests únicamente para hacerlos pasar.

Si cambia el comportamiento esperado, actualizar el test y justificar el cambio.

---

# 15. Dependencias

No instalar una dependencia sin evaluar:

* Si ya existe una solución.
* Mantenimiento.
* Seguridad.
* Compatibilidad.
* Tamaño.
* Complejidad añadida.

Mantener el número de dependencias bajo control.

---

# 16. Git

No modificar:

```text
.env
```

ni otros archivos que contengan secretos.

No incluir:

```text
node_modules/
dist/
build/
coverage/
```

salvo que exista una razón explícita.

Los cambios deben ser pequeños y coherentes.

---

# 17. Verificación

Antes de finalizar una tarea, ejecutar los comandos disponibles para:

```text
typecheck
lint
unit tests
integration tests
build
E2E tests
```

cuando correspondan.

No afirmar que algo fue probado si realmente no fue ejecutado.

---

# 18. Informe final

Al finalizar una tarea, informar brevemente:

### Cambios realizados

Qué archivos y funcionalidades fueron modificados.

### Decisiones

Decisiones técnicas relevantes.

### Verificación

Qué comandos se ejecutaron y sus resultados.

### Pendientes

Problemas detectados que no forman parte de la tarea.

---

# 19. Regla principal

El agente debe producir código que otro desarrollador pueda:

* Entender.
* Revisar.
* Testear.
* Modificar.
* Depurar.

No optimizar para impresionar.

Optimizar para construir software mantenible y seguro.
