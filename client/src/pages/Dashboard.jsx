import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isOwner = profile?.user_type === 'owner' || profile?.user_type === 'both';

  return (
    <div>
      <h1 className="page-title">Olá, {profile?.full_name?.split(' ')[0] || 'usuário'} 👋</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>O que você quer fazer hoje?</p>

      <div className="grid">
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/equipment')}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
          <h3>Buscar Equipamentos</h3>
          <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.3rem' }}>Encontre máquinas disponíveis para locação</p>
        </div>

        <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/my-rentals')}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
          <h3>Minhas Locações</h3>
          <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.3rem' }}>Acompanhe suas locações ativas</p>
        </div>

        <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/auctions')}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
          <h3>Leilões</h3>
          <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.3rem' }}>Participe de leilões em tempo real</p>
        </div>

        {isOwner && (
          <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/my-equipment')}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚜</div>
            <h3>Meus Equipamentos</h3>
            <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.3rem' }}>Gerencie seus equipamentos e solicitações</p>
          </div>
        )}
      </div>
    </div>
  );
}
