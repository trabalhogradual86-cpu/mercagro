import { useState, useRef, useEffect } from 'react';

const RESPONSES = [
  {
    keywords: ['olá', 'oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hello', 'hi'],
    reply: 'Olá! Sou o assistente virtual do Mercagro. Posso te ajudar com informações sobre locação de equipamentos, leilões, cadastros e muito mais. Como posso te ajudar hoje?',
  },
  {
    keywords: ['locar', 'alugar', 'locação', 'locacao', 'aluguel', 'como locar', 'como alugar'],
    reply: 'Para locar um equipamento é simples: 1) Acesse a aba **Equipamentos**, 2) Filtre por categoria ou localização, 3) Clique no equipamento desejado, 4) Escolha as datas e envie a solicitação. O proprietário confirma em até 24h.',
  },
  {
    keywords: ['leilão', 'leilao', 'leiloes', 'leilões', 'lance', 'dar lance', 'bid'],
    reply: 'Os leilões ficam disponíveis na aba **Leilões** com contagem regressiva em tempo real. Para dar um lance, basta estar logado e clicar em "Dar Lance". O maior lance ao encerrar ganha o período de uso do equipamento.',
  },
  {
    keywords: ['cadastrar', 'cadastro', 'registrar', 'registro', 'criar conta', 'conta'],
    reply: 'Para se cadastrar clique em **Cadastrar** no canto superior direito. Você pode se registrar como Produtor (para locar equipamentos) ou Proprietário (para disponibilizar suas máquinas). O processo leva menos de 2 minutos.',
  },
  {
    keywords: ['equipamento', 'maquina', 'máquina', 'trator', 'colheitadeira', 'plantadeira', 'pulverizador'],
    reply: 'Temos diversas categorias de equipamentos: Tratores, Colheitadeiras, Plantadeiras, Pulverizadores, Semeadeiras e mais. Acesse a aba **Equipamentos** e use os filtros para encontrar o que precisa na sua região.',
  },
  {
    keywords: ['preço', 'preco', 'valor', 'custo', 'quanto custa', 'diária', 'diaria'],
    reply: 'Os preços são definidos pelos proprietários em diárias (R$/dia). Na página de cada equipamento você encontra a diária base. Nosso sistema de **Análise IA** também sugere o preço justo para a região, ajudando nas negociações.',
  },
  {
    keywords: ['ia', 'inteligência artificial', 'inteligencia artificial', 'recomendação', 'recomendacao', 'consultor'],
    reply: 'O **Consultor IA** do Mercagro analisa sua cultura, solo e área plantada para recomendar os equipamentos mais adequados com custo-benefício otimizado. Acesse a aba "Consultor IA" no menu (disponível para usuários logados).',
  },
  {
    keywords: ['pagamento', 'pagar', 'pix', 'boleto', 'cartão', 'cartao', 'como pagar'],
    reply: 'O pagamento é negociado diretamente entre produtor e proprietário após a aprovação da solicitação de locação. A plataforma facilita o contato e garante transparência em todo o processo.',
  },
  {
    keywords: ['documento', 'contrato', 'seguro', 'garantia'],
    reply: 'Recomendamos que produtores e proprietários formalizem a locação com um contrato simples de comodato ou locação. A plataforma registra todas as solicitações, datas e valores acordados para referência.',
  },
  {
    keywords: ['localização', 'localizacao', 'estado', 'cidade', 'regiao', 'região', 'perto'],
    reply: 'Use o filtro de **localização** na aba Equipamentos para buscar máquinas disponíveis no seu estado ou cidade. Quanto mais próximo, menor o custo de frete e logística!',
  },
  {
    keywords: ['proprietário', 'proprietario', 'dono', 'disponibilizar', 'cadastrar equipamento'],
    reply: 'Para disponibilizar seu equipamento: 1) Crie uma conta como Proprietário, 2) Acesse **Meus Equipamentos**, 3) Clique em "Novo Equipamento", 4) Preencha os dados e fotos. Após aprovação pelo admin, sua máquina fica visível para todos os produtores.',
  },
  {
    keywords: ['aprovação', 'aprovacao', 'aprovado', 'pendente', 'status'],
    reply: 'Novos equipamentos passam por uma revisão de qualidade antes de aparecer na plataforma. O processo de aprovação leva até 48 horas. Você pode acompanhar o status em **Meus Equipamentos**.',
  },
  {
    keywords: ['painel', 'dashboard', 'minhas locações', 'minhas locacoes', 'histórico'],
    reply: 'No seu **Painel** você encontra um resumo das suas atividades, locações ativas, gastos e economias. Em **Minhas Locações** você vê o histórico completo e pode avaliar proprietários após cada locação.',
  },
  {
    keywords: ['avaliação', 'avaliacao', 'review', 'nota', 'estrela'],
    reply: 'Após o término de uma locação, você pode avaliar o proprietário e o equipamento. As avaliações ajudam outros produtores a escolherem os melhores equipamentos e constroem confiança na plataforma.',
  },
  {
    keywords: ['suporte', 'ajuda', 'problema', 'erro', 'bug', 'contato'],
    reply: 'Para suporte técnico ou dúvidas, você pode entrar em contato pelo e-mail suporte@mercagro.com.br. Nossa equipe responde em até 24h úteis.',
  },
  {
    keywords: ['obrigado', 'obrigada', 'valeu', 'thanks', 'grato', 'grata'],
    reply: 'Fico feliz em ajudar! Se tiver mais alguma dúvida sobre a plataforma, estou à disposição. Bons negócios no Mercagro!',
  },
  {
    keywords: ['tchau', 'até logo', 'ate logo', 'bye', 'até mais', 'ate mais'],
    reply: 'Até mais! Qualquer dúvida é só chamar. Boas colheitas!',
  },
];

