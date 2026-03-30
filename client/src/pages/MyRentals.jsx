import { useState, useEffect } from 'react';
import { api } from '../lib/api';

const STATUS_LABEL = {
  pending: { label: 'Aguardando confirmação', badge: 'badge-orange' },
  confirmed: { label: 'Confirmado', badge: 'badge-blue' },
  active: { label: 'Em andamento', badge: 'badge-green' },
  completed: { label: 'Concluído', badge: 'badge-gray' },
  cancelled: { label: 'Cancelado', badge: 'badge-red' },
};

export default function MyRentals() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/rentals/my').then(data => {
      setRentals(data);
      setLoading(false);
    });
  }, []);

  async function handleCancel(id) {
    if (!confirm('Cancelar esta locação?')) return;
    await api.patch(`/api/rentals/${id}/cancel`);
    setRentals(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
  }

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <div>
      <h1 className="page-title">Minhas Locações</h1>
      {rentals.length === 0 ? (
        <p style={{ color: '#666' }}>Você ainda não fez nenhuma locação.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {rentals.map(r => {
            const st = STATUS_LABEL[r.status] || { label: r.status, badge: 'badge-gray' };
            return (
              <div key={r.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span className={`badge ${st.badge}`}>{st.label}</span>
                    <h3 style={{ marginTop: '0.4rem' }}>{r.equipment?.name}</h3>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>{r.equipment?.brand} {r.equipment?.model}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 700, fontSize: '1.1rem', color: '#2d7a22' }}>R$ {Number(r.total_amount).toFixed(2)}</p>
                    <p style={{ fontSize: '0.85rem', color: '#666' }}>{r.start_date} → {r.end_date}</p>
                  </div>
                </div>
                {['pending', 'confirmed'].includes(r.status) && (
                  <button className="btn-danger" style={{ marginTop: '0.8rem', padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                    onClick={() => handleCancel(r.id)}>
                    Cancelar
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
