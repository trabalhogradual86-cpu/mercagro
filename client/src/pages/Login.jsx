import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(form.email, form.password);
      navigate('/painel');
    } catch (err) {
      setError(err.message || 'E-mail ou senha incorretos');
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
          <h2 style={s.leftTitle}>O mercado digital do agronegócio brasileiro</h2>
          <p style={s.leftSub}>51+ equipamentos disponíveis em todo o Brasil</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={s.right}>
        <div style={s.formWrap} className="animate-fade-up">
          <h1 style={s.formTitle}>Entrar na plataforma</h1>
          <p style={s.formSub}>Não tem conta? <Link to="/cadastrar">Cadastre-se grátis</Link></p>

          <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
            <div className="form-group">
              <label>E-mail</label>
              <input
                type="email"
                placeholder="seu@email.com"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Senha</label>
              <input
                type="password"
                placeholder="••••••••"
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>

            {error && <p className="error-msg" style={{ marginBottom: '1rem' }}>{error}</p>}

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              style={{ marginTop: '0.5rem' }}
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div style={s.demoBox}>
            <p style={s.demoTitle}>Credenciais de demonstração</p>
            <div style={s.demoRow}>
              <span>Admin</span>
              <code>admin@mercagro.com · Admin@123456</code>
            </div>
            <div style={s.demoRow}>
              <span>Usuário</span>
              <code>usuario@mercagro.com · User@123456</code>
            </div>
          </div>
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
    background: 'linear-gradient(160deg, var(--green-900), var(--green-800))',
    display: 'flex',
    alignItems: 'flex-end',
    padding: 'var(--space-2xl)',
  },
  leftContent: { maxWidth: 380 },
  leftEyebrow: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--amber-400)',
    marginBottom: '1.5rem',
  },
  leftTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
    fontWeight: 700,
    color: '#fff',
    lineHeight: 1.2,
    marginBottom: '1rem',
  },
  leftSub: {
    color: 'rgba(255,255,255,.6)',
    fontSize: '0.92rem',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-2xl)',
    background: 'var(--cream)',
  },
  formWrap: { width: '100%', maxWidth: 400 },
  formTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.7rem',
    fontWeight: 700,
    color: 'var(--green-900)',
    marginBottom: '0.4rem',
  },
  formSub: { fontSize: '0.9rem', color: 'var(--gray-600)' },
  demoBox: {
    marginTop: '1.5rem',
    background: 'var(--green-50)',
    border: '1px solid var(--green-100)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.9rem 1rem',
  },
  demoTitle: {
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--gray-600)',
    marginBottom: '0.5rem',
  },
  demoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.78rem',
    padding: '0.25rem 0',
    color: 'var(--gray-600)',
  },
};
