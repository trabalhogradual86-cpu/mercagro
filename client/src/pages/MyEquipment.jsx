import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Toast from '../components/ui/Toast';

const EQ_STATUS = {
  available: { label: 'Disponível', badge: 'badge-green' },
  rented:    { label: 'Alugado',    badge: 'badge-orange' },
  auction:   { label: 'Em leilão',  badge: 'badge-blue'   },
  inactive:  { label: 'Inativo',    badge: 'badge-gray'   },
};

function fmt(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export default function MyEquipment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('equipment');
  const [toast, setToast] = useState(null);

  function showToast(message, type = 'success') {
    setToast({ message, type });
  }

  const loadData = useCallback(async () => {
    try {
      const [{ data: eq }, rent] = await Promise.all([
        supabase.from('equipment').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
        api.get('/api/rentals/incoming'),
      ]);
      setEquipment(eq || []);
      setIncoming(rent || []);
    } catch {
      showToast('Erro ao carregar dados. Tente recarregar a página.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleConfirm(id) {
    try {
      await api.patch(`/api/rentals/${id}/confirm`);
      setIncoming(prev => prev.map(r => r.id === id ? { ...r, status: 'confirmed' } : r));
      showToast('Locação confirmada com sucesso!');
    } catch (err) {
      showToast(err.message || 'Erro ao confirmar locação.', 'error');
    }
  }

  async function handleCancel(id) {
    if (!confirm('Recusar esta solicitação?')) return;
    try {
      await api.patch(`/api/rentals/${id}/cancel`);
      setIncoming(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
      showToast('Solicitação recusada.');
    } catch (err) {
      showToast(err.message || 'Erro ao recusar solicitação.', 'error');
    }
  }

  async function handleComplete(id) {
    if (!confirm('Marcar esta locação como concluída? O equipamento voltará a ficar disponível.')) return;
    try {
      await api.patch(`/api/rentals/${id}/complete`);
      // Usa callback para evitar stale closure
      setIncoming(prev => {
        const rental = prev.find(r => r.id === id);
        if (rental) {
          setEquipment(eqs => eqs.map(eq =>
            eq.id === rental.equipment_id ? { ...eq, status: 'available' } : eq
          ));
        }
        return prev.map(r => r.id === id ? { ...r, status: 'completed' } : r);
      });
      showToast('Locação concluída! Equipamento disponível novamente.');
    } catch (err) {
      showToast(err.message || 'Erro ao concluir locação.', 'error');
    }
  }

  const pendingCount = incoming.filter(r => r.status === 'pending').length;

  if (loading) return <div className="loading">Carregando painel...</div>;

  return (
    <div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div style={s.pageHeader}>
        <div>
          <p className="section-label">Proprietário</p>
          <h1 className="page-title" style={{ margin: '0.3rem 0 0' }}>Meu Painel</h1>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/equipamentos/novo')}>
          + Novo Equipamento
        </button>
      </div>

      {/* Tab bar */}
      <div className="tab-bar" style={{ marginBottom: 'var(--space-xl)' }}>
        <button
          className={`tab-item ${tab === 'equipment' ? 'active' : ''}`}
          onClick={() => setTab('equipment')}
        >
          Equipamentos ({equipment.length})
        </button>
        <button
          className={`tab-item ${tab === 'rentals' ? 'active' : ''}`}
          onClick={() => setTab('rentals')}
        >
          Solicitações{pendingCount > 0 && <span style={s.badge}>{pendingCount}</span>}
        </button>
      </div>

      {tab === 'equipment' && (
        equipment.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">—</div>
            <p>Você ainda não cadastrou equipamentos.</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/equipamentos/novo')}>
              Cadastrar primeiro equipamento
            </button>
          </div>
        ) : (
          <div className="grid animate-fade-in">
            {equipment.map(eq => {
              const st = EQ_STATUS[eq.status] || { label: eq.status, badge: 'badge-gray' };
              return (
                <div key={eq.id} className="card card-hover" style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/equipamentos/${eq.id}`)}>
                  {eq.photos?.[0] ? (
                    <img src={eq.photos[0]} alt={eq.name} className="card-img" />
                  ) : (
                    <div className="card-img-placeholder">—</div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    <span className={`badge ${st.badge}`}>{st.label}</span>
                    {eq.approval_status === 'pending' && (
                      <span style={{ fontSize: '0.72rem', background: '#fef3c7', color: '#92400e', padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>
                        Aguardando aprovação
                      </span>
                    )}
                    {eq.approval_status === 'rejected' && (
                      <span style={{ fontSize: '0.72rem', background: '#fee2e2', color: '#991b1b', padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>
                        Reprovado
                      </span>
                    )}
                  </div>
                  <h3 style={s.cardTitle}>{eq.name}</h3>
                  <p style={s.cardSub}>{[eq.brand, eq.model].filter(Boolean).join(' · ')}</p>
                  <p className="price-tag" style={{ marginTop: '0.5rem', fontSize: '1rem' }}>
                    R$ {Number(eq.daily_rate).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span>/dia</span>
                  </p>
                  <button
                    onClick={e => { e.stopPropagation(); navigate(`/equipamentos/${eq.id}/editar`); }}
                    style={{ marginTop: '0.5rem', padding: '4px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: '0.82rem', color: '#374151' }}
                  >
                    Editar
                  </button>
                </div>
              );
            })}
          </div>
        )
      )}

      {tab === 'rentals' && (
        incoming.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">—</div>
            <p>Nenhuma solicitação recebida ainda.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {incoming.map(r => (
              <div key={r.id} className="card animate-fade-in">
                <div style={s.rentalRow}>
                  <div>
                    {r.status === 'pending'   && <span className="badge badge-orange">Pendente</span>}
                    {r.status === 'confirmed' && <span className="badge badge-blue">Confirmado</span>}
                    {r.status === 'active'    && <span className="badge badge-green">Ativo</span>}
                    {r.status === 'cancelled' && <span className="badge badge-gray">Cancelado</span>}
                    {r.status === 'completed' && <span className="badge badge-green">Concluído</span>}
                    <h3 style={s.cardTitle}>{r.equipment?.name}</h3>
                    <p style={s.cardSub}>Solicitante: {r.profiles?.full_name || '—'}</p>
                    <p style={s.cardSub}>{fmt(r.start_date)} → {fmt(r.end_date)}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="price-tag" style={{ fontSize: '1.05rem' }}>
                      R$ {Number(r.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {r.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--gray-200)' }}>
                    <button className="btn btn-primary" style={{ fontSize: '0.85rem' }} onClick={() => handleConfirm(r.id)}>
                      Confirmar
                    </button>
                    <button
                      className="btn"
                      style={{ fontSize: '0.85rem', color: 'var(--red-600)', border: '1px solid var(--red-100)', background: 'var(--red-100)' }}
                      onClick={() => handleCancel(r.id)}
                    >
                      Recusar
                    </button>
                  </div>
                )}
                {(r.status === 'confirmed' || r.status === 'active') && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--gray-200)' }}>
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: '0.85rem', background: '#16a34a' }}
                      onClick={() => handleComplete(r.id)}
                    >
                      Concluir Locação
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
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
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--amber-500)',
    color: '#fff',
    borderRadius: '999px',
    fontSize: '0.65rem',
    fontWeight: 700,
    padding: '0.1rem 0.45rem',
    marginLeft: '0.4rem',
    lineHeight: 1,
  },
  cardTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--green-900)',
    marginTop: '0.4rem',
    lineHeight: 1.3,
  },
  cardSub: {
    fontSize: '0.84rem',
    color: 'var(--gray-600)',
    marginTop: '0.15rem',
  },
  rentalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
};
