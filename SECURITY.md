## 1. Objetivo

Este documento define las prácticas de seguridad obligatorias para Prime Gym.

La seguridad debe considerarse desde el diseño, no como una etapa posterior.

---

## 2. Principios

Aplicar:

* Least privilege.
* Defense in depth.
* Secure by default.
* Fail securely.
* Never trust client input.
* Minimize sensitive data.
* Do not expose internal implementation details.

---

## 3. Secrets

Nunca almacenar en Git:

* Contraseñas.
* API keys.
* JWT secrets.
* Database credentials.
* Private keys.
* Tokens.
* Production `.env`.

Utilizar:

```text
.env
.env.local
```

y mantenerlos fuera del repositorio cuando contengan secretos.

Versionar únicamente ejemplos:

```text
.env.example
```

---

## 4. Environment variables

Todas las variables necesarias deben documentarse en `.env.example`.

Ejemplo:

```env
DATABASE_URL=
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

La aplicación debe fallar al iniciar si falta una variable crítica.

No utilizar valores inseguros como fallback para secretos.

Incorrecto:

```ts
const secret = process.env.JWT_SECRET || "secret";
```

---

## 5. Database security

La aplicación debe conectarse utilizando un usuario PostgreSQL con los permisos mínimos necesarios.

No utilizar el usuario administrador `postgres` desde la aplicación.

Nunca construir queries mediante concatenación de strings.

Validar todos los parámetros antes de utilizarlos.

Prisma debe utilizarse preferentemente para acceso a datos.

---

## 6. Input validation

Todo input externo debe validarse.

Fuentes:

```text
body
params
query
headers
cookies
environment variables
external APIs
```

La validación debe comprobar:

* Tipo.
* Formato.
* Longitud.
* Rango.
* Valores permitidos.
* Reglas específicas del dominio.

Nunca confiar únicamente en TypeScript.

---

## 7. Authentication

Si se implementa autenticación:

* Utilizar contraseñas almacenadas mediante hashing seguro.
* Nunca almacenar contraseñas en texto plano.
* Nunca registrar contraseñas en logs.
* Aplicar expiración y rotación adecuada de tokens cuando corresponda.
* Invalidar sesiones/tokens cuando el modelo de seguridad lo requiera.

No implementar criptografía propia.

---

## 8. Authorization

Autenticación y autorización son conceptos diferentes.

No basta con comprobar:

```text
"isAuthenticated"
```

También debe comprobarse si el usuario tiene permiso para realizar la operación solicitada.

Ejemplo:

```text
Usuario autenticado
        ↓
¿Puede acceder a este recurso?
        ↓
¿Puede modificarlo?
```

La autorización debe realizarse en backend.

Nunca confiar en que ocultar botones en React constituye una medida de seguridad.

---

## 9. CORS

Configurar una allowlist de orígenes.

Ejemplo conceptual:

```env
CORS_ORIGIN=http://localhost:5173
```

En producción utilizar únicamente los dominios permitidos.

No utilizar comodines innecesariamente.

---

## 10. HTTP security

Cuando corresponda utilizar middleware de seguridad como Helmet.

Considerar:

* Content Security Policy.
* X-Content-Type-Options.
* Referrer-Policy.
* Frame protections.
* HSTS en HTTPS.
* Rate limiting.

La configuración debe adaptarse al entorno.

---

## 11. Rate limiting

Endpoints sensibles deben tener protección contra abuso.

Especialmente:

* Login.
* Recuperación de contraseña.
* Registro.
* Endpoints costosos.
* Operaciones administrativas.

El rate limiting debe configurarse de acuerdo con el entorno y las necesidades reales.

---

## 12. Error handling

Nunca devolver:

* Stack traces.
* SQL queries.
* Database connection strings.
* Internal filesystem paths.
* Secrets.
* Información de infraestructura.

al cliente.

Los errores internos deben registrarse de forma segura.

---

## 13. Logging

Los logs no deben contener:

* Passwords.
* Tokens.
* Authorization headers.
* Cookies sensibles.
* Connection strings.
* Información personal innecesaria.

Los logs deben permitir diagnosticar problemas sin convertirse en una fuente de filtración de información.

---

## 14. PWA / Service Worker

La PWA debe tratar el cache como almacenamiento potencialmente persistente.

No almacenar indiscriminadamente datos privados.

Especial cuidado con:

* Tokens.
* Datos de miembros.
* Información administrativa.
* Respuestas autenticadas.

El Service Worker no debe permitir que un usuario vea información perteneciente a una sesión anterior.

---

## 15. Frontend security

Nunca confiar en el frontend para aplicar controles de seguridad.

Todo control crítico debe existir en el backend.

No insertar HTML proveniente del usuario mediante mecanismos equivalentes a:

```tsx
dangerouslySetInnerHTML
```

sin sanitización apropiada.

Evitar almacenar información sensible en:

```text
localStorage
sessionStorage
```

sin una razón de seguridad justificada.

---

## 16. Dependencies

Mantener dependencias actualizadas.

Antes de incorporar una dependencia:

* Revisar vulnerabilidades conocidas.
* Evaluar mantenimiento.
* Evaluar procedencia.
* Minimizar dependencias innecesarias.

Ejecutar periódicamente:

```bash
npm audit
```

y revisar manualmente los resultados antes de aplicar actualizaciones automáticas.

---

## 17. Prisma migrations

Las migraciones deben revisarse antes de aplicarse.

Especialmente cuando:

* Eliminan columnas.
* Eliminan tablas.
* Modifican tipos.
* Introducen restricciones.
* Modifican índices.

No ejecutar migraciones destructivas en producción sin una estrategia de backup y recuperación.

---

## 18. Security testing

Los tests deben contemplar, cuando corresponda:

* Input inválido.
* Acceso no autenticado.
* Acceso no autorizado.
* IDOR/BOLA.
* SQL injection.
* XSS.
* CORS incorrecto.
* Rate limiting.
* Manejo de errores.
* Información sensible en respuestas.

---

## 19. Reporte de vulnerabilidades

Las vulnerabilidades no deben publicarse públicamente antes de ser evaluadas y corregidas.

Al reportar una vulnerabilidad incluir:

* Descripción.
* Impacto.
* Pasos para reproducir.
* Endpoint afectado.
* Request/response relevante sin secretos.
* Severidad estimada.
* Posible mitigación.

Nunca incluir credenciales reales en reportes.

---

## 20. Regla de oro

Si una funcionalidad depende de que:

> "el usuario no pueda modificar el frontend"

entonces no es una medida de seguridad.

El backend debe asumir que cualquier cliente puede enviar cualquier request.
