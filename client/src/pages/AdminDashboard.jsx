import { useState, useEffect } from 'react';
import { api } from '../lib/api';

const STATUS_LABELS = {
  pending:   'Pendente',
  confirmed: 'Confirmada',
  active:    'Ativa',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  scheduled: 'Agendado',
  finished:  'Encerrado',
  available: 'Disponível',
  rented:    'Alugado',
  auction:   'Em Leilão',
  inactive:  'Inativo',
  approved:  'Aprovado',
  rejected:  'Rejeitado',
};

const USER_TYPE_LABELS = {
  producer: 'Produtor',
  owner:    'Proprietário',
  both:     'Ambos',
};

const TABS = ['Visão Geral', 'Usuários', 'Equipamentos', 'Locações', 'Leilões', 'Contabilidade'];

const STATUS_BADGE_CLASS = {
  pending:   'badge badge-amber',
  confirmed: 'badge badge-blue',
  active:    'badge badge-green',
  approved:  'badge badge-green',
  completed: 'badge badge-gray',
  finished:  'badge badge-gray',
  cancelled: 'badge badge-red',
  rejected:  'badge badge-red',
  scheduled: 'badge badge-blue',
  available: 'badge badge-green',
  rented:    'badge badge-amber',
  auction:   'badge badge-orange',
  inactive:  'badge badge-gray',
};

function StatusBadge({ value }) {
  return (
    <span className={STATUS_BADGE_CLASS[value] || 'badge badge-gray'}>
      {STATUS_LABELS[value] || value}
    </span>
  );
}

