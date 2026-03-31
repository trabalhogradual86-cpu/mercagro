import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

function timeLeft(endsAt) {
  const diff = new Date(endsAt) - new Date();
  if (diff <= 0) return 'Encerrado';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h ${m}m`;
}

export default function AuctionDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [bidding, setBidding] = useState(false);
  const [error, setError] = useState('');
  const [bidSuccess, setBidSuccess] = useState(false);

  useEffect(() => {
    fetchAuction();

    const channel = supabase
      .channel(`auction:${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'bids',
        filter: `auction_id=eq.${id}`,
      }, (payload) => {
        setBids(prev => [payload.new, ...prev]);
        setAuction(prev => prev ? { ...prev, current_price: payload.new.amount } : prev);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [id]);

  async function fetchAuction() {
    try {
      const data = await api.get(`/api/auctions/${id}`);
      setAuction(data);
      setBids(data.bids || []);
    } catch {
      setAuction(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleBid(e) {
    e.preventDefault();
    setError('');
    setBidSuccess(false);
    setBidding(true);
    try {
      await api.post(`/api/auctions/${id}/bid`, { amount: Number(bidAmount) });
      setBidAmount('');
      setBidSuccess(true);
      setTimeout(() => setBidSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setBidding(false);
    }
  }

  const minBid = auction
    ? Number(auction.current_price || auction.start_price) + Number(auction.min_increment)
    : 0;

  if (loading) return <div className="loading">Carregando leilão...</div>;
  if (!auction) return <div className="empty-state"><p>Leilão não encontrado.</p></div>;

  const isActive = auction.status === 'active';

  return (
    <div>
      <button onClick={() => navigate(-1)} style={s.back}>← Voltar</button>

      <div style={s.layout}>
        {/* Left — equipment info */}
        <div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {auction.equipment?.photos?.[0] ? (
              <img
                src={auction.equipment.photos[0]}
                alt={auction.equipment.name}
                style={{ width: '100%', height: 300, objectFit: 'cover' }}
              />
            ) : (
              <div style={{ height: 240, background: 'var(--green-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)', fontSize: '0.9rem' }}>
                Sem foto
              </div>
            )}
            <div style={{ padding: 'var(--space-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                {isActive ? (
                  <span className="badge badge-orange" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span className="status-dot live" style={{ marginRight: 0 }} />
                    Ao vivo
                  </span>
                ) : (
                  <span className="badge badge-blue">{auction.status}</span>
                )}
                <span style={{ fontSize: '0.82rem', color: 'var(--gray-600)' }}>
                  Encerra em {timeLeft(auction.ends_at)}
                </span>
              </div>
              <h1 style={s.title}>{auction.equipment?.name}</h1>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                {[auction.equipment?.brand, auction.equipment?.model, auction.equipment?.year].filter(Boolean).join(' · ')}
              </p>
              {auction.equipment?.description && (
                <p style={{ marginTop: '1rem', lineHeight: 1.7, color: 'var(--gray-700)', fontSize: '0.92rem' }}>
                  {auction.equipment.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right — bidding panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <p style={{ fontSize: '0.78rem', color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Lance atual</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800, color: 'var(--amber-700)', margin: '0.25rem 0' }}>
              R$ {Number(auction.current_price || auction.start_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>
              Incremento mínimo: R$ {Number(auction.min_increment).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>

            {user && isActive && auction.owner_id !== user.id && (
              <form onSubmit={handleBid} style={{ marginTop: '1.25rem', borderTop: '1px solid var(--gray-200)', paddingTop: '1.25rem' }}>
                <div className="form-group">
                  <label>Seu lance (mín. R$ {minBid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})</label>
                  <input
                    type="number"
                    min={minBid}
                    step="0.01"
                    required
                    value={bidAmount}
                    onChange={e => setBidAmount(e.target.value)}
                    placeholder={`${minBid.toFixed(2)}`}
                  />
                </div>
                {bidSuccess && (
                  <p style={{ background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.85rem', color: '#065f46', marginBottom: '0.5rem' }}>
                    Lance enviado! Aguardando confirmação em tempo real.
                  </p>
                )}
                {error && <p className="error-msg">{error}</p>}
                <button type="submit" className="btn btn-amber btn-full" disabled={bidding}>
                  {bidding ? 'Enviando...' : 'Dar Lance'}
                </button>
              </form>
            )}

            {!user && (
              <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                <a href="/login" style={{ color: 'var(--green-700)' }}>Entre</a> para participar do leilão.
              </p>
            )}

            {user && auction.owner_id === user.id && (
              <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--gray-500)', fontStyle: 'italic' }}>
                Este é o seu leilão.
              </p>
            )}
          </div>

          <div className="card">
            <h3 style={s.sectionTitle}>Histórico de lances</h3>
            {bids.length === 0 ? (
              <p style={{ color: 'var(--gray-500)', fontSize: '0.88rem' }}>Nenhum lance registrado ainda.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 280, overflowY: 'auto' }}>
                {bids.map((bid, i) => (
                  <div key={bid.id || i} style={s.bidRow}>
                    <span style={{ color: 'var(--gray-600)', fontSize: '0.88rem' }}>
                      {bid.profiles?.full_name || 'Usuário'}
                    </span>
                    <span style={{
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      color: i === 0 ? 'var(--amber-700)' : 'var(--gray-800)',
                    }}>
                      R$ {Number(bid.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  back: {
    background: 'none',
    border: 'none',
    color: 'var(--green-700)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    padding: '0.5rem 0',
    marginBottom: '1rem',
    display: 'block',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: '1.5rem',
    alignItems: 'start',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.6rem',
    fontWeight: 700,
    color: 'var(--green-900)',
    lineHeight: 1.25,
  },
  sectionTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.95rem',
    fontWeight: 700,
    color: 'var(--green-900)',
    marginBottom: '0.75rem',
  },
  bidRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.4rem 0',
    borderBottom: '1px solid var(--gray-100)',
  },
};
