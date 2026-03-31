import { useState, useEffect } from 'react';
import { api } from '../lib/api';

const STATUS_LABELS = {
  pending: 'Pendente',
  confirmed: 'Confirmada',
  active: 'Ativa',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  scheduled: 'Agendado',
  finished: 'Encerrado',
  available: 'Disponível',
  rented: 'Alugado',
  auction: 'Em Leilão',
  inactive: 'Inativo',
};

const USER_TYPE_LABELS = {
  producer: 'Produtor',
  owner: 'Proprietário',
  both: 'Ambos',
};

const TABS = ['Visão Geral', 'Usuários', 'Equipamentos', 'Locações', 'Leilões', 'Contabilidade'];

function StatusBadge({ value }) {
  const colors = {
    pending: '#f59e0b',
    confirmed: '#3b82f6',
    active: '#10b981',
    completed: '#6b7280',
    cancelled: '#ef4444',
    scheduled: '#8b5cf6',
    finished: '#6b7280',
    approved: '#10b981',
    rejected: '#ef4444',
  };
  return (
    <span style={{
      background: colors[value] || '#9ca3af',
      color: '#fff',
      padding: '2px 8px',
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: 600,
    }}>
      {STATUS_LABELS[value] || value}
    </span>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '1.5rem',
      flex: 1,
      minWidth: '160px',
      borderTop: `4px solid ${color}`,
    }}>
      <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}>{label}</p>
      <p style={{ margin: '0.5rem 0 0', fontSize: '2rem', fontWeight: 700, color: '#111827' }}>{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [accounting, setAccounting] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (activeTab === 0) loadStats();
    if (activeTab === 1) loadUsers();
    if (activeTab === 2) loadEquipment();
    if (activeTab === 3) loadRentals();
    if (activeTab === 4) loadAuctions();
    if (activeTab === 5) loadAccounting();
  }, [activeTab]);

  async function loadStats() {
    try {
      const data = await api.get('/api/admin/stats');
      setStats(data);
    } catch (e) { console.error(e); }
  }

  async function loadUsers() {
    setLoading(true);
    try { setUsers(await api.get('/api/admin/users')); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function loadEquipment() {
    setLoading(true);
    try { setEquipment(await api.get('/api/admin/equipment')); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function loadRentals() {
    setLoading(true);
    try { setRentals(await api.get('/api/admin/rentals')); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function loadAuctions() {
    setLoading(true);
    try { setAuctions(await api.get('/api/admin/auctions')); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function loadAccounting() {
    setLoading(true);
    try { setAccounting(await api.get('/api/admin/accounting')); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function showMessage(msg) {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  }

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

  const fmt = (val) => `R$ ${Number(val || 0).toFixed(2).replace('.', ',')}`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginBottom: '0.25rem' }}>
        Painel Administrativo
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Gerenciamento da plataforma Mercagro</p>

      {message && (
        <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', color: '#065f46' }}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '2px solid #e5e7eb', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {TABS.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            style={{
              padding: '0.6rem 1.1rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === i ? 700 : 400,
              color: activeTab === i ? '#16a34a' : '#6b7280',
              borderBottom: activeTab === i ? '2px solid #16a34a' : '2px solid transparent',
              marginBottom: '-2px',
              fontSize: '0.9rem',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Visão Geral */}
      {activeTab === 0 && (
        <div>
          {stats ? (
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <StatCard label="Usuários cadastrados" value={stats.totalUsers} color="#3b82f6" />
              <StatCard label="Equipamentos" value={stats.totalEquipment} color="#10b981" />
              <StatCard label="Aguardando aprovação" value={stats.pendingEquipment} color="#f59e0b" />
              <StatCard label="Locações ativas" value={stats.activeRentals} color="#8b5cf6" />
              <StatCard label="Receita da plataforma" value={`R$ ${Number(stats.totalFees).toFixed(2).replace('.', ',')}`} color="#16a34a" />
            </div>
          ) : (
            <p style={{ color: '#6b7280' }}>Carregando estatísticas...</p>
          )}
          <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: '0 0 0.5rem', color: '#374151' }}>Como usar o painel</h3>
            <ul style={{ color: '#6b7280', margin: 0, paddingLeft: '1.25rem', lineHeight: 2 }}>
              <li><strong>Usuários:</strong> visualize e bloqueie contas</li>
              <li><strong>Equipamentos:</strong> aprove ou rejeite novos cadastros</li>
              <li><strong>Locações:</strong> monitore e cancele locações problemáticas</li>
              <li><strong>Leilões:</strong> cancele leilões indevidos</li>
              <li><strong>Contabilidade:</strong> acompanhe a receita da plataforma (1% por locação)</li>
            </ul>
          </div>
        </div>
      )}

      {/* Usuários */}
      {activeTab === 1 && (
        <div>
          {loading ? <p>Carregando...</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                  {['Nome', 'Tipo', 'Cidade/UF', 'Cadastro', 'Status', 'Ação'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', color: '#374151', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {u.full_name}
                      {u.is_admin && <span style={{ marginLeft: '6px', fontSize: '0.7rem', background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: '4px' }}>ADMIN</span>}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>{USER_TYPE_LABELS[u.user_type] || u.user_type}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{u.location_city}/{u.location_state}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{fmtDate(u.created_at)}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <StatusBadge value={u.is_blocked ? 'cancelled' : 'active'} />
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {!u.is_admin && (
                        <button
                          onClick={() => handleBlockUser(u.id)}
                          style={{
                            padding: '4px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                            background: u.is_blocked ? '#d1fae5' : '#fee2e2',
                            color: u.is_blocked ? '#065f46' : '#991b1b',
                            fontWeight: 600, fontSize: '0.8rem'
                          }}
                        >
                          {u.is_blocked ? 'Desbloquear' : 'Bloquear'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Equipamentos */}
      {activeTab === 2 && (
        <div>
          {loading ? <p>Carregando...</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                  {['Equipamento', 'Proprietário', 'Categoria', 'Diária', 'Aprovação', 'Ação'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', color: '#374151', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {equipment.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>{e.name}<br /><small style={{ color: '#9ca3af' }}>{e.brand} {e.model} {e.year}</small></td>
                    <td style={{ padding: '0.75rem 1rem' }}>{e.profiles?.full_name || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{e.category}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{fmt(e.daily_rate)}</td>
                    <td style={{ padding: '0.75rem 1rem' }}><StatusBadge value={e.approval_status} /></td>
                    <td style={{ padding: '0.75rem 1rem', display: 'flex', gap: '6px' }}>
                      {e.approval_status === 'pending' && (
                        <>
                          <button onClick={() => handleApproveEquipment(e.id)} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: '#d1fae5', color: '#065f46', fontWeight: 600, fontSize: '0.8rem' }}>Aprovar</button>
                          <button onClick={() => handleRejectEquipment(e.id)} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: '#fee2e2', color: '#991b1b', fontWeight: 600, fontSize: '0.8rem' }}>Rejeitar</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Locações */}
      {activeTab === 3 && (
        <div>
          {loading ? <p>Carregando...</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                  {['Equipamento', 'Locatário', 'Proprietário', 'Período', 'Total', 'Taxa (1%)', 'Status', 'Ação'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', color: '#374151', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rentals.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>{r.equipment?.name || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{r.renter?.full_name || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{r.owner?.full_name || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>{fmtDate(r.start_date)} – {fmtDate(r.end_date)}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{fmt(r.total_amount)}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#16a34a', fontWeight: 600 }}>{fmt(r.platform_fee)}</td>
                    <td style={{ padding: '0.75rem 1rem' }}><StatusBadge value={r.status} /></td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {['pending', 'confirmed', 'active'].includes(r.status) && (
                        <button onClick={() => handleCancelRental(r.id)} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: '#fee2e2', color: '#991b1b', fontWeight: 600, fontSize: '0.8rem' }}>Cancelar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Leilões */}
      {activeTab === 4 && (
        <div>
          {loading ? <p>Carregando...</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                  {['Equipamento', 'Proprietário', 'Lance Atual', 'Encerra em', 'Status', 'Ação'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', color: '#374151', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auctions.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>{a.equipment?.name || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{a.owner?.full_name || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{fmt(a.current_price)}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{fmtDate(a.ends_at)}</td>
                    <td style={{ padding: '0.75rem 1rem' }}><StatusBadge value={a.status} /></td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {['scheduled', 'active'].includes(a.status) && (
                        <button onClick={() => handleCancelAuction(a.id)} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: '#fee2e2', color: '#991b1b', fontWeight: 600, fontSize: '0.8rem' }}>Cancelar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Contabilidade */}
      {activeTab === 5 && (
        <div>
          {loading ? <p>Carregando...</p> : accounting && (
            <>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div>
                  <p style={{ margin: 0, color: '#166534', fontWeight: 600 }}>Receita Total da Plataforma</p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '2rem', fontWeight: 800, color: '#16a34a' }}>
                    R$ {Number(accounting.totalRevenue).toFixed(2).replace('.', ',')}
                  </p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#6b7280' }}>Taxa de 1% sobre cada locação confirmada</p>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                    {['Data', 'Equipamento', 'Locatário', 'Proprietário', 'Valor Total', 'Taxa (1%)', 'Status'].map(h => (
                      <th key={h} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', color: '#374151', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {accounting.rentals.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>{fmtDate(r.created_at)}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{r.equipment?.name || '—'}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{r.renter?.full_name || '—'}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{r.owner?.full_name || '—'}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{fmt(r.total_amount)}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#16a34a', fontWeight: 700 }}>{fmt(r.platform_fee)}</td>
                      <td style={{ padding: '0.75rem 1rem' }}><StatusBadge value={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
}
