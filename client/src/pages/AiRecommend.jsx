import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const CULTURAS = ['Soja', 'Milho', 'Cana-de-açúcar', 'Algodão', 'Trigo', 'Café', 'Arroz', 'Feijão', 'Sorgo', 'Girassol', 'Outra'];
const SOLOS = ['Argiloso', 'Arenoso', 'Franco-argiloso', 'Franco-arenoso', 'Humoso', 'Outro'];

export default function AiRecommend() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    crop_type: 'Soja',
    soil_type: 'Argiloso',
    area_ha: '',
    location_city: '',
    location_state: '',
    period: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) { navigate('/entrar'); return; }
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const data = await api.post('/api/ai/recommend', {
        ...form,
        area_ha: Number(form.area_ha),
      });
      setResult(data);
    } catch (err) {
      setError(err.message || 'Erro ao consultar a IA. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ padding: 'var(--space-xl) 0 var(--space-lg)' }}>
        <p className="section-label">Inteligência Artificial</p>
        <h1 className="page-title" style={{ margin: '0.3rem 0 0.5rem' }}>Consultor de Equipamentos</h1>
        <p style={{ color: 'var(--gray-600)', fontSize: '0.95rem' }}>
          Informe as características da sua lavoura e receba recomendações personalizadas de equipamentos.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
        <div className="card" style={{ padding: 'var(--space-lg)' }}>
          <h2 style={s.cardTitle}>Dados da lavoura</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label>Cultura *</label>
                <select required value={form.crop_type} onChange={set('crop_type')}>
                  {CULTURAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Tipo de solo *</label>
                <select required value={form.soil_type} onChange={set('soil_type')}>
                  {SOLOS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Área (hectares) *</label>
              <input
                type="number" required min="0.1" step="0.1"
                placeholder="Ex: 150"
                value={form.area_ha} onChange={set('area_ha')}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label>Cidade *</label>
                <input required placeholder="Sua cidade" value={form.location_city} onChange={set('location_city')} />
              </div>
              <div className="form-group">
                <label>Estado *</label>
                <select required value={form.location_state} onChange={set('location_state')}>
                  <option value="">UF</option>
                  {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Período de uso</label>
              <input
                placeholder="Ex: Plantio 2025/2026, out-nov"
                value={form.period} onChange={set('period')}
              />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Consultando IA...' : 'Receber recomendações'}
            </button>
            {!user && (
              <p style={{ fontSize: '0.83rem', color: 'var(--gray-500)', textAlign: 'center', marginTop: '0.75rem' }}>
                Você precisa estar logado para usar este recurso.
              </p>
            )}
          </form>
        </div>

        {loading && (
          <div className="card" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
            <div style={{ color: 'var(--gray-500)', fontSize: '0.95rem', padding: '2rem 0' }}>
              Consultando inteligência artificial...
            </div>
          </div>
        )}

        {result && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {result.recommendations?.map((rec, i) => (
              <div key={i} className="card animate-fade-in" style={{ padding: 'var(--space-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <h3 style={s.recTitle}>{rec.equipment_type}</h3>
                  {rec.priority && (
                    <span style={{
                      fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                      background: rec.priority === 'alta' ? '#d1fae5' : '#fef3c7',
                      color: rec.priority === 'alta' ? '#065f46' : '#92400e',
                      whiteSpace: 'nowrap',
                      textTransform: 'capitalize',
                    }}>
                      Prioridade {rec.priority}
                    </span>
                  )}
                </div>
                {rec.reason && (
                  <p style={{ fontSize: '0.88rem', color: 'var(--gray-600)', marginTop: '0.4rem', lineHeight: 1.6 }}>
                    {rec.reason}
                  </p>
                )}
                {rec.suggested_specs && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--gray-500)', marginTop: '0.35rem', fontStyle: 'italic' }}>
                    Especificação sugerida: {rec.suggested_specs}
                  </p>
                )}
                <button
                  className="btn"
                  style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: 'var(--green-700)', border: '1px solid var(--green-200)', background: 'var(--green-50)', padding: '0.3rem 0.9rem' }}
                  onClick={() => navigate(`/equipamentos?category=${encodeURIComponent(rec.equipment_type)}`)}
                >
                  Buscar este equipamento →
                </button>
              </div>
            ))}

            {result.tips && (
              <div className="card animate-fade-in" style={{ padding: 'var(--space-md)', background: '#fffbeb', border: '1px solid #fde68a' }}>
                <h3 style={{ ...s.recTitle, color: '#92400e', marginBottom: '0.5rem' }}>Dicas adicionais</h3>
                <p style={{ fontSize: '0.88rem', color: '#78350f', lineHeight: 1.7 }}>{result.tips}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  cardTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.05rem',
    fontWeight: 700,
    color: 'var(--green-900)',
    marginBottom: '1rem',
  },
  recTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.98rem',
    fontWeight: 700,
    color: 'var(--green-900)',
  },
};