const FALLBACKS = [
  'Não tenho certeza sobre isso. Posso te ajudar com locação de equipamentos, leilões, cadastro ou preços. O que você gostaria de saber?',
  'Essa informação não está na minha base. Tente perguntar sobre como locar, como funciona o leilão, cadastro de equipamentos ou pagamento.',
  'Para essa questão específica, recomendo entrar em contato com nosso suporte em suporte@mercagro.com.br. Posso ajudar com informações gerais sobre a plataforma!',
];

const GREETINGS = [
  'Olá! Sou o assistente virtual do Mercagro. Como posso te ajudar?',
  'Precisa de ajuda com locação, leilões ou cadastro? Estou aqui!',
];

function matchResponse(text) {
  const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const { keywords, reply } of RESPONSES) {
    for (const kw of keywords) {
      const kwNorm = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (lower.includes(kwNorm)) return reply;
    }
  }
  return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: GREETINGS[0] }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, typing]);

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    setInput('');
    setMessages(prev => [...prev, { from: 'user', text }]);
    setTyping(true);

    const reply = matchResponse(text);
    const delay = 800 + Math.min(text.length * 15, 1200);

    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, { from: 'bot', text: reply }]);
    }, delay);
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function renderText(text) {
    // Bold via **text**
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : part
    );
  }

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setOpen(v => !v)}
        style={s.fab}
        aria-label="Abrir assistente virtual"
        title="Assistente Mercagro"
      >
        {open ? (
          <span style={s.fabIcon}>✕</span>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
      </button>

      {/* Painel do chat */}
      {open && (
        <div style={s.panel}>
          {/* Header */}
          <div style={s.header}>
            <div style={s.headerAvatar}>M</div>
            <div>
              <div style={s.headerName}>Assistente Mercagro</div>
              <div style={s.headerStatus}>
                <span style={s.onlineDot} /> Online agora
              </div>
            </div>
          </div>

          {/* Mensagens */}
          <div style={s.messages}>
            {messages.map((msg, i) => (
              <div key={i} style={msg.from === 'user' ? s.rowUser : s.rowBot}>
                {msg.from === 'bot' && <div style={s.botAvatar}>M</div>}
                <div style={msg.from === 'user' ? s.bubbleUser : s.bubbleBot}>
                  {renderText(msg.text)}
                </div>
              </div>
            ))}
            {typing && (
              <div style={s.rowBot}>
                <div style={s.botAvatar}>M</div>
                <div style={{ ...s.bubbleBot, ...s.typingBubble }}>
                  <span style={s.dot} />
                  <span style={{ ...s.dot, animationDelay: '.2s' }} />
                  <span style={{ ...s.dot, animationDelay: '.4s' }} />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div style={s.inputArea}>
            <input
              style={s.input}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Escreva sua pergunta..."
              maxLength={300}
              autoFocus
            />
            <button style={s.sendBtn} onClick={handleSend} disabled={!input.trim()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>

          <div style={s.footer}>Assistente virtual — respostas automáticas</div>
        </div>
      )}

      <style>{`
        @keyframes botTypeDot {
          0%, 60%, 100% { opacity: .3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-4px); }
        }
      `}</style>
    </>
  );
}

const s = {
  fab: {
    position: 'fixed',
    bottom: '1.75rem',
    right: '1.75rem',
    zIndex: 1000,
    width: 54,
    height: 54,
    borderRadius: '50%',
    background: 'var(--green-800)',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(13,33,24,.35)',
    transition: 'transform .2s, box-shadow .2s',
  },
  fabIcon: { fontSize: '1.1rem', fontWeight: 600 },
  panel: {
    position: 'fixed',
    bottom: '5.5rem',
    right: '1.75rem',
    zIndex: 999,
    width: 360,
    maxHeight: 520,
    background: '#fff',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    border: '1px solid var(--gray-200)',
  },
  header: {
    background: 'var(--green-800)',
    padding: '0.85rem 1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'rgba(255,255,255,.2)',
    color: '#fff',
    fontWeight: 700,
    fontSize: '0.95rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerName: {
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.9rem',
    fontFamily: 'var(--font-body)',
  },
  headerStatus: {
    color: 'rgba(255,255,255,.7)',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    marginTop: '0.1rem',
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#4cde7c',
    display: 'inline-block',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    background: 'var(--cream)',
  },
  rowBot: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '0.5rem',
  },
  rowUser: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'var(--green-800)',
    color: '#fff',
    fontWeight: 700,
    fontSize: '0.78rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bubbleBot: {
    background: '#fff',
    border: '1px solid var(--gray-200)',
    borderRadius: '12px 12px 12px 4px',
    padding: '0.6rem 0.9rem',
    fontSize: '0.85rem',
    color: 'var(--gray-800)',
    maxWidth: 270,
    lineHeight: 1.5,
    boxShadow: 'var(--shadow-sm)',
  },
  bubbleUser: {
    background: 'var(--green-800)',
    borderRadius: '12px 12px 4px 12px',
    padding: '0.6rem 0.9rem',
    fontSize: '0.85rem',
    color: '#fff',
    maxWidth: 270,
    lineHeight: 1.5,
  },
  typingBubble: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    padding: '0.7rem 0.9rem',
    minWidth: 56,
  },
  dot: {
    display: 'inline-block',
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: 'var(--gray-400)',
    animation: 'botTypeDot 1s ease infinite',
  },
  inputArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.75rem 0.75rem',
    borderTop: '1px solid var(--gray-200)',
    background: '#fff',
  },
  input: {
    flex: 1,
    border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    fontFamily: 'var(--font-body)',
    color: 'var(--gray-800)',
    background: 'var(--gray-100)',
    outline: 'none',
  },
  sendBtn: {
    background: 'var(--green-800)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'opacity .15s',
  },
  footer: {
    textAlign: 'center',
    fontSize: '0.7rem',
    color: 'var(--gray-400)',
    padding: '0.4rem',
    background: '#fff',
  },
};
