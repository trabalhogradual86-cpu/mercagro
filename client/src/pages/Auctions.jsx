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

export default function Auctions() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/auctions').then(data => {
      setAuctions(data);
      setLoading(false);
    });
    const interval = setInterval(() => setAuctions(a => [...a]), 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="loading">Carregando leilões...</div>;

  return (
    <div>
      <h1 className="page-title">Leilões Ativos</h1>
      {auctions.length === 0 ? (
        <p style={{ color: '#666' }}>Nenhum leilão ativo no momento.</p>
      ) : (
        <div className="grid">
          {auctions.map(a => (
            <div key={a.id} className="card" style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/auctions/${a.id}`)}>
              {a.equipment?.photos?.[0] ? (
                <img src={a.equipment.photos[0]} alt={a.equipment.name}
                  style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 8, marginBottom: '0.8rem' }} />
              ) : (
                <div style={{ height: 150, background: '#fff8e1', borderRadius: 8, marginBottom: '0.8rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>⚡</div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`badge ${a.status === 'active' ? 'badge-orange' : 'badge-blue'}`}>
                  {a.status === 'active' ? 'Ao vivo' : 'Agendado'}
                </span>
                <span style={{ fontSize: '0.85rem', color: '#666' }}>⏱ {timeLeft(a.ends_at)}</span>
              </div>
              <h3 style={{ marginTop: '0.5rem' }}>{a.equipment?.name}</h3>
              <p style={{ color: '#666', fontSize: '0.88rem' }}>{a.equipment?.brand} {a.equipment?.model}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.8rem' }}>
                <div>
                  <p style={{ fontSize: '0.78rem', color: '#999' }}>Lance atual</p>
                  <p style={{ fontWeight: 700, fontSize: '1.1rem', color: '#e65100' }}>
                    R$ {Number(a.current_price || a.start_price).toFixed(2)}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.78rem', color: '#999' }}>Início</p>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>R$ {Number(a.start_price).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
