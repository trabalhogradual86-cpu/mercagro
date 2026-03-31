import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Trator', 'Colheitadeira', 'Plantadeira', 'Pulverizador', 'Grades', 'Implemento', 'Outro'];

function EquipmentCard({ eq, onClick }) {
  return (
    <div className="card card-hover" style={s.card} onClick={onClick}>
      {eq.photos?.[0] ? (
        <img src={eq.photos[0]} alt={eq.name} className="card-img" />
      ) : (
        <div className="card-img-placeholder">—</div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <span className="badge badge-green">{eq.category}</span>
        <span style={{ fontSize: '0.78rem', color: 'var(--gray-600)' }}>
          {eq.location_city}, {eq.location_state}
        </span>
      </div>

      <h3 style={s.cardTitle}>{eq.name}</h3>
      <p style={s.cardSub}>{[eq.brand, eq.model, eq.year].filter(Boolean).join(' · ')}</p>

      <div style={s.cardFooter}>
        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--gray-600)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Diária</span>
          <span className="price-tag">
            R$ {Number(eq.daily_rate).toFixed(2)} <span>/dia</span>
          </span>
        </div>
        <span style={s.cardArrow}>→</span>
      </div>
    </div>
  );
}

export default function Equipment() {
  const [equipment, setEquipment] = useState([]);
  const [filters, setFilters] = useState({ category: '', city: '' });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchEquipment();
  }, [filters]);

  async function fetchEquipment() {
    setLoading(true);
    setFetchError(false);
    const params = new URLSearchParams({ status: 'available' });
    if (filters.category) params.append('category', filters.category);
    if (filters.city) params.append('city', filters.city);
    try {
      const data = await api.get(`/api/equipment?${params}`);
      setEquipment(data);
    } catch {
      setEquipment([]);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={s.pageHeader}>
        <div>
          <p className="section-label">Catálogo</p>
          <h1 className="page-title" style={{ margin: '0.3rem 0 0' }}>Equipamentos Disponíveis</h1>
        </div>
        {user && (
          <button className="btn btn-primary" onClick={() => navigate('/equipment/new')}>
            + Cadastrar Equipamento
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={s.filters}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
          <select
            style={{ maxWidth: 220, background: 'var(--white)' }}
            value={filters.category}
            onChange={e => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">Todas as categorias</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <input
            style={{ maxWidth: 220 }}
            placeholder="Filtrar por cidade..."
            value={filters.city}
            onChange={e => setFilters({ ...filters, city: e.target.value })}
          />
        </div>
        {!loading && (
          <span style={{ fontSize: '0.85rem', color: 'var(--gray-600)', whiteSpace: 'nowrap' }}>
            {equipment.length} resultado{equipment.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="loading">Buscando equipamentos...</div>
      ) : fetchError ? (
        <div className="empty-state">
          <div className="empty-icon">⚠</div>
          <p>Não foi possível carregar os equipamentos.</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={fetchEquipment}>
            Tentar novamente
          </button>
        </div>
      ) : equipment.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">—</div>
          <p>Nenhum equipamento encontrado para os filtros selecionados.</p>
        </div>
      ) : (
        <div className="grid animate-fade-in">
          {equipment.map(eq => (
            <EquipmentCard key={eq.id} eq={eq} onClick={() => navigate(`/equipment/${eq.id}`)} />
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
  filters: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    marginBottom: 'var(--space-xl)',
    background: 'var(--white)',
    border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius-md)',
    padding: '0.9rem 1.2rem',
    flexWrap: 'wrap',
  },
  card: { cursor: 'pointer' },
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
    transition: 'transform .2s',
  },
};
