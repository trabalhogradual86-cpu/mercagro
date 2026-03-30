import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    email: '', password: '', full_name: '', cpf_cnpj: '',
    user_type: 'producer', location_city: '', location_state: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signUp(form.email, form.password);
      await api.post('/api/auth/profile', {
        full_name: form.full_name,
        cpf_cnpj: form.cpf_cnpj,
        user_type: form.user_type,
        location_city: form.location_city,
        location_state: form.location_state,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  }

  const estados = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 500 }}>
        <h1 style={{ marginBottom: '1.5rem', fontSize: '1.4rem' }}>Criar conta no Mercagro</h1>
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Nome completo</label>
            <input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>CPF ou CNPJ</label>
            <input required value={form.cpf_cnpj} onChange={e => setForm({ ...form, cpf_cnpj: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Você é:</label>
            <select value={form.user_type} onChange={e => setForm({ ...form, user_type: e.target.value })}>
              <option value="producer">Produtor Rural (quero alugar)</option>
              <option value="owner">Proprietário (tenho máquinas para alugar)</option>
              <option value="both">Ambos</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.8rem' }}>
            <div className="form-group">
              <label>Cidade</label>
              <input required value={form.location_city} onChange={e => setForm({ ...form, location_city: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Estado</label>
              <select required value={form.location_state} onChange={e => setForm({ ...form, location_state: e.target.value })}>
                <option value="">UF</option>
                {estados.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>E-mail</label>
            <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Senha</label>
            <input type="password" required minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>
        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
