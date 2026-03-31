import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const USER_TYPE_LABELS = {
  producer: 'Produtor rural — quero alugar equipamentos',
  owner: 'Proprietário — tenho máquinas para alugar',
  both: 'Ambos',
};

export default function Profile() {
  const { profile, fetchProfile, user } = useAuth();
  const [form, setForm] = useState({ full_name: '', location_city: '', location_state: '', user_type: 'producer' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        location_city: profile.location_city || '',
        location_state: profile.location_state || '',
        user_type: profile.user_type || 'producer',
      });
    }
  }, [profile]);

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.post('/api/auth/profile', form);
      await fetchProfile(user.id);
      setSuccess('Perfil atualizado com sucesso!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '0 1rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginBottom: '0.25rem' }}>Meu Perfil</h1>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Atualize seus dados cadastrais</p>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome completo</label>
            <input required value={form.full_name} onChange={set('full_name')} />
          </div>

          <div className="form-group">
            <label>CPF / CNPJ</label>
            <input value={profile?.cpf_cnpj || ''} disabled style={{ background: '#f9fafb', color: '#9ca3af' }} />
            <small style={{ color: '#9ca3af' }}>Documento não pode ser alterado</small>
          </div>

          <div className="form-group">
            <label>E-mail</label>
            <input value={user?.email || ''} disabled style={{ background: '#f9fafb', color: '#9ca3af' }} />
          </div>

          <div className="form-group">
            <label>Perfil de usuário</label>
            <select value={form.user_type} onChange={set('user_type')}>
              {Object.entries(USER_TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label>Cidade</label>
              <input required value={form.location_city} onChange={set('location_city')} />
            </div>
            <div className="form-group">
              <label>Estado</label>
              <select required value={form.location_state} onChange={set('location_state')}>
                <option value="">UF</option>
                {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
          </div>

          {success && (
            <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#065f46' }}>
              {success}
            </div>
          )}
          {error && <p className="error-msg">{error}</p>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>
      </div>
    </div>
  );
}
