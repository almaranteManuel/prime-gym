import type { IRutina } from '@gym/shared';

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
          Prime Gym · Alumno: {rutina.socio.nombre} (DNI {rutina.socio.dni}) · {fecha}
        </p>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {['#', 'Ejercicio', 'Series', 'Repeticiones', 'Notas'].map((h) => (
              <th key={h} style={{ textAlign: 'left', border: '1px solid #999999', backgroundColor: '#eeeeee', padding: '8px 10px' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rutina.ejercicios.map((e, i) => (
            <tr key={i}>
              <td style={{ border: '1px solid #999999', padding: '8px 10px' }}>{i + 1}</td>
              <td style={{ border: '1px solid #999999', padding: '8px 10px', fontWeight: 'bold' }}>{e.ejercicio}</td>
              <td style={{ border: '1px solid #999999', padding: '8px 10px' }}>{e.series || '-'}</td>
              <td style={{ border: '1px solid #999999', padding: '8px 10px' }}>{e.repeticiones || '-'}</td>
              <td style={{ border: '1px solid #999999', padding: '8px 10px' }}>{e.notas || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: 11, color: '#555555', marginTop: 16 }}>Rutina personalizada · Consultá a tu entrenador ante cualquier duda.</p>
    </div>
  );
}
