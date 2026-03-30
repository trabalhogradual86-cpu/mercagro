import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Trator', 'Colheitadeira', 'Plantadeira', 'Pulverizador', 'Grades', 'Implemento', 'Outro'];
const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export default function EquipmentNew() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', brand: '', model: '', year: '', category: 'Trator',
    description: '', daily_rate: '', location_city: '', location_state: '',
  });
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handlePhotoUpload(e) {
    const files = Array.from(e.target.files);
    setUploading(true);
    const urls = [];
    for (const file of files) {
      const path = `equipment/${user.id}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from('equipment-photos').upload(path, file);
      if (!upErr) {
        const { data } = supabase.storage.from('equipment-photos').getPublicUrl(path);
        urls.push(data.publicUrl);
      }
    }
    setPhotos(prev => [...prev, ...urls]);
    setUploading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.post('/api/equipment', { ...form, year: Number(form.year) || null, daily_rate: Number(form.daily_rate), photos });
      navigate(`/equipment/${data.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: '2rem auto', padding: '0 1rem' }}>
      <h1 className="page-title">Cadastrar Equipamento</h1>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome do equipamento *</label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Categoria *</label>
            <select required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
            <div className="form-group">
              <label>Marca</label>
              <input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Modelo</label>
              <input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Ano</label>
              <input type="number" min="1950" max="2025" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Valor da diária (R$) *</label>
            <input type="number" required min="1" step="0.01" value={form.daily_rate}
              onChange={e => setForm({ ...form, daily_rate: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.8rem' }}>
            <div className="form-group">
              <label>Cidade *</label>
              <input required value={form.location_city} onChange={e => setForm({ ...form, location_city: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Estado *</label>
              <select required value={form.location_state} onChange={e => setForm({ ...form, location_state: e.target.value })}>
                <option value="">UF</option>
                {ESTADOS.map(uf => <option key={uf}>{uf}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Descrição</label>
            <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Fotos do equipamento</label>
            <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
            {uploading && <p style={{ color: '#666', fontSize: '0.85rem' }}>Enviando fotos...</p>}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {photos.map((url, i) => (
                <img key={i} src={url} alt="foto" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6 }} />
              ))}
            </div>
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading || uploading}>
            {loading ? 'Cadastrando...' : 'Cadastrar Equipamento'}
          </button>
        </form>
      </div>
    </div>
  );
}
