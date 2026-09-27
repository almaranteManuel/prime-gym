import type { IRutina } from '@gym/shared';
import { contarEjercicios } from './RutinaDetalle.js';

/**
 * Versión imprimible de la rutina, solo con estilos inline en hex.
 * Fondo blanco/claro para el PDF (ignora el dark-mode); html2canvas
 * rinde mejor con estilos inline que con clases utilitarias.
 */
export function RutinaPdf({ rutina }: { rutina: IRutina }) {
  const fecha = new Date(rutina.fechaCreacion).toLocaleDateString('es-AR');
  return (
    <div style={{ width: 760, backgroundColor: '#ffffff', color: '#111111', fontFamily: 'Arial, Helvetica, sans-serif', padding: 32 }}>
      <div style={{ borderBottom: '3px solid #111111', paddingBottom: 12, marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>{rutina.titulo}</h1>
        <p style={{ fontSize: 13, margin: '6px 0 0', color: '#333333' }}>
          Prime Gym · Alumno: {rutina.socio.nombre} (DNI {rutina.socio.dni}) · {fecha} · {rutina.dias.length} días · {contarEjercicios(rutina)} ejercicios
        </p>
      </div>
      {rutina.dias.map((d, di) => (
        <div key={di} style={{ marginBottom: 20 }}>
          <div style={{ backgroundColor: '#111111', color: '#ffffff', padding: '8px 12px', marginBottom: 0 }}>
            <span style={{ fontSize: 15, fontWeight: 'bold' }}>{d.nombre}</span>
            {d.etapa || d.objetivo ? (
              <span style={{ fontSize: 12, marginLeft: 12 }}>
                {[d.etapa && `Etapa: ${d.etapa}`, d.objetivo && `Objetivo: ${d.objetivo}`].filter(Boolean).join(' · ')}
              </span>
            ) : null}
          </div>
          {d.bloques.map((b, bi) => (
            <div key={bi} style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 'bold', margin: '10px 0 4px', textTransform: 'uppercase' }}>{b.nombre}</p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['#', 'Ejercicio', 'Series', 'Repeticiones', 'Notas'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', border: '1px solid #999999', backgroundColor: '#eeeeee', padding: '6px 10px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {b.ejercicios.map((e, ei) => (
                    <tr key={ei}>
                      <td style={{ border: '1px solid #999999', padding: '6px 10px' }}>{ei + 1}</td>
                      <td style={{ border: '1px solid #999999', padding: '6px 10px', fontWeight: 'bold' }}>{e.ejercicio}</td>
                      <td style={{ border: '1px solid #999999', padding: '6px 10px' }}>{e.series || '-'}</td>
                      <td style={{ border: '1px solid #999999', padding: '6px 10px' }}>{e.repeticiones || '-'}</td>
                      <td style={{ border: '1px solid #999999', padding: '6px 10px' }}>{e.notas || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ))}
      <p style={{ fontSize: 11, color: '#555555', marginTop: 16 }}>Rutina personalizada · Consultá a tu entrenador ante cualquier duda.</p>
    </div>
  );
}
