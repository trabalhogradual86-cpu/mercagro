import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Trator', 'Colheitadeira', 'Plantadeira', 'Pulverizador', 'Grades', 'Implemento', 'Outro'];
const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const EMPTY_FORM = {
  name: '', brand: '', model: '', year: '', category: 'Trator',
  description: '', daily_rate: '', location_city: '', location_state: '',
};

export default function EquipmentForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(isEditing ? null : EMPTY_FORM);
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState('');
  const [aiPriceSuggestion, setAiPriceSuggestion] = useState(null);
  const [loadingAiPrice, setLoadingAiPrice] = useState(false);

  useEffect(() => {
    if (!isEditing) return;
    async function load() {
      try {
        const data = await api.get(`/api/equipment/${id}`);
        if (data.owner_id !== user?.id) {
          navigate('/meus-equipamentos');
          return;
        }
        setForm({
          name: data.name || '',
          brand: data.brand || '',
          model: data.model || '',
          year: data.year || '',
          category: data.category || 'Trator',
          description: data.description || '',
          daily_rate: data.daily_rate || '',
          location_city: data.location_city || '',
          location_state: data.location_state || '',
        });
        setPhotos(data.photos || []);
      } catch {
        setError('Equipamento não encontrado.');
      } finally {
        setFetching(false);
      }
    }
    load();
  }, [id, user, isEditing, navigate]);

  async function handleAiPrice() {
    if (!form?.category || !form?.location_state) return;
    setLoadingAiPrice(true);
    setAiPriceSuggestion(null);
    try {
      const result = await api.post('/api/ai/price', {
        equipment_category: form.category,
        brand: form.brand || '',
        model: form.model || '',
        year: form.year ? Number(form.year) : null,
        location_state: form.location_state,
      });
      setAiPriceSuggestion(result);
      if (result.daily_rate_suggested) {
        setForm(f => ({ ...f, daily_rate: String(result.daily_rate_suggested) }));
      }
    } catch {
      setAiPriceSuggestion({ error: true });
    } finally {
      setLoadingAiPrice(false);
    }
  }

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

  function removePhoto(url) {
    setPhotos(prev => prev.filter(p => p !== url));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isEditing) {
        await api.put(`/api/equipment/${id}`, {
          ...form,
          year: Number(form.year) || null,
          daily_rate: Number(form.daily_rate),
          photos,
        });
        navigate(`/equipamentos/${id}`);
      } else {
        const data = await api.post('/api/equipment', {
          ...form,
          year: Number(form.year) || null,
          daily_rate: Number(form.daily_rate),
          photos,
        });
        navigate(`/equipamentos/${data.id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (fetching) return <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>Carregando...</div>;
  if (isEditing && !form) return <div style={{ textAlign: 'center', padding: '4rem', color: '#ef4444' }}>{error}</div>;

  return (
    <div style={{ maxWidth: 700, margin: '2rem auto', padding: '0 1rem' }}>
      <h1 className="page-title">{isEditing ? 'Editar Equipamento' : 'Cadastrar Equipamento'}</h1>
      <div className="card" style={{ padding: 'var(--space-lg)' }}>
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
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <input
                type="number" required min="1" step="0.01" value={form.daily_rate}
                onChange={e => setForm({ ...form, daily_rate: e.target.value })}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={handleAiPrice}
                disabled={loadingAiPrice || !form.category || !form.location_state}
                title={!form.location_state ? 'Selecione o estado primeiro' : 'Sugerir preço com base em IA'}
                style={{
                  padding: '0.55rem 0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--green-200)',
                  background: loadingAiPrice ? '#f0fdf4' : 'var(--green-50)',
                  color: 'var(--green-700)',
                  cursor: (!form.category || !form.location_state) ? 'not-allowed' : 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  opacity: (!form.category || !form.location_state) ? 0.5 : 1,
                }}
              >
                {loadingAiPrice ? 'Consultando...' : 'Sugerir com IA'}
              </button>
            </div>
            {aiPriceSuggestion && !aiPriceSuggestion.error && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.6rem 0.8rem',
                background: '#f0fdf4',
                border: '1px solid var(--green-200)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.83rem',
                color: 'var(--green-800)',
                lineHeight: 1.5,
              }}>
                <strong>Faixa sugerida:</strong> R$ {aiPriceSuggestion.daily_rate_min} – R$ {aiPriceSuggestion.daily_rate_max}/dia
                &nbsp;&nbsp;·&nbsp;&nbsp;
                <strong>Recomendado:</strong> R$ {aiPriceSuggestion.daily_rate_suggested}/dia
                {aiPriceSuggestion.justification && (
                  <p style={{ margin: '0.3rem 0 0', color: 'var(--green-700)', fontSize: '0.8rem' }}>
                    {aiPriceSuggestion.justification}
                  </p>
                )}
              </div>
            )}
            {aiPriceSuggestion?.error && (
              <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '0.35rem' }}>
                Não foi possível consultar a IA agora. Defina o valor manualmente.
              </p>
            )}
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
                <div key={i} style={{ position: 'relative' }}>
                  <img src={url} alt="foto" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6 }} />
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => removePhoto(url)}
                      style={{
                        position: 'absolute', top: -6, right: -6, background: '#ef4444', color: '#fff',
                        border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer',
                        fontSize: '0.7rem', lineHeight: '20px', padding: 0,
                      }}
                    >×</button>
                  )}
                </div>
              ))}
            </div>
          </div>
          {error && <p className="error-msg">{error}</p>}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {isEditing && (
              <button
                type="button"
                onClick={() => navigate(`/equipamentos/${id}`)}
                style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', color: '#374151' }}
              >
                Cancelar
              </button>
            )}
            <button type="submit" className="btn btn-primary" disabled={loading || uploading}>
              {loading
                ? (isEditing ? 'Salvando...' : 'Cadastrando...')
                : (isEditing ? 'Salvar alterações' : 'Cadastrar Equipamento')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
