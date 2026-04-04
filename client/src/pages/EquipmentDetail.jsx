import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function EquipmentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState(null);
  const [rental, setRental] = useState({ start_date: '', end_date: '' });
  const [aiPrice, setAiPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [renting, setRenting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/api/equipment/${id}`)
      .then(data => setEquipment(data))
      .catch(() => setEquipment(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function fetchAiPrice() {
    if (!equipment) return;
    try {
      const result = await api.post('/api/ai/price', {
        equipment_category: equipment.category,
        brand: equipment.brand,
        model: equipment.model,
        year: equipment.year,
        location_state: equipment.location_state,
      });
      setAiPrice(result);
    } catch {
      setAiPrice({ unavailable: true });
    }
  }

  async function handleRent(e) {
    e.preventDefault();
    setError('');
    setRenting(true);
    try {
      await api.post('/api/rentals', { equipment_id: id, ...rental });
      setSuccess('Solicitação enviada. Aguarde a confirmação do proprietário.');
    } catch (err) {
      setError(err.message);
    } finally {
      setRenting(false);
    }
  }

  const totalDays = rental.start_date && rental.end_date
    ? Math.ceil((new Date(rental.end_date) - new Date(rental.start_date)) / 86400000)
    : 0;

  if (loading) return <div className="loading">Carregando equipamento...</div>;
  if (!equipment) return <div className="empty-state"><p>Equipamento não encontrado.</p></div>;

  return (
    <div>
      <button onClick={() => navigate(-1)} style={s.back}>← Voltar</button>

      <div style={s.layout}>
        {/* Left — details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {equipment.photos?.[0] ? (
              <img
                src={equipment.photos[0]}
                alt={equipment.name}
                style={{ width: '100%', height: 320, objectFit: 'cover' }}
              />
            ) : (
              <div style={{ height: 240, background: 'var(--green-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)', fontSize: '0.9rem' }}>
                Sem foto
              </div>
            )}
            <div style={{ padding: 'var(--space-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="badge badge-green">{equipment.category}</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--gray-600)' }}>
                  {equipment.location_city}, {equipment.location_state}
                </span>
              </div>

              <h1 style={s.title}>{equipment.name}</h1>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                {[equipment.brand, equipment.model, equipment.year].filter(Boolean).join(' · ')}
              </p>

              {equipment.description && (
                <p style={{ marginTop: '1rem', lineHeight: 1.7, color: 'var(--gray-700)', fontSize: '0.92rem' }}>
                  {equipment.description}
                </p>
              )}
            </div>
          </div>

          {/* AI price panel */}
          {aiPrice && (
            <div className={`card ${aiPrice.unavailable ? '' : 'ai-panel'}`}>
              {aiPrice.unavailable ? (
                <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                  Análise por IA indisponível no momento.
                </p>
              ) : (
                <>
                  <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--green-700)', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Análise de preço por IA
                  </p>
                  <p style={{ fontSize: '0.92rem', color: 'var(--gray-800)' }}>
                    Faixa: <strong>R$ {aiPrice.daily_rate_min} – R$ {aiPrice.daily_rate_max}/dia</strong>
                    &nbsp;&nbsp;·&nbsp;&nbsp;
                    Sugerido: <strong style={{ color: 'var(--green-700)' }}>R$ {aiPrice.daily_rate_suggested}/dia</strong>
                  </p>
                  {aiPrice.justification && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: '0.4rem', lineHeight: 1.6 }}>
                      {aiPrice.justification}
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Right — price + rental form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <p style={{ fontSize: '0.72rem', color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Diária</p>
            <p className="price-tag" style={{ fontSize: '1.7rem', margin: '0.25rem 0 0.75rem' }}>
              R$ {Number(equipment.daily_rate).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              <span>/dia</span>
            </p>

            {user && !aiPrice && (
              <button className="btn btn-outline" style={{ width: '100%', fontSize: '0.85rem' }} onClick={fetchAiPrice}>
                Verificar preço com IA
              </button>
            )}
          </div>

          {user && equipment.status === 'available' && !success && (
            <div className="card">
              <h3 style={s.sectionTitle}>Solicitar Locação</h3>
              <form onSubmit={handleRent}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label>Início</label>
                    <input
                      type="date"
                      required
                      value={rental.start_date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => {
                        const newStart = e.target.value;
                        // Se a data de término já está preenchida e é antes da nova data de início, limpa
                        const newEnd = rental.end_date && rental.end_date <= newStart ? '' : rental.end_date;
                        setRental({ start_date: newStart, end_date: newEnd });
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Término</label>
                    <input
                      type="date"
                      required
                      value={rental.end_date}
                      min={rental.start_date
                        ? new Date(new Date(rental.start_date).getTime() + 86400000).toISOString().split('T')[0]
                        : new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                      onChange={e => setRental({ ...rental, end_date: e.target.value })}
                    />
                  </div>
                </div>

                {totalDays > 0 && (
                  <div style={s.totalBox}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>{totalDays} dia{totalDays !== 1 ? 's' : ''}</span>
                    <span style={{ fontWeight: 700, color: 'var(--green-800)' }}>
                      R$ {(totalDays * equipment.daily_rate).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {error && <p className="error-msg">{error}</p>}
                <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '0.75rem' }} disabled={renting}>
                  {renting ? 'Enviando...' : 'Solicitar Locação'}
                </button>
              </form>
            </div>
          )}

          {success && (
            <div className="card" style={{ borderLeft: '3px solid var(--green-600)', background: 'var(--green-50)' }}>
              <p style={{ color: 'var(--green-800)', fontSize: '0.92rem' }}>{success}</p>
            </div>
          )}

          {equipment.status !== 'available' && (
            <div className="card">
              <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                Este equipamento não está disponível para locação no momento.
              </p>
            </div>
          )}

          {!user && (
            <div className="card">
              <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                <a href="/entrar" style={{ color: 'var(--green-700)' }}>Entre na plataforma</a> para solicitar a locação deste equipamento.
              </p>
            </div>
          )}
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
    gridTemplateColumns: '1fr 320px',
    gap: '1.5rem',
    alignItems: 'start',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.6rem',
    fontWeight: 700,
    color: 'var(--green-900)',
    lineHeight: 1.25,
    marginTop: '0.5rem',
  },
  sectionTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--green-900)',
    marginBottom: '1rem',
  },
  totalBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'var(--green-50)',
    border: '1px solid var(--green-100)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.6rem 0.9rem',
    marginTop: '0.5rem',
  },
};
