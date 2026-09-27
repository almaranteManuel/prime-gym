import { useEffect, useState, type FormEvent } from 'react';
import type { CreateSocioDTO, ISocio } from '@gym/shared';

export type SocioFormValues = CreateSocioDTO;

interface SocioFormProps {
  /** Si se provee, el formulario actúa en modo edición. */
  initialSocio?: ISocio | null;
  submitting: boolean;
  formError: string | null;
  onSubmit: (values: SocioFormValues) => void;
  onCancel: () => void;
}

const inputClass =
  'w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500';

const labelClass = 'mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-400';

/**
 * Formulario reutilizable para alta y edición de socios.
 * La validación definitiva vive en el backend; aquí solo se exige
 * presencia y se normaliza trim antes de enviar.
 */
export function SocioForm({ initialSocio, submitting, formError, onSubmit, onCancel }: SocioFormProps) {
  const [nombre, setNombre] = useState('');
  const [celular, setCelular] = useState('');
  const [dni, setDni] = useState('');
  const [patologias, setPatologias] = useState('');
  const [objetivos, setObjetivos] = useState('');
  const [dias, setDias] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const isEditing = initialSocio !== null && initialSocio !== undefined;

  useEffect(() => {
    setNombre(initialSocio?.nombre ?? '');
    setCelular(initialSocio?.celular ?? '');
    setDni(initialSocio?.dni ?? '');
    setPatologias(initialSocio?.patologias ?? '');
    setObjetivos(initialSocio?.objetivos ?? '');
    setDias(initialSocio?.diasEntrenamiento?.toString() ?? '');
    setLocalError(null);
  }, [initialSocio]);

  function handleSubmit(e: FormEvent): void {
    e.preventDefault();
    const values: SocioFormValues = {
      nombre: nombre.trim(),
      celular: celular.trim(),
      dni: dni.trim(),
      patologias: patologias.trim() ? patologias.trim() : null,
      objetivos: objetivos.trim() ? objetivos.trim() : null,
    };
    if (!values.nombre || !values.celular || !values.dni) {
      setLocalError('Nombre, celular y DNI son obligatorios.');
      return;
    }
    const trimmedDias = dias.trim();
    if (trimmedDias === '') {
      values.diasEntrenamiento = null;
    } else {
      const parsedDias = Number(trimmedDias);
      if (!Number.isInteger(parsedDias) || parsedDias < 1) {
        setLocalError('Los días por semana deben ser un entero mayor o igual a 1 (o vacío).');
        return;
      }
      values.diasEntrenamiento = parsedDias;
    }
    setLocalError(null);
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="text-base font-semibold text-zinc-100">{isEditing ? 'Editar socio' : 'Nuevo socio'}</h2>
      <p className="mt-1 text-xs text-zinc-400">
        {isEditing ? `Modificando a ${initialSocio?.nombre}` : 'Completa los datos para dar de alta un socio.'}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="socio-nombre" className={labelClass}>Nombre *</label>
          <input
            id="socio-nombre"
            className={inputClass}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre y apellido"
            maxLength={120}
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="socio-dni" className={labelClass}>DNI *</label>
          <input
            id="socio-dni"
            className={inputClass}
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            placeholder="12345678"
            maxLength={20}
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="socio-celular" className={labelClass}>Celular *</label>
          <input
            id="socio-celular"
            className={inputClass}
            value={celular}
            onChange={(e) => setCelular(e.target.value)}
            placeholder="+54 9 ..."
            maxLength={40}
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="socio-dias" className={labelClass}>Días por semana</label>
          <input
            id="socio-dias"
            className={inputClass}
            value={dias}
            onChange={(e) => setDias(e.target.value)}
            placeholder="Ej. 3 (vacío = sin dato)"
            inputMode="numeric"
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="socio-objetivos" className={labelClass}>Objetivos</label>
          <input
            id="socio-objetivos"
            className={inputClass}
            value={objetivos}
            onChange={(e) => setObjetivos(e.target.value)}
            placeholder="Hipertrofia, salud, ..."
            maxLength={2000}
            autoComplete="off"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="socio-patologias" className={labelClass}>Patologías</label>
          <textarea
            id="socio-patologias"
            className={`${inputClass} min-h-20 resize-y`}
            value={patologias}
            onChange={(e) => setPatologias(e.target.value)}
            placeholder="Condiciones de salud relevantes (opcional)"
            maxLength={2000}
          />
        </div>
      </div>

      {localError ? (
        <p role="alert" className="mt-3 rounded-lg border border-red-900/60 bg-red-950/50 px-3 py-2 text-sm text-red-200">
          {localError}
        </p>
      ) : null}
      {formError ? (
        <p role="alert" className="mt-3 rounded-lg border border-red-900/60 bg-red-950/50 px-3 py-2 text-sm text-red-200">
          {formError}
        </p>
      ) : null}

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-white disabled:opacity-50"
        >
          {submitting ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Dar de alta'}
        </button>
      </div>
    </form>
  );
}
