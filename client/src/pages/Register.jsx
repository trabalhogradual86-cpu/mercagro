import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '', password: '', full_name: '', cpf_cnpj: '',
    user_type: 'producer', location_city: '', location_state: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }));
  }

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
      navigate('/onboarding');
    } catch (err) {
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      {/* Left panel */}
      <div style={s.left}>
        <div style={s.leftContent}>
          <p style={s.leftEyebrow}>Mercagro</p>
          <h2 style={s.leftTitle}>Conectando o campo ao mercado digital</h2>
          <p style={s.leftSub}>Cadastre-se e acesse equipamentos agrícolas em todo o Brasil.</p>
        </div>
      </div>

      {/* Right panel */}
      <div style={s.right}>
        <div style={s.formWrap} className="animate-fade-up">
          <h1 style={s.formTitle}>Criar conta</h1>
          <p style={s.formSub}>Já tem conta? <Link to="/login">Entrar</Link></p>

          <form onSubmit={handleRegister} style={{ marginTop: '1.75rem' }}>
            <div className="form-group">
              <label>Nome completo</label>
              <input required placeholder="Seu nome" value={form.full_name} onChange={set('full_name')} />
            </div>

            <div className="form-group">
              <label>CPF ou CNPJ</label>
              <input required placeholder="000.000.000-00" value={form.cpf_cnpj} onChange={set('cpf_cnpj')} />
            </div>

            <div className="form-group">
              <label>Perfil</label>
              <select value={form.user_type} onChange={set('user_type')}>
                <option value="producer">Produtor rural — quero alugar equipamentos</option>
                <option value="owner">Proprietário — tenho máquinas para alugar</option>
                <option value="both">Ambos</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label>Cidade</label>
                <input required placeholder="Sua cidade" value={form.location_city} onChange={set('location_city')} />
              </div>
              <div className="form-group">
                <label>Estado</label>
                <select required value={form.location_state} onChange={set('location_state')}>
                  <option value="">UF</option>
                  {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>E-mail</label>
              <input type="email" required placeholder="seu@email.com" value={form.email} onChange={set('email')} />
            </div>

            <div className="form-group">
              <label>Senha</label>
              <input type="password" required minLength={6} placeholder="Mínimo 6 caracteres" value={form.password} onChange={set('password')} />
            </div>

            {error && <p className="error-msg" style={{ marginBottom: '1rem' }}>{error}</p>}

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    minHeight: 'calc(100vh - 64px)',
    margin: '0 calc(-1 * var(--space-lg))',
  },
  left: {
    background: 'linear-gradient(160deg, var(--green-900), var(--soil-700))',
    display: 'flex',
    alignItems: 'flex-end',
    padding: 'var(--space-2xl)',
  },
  leftContent: { maxWidth: 380 },
  leftEyebrow: {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--amber-400)',
    marginBottom: '1.5rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  leftTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(1.5rem, 3vw, 2rem)',
    fontWeight: 700,
    color: '#fff',
    lineHeight: 1.2,
    marginBottom: '1rem',
  },
  leftSub: {
    color: 'rgba(255,255,255,.6)',
    fontSize: '0.92rem',
    lineHeight: 1.6,
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-2xl)',
    background: 'var(--cream)',
    overflowY: 'auto',
  },
  formWrap: { width: '100%', maxWidth: 420 },
  formTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.7rem',
    fontWeight: 700,
    color: 'var(--green-900)',
    marginBottom: '0.4rem',
  },
  formSub: { fontSize: '0.9rem', color: 'var(--gray-600)' },
};
