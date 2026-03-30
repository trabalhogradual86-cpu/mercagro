import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function MyEquipment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('equipment');

  useEffect(() => {
    Promise.all([
      supabase.from('equipment').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
      api.get('/api/rentals/incoming'),
    ]).then(([{ data: eq }, rent]) => {
      setEquipment(eq || []);
      setIncoming(rent || []);
      setLoading(false);
    });
  }, [user.id]);

  async function handleConfirm(id) {
    await api.patch(`/api/rentals/${id}/confirm`);
    setIncoming(prev => prev.map(r => r.id === id ? { ...r, status: 'confirmed' } : r));
  }

  async function handleCancel(id) {
    if (!confirm('Recusar esta solicitação?')) return;
    await api.patch(`/api/rentals/${id}/cancel`);
    setIncoming(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
  }

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Meu Painel de Proprietário</h1>
        <button className="btn-primary" onClick={() => navigate('/equipment/new')}>+ Novo Equipamento</button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button className={tab === 'equipment' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('equipment')}>
          Meus Equipamentos ({equipment.length})
        </button>
        <button className={tab === 'rentals' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('rentals')}>
          Solicitações ({incoming.filter(r => r.status === 'pending').length})
        </button>
      </div>

      {tab === 'equipment' && (
        equipment.length === 0 ? (
          <p style={{ color: '#666' }}>Você ainda não cadastrou equipamentos.</p>
        ) : (
          <div className="grid">
            {equipment.map(eq => (
              <div key={eq.id} className="card" style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/equipment/${eq.id}`)}>
                <span className={`badge ${eq.status === 'available' ? 'badge-green' : eq.status === 'rented' ? 'badge-orange' : 'badge-gray'}`}>
                  {eq.status}
                </span>
                <h3 style={{ marginTop: '0.4rem' }}>{eq.name}</h3>
                <p style={{ color: '#666', fontSize: '0.88rem' }}>{eq.brand} {eq.model}</p>
                <p style={{ fontWeight: 600, color: '#2d7a22', marginTop: '0.4rem' }}>R$ {Number(eq.daily_rate).toFixed(2)}/dia</p>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'rentals' && (
        incoming.length === 0 ? (
          <p style={{ color: '#666' }}>Nenhuma solicitação recebida.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {incoming.map(r => (
              <div key={r.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span className={`badge ${r.status === 'pending' ? 'badge-orange' : r.status === 'confirmed' ? 'badge-blue' : 'badge-gray'}`}>
                      {r.status === 'pending' ? 'Pendente' : r.status === 'confirmed' ? 'Confirmado' : r.status}
                    </span>
                    <h3 style={{ marginTop: '0.4rem' }}>{r.equipment?.name}</h3>
                    <p style={{ color: '#666', fontSize: '0.88rem' }}>Solicitante: {r.profiles?.full_name || '—'}</p>
                    <p style={{ color: '#666', fontSize: '0.85rem' }}>{r.start_date} → {r.end_date}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 700, fontSize: '1.1rem', color: '#2d7a22' }}>R$ {Number(r.total_amount).toFixed(2)}</p>
                  </div>
                </div>
                {r.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem' }}>
                    <button className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}
                      onClick={() => handleConfirm(r.id)}>Confirmar</button>
                    <button className="btn-danger" style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}
                      onClick={() => handleCancel(r.id)}>Recusar</button>
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
