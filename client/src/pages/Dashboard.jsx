import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CARDS = [
  {
    icon: '🚜',
    title: 'Buscar Equipamentos',
    desc: 'Encontre máquinas disponíveis para locação na sua região',
    path: '/equipment',
    role: 'all',
    color: 'var(--green-700)',
  },
  {
    icon: '📋',
    title: 'Minhas Locações',
    desc: 'Acompanhe suas locações ativas e histórico completo',
    path: '/my-rentals',
    role: 'all',
    color: 'var(--green-600)',
  },
  {
    icon: '🏷️',
    title: 'Leilões',
    desc: 'Participe de leilões de equipamentos em tempo real',
    path: '/auctions',
    role: 'all',
    color: 'var(--amber-600)',
  },
  {
    icon: '⚙️',
    title: 'Meus Equipamentos',
    desc: 'Gerencie suas máquinas e acompanhe as solicitações recebidas',
    path: '/my-equipment',
    role: 'owner',
    color: 'var(--green-800)',
  },
];

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isOwner = profile?.user_type === 'owner' || profile?.user_type === 'both';
  const firstName = profile?.full_name?.split(' ')[0] || 'usuário';

  const visibleCards = CARDS.filter(c => c.role === 'all' || (c.role === 'owner' && isOwner));

  return (
    <div>
      {/* Header */}
      <div style={{
        padding: 'var(--space-xl) 0',
        borderBottom: '1px solid var(--gray-200)',
        marginBottom: 'var(--space-xl)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-md)',
      }}>
        <div>
          <p className="section-label">Painel</p>
          <h1 className="page-title" style={{ margin: '0.3rem 0 0.25rem' }}>
            Olá, {firstName} 👋
          </h1>
          <p style={{ color: 'var(--gray-600)', fontSize: '0.92rem' }}>
            {profile?.location_city
              ? `${profile.location_city}, ${profile.location_state}`
              : 'Bem-vindo ao Mercagro'}
          </p>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/profile')}
        >
          Editar perfil
        </button>
      </div>

      {/* Cards de navegação */}
      <div className="grid animate-fade-in">
        {visibleCards.map(card => (
          <button
            key={card.path}
            className="card card-hover"
            onClick={() => navigate(card.path)}
            style={{
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-sm)',
            }}
          >
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-md)',
              background: card.role === 'owner' ? 'var(--soil-100)' : card.title.includes('Leilão') ? 'var(--amber-100)' : 'var(--green-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              marginBottom: 'var(--space-xs)',
              flexShrink: 0,
            }}>
              {card.icon}
            </div>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.05rem',
              fontWeight: 700,
              color: 'var(--green-900)',
              margin: 0,
            }}>
              {card.title}
            </h3>
            <p style={{
              fontSize: '0.88rem',
              color: 'var(--gray-600)',
              lineHeight: 1.55,
              margin: 0,
              flex: 1,
            }}>
              {card.desc}
            </p>
            <span style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: card.color,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              marginTop: 'var(--space-xs)',
            }}>
              Acessar →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
