import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

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

  useEffect(() => {
    fetchAuction();

    // Supabase Realtime — lances ao vivo
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
    } finally {
      setLoading(false);
    }
  }

  async function handleBid(e) {
    e.preventDefault();
    setError('');
    setBidding(true);
    try {
      await api.post(`/api/auctions/${id}/bid`, { amount: Number(bidAmount) });
      setBidAmount('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBidding(false);
    }
  }

  const minBid = auction ? (Number(auction.current_price || auction.start_price) + Number(auction.min_increment)) : 0;

  if (loading) return <div className="loading">Carregando leilão...</div>;
  if (!auction) return <p>Leilão não encontrado.</p>;

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', color: '#2d7a22', marginBottom: '1rem' }}>← Voltar</button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
        <div>
          <div className="card">
            {auction.equipment?.photos?.[0] && (
              <img src={auction.equipment.photos[0]} alt={auction.equipment.name}
                style={{ width: '100%', height: 280, objectFit: 'cover', borderRadius: 8, marginBottom: '1rem' }} />
            )}
            <span className={`badge ${auction.status === 'active' ? 'badge-orange' : 'badge-blue'}`}>
              {auction.status === 'active' ? '🔴 Ao vivo' : auction.status}
            </span>
            <h1 style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>{auction.equipment?.name}</h1>
            <p style={{ color: '#666' }}>{auction.equipment?.brand} {auction.equipment?.model}</p>
            {auction.equipment?.description && (
              <p style={{ marginTop: '0.8rem', lineHeight: 1.6, color: '#444' }}>{auction.equipment.description}</p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <p style={{ fontSize: '0.85rem', color: '#999' }}>Lance atual</p>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: '#e65100' }}>
              R$ {Number(auction.current_price || auction.start_price).toFixed(2)}
            </p>
            <p style={{ fontSize: '0.82rem', color: '#888', marginTop: '0.2rem' }}>
              Incremento mínimo: R$ {auction.min_increment}
            </p>

            {user && auction.status === 'active' && auction.owner_id !== user.id && (
              <form onSubmit={handleBid} style={{ marginTop: '1rem' }}>
                <div className="form-group">
                  <label>Seu lance (mín. R$ {minBid.toFixed(2)})</label>
                  <input type="number" min={minBid} step="0.01" required
                    value={bidAmount} onChange={e => setBidAmount(e.target.value)} />
                </div>
                {error && <p className="error-msg">{error}</p>}
                <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={bidding}>
                  {bidding ? 'Enviando lance...' : 'Dar Lance'}
                </button>
              </form>
            )}

            {!user && <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}><a href="/login">Entre</a> para dar lances.</p>}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '0.8rem' }}>Últimos lances</h3>
            {bids.length === 0 ? (
              <p style={{ color: '#999', fontSize: '0.9rem' }}>Nenhum lance ainda.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 300, overflowY: 'auto' }}>
                {bids.map((bid, i) => (
                  <div key={bid.id || i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: '#666' }}>{bid.profiles?.full_name || 'Usuário'}</span>
                    <span style={{ fontWeight: 600, color: i === 0 ? '#e65100' : '#333' }}>R$ {Number(bid.amount).toFixed(2)}</span>
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
