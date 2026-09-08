## 1. Objetivo

Este documento define la estrategia de testing de Prime Gym.

El objetivo no es simplemente alcanzar un porcentaje de cobertura.

El objetivo es detectar errores reales y proteger comportamientos importantes.

---

# 2. Pirámide de testing

La estrategia sigue aproximadamente:

```text
              E2E
             /   \
          Integration
         /           \
       Unit  Unit  Unit
```

La mayor cantidad de tests debe ser unitaria.

Los tests de integración verifican interacción entre módulos.

Los E2E verifican flujos críticos completos.

---

# 3. Unit tests

Los unit tests deben verificar una unidad aislada.

Principalmente:

* Services.
* Validators.
* Utilities.
* Transformaciones.
* Hooks.
* Funciones de dominio.

Ejemplo:

```text
createMember()
```

debe probarse sin levantar Express ni depender de una base PostgreSQL real cuando no sea necesario.

Casos mínimos:

### Happy path

```text
input válido → resultado esperado
```

### Invalid input

```text
input inválido → error esperado
```

### Boundary cases

Ejemplos:

```text
string vacío
string demasiado largo
valor 0
valor negativo
fecha límite
```

### Business rules

Verificar explícitamente las reglas del dominio.

---

# 4. Integration tests

Los integration tests verifican que varios componentes funcionen correctamente juntos.

Ejemplos:

```text
HTTP request
    ↓
Express
    ↓
Controller
    ↓
Service
    ↓
Prisma
    ↓
PostgreSQL
```

Deben probar:

* Status codes.
* Request validation.
* Responses.
* Persistencia.
* Constraints.
* Manejo de errores.
* Autenticación.
* Autorización.

Cuando sea posible utilizar una base de datos de testing aislada.

Nunca ejecutar integration tests contra producción.

---

# 5. Database testing

Los tests que utilizan PostgreSQL deben ejecutarse contra una base de datos dedicada a testing.

Ejemplo:

```text
prime_gym
prime_gym_test
```

Nunca:

```text
prime_gym_production
```

Los tests deben dejar el estado conocido entre ejecuciones.

Utilizar transacciones, truncation o recreación de base según la estrategia adoptada.

---

# 6. E2E

Los E2E prueban el comportamiento desde la perspectiva del usuario.

Ejemplo:

```text
Usuario
 ↓
Browser
 ↓
React
 ↓
API
 ↓
PostgreSQL
```

Utilizar una herramienta como Playwright cuando el proyecto esté preparado para ello.

---

# 7. Flujos E2E prioritarios

Como mínimo deberían cubrirse los flujos críticos.

Ejemplos futuros:

### Login

```text
usuario ingresa credenciales
→ autenticación correcta
→ acceso al sistema
```

### Registro de socio

```text
abrir formulario
→ introducir datos
→ enviar
→ API responde
→ socio aparece correctamente
```

### Edición

```text
abrir socio
→ modificar información
→ guardar
→ información actualizada
```

### Eliminación

```text
solicitar eliminación
→ confirmar
→ registro deja de estar disponible
```

### Autorización

```text
usuario sin permisos
→ intenta acceder
→ backend rechaza operación
```

---

# 8. Security tests

Cada endpoint sensible debe considerar:

### Authentication

```text
sin credenciales → 401
```

### Authorization

```text
sin permisos → 403
```

### Invalid input

```text
input inválido → 400
```

### Resource access

Verificar que un usuario no pueda acceder a recursos que no le corresponden modificando IDs.

Esto ayuda a detectar:

```text
IDOR / BOLA
```

---

# 9. API contract testing

Cuando existan tipos compartidos entre frontend y backend, verificar que el contrato se mantenga consistente.

Por ejemplo:

```ts
interface Member {
  id: string;
  name: string;
}
```

Si la API cambia:

```text
name → fullName
```

debe actualizarse el contrato y todos los consumidores correspondientes.

Evitar duplicar contratos manualmente.

---

# 10. Frontend tests

Los componentes importantes deben probar:

* Renderizado.
* Interacción.
* Estados loading.
* Estados error.
* Estados vacíos.
* Respuestas exitosas.
* Validaciones.

Ejemplo:

```text
Loading
Empty
Success
Error
```

No probar únicamente el snapshot de un componente.

---

# 11. PWA testing

La PWA debe probar:

* Manifest válido.
* Service Worker generado.
* Aplicación cargable.
* Assets críticos disponibles.
* Comportamiento offline esperado.
* Actualización del Service Worker.

No asumir que la PWA funciona simplemente porque Vite compila.

---

# 12. Mocking

Mockear dependencias externas cuando el test no pretende comprobarlas.

Ejemplo:

Un unit test de un service puede mockear Prisma.

Pero un integration test debería comprobar la integración real con una base de testing.

No mockear todo.

Si todo está mockeado, el test puede pasar aunque el sistema real esté roto.

---

# 13. Tests deterministas

Los tests deben ser:

* Repetibles.
* Independientes.
* Deterministas.

Evitar depender de:

* Hora real.
* APIs externas.
* Internet.
* Estado de otra prueba.
* Datos creados manualmente.
* Orden accidental de ejecución.

Cuando sea necesario, controlar el tiempo y datos externos mediante mocks.

---

# 14. Test data

Los datos de testing deben ser explícitos y reproducibles.

Evitar depender de datos existentes manualmente en una base.

Preferir factories/builders:

```ts
createTestMember()
```

Esto facilita modificar el modelo posteriormente.

---

# 15. Coverage

La cobertura es una métrica útil, pero no debe convertirse en el objetivo principal.

No hacer:

```text
escribir tests artificiales solamente para aumentar coverage
```

Priorizar:

1. Código crítico.
2. Reglas de negocio.
3. Seguridad.
4. Integraciones.
5. Casos límite.

---

# 16. Regression testing

Cada bug corregido debería incorporar un test que reproduzca el problema cuando sea razonable.

Patrón:

```text
Bug
 ↓
Test que reproduce bug
 ↓
Fix
 ↓
Test pasa
```

Esto evita que el mismo problema reaparezca.

---

# 17. Test naming

Los nombres deben explicar comportamiento.

Preferir:

```text
should reject member creation when email is invalid
```

sobre:

```text
test1
```

Un test debe poder entenderse sin leer completamente su implementación.

---

# 18. Definition of Done

Una funcionalidad no se considera terminada si:

* No tiene tests adecuados.
* Rompe tests existentes.
* Introduce errores de TypeScript.
* Introduce errores de lint.
* Rompe build.
* Deja comportamiento crítico sin verificar.

Antes de finalizar:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

y, cuando corresponda:

```bash
npm run test:e2e
```

---

# 19. Prioridad de tests

Cuando el tiempo sea limitado:

### Prioridad 1

Reglas de negocio críticas.

### Prioridad 2

Autenticación y autorización.

### Prioridad 3

Persistencia y endpoints críticos.

### Prioridad 4

Flujos E2E principales.

### Prioridad 5

Componentes secundarios y detalles visuales.

---

# 20. Regla general

Un buen test responde:

> "¿Qué comportamiento importante dejaría de funcionar si alguien rompe este código mañana?"

Si la respuesta es clara, probablemente vale la pena tener el test.
