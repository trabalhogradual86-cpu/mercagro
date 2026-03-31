import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <header style={s.header}>
      <div style={s.inner}>
        {/* Logo */}
        <Link to="/" style={s.logo}>
          <span style={s.logoIcon}>🌾</span>
          <span style={s.logoText}>Mercagro</span>
        </Link>

        {/* Nav */}
        <nav style={s.nav}>
          <Link to="/equipment" style={{ ...s.navLink, ...(isActive('/equipment') ? s.navLinkActive : {}) }}>
            Equipamentos
          </Link>
          <Link to="/auctions" style={{ ...s.navLink, ...(isActive('/auctions') ? s.navLinkActive : {}) }}>
            Leilões
            <span style={s.liveDot} />
          </Link>

          {user ? (
            <>
              <Link to="/dashboard" style={{ ...s.navLink, ...(isActive('/dashboard') ? s.navLinkActive : {}) }}>
                Painel
              </Link>
              <div style={s.userMenu}>
                <button style={s.avatarBtn} onClick={() => setMenuOpen(!menuOpen)}>
                  <span style={s.avatarCircle}>
                    {profile?.full_name?.[0]?.toUpperCase() || '?'}
                  </span>
                </button>
                {menuOpen && (
                  <div style={s.dropdown} onClick={() => setMenuOpen(false)}>
                    <p style={s.dropdownName}>{profile?.full_name || user.email}</p>
                    <div style={s.dropdownDivider} />
                    <Link to="/profile" style={s.dropdownItem}>Meu Perfil</Link>
                    <Link to="/my-rentals" style={s.dropdownItem}>Minhas Locações</Link>
                    {(profile?.user_type === 'owner' || profile?.user_type === 'both') && (
                      <Link to="/my-equipment" style={s.dropdownItem}>Meus Equipamentos</Link>
                    )}
                    {profile?.is_admin && (
                      <>
                        <div style={s.dropdownDivider} />
                        <Link to="/admin" style={{ ...s.dropdownItem, color: '#16a34a', fontWeight: 600 }}>
                          ⚙ Painel Admin
                        </Link>
                      </>
                    )}
                    <div style={s.dropdownDivider} />
                    <button style={s.dropdownItemDanger} onClick={handleSignOut}>Sair</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" style={s.navLink}>Entrar</Link>
              <Link to="/register" style={s.btnRegister} className="btn btn-primary btn-sm">
                Cadastrar
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

const s = {
  header: {
    background: 'rgba(255,255,255,0.96)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--gray-200)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  inner: {
    maxWidth: 1240,
    margin: '0 auto',
    padding: '0 1.5rem',
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    textDecoration: 'none',
  },
  logoIcon: { fontSize: '1.4rem' },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.35rem',
    fontWeight: 700,
    color: 'var(--green-800)',
    letterSpacing: '-0.02em',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    padding: '0.4rem 0.8rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.9rem',
    fontWeight: 500,
    color: 'var(--gray-700, #4a4740)',
    textDecoration: 'none',
    transition: 'background .15s, color .15s',
    position: 'relative',
  },
  navLinkActive: {
    color: 'var(--green-800)',
    background: 'var(--green-50)',
    fontWeight: 600,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#e53935',
    animation: 'pulse 1.8s ease infinite',
    flexShrink: 0,
  },
  btnRegister: {
    marginLeft: '0.5rem',
    textDecoration: 'none',
  },
  userMenu: { position: 'relative', marginLeft: '0.4rem' },
  avatarBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  avatarCircle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'var(--green-800)',
    color: '#fff',
    fontWeight: 700,
    fontSize: '0.88rem',
    fontFamily: 'var(--font-body)',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    background: '#fff',
    border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-lg)',
    minWidth: 200,
    overflow: 'hidden',
    zIndex: 200,
  },
  dropdownName: {
    padding: '0.75rem 1rem',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--gray-800)',
  },
  dropdownDivider: { height: 1, background: 'var(--gray-200)' },
  dropdownItem: {
    display: 'block',
    padding: '0.6rem 1rem',
    fontSize: '0.88rem',
    color: 'var(--gray-700, #4a4740)',
    textDecoration: 'none',
    transition: 'background .15s',
  },
  dropdownItemDanger: {
    display: 'block',
    width: '100%',
    padding: '0.6rem 1rem',
    textAlign: 'left',
    fontSize: '0.88rem',
    color: 'var(--red-600)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  },
};
