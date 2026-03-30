import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div>
      {/* Hero */}
      <section style={styles.hero}>
        <h1 style={styles.heroTitle}>Alugue ou Leiloe Máquinas Agrícolas</h1>
        <p style={styles.heroSub}>
          Conectamos produtores rurais e proprietários de equipamentos em um ambiente digital seguro e eficiente.
        </p>
        <div style={styles.heroActions}>
          <button className="btn-primary" style={{ fontSize: '1rem', padding: '0.8rem 1.8rem' }}
            onClick={() => navigate('/equipment')}>
            Buscar Equipamentos
          </button>
          <button className="btn-secondary" style={{ fontSize: '1rem', padding: '0.8rem 1.8rem' }}
            onClick={() => navigate('/auctions')}>
            Ver Leilões
          </button>
        </div>
      </section>

      {/* Funcionalidades */}
      <section style={{ padding: '3rem 0' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.4rem' }}>Como funciona o Mercagro</h2>
        <div className="grid">
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>🚜</div>
            <h3>Locação Direta</h3>
            <p style={{ color: '#666', marginTop: '0.5rem', fontSize: '0.95rem' }}>
              Encontre equipamentos disponíveis perto de você e agende a locação com segurança.
            </p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>⚡</div>
            <h3>Leilões em Tempo Real</h3>
            <p style={{ color: '#666', marginTop: '0.5rem', fontSize: '0.95rem' }}>
              Dispute equipamentos em leilões ao vivo com atualização automática de lances.
            </p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>🤖</div>
            <h3>Recomendação por IA</h3>
            <p style={{ color: '#666', marginTop: '0.5rem', fontSize: '0.95rem' }}>
              Receba sugestões personalizadas de máquinas com base no seu tipo de solo e cultura.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

const styles = {
  hero: {
    background: 'linear-gradient(135deg, #1b5e20 0%, #2d7a22 60%, #4caf50 100%)',
    color: '#fff',
    padding: '5rem 2rem',
    textAlign: 'center',
    borderRadius: '0 0 16px 16px',
  },
  heroTitle: {
    fontSize: '2.2rem',
    fontWeight: 800,
    marginBottom: '1rem',
  },
  heroSub: {
    fontSize: '1.1rem',
    opacity: 0.9,
    maxWidth: 560,
    margin: '0 auto 2rem',
  },
  heroActions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
};
