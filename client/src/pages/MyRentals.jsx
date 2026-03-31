import { useState, useEffect } from 'react';
import { api } from '../lib/api';

const STATUS = {
  pending:   { label: 'Aguardando confirmação', badge: 'badge-orange' },
  confirmed: { label: 'Confirmado',             badge: 'badge-blue'   },
  active:    { label: 'Em andamento',           badge: 'badge-green'  },
  completed: { label: 'Concluído',              badge: 'badge-gray'   },
  cancelled: { label: 'Cancelado',              badge: 'badge-red'    },
};

function fmt(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 999,
      background: type === 'success' ? '#d1fae5' : '#fee2e2',
      border: `1px solid ${type === 'success' ? '#6ee7b7' : '#fca5a5'}`,
      color: type === 'success' ? '#065f46' : '#991b1b',
      padding: '0.75rem 1.25rem', borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
      fontWeight: 600, fontSize: '0.9rem', maxWidth: '320px',
    }}>
      {message}
    </div>
  );
}

export default function MyRentals() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    api.get('/api/rentals/my')
      .then(data => setRentals(data))
      .catch(() => setRentals([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleCancel(id) {
    if (!confirm('Cancelar esta locação?')) return;
    try {
      await api.patch(`/api/rentals/${id}/cancel`);
      setRentals(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
      setToast({ message: 'Locação cancelada com sucesso.', type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Erro ao cancelar a locação.', type: 'error' });
    }
  }

  if (loading) return <div className="loading">Carregando locações...</div>;

  return (
    <div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div style={s.header}>
        <p className="section-label">Histórico</p>
        <h1 className="page-title" style={{ margin: '0.3rem 0 0' }}>Minhas Locações</h1>
      </div>

      {rentals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">—</div>
          <p>Você ainda não fez nenhuma locação.</p>
          <a href="/equipment" style={{ marginTop: '1rem', display: 'inline-block', color: 'var(--green-700)', fontWeight: 600 }}>
            Buscar equipamentos →
          </a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {rentals.map(r => {
            const st = STATUS[r.status] || { label: r.status, badge: 'badge-gray' };
            return (
              <div key={r.id} className="card animate-fade-in">
                <div style={s.cardRow}>
                  <div>
                    <span className={`badge ${st.badge}`}>{st.label}</span>
                    <h3 style={s.equipName}>{r.equipment?.name}</h3>
                    <p style={s.equipSub}>{[r.equipment?.brand, r.equipment?.model].filter(Boolean).join(' · ')}</p>
                    <p style={s.dates}>{fmt(r.start_date)} → {fmt(r.end_date)}</p>
                    {r.owner?.full_name && (
                      <p style={{ ...s.equipSub, marginTop: '0.25rem' }}>
                        Proprietário: {r.owner.full_name}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="price-tag" style={{ fontSize: '1.1rem' }}>
                      R$ {Number(r.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <p style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                      R$ {Number(r.daily_rate).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/dia
                    </p>
                  </div>
                </div>
                {['pending', 'confirmed'].includes(r.status) && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--gray-200)' }}>
                    <button
                      className="btn"
                      style={{ fontSize: '0.82rem', color: 'var(--red-600)', border: '1px solid var(--red-100)', background: 'var(--red-100)', padding: '0.35rem 0.9rem' }}
                      onClick={() => handleCancel(r.id)}
                    >
                      Cancelar locação
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const s = {
  header: {
    padding: 'var(--space-xl) 0 var(--space-lg)',
  },
  cardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  equipName: {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--green-900)',
    marginTop: '0.4rem',
  },
  equipSub: {
    fontSize: '0.85rem',
    color: 'var(--gray-600)',
    marginTop: '0.15rem',
  },
  dates: {
    fontSize: '0.82rem',
    color: 'var(--gray-500)',
    marginTop: '0.3rem',
    fontVariantNumeric: 'tabular-nums',
  },
};
