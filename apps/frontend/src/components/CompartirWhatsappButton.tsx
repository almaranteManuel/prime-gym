import { buildWhatsAppUrl } from '../utils/rutina-whatsapp.js';

interface CompartirWhatsappButtonProps {
  celular: string | null | undefined;
  mensaje: string;
  /** Texto del botón ("WhatsApp" por defecto). */
  label?: string;
  className?: string;
}

/**
 * Botón presentacional que abre el chat de WhatsApp del alumno con un
 * mensaje listo. Si el celular no es válido, se muestra deshabilitado.
 */
export function CompartirWhatsappButton({ celular, mensaje, label = 'WhatsApp', className }: CompartirWhatsappButtonProps) {
  const url = celular ? buildWhatsAppUrl(celular, mensaje) : null;
  const estilo =
    className ??
    'rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40';
  if (!url) {
    return (
      <button type="button" disabled title="El alumno no tiene un celular válido para WhatsApp" className={estilo}>
        {label}
      </button>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={estilo} title="Abrir chat de WhatsApp del alumno">
      {label}
    </a>
  );
}
