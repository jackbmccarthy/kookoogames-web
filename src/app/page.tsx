import Link from 'next/link';

export default function Home() {
  const games = [
    { name: 'Word Search', emoji: '🔍', path: '/games/word-search', description: 'Find hidden words!' },
  ];

  return (
    <main style={{
      minHeight: '100vh',
      padding: '40px 20px',
    }}>
      <h1>KooKoo Games! 🎮</h1>
      <p style={{ textAlign: 'center', color: 'white', fontSize: '1.3rem', marginBottom: '40px' }}>
        Fun games for kids!
      </p>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {games.map(game => (
          <Link
            key={game.path}
            href={game.path}
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '30px',
              textAlign: 'center',
              textDecoration: 'none',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              transition: 'transform 0.2s',
            }}
          >
            <div style={{ fontSize: '4rem', marginBottom: '10px' }}>{game.emoji}</div>
            <h2 style={{ color: '#333', marginBottom: '10px' }}>{game.name}</h2>
            <p style={{ color: '#666' }}>{game.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
