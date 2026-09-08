import type { ApiHealthResponse } from '@gym/shared';

/**
 * Capa de servicio: aquí vivirá la lógica de negocio.
 * Por ahora solo compone el contrato compartido, sin acceso a DB.
 */
export function getHealth(): ApiHealthResponse {
  return {
    status: 'ok',
    service: 'gym-api',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  };
}
