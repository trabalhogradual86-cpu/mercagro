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
    api.get(`/api/equipment/${id}`).then(data => {
      setEquipment(data);
      setLoading(false);
    });
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
      setAiPrice(null);
    }
  }

  async function handleRent(e) {
    e.preventDefault();
    setError('');
    setRenting(true);
    try {
      await api.post('/api/rentals', { equipment_id: id, ...rental });
      setSuccess('Solicitação de locação enviada! Aguarde a confirmação do proprietário.');
    } catch (err) {
      setError(err.message);
    } finally {
      setRenting(false);
    }
  }

  if (loading) return <div className="loading">Carregando...</div>;
  if (!equipment) return <p>Equipamento não encontrado.</p>;

  return (
    <div style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', color: '#2d7a22', marginBottom: '1rem' }}>← Voltar</button>

      <div className="card">
        {equipment.photos?.[0] && (
          <img src={equipment.photos[0]} alt={equipment.name}
            style={{ width: '100%', height: 300, objectFit: 'cover', borderRadius: 8, marginBottom: '1rem' }} />
        )}

        <span className="badge badge-green">{equipment.category}</span>
        <h1 style={{ fontSize: '1.6rem', margin: '0.5rem 0' }}>{equipment.name}</h1>
        <p style={{ color: '#666' }}>{equipment.brand} {equipment.model} {equipment.year && `• ${equipment.year}`}</p>
        <p style={{ color: '#666', marginTop: '0.3rem' }}>📍 {equipment.location_city}, {equipment.location_state}</p>
        {equipment.description && <p style={{ marginTop: '1rem', lineHeight: 1.6 }}>{equipment.description}</p>}

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <p style={{ fontWeight: 700, fontSize: '1.4rem', color: '#2d7a22' }}>
            R$ {Number(equipment.daily_rate).toFixed(2)}<span style={{ fontWeight: 400, fontSize: '0.9rem', color: '#666' }}>/dia</span>
          </p>
          {user && !aiPrice && (
            <button className="btn-secondary" onClick={fetchAiPrice}>Verificar preço com IA</button>
          )}
        </div>

        {aiPrice && (
          <div style={{ background: '#e8f5e9', borderRadius: 8, padding: '1rem', marginTop: '1rem' }}>
            <strong>Análise de Preço por IA</strong>
            <p style={{ fontSize: '0.9rem', marginTop: '0.3rem' }}>
              Faixa: R$ {aiPrice.daily_rate_min} – R$ {aiPrice.daily_rate_max}/dia | Sugerido: <strong>R$ {aiPrice.daily_rate_suggested}/dia</strong>
            </p>
            <p style={{ fontSize: '0.85rem', color: '#555', marginTop: '0.3rem' }}>{aiPrice.justification}</p>
          </div>
        )}

        {user && equipment.status === 'available' && (
          <form onSubmit={handleRent} style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Solicitar Locação</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <div className="form-group">
                <label>Data de início</label>
                <input type="date" required value={rental.start_date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setRental({ ...rental, start_date: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Data de término</label>
                <input type="date" required value={rental.end_date}
                  min={rental.start_date || new Date().toISOString().split('T')[0]}
                  onChange={e => setRental({ ...rental, end_date: e.target.value })} />
              </div>
            </div>
            {rental.start_date && rental.end_date && (
              <p style={{ color: '#2d7a22', fontWeight: 600 }}>
                Total estimado: R$ {(
                  Math.ceil((new Date(rental.end_date) - new Date(rental.start_date)) / 86400000) * equipment.daily_rate
                ).toFixed(2)}
              </p>
            )}
            {error && <p className="error-msg">{error}</p>}
            {success && <p style={{ color: '#2d7a22', marginTop: '0.5rem' }}>{success}</p>}
            <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }} disabled={renting}>
              {renting ? 'Enviando...' : 'Solicitar Locação'}
            </button>
          </form>
        )}

        {!user && (
          <p style={{ marginTop: '1rem', color: '#666' }}>
            <a href="/login">Entre</a> para solicitar a locação deste equipamento.
          </p>
        )}
      </div>
    </div>
  );
}
