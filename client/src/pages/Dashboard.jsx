import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isOwner = profile?.user_type === 'owner' || profile?.user_type === 'both';
  const isProducer = profile?.user_type === 'producer' || profile?.user_type === 'both';
  const firstName = profile?.full_name?.split(' ')[0] || 'usuário';

  const [myRentals, setMyRentals] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const calls = [];
        if (isProducer) calls.push(api.get('/api/rentals/my').catch(() => []));
        else calls.push(Promise.resolve([]));
        if (isOwner) calls.push(api.get('/api/rentals/incoming').catch(() => []));
        else calls.push(Promise.resolve([]));
        const [rentals, inc] = await Promise.all(calls);
        setMyRentals(rentals || []);
        setIncoming(inc || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isProducer, isOwner]);

  const activeRentals   = myRentals.filter(r => r.status === 'active').length;
  const pendingRentals  = myRentals.filter(r => r.status === 'pending').length;
  const newRequests     = incoming.filter(r => r.status === 'pending').length;
  const activeIncoming  = incoming.filter(r => ['confirmed', 'active'].includes(r.status)).length;

  return (
    <div>
      {/* Header */}
      <div style={{
        padding: 'var(--space-xl) 0',
        borderBottom: '1px solid var(--gray-200)',
        marginBottom: 'var(--space-xl)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-md)',
      }}>
        <div>
          <p className="section-label">Painel</p>
          <h1 className="page-title" style={{ margin: '0.3rem 0 0.25rem' }}>
            Olá, {firstName}
          </h1>
          <p style={{ color: 'var(--gray-600)', fontSize: '0.92rem' }}>
            {profile?.location_city
              ? `${profile.location_city}, ${profile.location_state}`
              : 'Bem-vindo ao Mercagro'}
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/perfil')}>
          Editar perfil
        </button>
      </div>

      {/* Alertas de pendências */}
      {!loading && (newRequests > 0 || pendingRentals > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
          {newRequests > 0 && (
            <div
              onClick={() => navigate('/meus-equipamentos')}
              style={{
                background: 'var(--amber-50, #fffbeb)',
                border: '1px solid var(--amber-200, #fde68a)',
                borderLeft: '4px solid var(--amber-500)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--amber-800, #92400e)' }}>
                {newRequests} {newRequests > 1 ? 'solicitações' : 'solicitação'} aguardando sua confirmação
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--amber-700, #b45309)' }}>Ver →</span>
            </div>
          )}
          {pendingRentals > 0 && (
            <div
              onClick={() => navigate('/minhas-locacoes')}
              style={{
                background: 'var(--green-50)',
                border: '1px solid var(--green-200, #bbf7d0)',
                borderLeft: '4px solid var(--green-500)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--green-800)' }}>
                {pendingRentals} {pendingRentals > 1 ? 'locações' : 'locação'} aguardando confirmação do proprietário
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--green-700)' }}>Ver →</span>
            </div>
          )}
        </div>
      )}

      {/* Métricas */}
      {!loading && (
        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', marginBottom: 'var(--space-xl)' }}>
          {isProducer && (
            <>
              <div
                className="card"
                onClick={() => navigate('/minhas-locacoes')}
                style={{ flex: 1, minWidth: 160, cursor: 'pointer', borderTop: '3px solid var(--green-500)' }}
              >
                <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-600)' }}>
                  Locações ativas
                </p>
                <p style={{ margin: '0.3rem 0 0', fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--green-900)', lineHeight: 1 }}>
                  {activeRentals}
                </p>
              </div>
              <div
                className="card"
                onClick={() => navigate('/minhas-locacoes')}
                style={{ flex: 1, minWidth: 160, cursor: 'pointer', borderTop: '3px solid var(--amber-500)' }}
              >
                <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-600)' }}>
                  Aguardando confirmação
                </p>
                <p style={{ margin: '0.3rem 0 0', fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--green-900)', lineHeight: 1 }}>
                  {pendingRentals}
                </p>
              </div>
            </>
          )}
          {isOwner && (
            <>
              <div
                className="card"
                onClick={() => navigate('/meus-equipamentos')}
                style={{ flex: 1, minWidth: 160, cursor: 'pointer', borderTop: '3px solid var(--amber-500)' }}
              >
                <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-600)' }}>
                  Solicitações novas
                </p>
                <p style={{ margin: '0.3rem 0 0', fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--green-900)', lineHeight: 1 }}>
                  {newRequests}
                </p>
              </div>
              <div
                className="card"
                onClick={() => navigate('/meus-equipamentos')}
                style={{ flex: 1, minWidth: 160, cursor: 'pointer', borderTop: '3px solid var(--green-600)' }}
              >
                <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-600)' }}>
                  Locações em andamento
                </p>
                <p style={{ margin: '0.3rem 0 0', fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--green-900)', lineHeight: 1 }}>
                  {activeIncoming}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Ação primária contextual */}
      <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
        {isProducer && (
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/equipamentos')}>
            Buscar Equipamentos
          </button>
        )}
        {isOwner && (
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/equipamentos/novo')}>
            + Cadastrar Equipamento
          </button>
        )}
        <button className="btn btn-ghost btn-lg" onClick={() => navigate('/leiloes')}>
          Ver Leilões
        </button>
      </div>
    </div>
  );
}
