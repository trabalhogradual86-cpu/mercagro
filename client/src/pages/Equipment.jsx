import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Trator', 'Colheitadeira', 'Plantadeira', 'Pulverizador', 'Grades', 'Implemento', 'Outro'];

export default function Equipment() {
  const [equipment, setEquipment] = useState([]);
  const [filters, setFilters] = useState({ category: '', city: '' });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchEquipment();
  }, [filters]);

  async function fetchEquipment() {
    setLoading(true);
    const params = new URLSearchParams({ status: 'available' });
    if (filters.category) params.append('category', filters.category);
    if (filters.city) params.append('city', filters.city);
    try {
      const data = await api.get(`/api/equipment?${params}`);
      setEquipment(data);
    } catch {
      setEquipment([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Equipamentos Disponíveis</h1>
        {user && (
          <button className="btn-primary" onClick={() => navigate('/equipment/new')}>+ Cadastrar equipamento</button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <select style={{ maxWidth: 200 }} value={filters.category}
          onChange={e => setFilters({ ...filters, category: e.target.value })}>
          <option value="">Todas as categorias</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input style={{ maxWidth: 200 }} placeholder="Filtrar por cidade..."
          value={filters.city} onChange={e => setFilters({ ...filters, city: e.target.value })} />
      </div>

      {loading ? (
        <div className="loading">Carregando equipamentos...</div>
      ) : equipment.length === 0 ? (
        <p style={{ color: '#666' }}>Nenhum equipamento encontrado.</p>
      ) : (
        <div className="grid">
          {equipment.map(eq => (
            <div key={eq.id} className="card" style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/equipment/${eq.id}`)}>
              {eq.photos?.[0] ? (
                <img src={eq.photos[0]} alt={eq.name}
                  style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8, marginBottom: '0.8rem' }} />
              ) : (
                <div style={{ width: '100%', height: 160, background: '#e8f5e9', borderRadius: 8, marginBottom: '0.8rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🚜</div>
              )}
              <span className="badge badge-green">{eq.category}</span>
              <h3 style={{ marginTop: '0.5rem' }}>{eq.name}</h3>
              <p style={{ color: '#666', fontSize: '0.9rem' }}>{eq.brand} {eq.model} {eq.year && `• ${eq.year}`}</p>
              <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                📍 {eq.location_city}, {eq.location_state}
              </p>
              <p style={{ fontWeight: 700, color: '#2d7a22', marginTop: '0.5rem', fontSize: '1.05rem' }}>
                R$ {Number(eq.daily_rate).toFixed(2)}<span style={{ fontWeight: 400, fontSize: '0.85rem', color: '#666' }}>/dia</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
