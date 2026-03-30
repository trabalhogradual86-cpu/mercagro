import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        <Link to="/" style={styles.logo}>🌾 Mercagro</Link>
        <nav style={styles.nav}>
          <Link to="/equipment">Equipamentos</Link>
          <Link to="/auctions">Leilões</Link>
          {user ? (
            <>
              <Link to="/dashboard">Painel</Link>
              <button onClick={handleSignOut} style={styles.btnOut}>Sair</button>
            </>
          ) : (
            <>
              <Link to="/login">Entrar</Link>
              <Link to="/register" style={styles.btnRegister}>Cadastrar</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

const styles = {
  header: {
    background: '#fff',
    borderBottom: '1px solid #e0e0e0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  inner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 1rem',
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    fontSize: '1.3rem',
    fontWeight: 700,
    color: '#2d7a22',
    textDecoration: 'none',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  btnOut: {
    background: 'none',
    color: '#d32f2f',
    padding: '0.3rem 0.8rem',
    border: '1px solid #d32f2f',
    borderRadius: 6,
  },
  btnRegister: {
    background: '#2d7a22',
    color: '#fff',
    padding: '0.4rem 0.9rem',
    borderRadius: 6,
    textDecoration: 'none',
  },
};
