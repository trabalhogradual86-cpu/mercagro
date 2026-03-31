import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Onboarding() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const firstName = profile?.full_name?.split(' ')[0] || 'bem-vindo';
  const isProducer = profile?.user_type === 'producer' || profile?.user_type === 'both';
  const isOwner = profile?.user_type === 'owner' || profile?.user_type === 'both';

  return (
    <div style={{ maxWidth: '680px', margin: '4rem auto', padding: '0 1rem', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🌱</div>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>
        Olá, {firstName}!
      </h1>
      <p style={{ color: '#6b7280', fontSize: '1.05rem', marginBottom: '2.5rem' }}>
        Sua conta foi criada com sucesso. O que você gostaria de fazer primeiro?
      </p>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
        {isProducer && (
          <button
            onClick={() => navigate('/equipment')}
            style={{
              background: '#16a34a', color: '#fff', border: 'none', borderRadius: '12px',
              padding: '1.5rem 2rem', cursor: 'pointer', flex: '1', minWidth: '220px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
            }}
          >
            <span style={{ fontSize: '2rem' }}>🚜</span>
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Buscar Equipamento</span>
            <span style={{ fontSize: '0.85rem', opacity: 0.85 }}>Encontre máquinas disponíveis para alugar</span>
          </button>
        )}

        {isOwner && (
          <button
            onClick={() => navigate('/equipment/new')}
            style={{
              background: '#2563eb', color: '#fff', border: 'none', borderRadius: '12px',
              padding: '1.5rem 2rem', cursor: 'pointer', flex: '1', minWidth: '220px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
            }}
          >
            <span style={{ fontSize: '2rem' }}>➕</span>
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Cadastrar Equipamento</span>
            <span style={{ fontSize: '0.85rem', opacity: 0.85 }}>Anuncie sua máquina para locação</span>
          </button>
        )}

        <button
          onClick={() => navigate('/auctions')}
          style={{
            background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '12px',
            padding: '1.5rem 2rem', cursor: 'pointer', flex: '1', minWidth: '220px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
          }}
        >
          <span style={{ fontSize: '2rem' }}>🔨</span>
          <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Ver Leilões</span>
          <span style={{ fontSize: '0.85rem', opacity: 0.85 }}>Participe de leilões em tempo real</span>
        </button>
      </div>

      <button
        onClick={() => navigate('/dashboard')}
        style={{
          background: 'none', border: '1px solid #d1d5db', borderRadius: '8px',
          padding: '0.6rem 1.5rem', cursor: 'pointer', color: '#6b7280', fontSize: '0.95rem',
        }}
      >
        Ir para o Dashboard →
      </button>

      <div style={{ marginTop: '3rem', background: '#f9fafb', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e5e7eb', textAlign: 'left' }}>
        <p style={{ margin: 0, color: '#374151', fontWeight: 600, marginBottom: '0.5rem' }}>Como funciona o Mercagro?</p>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#6b7280', lineHeight: 1.9, fontSize: '0.9rem' }}>
          <li>Proprietários cadastram equipamentos para aluguel ou leilão</li>
          <li>Produtores buscam máquinas por categoria e localização</li>
          <li>A locação é confirmada pelo proprietário após a solicitação</li>
          <li>Novos equipamentos passam por aprovação antes de aparecer no catálogo</li>
        </ul>
      </div>
    </div>
  );
}
