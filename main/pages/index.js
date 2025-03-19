import Navbar from 'main/components/Navbar';

export default function Home() {
  return (
    <div>
      <Navbar />
      <header style={{ padding: '20px', backgroundColor: '#f5f5f5' }}>
        <h1>Mi Proyecto Next.js</h1>
      </header>
      <main style={{ padding: '20px' }}>
        <p>Bienvenido a mi proyecto básico con Next.js.</p>
      </main>
      <footer style={{ padding: '20px', backgroundColor: '#f5f5f5' }}>
        <p>&copy; 2025 Mi Proyecto</p>
      </footer>
    </div>
  )
}
