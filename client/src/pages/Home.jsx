import { useNavigate } from 'react-router-dom';

const STATS = [
  { value: '51+', label: 'Equipamentos' },
  { value: '15', label: 'Cidades' },
  { value: '9', label: 'Estados' },
  { value: '100%', label: 'Digital' },
];

const FEATURES = [
  {
    title: 'Locação Direta',
    desc: 'Encontre e agende equipamentos disponíveis perto de você com total segurança e contrato digital.',
  },
  {
    title: 'Leilões ao Vivo',
    desc: 'Dispute equipamentos em leilões com atualização de lances em tempo real. Sempre transparente.',
  },
  {
    title: 'Recomendação por IA',
    desc: 'Nosso sistema analisa sua cultura, solo e área para indicar o equipamento ideal com preço justo.',
  },
  {
    title: 'Por Geolocalização',
    desc: 'Filtre máquinas disponíveis na sua região. Menos logística, mais eficiência.',
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div>
      {/* ── HERO ── */}
      <section style={s.hero}>
        {/* Grain texture overlay */}
        <div style={s.heroOverlay} />

        <div style={s.heroContent}>
          <p className="section-label animate-fade-up" style={{ color: 'var(--amber-400)' }}>
            Plataforma agrícola digital
          </p>
          <h1 className="display-1 animate-fade-up delay-1" style={{ marginTop: '0.75rem', maxWidth: 700 }}>
            Aluguel e Leilão de Máquinas Agrícolas
          </h1>
          <p className="animate-fade-up delay-2" style={s.heroSub}>
            Conectamos produtores rurais e proprietários de equipamentos em um ambiente digital seguro, eficiente e acessível para todo o Brasil.
          </p>
          <div className="animate-fade-up delay-3" style={s.heroCTA}>
            <button className="btn btn-amber btn-lg" onClick={() => navigate('/equipamentos')}>
              Buscar Equipamentos
            </button>
            <button className="btn btn-outline btn-lg" onClick={() => navigate('/leiloes')}>
              Ver Leilões Ativos
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div style={s.statsBar}>
          {STATS.map((stat) => (
            <div key={stat.label} style={s.statItem}>
              <span style={s.statValue}>{stat.value}</span>
              <span style={s.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: 'var(--space-2xl) 0' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <p className="section-label">Como funciona</p>
          <h2 className="display-2" style={{ marginTop: '0.5rem' }}>
            Tudo que você precisa, em um só lugar
          </h2>
        </div>
        <div className="grid">
          {FEATURES.map((f, i) => (
            <div key={f.title} className={`card animate-fade-up delay-${i + 1}`} style={s.featureCard}>
              <h3 style={s.featureTitle}>{f.title}</h3>
              <p style={s.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section style={s.ctaBand}>
        <div style={{ flex: 1 }}>
          <p className="section-label" style={{ color: 'var(--amber-400)', marginBottom: '0.5rem' }}>
            Tem máquinas paradas?
          </p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
            Transforme seu equipamento em renda
          </h2>
          <p style={{ color: 'rgba(255,255,255,.7)', marginTop: '0.6rem', fontSize: '0.95rem' }}>
            Cadastre suas máquinas e comece a receber locações ou crie leilões em minutos.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
          <button className="btn btn-amber btn-lg" onClick={() => navigate('/cadastrar')}>
            Cadastrar Equipamento
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/entrar')}>
            Já tenho conta
          </button>
        </div>
      </section>

      <div style={{ height: 'var(--space-2xl)' }} />
    </div>
  );
}

const s = {
  hero: {
    background: 'linear-gradient(160deg, var(--green-900) 0%, var(--green-800) 55%, var(--soil-700) 100%)',
    borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 'var(--space-2xl)',
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
    opacity: 0.6,
    pointerEvents: 'none',
  },
  heroContent: {
    position: 'relative',
    padding: 'clamp(3rem, 8vw, 6rem) var(--space-xl) clamp(2rem, 4vw, 3rem)',
    maxWidth: 800,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
    maxWidth: 560,
    marginTop: '1.2rem',
    lineHeight: 1.7,
  },
  heroCTA: {
    display: 'flex',
    gap: '0.9rem',
    marginTop: '2rem',
    flexWrap: 'wrap',
  },
  statsBar: {
    position: 'relative',
    display: 'flex',
    borderTop: '1px solid rgba(255,255,255,.12)',
    padding: '1.2rem var(--space-xl)',
    gap: '2rem',
    flexWrap: 'wrap',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.1rem',
  },
  statValue: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.6rem',
    fontWeight: 700,
    color: 'var(--white)',
  },
  statLabel: {
    fontSize: '0.78rem',
    fontWeight: 500,
    color: 'rgba(255,255,255,.55)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  featureCard: {
    borderTop: '3px solid var(--green-100)',
    transition: 'box-shadow .25s, transform .25s, border-color .25s',
  },
  featureIcon: {
    fontSize: '2rem',
    marginBottom: '0.8rem',
    display: 'inline-block',
  },
  featureTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--green-900)',
    marginBottom: '0.5rem',
  },
  featureDesc: {
    color: 'var(--gray-600)',
    fontSize: '0.92rem',
    lineHeight: 1.65,
  },
  ctaBand: {
    background: 'linear-gradient(120deg, var(--green-800), var(--green-900))',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-xl) var(--space-xl)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--space-xl)',
    flexWrap: 'wrap',
  },
};
