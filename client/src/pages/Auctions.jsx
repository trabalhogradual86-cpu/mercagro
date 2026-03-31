import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

function timeLeft(endsAt) {
  const diff = new Date(endsAt) - new Date();
  if (diff <= 0) return 'Encerrado';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h ${m}m`;
}

function AuctionCard({ auction, onClick }) {
  const isActive = auction.status === 'active';
  const tl = timeLeft(auction.ends_at);

  return (
    <div className="card card-hover" style={{ cursor: 'pointer' }} onClick={onClick}>
      {auction.equipment?.photos?.[0] ? (
        <img src={auction.equipment.photos[0]} alt={auction.equipment.name} className="card-img" />
      ) : (
        <div className="card-img-placeholder" style={{ background: 'var(--green-50)' }}>—</div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        {isActive ? (
          <span className="badge badge-orange" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span className="status-dot live" style={{ marginRight: 0 }} />
            Ao vivo
          </span>
        ) : (
          <span className="badge badge-blue">Agendado</span>
        )}
        <span style={{ fontSize: '0.78rem', color: 'var(--gray-600)', fontVariantNumeric: 'tabular-nums' }}>
          {tl}
        </span>
      </div>

      <h3 style={s.cardTitle}>{auction.equipment?.name}</h3>
      <p style={s.cardSub}>{[auction.equipment?.brand, auction.equipment?.model].filter(Boolean).join(' · ')}</p>

      <div style={s.cardFooter}>
        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--gray-600)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Lance atual</span>
          <span className="price-tag" style={{ color: 'var(--amber-700)' }}>
            R$ {Number(auction.current_price || auction.start_price).toFixed(2)}
          </span>
        </div>
        <span style={s.cardArrow}>→</span>
      </div>
    </div>
  );
}

export default function Auctions() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    function load() {
      api.get('/api/auctions')
        .then(data => setAuctions(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
    load();
    // Refaz o fetch a cada 30s para atualizar lances e contagem regressiva
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div style={s.pageHeader}>
        <div>
          <p className="section-label">Tempo real</p>
          <h1 className="page-title" style={{ margin: '0.3rem 0 0' }}>Leilões Ativos</h1>
        </div>
      </div>

      {loading ? (
        <div className="loading">Carregando leilões...</div>
      ) : auctions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">—</div>
          <p>Nenhum leilão ativo no momento.</p>
        </div>
      ) : (
        <div className="grid animate-fade-in">
          {auctions.map(a => (
            <AuctionCard key={a.id} auction={a} onClick={() => navigate(`/auctions/${a.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

const s = {
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 'var(--space-xl) 0 var(--space-lg)',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  cardTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--green-900)',
    marginTop: '0.6rem',
    lineHeight: 1.3,
  },
  cardSub: {
    fontSize: '0.82rem',
    color: 'var(--gray-600)',
    marginTop: '0.2rem',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: '0.8rem',
    paddingTop: '0.8rem',
    borderTop: '1px solid var(--gray-200)',
  },
  cardArrow: {
    fontSize: '1.2rem',
    color: 'var(--green-600)',
  },
};
