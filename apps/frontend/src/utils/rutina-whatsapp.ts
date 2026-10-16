/**
 * Ayudas para compartir rutinas por WhatsApp.
 * WhatsApp no permite adjuntar archivos vía enlace web, por eso el flujo es:
 * "Descargar PDF" + botón WhatsApp (abre el chat con mensaje listo y el
 * dueño adjunta el PDF en la conversación).
 */

/**
 * Normaliza un celular argentino al formato que exige wa.me: solo dígitos
 * con código país, sin "+", "00" inicial ni "0" de trunk.
 *
 * Los números siempre son argentinos, así que basta con el número local:
 *  - "3434222333" → "5493434222333" (se asume móvil: se agrega 54 + 9).
 *  - "0343 422-2333" / "343 15-422-2333" → "5493434222333".
 *  - Si ya trae código país ("+549...", "00549..."), se respeta tal cual.
 * Devuelve null si no hay dígitos suficientes.
 */
export function normalizarTelefonoParaWhatsApp(celular: string): string | null {
  const soloDigitos = celular.replace(/\D/g, '');
  if (!soloDigitos) return null;
  let numero = soloDigitos;
  if (numero.startsWith('00')) numero = numero.slice(2);
  else if (numero.startsWith('0')) numero = numero.slice(1);
  // Ya trae código país: se deja como está (móvil 549... o fijo 54...).
  if (numero.startsWith('54')) return numero.length >= 11 ? numero : null;
  // Prefijo "15" de móvil local (ej. 0343 15-4222333): va tras el área,
  // así que se elimina para luego anteponer 549. Solo si queda un número
  // nacional de 10 dígitos (área + número, ej. 343 + 4222333).
  if (numero.startsWith('15')) numero = numero.slice(2);
  for (const pos of [2, 3, 4]) {
    if (numero.length === 12 && numero.slice(pos, pos + 2) === '15') {
      const sinQuince = numero.slice(0, pos) + numero.slice(pos + 2);
      if (sinQuince.length === 10) {
        numero = sinQuince;
        break;
      }
    }
  }
  // "9" inicial sin 54 (ej. 93434222333): es el prefijo de móvil.
  if (numero.length === 11 && numero.startsWith('9')) numero = numero.slice(1);
  if (numero.length !== 10) return null;
  return `549${numero}`;
}

/** Mensaje listo para enviar junto a la rutina en PDF. */
export function buildMensajeRutina(nombreAlumno: string, titulo: string, dias: number, ejercicios: number): string {
  return (
    `Hola ${nombreAlumno}, te comparto tu rutina "${titulo}" ` +
    `(${dias} ${dias === 1 ? 'día' : 'días'}, ${ejercicios} ${ejercicios === 1 ? 'ejercicio' : 'ejercicios'}) ` +
    `de Prime Gym. Te adjunto el PDF. ¡Buen entrenamiento!`
  );
}

/**
 * URL https://wa.me/<telefono>?text=<mensaje> lista para abrir.
 * Null si el celular no es utilizable.
 */
export function buildWhatsAppUrl(celular: string, mensaje: string): string | null {
  const telefono = normalizarTelefonoParaWhatsApp(celular);
  if (!telefono) return null;
  return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
}
