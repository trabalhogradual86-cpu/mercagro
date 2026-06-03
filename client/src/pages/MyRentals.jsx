import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import Toast from '../components/ui/Toast';

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

function StarRating({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.75rem' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '1.75rem', lineHeight: 1,
            color: n <= value ? '#f59e0b' : '#d1d5db',
            padding: '0 2px',
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function ReviewModal({ rental, onClose, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/api/reviews', { rental_id: rental.id, rating, comment });
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={modal.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modal.box} className="animate-fade-up">
        <h2 style={modal.title}>Avaliar locação</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)', marginBottom: '1.25rem' }}>
          {rental.equipment?.name} · Proprietário: {rental.owner?.full_name || '—'}
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Sua nota</label>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div className="form-group">
            <label>Comentário (opcional)</label>
            <textarea
              rows={3}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Como foi a experiência com este equipamento e proprietário?"
              style={{ resize: 'vertical' }}
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar avaliação'}
            </button>
            <button type="button" className="btn" onClick={onClose}
              style={{ border: '1px solid var(--gray-300)', color: 'var(--gray-700)' }}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MyRentals() {
  const [rentals, setRentals] = useState([]);
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [reviewRental, setReviewRental] = useState(null);

  useEffect(() => {
    api.get('/api/rentals/my')
      .then(async data => {
        setRentals(data);
        // Buscar reviews existentes para locações concluídas
        const completed = data.filter(r => r.status === 'completed');
        const reviewMap = {};
        await Promise.all(completed.map(async r => {
          try {
            const result = await api.get(`/api/reviews/rental/${r.id}`);
            reviewMap[r.id] = result;
          } catch { /* ignora */ }
        }));
        setReviews(reviewMap);
      })
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

  function handleReviewSuccess() {
    setToast({ message: 'Avaliação enviada com sucesso!', type: 'success' });
    const id = reviewRental.id;
    setReviewRental(null);
    // Marcar como avaliada localmente
    setReviews(prev => ({ ...prev, [id]: [{ id: 'local' }] }));
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

      {reviewRental && (
        <ReviewModal
          rental={reviewRental}
          onClose={() => setReviewRental(null)}
          onSuccess={handleReviewSuccess}
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
          <a href="/equipamentos" style={{ marginTop: '1rem', display: 'inline-block', color: 'var(--green-700)', fontWeight: 600 }}>
            Buscar equipamentos →
          </a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {rentals.map(r => {
            const st = STATUS[r.status] || { label: r.status, badge: 'badge-gray' };
            const jaAvaliou = reviews[r.id] && reviews[r.id].length > 0;
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
                {r.status === 'completed' && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--gray-200)' }}>
                    {jaAvaliou ? (
                      <span style={{ fontSize: '0.82rem', color: 'var(--gray-500)', fontStyle: 'italic' }}>
                        Avaliação enviada
                      </span>
                    ) : (
                      <button
                        className="btn"
                        style={{ fontSize: '0.82rem', color: 'var(--amber-700)', border: '1px solid #fde68a', background: '#fef9c3', padding: '0.35rem 0.9rem' }}
                        onClick={() => setReviewRental(r)}
                      >
                        Avaliar locação
                      </button>
                    )}
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

const modal = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '1rem',
  },
  box: {
    background: '#fff', borderRadius: 12, padding: '2rem',
    width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  title: {
    fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700,
    color: 'var(--green-900)', marginBottom: '0.25rem',
  },
};

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
