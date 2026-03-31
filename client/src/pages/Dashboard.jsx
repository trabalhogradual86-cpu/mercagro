import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CARDS = [
  {
    title: 'Buscar Equipamentos',
    desc: 'Encontre máquinas disponíveis para locação',
    path: '/equipment',
    role: 'all',
  },
  {
    title: 'Minhas Locações',
    desc: 'Acompanhe suas locações e histórico',
    path: '/my-rentals',
    role: 'all',
  },
  {
    title: 'Leilões',
    desc: 'Participe de leilões em tempo real',
    path: '/auctions',
    role: 'all',
  },
  {
    title: 'Meus Equipamentos',
    desc: 'Gerencie suas máquinas e solicitações',
    path: '/my-equipment',
    role: 'owner',
  },
];

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isOwner = profile?.user_type === 'owner' || profile?.user_type === 'both';

  const firstName = profile?.full_name?.split(' ')[0] || 'usuário';

  return (
    <div>
      <div style={s.header}>
        <div>
          <p className="section-label">Painel</p>
          <h1 className="page-title" style={{ margin: '0.3rem 0 0.25rem' }}>
            Olá, {firstName}
          </h1>
          <p style={{ color: 'var(--gray-600)', fontSize: '0.92rem' }}>
            {profile?.location_city ? `${profile.location_city}, ${profile.location_state}` : 'Bem-vindo ao Mercagro'}
          </p>
        </div>
      </div>

      <div className="grid animate-fade-in">
        {CARDS.filter(c => c.role === 'all' || (c.role === 'owner' && isOwner)).map(card => (
          <button
            key={card.path}
            className="card card-hover"
            style={s.card}
            onClick={() => navigate(card.path)}
          >
            <h3 style={s.cardTitle}>{card.title}</h3>
            <p style={s.cardDesc}>{card.desc}</p>
            <span style={s.cardArrow}>→</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const s = {
  header: {
    padding: 'var(--space-xl) 0 var(--space-xl)',
    borderBottom: '1px solid var(--gray-200)',
    marginBottom: 'var(--space-xl)',
  },
  card: {
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    background: 'none',
    border: 'none',
    padding: 0,
    display: 'block',
  },
  cardTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.05rem',
    fontWeight: 700,
    color: 'var(--green-900)',
    marginBottom: '0.4rem',
  },
  cardDesc: {
    fontSize: '0.88rem',
    color: 'var(--gray-600)',
    lineHeight: 1.5,
  },
  cardArrow: {
    display: 'block',
    marginTop: '1rem',
    fontSize: '1.1rem',
    color: 'var(--green-600)',
  },
};
