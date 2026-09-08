import { ApiStatus } from '../components/ApiStatus.js';

export function Home() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1>Gimnasio App</h1>
      <p>Esqueleto del frontend (React + Vite + PWA). Sin lógica de negocio todavía.</p>
      <section style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: 8 }}>
        <h2>Estado del backend</h2>
        <ApiStatus />
      </section>
    </main>
  );
}