function StatCard({ icon, label, value, accent }) {
  return (
    <div className="card" style={{
      flex: 1,
      minWidth: 160,
      borderTop: `3px solid ${accent}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-xs)',
    }}>
      <div style={{ fontSize: '1.5rem' }}>{icon}</div>
      <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-600)' }}>
        {label}
      </p>
      <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--green-900)', lineHeight: 1 }}>
        {value}
      </p>
    </div>
  );
}

function TableWrapper({ headers, children, loading }) {
  if (loading) return <div className="loading">Carregando...</div>;
  return (
    <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ background: 'var(--gray-100)', textAlign: 'left' }}>
            {headers.map(h => (
              <th key={h} style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--gray-200)',
                color: 'var(--gray-600)',
                fontWeight: 600,
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

const tdStyle = { padding: '0.85rem 1rem', borderBottom: '1px solid var(--gray-100)', verticalAlign: 'middle' };

export default function AdminDashboard() {
  const [activeTab, setActiveTab]   = useState(0);
  const [stats, setStats]           = useState(null);
  const [users, setUsers]           = useState([]);
  const [equipment, setEquipment]   = useState([]);
  const [rentals, setRentals]       = useState([]);
  const [auctions, setAuctions]     = useState([]);
  const [accounting, setAccounting] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [message, setMessage]       = useState('');

  useEffect(() => { loadStats(); }, []);

  useEffect(() => {
    if (activeTab === 0) loadStats();
    if (activeTab === 1) loadUsers();
    if (activeTab === 2) loadEquipment();
    if (activeTab === 3) loadRentals();
    if (activeTab === 4) loadAuctions();
    if (activeTab === 5) loadAccounting();
  }, [activeTab]);

  async function loadStats()      { try { setStats(await api.get('/api/admin/stats')); } catch (e) { console.error(e); } }
  async function loadUsers()      { setLoading(true); try { setUsers(await api.get('/api/admin/users')); } catch (e) { console.error(e); } finally { setLoading(false); } }
  async function loadEquipment()  { setLoading(true); try { setEquipment(await api.get('/api/admin/equipment')); } catch (e) { console.error(e); } finally { setLoading(false); } }
  async function loadRentals()    { setLoading(true); try { setRentals(await api.get('/api/admin/rentals')); } catch (e) { console.error(e); } finally { setLoading(false); } }
  async function loadAuctions()   { setLoading(true); try { setAuctions(await api.get('/api/admin/auctions')); } catch (e) { console.error(e); } finally { setLoading(false); } }
  async function loadAccounting() { setLoading(true); try { setAccounting(await api.get('/api/admin/accounting')); } catch (e) { console.error(e); } finally { setLoading(false); } }

  function showMessage(msg) { setMessage(msg); setTimeout(() => setMessage(''), 3500); }

  async function handleBlockUser(id) {
    try {
      const updated = await api.patch(`/api/admin/users/${id}/block`);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_blocked: updated.is_blocked } : u));
      showMessage(updated.is_blocked ? 'Usuário bloqueado.' : 'Usuário desbloqueado.');
    } catch (e) { showMessage('Erro: ' + e.message); }
  }

  async function handleApproveEquipment(id) {
    try {
      await api.patch(`/api/admin/equipment/${id}/approve`);
      setEquipment(prev => prev.map(e => e.id === id ? { ...e, approval_status: 'approved' } : e));
      showMessage('Equipamento aprovado!');
    } catch (e) { showMessage('Erro: ' + e.message); }
  }

  async function handleRejectEquipment(id) {
    try {
      await api.patch(`/api/admin/equipment/${id}/reject`);
      setEquipment(prev => prev.map(e => e.id === id ? { ...e, approval_status: 'rejected' } : e));
      showMessage('Equipamento rejeitado.');
    } catch (e) { showMessage('Erro: ' + e.message); }
  }

  async function handleCancelRental(id) {
    if (!confirm('Cancelar esta locação?')) return;
    try {
      await api.patch(`/api/admin/rentals/${id}/cancel`);
      setRentals(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
      showMessage('Locação cancelada.');
    } catch (e) { showMessage('Erro: ' + e.message); }
  }

  async function handleCancelAuction(id) {
    if (!confirm('Cancelar este leilão?')) return;
    try {
      await api.patch(`/api/admin/auctions/${id}/cancel`);
      setAuctions(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
      showMessage('Leilão cancelado.');
    } catch (e) { showMessage('Erro: ' + e.message); }
  }

  const fmt     = v => `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`;
  const fmtDate = d => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div>
          <p className="section-label">Administração</p>
          <h1 className="page-title" style={{ margin: '0.3rem 0 0.25rem' }}>Painel Administrativo</h1>
          <p style={{ color: 'var(--gray-600)', fontSize: '0.92rem' }}>Gerenciamento completo da plataforma Mercagro</p>
        </div>
        {stats?.pendingEquipment > 0 && (
          <span className="badge badge-amber" style={{ fontSize: '0.82rem' }}>
            {stats.pendingEquipment} equipamento{stats.pendingEquipment > 1 ? 's' : ''} aguardando aprovação
          </span>
        )}
      </div>

      {/* Toast de feedback */}
      {message && (
        <div style={{
          background: 'var(--green-100)',
          border: '1px solid var(--green-400)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-sm)',
          marginBottom: 'var(--space-md)',
          color: 'var(--green-800)',
          fontWeight: 500,
          fontSize: '0.9rem',
          animation: 'fadeIn .3s ease',
        }}>
          {message}
        </div>
      )}

      {/* Tab bar */}
      <div className="tab-bar" style={{ marginTop: 'var(--space-lg)' }}>
        {TABS.map((tab, i) => (
          <button
            key={i}
            className={`tab-btn${activeTab === i ? ' active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Visão Geral ─────────────────────────────────────────────── */}
      {activeTab === 0 && (
        <div className="animate-fade-in">
          {stats ? (
            <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', marginBottom: 'var(--space-xl)' }}>
              <StatCard icon="👥" label="Usuários cadastrados" value={stats.totalUsers}     accent="var(--green-500)" />
              <StatCard icon="🚜" label="Equipamentos"         value={stats.totalEquipment} accent="var(--green-700)" />
              <StatCard icon="⏳" label="Aguardando aprovação" value={stats.pendingEquipment} accent="var(--amber-500)" />
              <StatCard icon="📋" label="Locações ativas"      value={stats.activeRentals}  accent="var(--green-600)" />
              <StatCard icon="💰" label="Receita da plataforma"
                value={`R$ ${Number(stats.totalFees || 0).toFixed(2).replace('.', ',')}`}
                accent="var(--amber-600)"
              />
            </div>
          ) : (
            <div className="loading">Carregando estatísticas...</div>
          )}

          <div className="card" style={{ background: 'var(--green-50)', borderColor: 'var(--green-100)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--green-800)', marginBottom: 'var(--space-sm)' }}>
              Como usar o painel
            </h3>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 2, color: 'var(--gray-600)', fontSize: '0.9rem' }}>
              <li><strong style={{ color: 'var(--gray-800)' }}>Usuários:</strong> visualize e bloqueie contas de usuários</li>
              <li><strong style={{ color: 'var(--gray-800)' }}>Equipamentos:</strong> aprove ou rejeite novos cadastros</li>
              <li><strong style={{ color: 'var(--gray-800)' }}>Locações:</strong> monitore e cancele locações problemáticas</li>
              <li><strong style={{ color: 'var(--gray-800)' }}>Leilões:</strong> cancele leilões indevidos</li>
              <li><strong style={{ color: 'var(--gray-800)' }}>Contabilidade:</strong> acompanhe a receita (1% por locação)</li>
            </ul>
          </div>
        </div>
      )}

      {/* ── Usuários ────────────────────────────────────────────────── */}
      {activeTab === 1 && (
        <div className="animate-fade-in">
          <TableWrapper headers={['Nome', 'Tipo', 'Cidade / UF', 'Cadastro', 'Status', 'Ação']} loading={loading}>
            {users.map(u => (
              <tr key={u.id} style={{ background: u.is_blocked ? 'var(--red-100)' : undefined }}>
                <td style={tdStyle}>
                  <span style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{u.full_name}</span>
                  {u.is_admin && (
                    <span className="badge badge-amber" style={{ marginLeft: 8, fontSize: '0.68rem' }}>ADMIN</span>
                  )}
                </td>
                <td style={tdStyle}>{USER_TYPE_LABELS[u.user_type] || u.user_type}</td>
                <td style={{ ...tdStyle, color: 'var(--gray-600)' }}>{u.location_city || '—'} {u.location_state ? `/ ${u.location_state}` : ''}</td>
                <td style={{ ...tdStyle, color: 'var(--gray-600)', whiteSpace: 'nowrap' }}>{fmtDate(u.created_at)}</td>
                <td style={tdStyle}>
                  <StatusBadge value={u.is_blocked ? 'cancelled' : 'active'} />
                </td>
                <td style={tdStyle}>
                  {!u.is_admin && (
                    <button
                      className={`btn btn-sm ${u.is_blocked ? 'btn-ghost' : 'btn-danger'}`}
                      onClick={() => handleBlockUser(u.id)}
                    >
                      {u.is_blocked ? 'Desbloquear' : 'Bloquear'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && users.length === 0 && (
              <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: 'var(--gray-600)' }}>Nenhum usuário encontrado.</td></tr>
            )}
          </TableWrapper>
        </div>
      )}

      {/* ── Equipamentos ────────────────────────────────────────────── */}
      {activeTab === 2 && (
        <div className="animate-fade-in">
          <TableWrapper headers={['Equipamento', 'Proprietário', 'Categoria', 'Diária', 'Aprovação', 'Ações']} loading={loading}>
            {equipment.map(e => (
              <tr key={e.id}>
                <td style={tdStyle}>
                  <span style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{e.name}</span>
                  <br />
                  <small style={{ color: 'var(--gray-600)' }}>{[e.brand, e.model, e.year].filter(Boolean).join(' ')}</small>
                </td>
                <td style={{ ...tdStyle, color: 'var(--gray-600)' }}>{e.profiles?.full_name || '—'}</td>
                <td style={{ ...tdStyle, color: 'var(--gray-600)' }}>{e.category}</td>
                <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--green-800)' }}>{fmt(e.daily_rate)}</td>
                <td style={tdStyle}><StatusBadge value={e.approval_status} /></td>
                <td style={{ ...tdStyle }}>
                  {e.approval_status === 'pending' && (
                    <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                      <button className="btn btn-sm btn-ghost" onClick={() => handleApproveEquipment(e.id)}>
                        Aprovar
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleRejectEquipment(e.id)}>
                        Rejeitar
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!loading && equipment.length === 0 && (
              <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: 'var(--gray-600)' }}>Nenhum equipamento encontrado.</td></tr>
            )}
          </TableWrapper>
        </div>
      )}

      {/* ── Locações ────────────────────────────────────────────────── */}
      {activeTab === 3 && (
        <div className="animate-fade-in">
          <TableWrapper headers={['Equipamento', 'Locatário', 'Proprietário', 'Período', 'Total', 'Taxa (1%)', 'Status', 'Ação']} loading={loading}>
            {rentals.map(r => (
              <tr key={r.id}>
                <td style={{ ...tdStyle, fontWeight: 500 }}>{r.equipment?.name || '—'}</td>
                <td style={{ ...tdStyle, color: 'var(--gray-600)' }}>{r.renter?.full_name || '—'}</td>
                <td style={{ ...tdStyle, color: 'var(--gray-600)' }}>{r.owner?.full_name || '—'}</td>
                <td style={{ ...tdStyle, color: 'var(--gray-600)', whiteSpace: 'nowrap', fontSize: '0.83rem' }}>
                  {fmtDate(r.start_date)} – {fmtDate(r.end_date)}
                </td>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{fmt(r.total_amount)}</td>
                <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--green-700)' }}>{fmt(r.platform_fee)}</td>
                <td style={tdStyle}><StatusBadge value={r.status} /></td>
                <td style={tdStyle}>
                  {['pending', 'confirmed', 'active'].includes(r.status) && (
                    <button className="btn btn-sm btn-danger" onClick={() => handleCancelRental(r.id)}>
                      Cancelar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && rentals.length === 0 && (
              <tr><td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: 'var(--gray-600)' }}>Nenhuma locação encontrada.</td></tr>
            )}
          </TableWrapper>
        </div>
      )}

      {/* ── Leilões ─────────────────────────────────────────────────── */}
      {activeTab === 4 && (
        <div className="animate-fade-in">
          <TableWrapper headers={['Equipamento', 'Proprietário', 'Lance Atual', 'Encerra em', 'Status', 'Ação']} loading={loading}>
            {auctions.map(a => (
              <tr key={a.id}>
                <td style={{ ...tdStyle, fontWeight: 500 }}>{a.equipment?.name || '—'}</td>
                <td style={{ ...tdStyle, color: 'var(--gray-600)' }}>{a.owner?.full_name || '—'}</td>
                <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--amber-600)' }}>{fmt(a.current_price)}</td>
                <td style={{ ...tdStyle, color: 'var(--gray-600)' }}>{fmtDate(a.ends_at)}</td>
                <td style={tdStyle}><StatusBadge value={a.status} /></td>
                <td style={tdStyle}>
                  {['scheduled', 'active'].includes(a.status) && (
                    <button className="btn btn-sm btn-danger" onClick={() => handleCancelAuction(a.id)}>
                      Cancelar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && auctions.length === 0 && (
              <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: 'var(--gray-600)' }}>Nenhum leilão encontrado.</td></tr>
            )}
          </TableWrapper>
        </div>
      )}

      {/* ── Contabilidade ───────────────────────────────────────────── */}
      {activeTab === 5 && (
        <div className="animate-fade-in">
          {loading ? <div className="loading">Carregando...</div> : accounting && (
            <>
              {/* Card de receita total */}
              <div className="card" style={{
                background: 'var(--green-50)',
                borderColor: 'var(--green-100)',
                borderTop: '3px solid var(--green-500)',
                marginBottom: 'var(--space-xl)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-lg)',
              }}>
                <div style={{ fontSize: '2.5rem' }}>💰</div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--green-700)' }}>
                    Receita Total da Plataforma
                  </p>
                  <p style={{ margin: '0.2rem 0 0', fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800, color: 'var(--green-800)', lineHeight: 1 }}>
                    R$ {Number(accounting.totalRevenue || 0).toFixed(2).replace('.', ',')}
                  </p>
                  <p style={{ margin: '0.3rem 0 0', fontSize: '0.82rem', color: 'var(--gray-600)' }}>
                    Taxa de 1% sobre cada locação confirmada
                  </p>
                </div>
              </div>

              <TableWrapper headers={['Data', 'Equipamento', 'Locatário', 'Proprietário', 'Valor Total', 'Taxa (1%)', 'Status']} loading={false}>
                {accounting.rentals.map(r => (
                  <tr key={r.id}>
                    <td style={{ ...tdStyle, color: 'var(--gray-600)', whiteSpace: 'nowrap', fontSize: '0.83rem' }}>{fmtDate(r.created_at)}</td>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{r.equipment?.name || '—'}</td>
                    <td style={{ ...tdStyle, color: 'var(--gray-600)' }}>{r.renter?.full_name || '—'}</td>
                    <td style={{ ...tdStyle, color: 'var(--gray-600)' }}>{r.owner?.full_name || '—'}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{fmt(r.total_amount)}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--green-700)' }}>{fmt(r.platform_fee)}</td>
                    <td style={tdStyle}><StatusBadge value={r.status} /></td>
                  </tr>
                ))}
                {accounting.rentals.length === 0 && (
                  <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: 'var(--gray-600)' }}>Nenhuma transação registrada.</td></tr>
                )}
              </TableWrapper>
            </>
          )}
        </div>
      )}

      <div style={{ height: 'var(--space-2xl)' }} />
    </div>
  );
}
