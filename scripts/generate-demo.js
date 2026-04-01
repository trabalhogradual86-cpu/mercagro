/**
 * generate-demo.js
 * Captura screenshots de todas as telas do Mercagro e gera
 * uma apresentação HTML elegante com roadmap para o cliente.
 */
const puppeteer = require('../node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

const sleep = ms => new Promise(r => setTimeout(r, ms));
const BASE = 'http://localhost:5173';
const OUT_DIR = path.join(__dirname, '../demo');
const SHOTS_DIR = path.join(OUT_DIR, 'shots');

if (!fs.existsSync(SHOTS_DIR)) fs.mkdirSync(SHOTS_DIR, { recursive: true });

const ADMIN = { email: 'admin@mercagro.com', password: 'Admin@123456' };
const USER  = { email: 'usuario@mercagro.com', password: 'User@123456' };

async function waitForLoad(page) {
  await page.waitForFunction(
    () => !document.querySelector('.loading') && document.readyState === 'complete',
    { timeout: 12000 }
  ).catch(() => {});
  await sleep(800);
}

async function shot(page, name, clip = null) {
  const opts = { path: path.join(SHOTS_DIR, `${name}.png`), fullPage: !clip };
  if (clip) opts.clip = clip;
  await page.screenshot(opts);
  const buf = fs.readFileSync(opts.path);
  return 'data:image/png;base64,' + buf.toString('base64');
}

async function login(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await sleep(600);
  await page.$eval('input[type="email"]', (el, v) => el.value = v, email);
  await page.$eval('input[type="password"]', (el, v) => el.value = v, password);
  await page.type('input[type="email"]', '', { delay: 1 }); // trigger React onChange
  // Usar evaluate para setar valores em React
  await page.evaluate((em, pw) => {
    const emailEl = document.querySelector('input[type="email"]');
    const passEl  = document.querySelector('input[type="password"]');
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(emailEl, em);
    emailEl.dispatchEvent(new Event('input', { bubbles: true }));
    nativeInputValueSetter.call(passEl, pw);
    passEl.dispatchEvent(new Event('input', { bubbles: true }));
  }, email, password);
  await sleep(300);
  await page.click('button[type="submit"]');
  await page.waitForFunction(
    () => !window.location.href.includes('/login'),
    { timeout: 10000 }
  ).catch(() => {});
  await waitForLoad(page);
}

async function main() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  MERCAGRO — Gerando Apresentação Demo    ║');
  console.log('╚══════════════════════════════════════════╝\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  const slides = [];

  async function capture(label, desc, fn) {
    process.stdout.write(`  📸 ${label}...`);
    try {
      const img = await fn(page);
      slides.push({ label, desc, img });
      console.log(' ✓');
    } catch (e) {
      console.log(` ✗ ${e.message.slice(0, 60)}`);
      slides.push({ label, desc, img: null });
    }
  }

  // ── Páginas Públicas ─────────────────────────────────────────────────
  await capture('Página Inicial', 'Vitrine pública — busca e descoberta de equipamentos agrícolas', async (p) => {
    await p.goto(BASE, { waitUntil: 'networkidle2' });
    await sleep(1500);
    return shot(p, '01-home');
  });

  await capture('Catálogo de Equipamentos', 'Listagem com filtros por categoria, localização e faixa de preço', async (p) => {
    await p.goto(`${BASE}/equipment`, { waitUntil: 'networkidle2' });
    await sleep(2000);
    return shot(p, '02-equipment');
  });

  await capture('Leilões Online', 'Sala de leilões em tempo real com contagem regressiva e lances ao vivo', async (p) => {
    await p.goto(`${BASE}/auctions`, { waitUntil: 'networkidle2' });
    await sleep(1500);
    return shot(p, '03-auctions');
  });

  // ── Fluxo do Usuário ─────────────────────────────────────────────────
  await capture('Login / Autenticação', 'Autenticação segura com Supabase — suporte a múltiplos perfis', async (p) => {
    await p.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
    await sleep(800);
    return shot(p, '04-login');
  });

  await capture('Dashboard do Usuário', 'Painel personalizado com estatísticas de locações e equipamentos', async (p) => {
    await login(p, USER.email, USER.password);
    await p.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle2' });
    await waitForLoad(p);
    return shot(p, '05-dashboard');
  });

  await capture('Minhas Locações', 'Histórico e acompanhamento de todas as locações ativas e concluídas', async (p) => {
    await p.goto(`${BASE}/my-rentals`, { waitUntil: 'networkidle2' });
    await waitForLoad(p);
    return shot(p, '06-my-rentals');
  });

  await capture('Meus Equipamentos', 'Gestão dos equipamentos cadastrados com controle de status e locações recebidas', async (p) => {
    await p.goto(`${BASE}/my-equipment`, { waitUntil: 'networkidle2' });
    await waitForLoad(p);
    return shot(p, '07-my-equipment');
  });

  await capture('Cadastrar Equipamento', 'Formulário completo com upload de fotos, precificação e localização', async (p) => {
    await p.goto(`${BASE}/equipment/new`, { waitUntil: 'networkidle2' });
    await waitForLoad(p);
    return shot(p, '08-equipment-new');
  });

  await capture('Perfil do Usuário', 'Edição de dados pessoais, tipo de conta e configurações', async (p) => {
    await p.goto(`${BASE}/profile`, { waitUntil: 'networkidle2' });
    await waitForLoad(p);
    return shot(p, '09-profile');
  });

  // ── Painel Admin ──────────────────────────────────────────────────────
  await capture('Painel Administrativo — Visão Geral', 'Dashboard central com KPIs, receita e métricas da plataforma', async (p) => {
    await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await sleep(300);
    await login(p, ADMIN.email, ADMIN.password);
    await p.goto(`${BASE}/admin`, { waitUntil: 'networkidle2' });
    await page.waitForFunction(
      () => document.body.innerText.includes('Painel Administrativo'),
      { timeout: 10000 }
    ).catch(() => {});
    await sleep(800);
    return shot(p, '10-admin-overview');
  });

  await capture('Admin — Gerenciamento de Usuários', 'Lista completa de usuários com ações de bloquear/desbloquear', async (p) => {
    // Clicar na aba Usuários
    const btn = await p.$('[class*="tab"]:nth-child(2), button');
    const tabs = await p.$$('button');
    for (const t of tabs) {
      const txt = await p.evaluate(el => el.textContent, t);
      if (txt.includes('Usuário')) { await t.click(); await sleep(600); break; }
    }
    return shot(p, '11-admin-users');
  });

  await capture('Admin — Aprovação de Equipamentos', 'Moderação de novos equipamentos cadastrados na plataforma', async (p) => {
    const tabs = await p.$$('button');
    for (const t of tabs) {
      const txt = await p.evaluate(el => el.textContent, t);
      if (txt.includes('Equipamento')) { await t.click(); await sleep(600); break; }
    }
    return shot(p, '12-admin-equipment');
  });

  await capture('Admin — Contabilidade', 'Receita de taxas por locação (1% por transação) e relatório financeiro', async (p) => {
    const tabs = await p.$$('button');
    for (const t of tabs) {
      const txt = await p.evaluate(el => el.textContent, t);
      if (txt.includes('Contab')) { await t.click(); await sleep(600); break; }
    }
    return shot(p, '13-admin-accounting');
  });

  await browser.close();

  // ── Gera HTML da Apresentação ─────────────────────────────────────────
  console.log('\n  🎨 Gerando apresentação HTML...');
  const html = buildPresentation(slides);
  const outFile = path.join(OUT_DIR, 'mercagro-demo.html');
  fs.writeFileSync(outFile, html);

  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║  ✅ Apresentação gerada com sucesso!      ║`);
  console.log(`╚══════════════════════════════════════════╝`);
  console.log(`\n  📂 Arquivo: ${outFile}`);
  console.log(`  🖥️  Abra no navegador para apresentar ao cliente\n`);
}

function buildPresentation(slides) {
  const validSlides = slides.filter(s => s.img);
  const slidesHtml = validSlides.map((s, i) => `
    <div class="slide" data-index="${i}">
      <div class="slide-content">
        <img src="${s.img}" alt="${s.label}" />
        <div class="slide-caption">
          <span class="slide-number">${String(i + 1).padStart(2, '0')} / ${String(validSlides.length).padStart(2, '0')}</span>
          <h2>${s.label}</h2>
          <p>${s.desc}</p>
        </div>
      </div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mercagro — Demo do Sistema</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --green-900: #0d2118;
    --green-800: #1a3d2b;
    --green-700: #24562e;
    --green-500: #3a8a44;
    --green-100: #e8f3e8;
    --amber-500: #d4a017;
    --amber-400: #e6b82a;
    --cream: #f8f5ee;
    --white: #ffffff;
    --gray-200: #e8e6e0;
    --gray-600: #7a7468;
    --gray-800: #3a3630;
  }

  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--green-900);
    color: var(--white);
    height: 100vh;
    overflow: hidden;
    user-select: none;
  }

  /* ── Cover ── */
  #cover {
    position: fixed;
    inset: 0;
    background: linear-gradient(135deg, var(--green-900) 0%, #0a1f14 50%, #1a3000 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    z-index: 100;
    transition: opacity .8s ease, visibility .8s;
  }
  #cover.hidden { opacity: 0; visibility: hidden; }
  #cover .logo-mark {
    width: 90px;
    height: 90px;
    background: linear-gradient(135deg, var(--green-500), var(--amber-500));
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.8rem;
    box-shadow: 0 20px 60px rgba(58,138,68,.4);
    animation: float 3s ease-in-out infinite;
  }
  @keyframes float {
    0%,100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
  #cover h1 {
    font-family: 'Playfair Display', serif;
    font-size: clamp(2.8rem, 6vw, 5rem);
    font-weight: 800;
    letter-spacing: -0.02em;
    background: linear-gradient(135deg, var(--white) 0%, var(--amber-400) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  #cover p {
    font-size: 1.1rem;
    color: rgba(255,255,255,.6);
    letter-spacing: 0.04em;
  }
  #cover .tag {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 1rem;
    background: rgba(255,255,255,.08);
    border: 1px solid rgba(255,255,255,.15);
    border-radius: 9999px;
    font-size: 0.82rem;
    color: rgba(255,255,255,.7);
    backdrop-filter: blur(8px);
  }
  #cover .start-btn {
    margin-top: 1rem;
    padding: 0.85rem 2.5rem;
    background: linear-gradient(135deg, var(--green-700), var(--green-500));
    color: var(--white);
    border: none;
    border-radius: 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 8px 30px rgba(58,138,68,.35);
    transition: all .2s;
  }
  #cover .start-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(58,138,68,.5); }
  #cover .tech-pills {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: center;
    max-width: 500px;
  }
  #cover .pill {
    padding: 0.3rem 0.75rem;
    background: rgba(255,255,255,.06);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 6px;
    font-size: 0.75rem;
    color: rgba(255,255,255,.5);
  }

  /* ── Slideshow ── */
  #slideshow {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    background: #080f0b;
  }

  /* Top bar */
  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 2rem;
    background: rgba(13,33,24,.9);
    border-bottom: 1px solid rgba(255,255,255,.08);
    backdrop-filter: blur(12px);
    flex-shrink: 0;
  }
  .top-bar .brand {
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    font-size: 1.1rem;
    color: var(--white);
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  .top-bar .brand span { font-size: 1.3rem; }
  .progress-bar {
    flex: 1;
    max-width: 400px;
    height: 3px;
    background: rgba(255,255,255,.1);
    border-radius: 2px;
    margin: 0 2rem;
    position: relative;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--green-500), var(--amber-400));
    border-radius: 2px;
    transition: width .4s ease;
  }
  .slide-counter {
    font-size: 0.82rem;
    color: rgba(255,255,255,.5);
    font-weight: 500;
    min-width: 60px;
    text-align: right;
  }

  /* Slides container */
  .slides-wrapper {
    flex: 1;
    position: relative;
    overflow: hidden;
  }
  .slide {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transform: translateX(60px);
    transition: opacity .5s ease, transform .5s cubic-bezier(0.16,1,0.3,1);
    pointer-events: none;
  }
  .slide.active {
    opacity: 1;
    transform: translateX(0);
    pointer-events: all;
  }
  .slide.exit {
    opacity: 0;
    transform: translateX(-60px);
  }
  .slide-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    max-width: 1400px;
    padding: 1.5rem 2rem;
    gap: 1rem;
  }
  .slide-content img {
    flex: 1;
    min-height: 0;
    object-fit: contain;
    object-position: top;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0,0,0,.5);
    border: 1px solid rgba(255,255,255,.06);
  }
  .slide-caption {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .slide-number {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.15em;
    color: var(--amber-400);
    text-transform: uppercase;
  }
  .slide-caption h2 {
    font-family: 'Playfair Display', serif;
    font-size: clamp(1.2rem, 2.5vw, 1.7rem);
    font-weight: 700;
    color: var(--white);
    line-height: 1.2;
  }
  .slide-caption p {
    font-size: 0.88rem;
    color: rgba(255,255,255,.55);
    line-height: 1.5;
    max-width: 700px;
  }

  /* Bottom controls */
  .controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    padding: 1rem 2rem;
    background: rgba(13,33,24,.8);
    border-top: 1px solid rgba(255,255,255,.06);
    flex-shrink: 0;
  }
  .nav-btn {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(255,255,255,.08);
    border: 1px solid rgba(255,255,255,.12);
    color: var(--white);
    font-size: 1.1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all .2s;
  }
  .nav-btn:hover { background: rgba(255,255,255,.16); }
  .nav-btn:disabled { opacity: 0.3; cursor: default; }
  .auto-btn {
    padding: 0.5rem 1.25rem;
    background: rgba(58,138,68,.2);
    border: 1px solid rgba(58,138,68,.3);
    color: rgba(255,255,255,.8);
    border-radius: 8px;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: all .2s;
    font-family: 'DM Sans', sans-serif;
  }
  .auto-btn.running { background: rgba(212,160,23,.2); border-color: rgba(212,160,23,.3); }
  .auto-btn:hover { opacity: 0.85; }
  .dots {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 3px;
    background: rgba(255,255,255,.2);
    transition: all .3s;
    cursor: pointer;
  }
  .dot.active {
    width: 20px;
    background: var(--green-500);
  }

  /* ── Roadmap Slide ── */
  .roadmap-slide {
    background: linear-gradient(135deg, var(--green-900) 0%, #0a1f14 100%);
    padding: 2rem 3rem;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,.06);
    overflow-y: auto;
    width: 100%;
  }
  .roadmap-slide h2 {
    font-family: 'Playfair Display', serif;
    font-size: 1.8rem;
    font-weight: 800;
    margin-bottom: 0.4rem;
    background: linear-gradient(135deg, var(--white), var(--amber-400));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .roadmap-slide .subtitle {
    color: rgba(255,255,255,.5);
    font-size: 0.9rem;
    margin-bottom: 2rem;
  }
  .phases {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }
  .phase {
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 12px;
    padding: 1.25rem;
    position: relative;
  }
  .phase.done { border-color: rgba(58,138,68,.3); background: rgba(58,138,68,.06); }
  .phase.active-phase { border-color: rgba(212,160,23,.4); background: rgba(212,160,23,.06); }
  .phase-tag {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    border-radius: 6px;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 0.75rem;
  }
  .phase.done .phase-tag { background: rgba(58,138,68,.2); color: #6fcf7a; }
  .phase.active-phase .phase-tag { background: rgba(212,160,23,.25); color: var(--amber-400); }
  .phase:not(.done):not(.active-phase) .phase-tag { background: rgba(255,255,255,.08); color: rgba(255,255,255,.5); }
  .phase h3 { font-size: 0.92rem; font-weight: 700; color: var(--white); margin-bottom: 0.75rem; }
  .phase ul { list-style: none; display: flex; flex-direction: column; gap: 0.4rem; }
  .phase ul li {
    font-size: 0.78rem;
    color: rgba(255,255,255,.6);
    display: flex;
    align-items: flex-start;
    gap: 0.4rem;
    line-height: 1.3;
  }
  .phase ul li::before { content: '·'; color: rgba(255,255,255,.3); flex-shrink: 0; }
  .phase.done ul li::before { content: '✓'; color: #6fcf7a; }
  .phase.active-phase ul li::before { content: '→'; color: var(--amber-400); }
  .tech-stack {
    margin-top: 1.5rem;
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .tech-badge {
    padding: 0.3rem 0.75rem;
    background: rgba(255,255,255,.06);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 6px;
    font-size: 0.75rem;
    color: rgba(255,255,255,.6);
  }

  /* ── Keyboard hint ── */
  .hint { position: fixed; bottom: 80px; right: 2rem; font-size: 0.72rem; color: rgba(255,255,255,.25); }

  /* Roadmap container inside slide */
  .roadmap-container {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem 2rem;
  }
</style>
</head>
<body>

<!-- Cover -->
<div id="cover">
  <div class="logo-mark">🌾</div>
  <h1>Mercagro</h1>
  <p>Plataforma de Locação e Leilão de Máquinas Agrícolas</p>
  <div class="tech-pills">
    <span class="pill">React 18</span>
    <span class="pill">Node.js</span>
    <span class="pill">Supabase</span>
    <span class="pill">PostgreSQL</span>
    <span class="pill">OpenAI</span>
    <span class="pill">Puppeteer</span>
  </div>
  <div class="tag">
    <span>📋</span> Demonstração do Sistema — ${new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' })}
  </div>
  <button class="start-btn" onclick="startPresentation()">▶ Iniciar Apresentação</button>
</div>

<!-- Slideshow -->
<div id="slideshow" style="display:none">
  <div class="top-bar">
    <div class="brand"><span>🌾</span> Mercagro</div>
    <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
    <div class="slide-counter" id="slideCounter">1 / ${validSlides + 1}</div>
  </div>

  <div class="slides-wrapper" id="slidesWrapper">
    ${slidesHtml}

    <!-- Roadmap slide (last) -->
    <div class="slide" data-index="${validSlides.length}">
      <div class="roadmap-container">
        <div class="roadmap-slide">
          <h2>Roadmap do Produto</h2>
          <p class="subtitle">Evolução planejada da plataforma Mercagro — 2025 → 2027</p>
          <div class="phases">
            <div class="phase done">
              <div class="phase-tag">✓ Concluído</div>
              <h3>Fase 1 — Core</h3>
              <ul>
                <li>Autenticação e perfis de usuário</li>
                <li>Cadastro e busca de equipamentos</li>
                <li>Sistema de locação</li>
                <li>Leilões em tempo real</li>
                <li>Upload de fotos</li>
              </ul>
            </div>
            <div class="phase done">
              <div class="phase-tag">✓ Concluído</div>
              <h3>Fase 2 — Admin</h3>
              <ul>
                <li>Painel administrativo completo</li>
                <li>Moderação de equipamentos</li>
                <li>Bloqueio de usuários</li>
                <li>Taxa de plataforma (1%)</li>
                <li>Contabilidade e relatórios</li>
              </ul>
            </div>
            <div class="phase active-phase">
              <div class="phase-tag">→ Em andamento</div>
              <h3>Fase 3 — Experiência</h3>
              <ul>
                <li>Assistente IA com OpenAI</li>
                <li>Recomendação de equipamentos</li>
                <li>Avaliações e reviews</li>
                <li>Notificações push</li>
                <li>Seguro opcional por locação</li>
              </ul>
            </div>
            <div class="phase">
              <div class="phase-tag">Planejado 2026</div>
              <h3>Fase 4 — Escala</h3>
              <ul>
                <li>App mobile (React Native)</li>
                <li>Integração com bancos</li>
                <li>API pública para parceiros</li>
                <li>Marketplace multi-tenant</li>
                <li>Analytics avançado</li>
              </ul>
            </div>
          </div>
          <div class="tech-stack">
            <span style="font-size:0.75rem;color:rgba(255,255,255,.35);margin-right:0.25rem">Stack:</span>
            <span class="tech-badge">React 18 + Vite</span>
            <span class="tech-badge">Node.js + Express</span>
            <span class="tech-badge">Supabase + PostgreSQL</span>
            <span class="tech-badge">Supabase Auth + RLS</span>
            <span class="tech-badge">Supabase Storage</span>
            <span class="tech-badge">OpenAI API</span>
            <span class="tech-badge">Puppeteer</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="controls">
    <button class="nav-btn" id="prevBtn" onclick="navigate(-1)">&#8592;</button>
    <div class="dots" id="dots"></div>
    <button class="nav-btn" id="nextBtn" onclick="navigate(1)">&#8594;</button>
    <button class="auto-btn" id="autoBtn" onclick="toggleAuto()">▶ Auto</button>
  </div>
</div>

<div class="hint" id="hint">← → teclas de seta &nbsp;|&nbsp; Espaço para auto-play</div>

<script>
  const TOTAL = ${validSlides.length + 1};
  let current = 0;
  let autoPlay = false;
  let autoTimer = null;
  const AUTO_DELAY = 5000;

  const slides = document.querySelectorAll('.slide');
  const dots = document.getElementById('dots');
  const progressFill = document.getElementById('progressFill');
  const slideCounter = document.getElementById('slideCounter');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const autoBtn = document.getElementById('autoBtn');

  // Build dots
  for (let i = 0; i < TOTAL; i++) {
    const d = document.createElement('div');
    d.className = 'dot' + (i === 0 ? ' active' : '');
    d.onclick = () => goTo(i);
    dots.appendChild(d);
  }

  function goTo(idx) {
    slides[current].classList.remove('active');
    slides[current].classList.add('exit');
    setTimeout(() => slides[current < idx ? current : current].classList.remove('exit'), 500);
    current = Math.max(0, Math.min(TOTAL - 1, idx));
    slides[current].classList.add('active');

    // Update UI
    const pct = ((current) / (TOTAL - 1)) * 100;
    progressFill.style.width = pct + '%';
    slideCounter.textContent = (current + 1) + ' / ' + TOTAL;
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === TOTAL - 1;
    document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === current));

    // Reset exit classes
    slides.forEach((s, i) => { if (i !== current) { setTimeout(() => s.classList.remove('exit'), 500); } });
  }

  function navigate(dir) {
    goTo(current + dir);
    if (autoPlay && current === TOTAL - 1) { stopAuto(); }
  }

  function toggleAuto() {
    autoPlay ? stopAuto() : startAuto();
  }

  function startAuto() {
    autoPlay = true;
    autoBtn.textContent = '⏸ Pausar';
    autoBtn.classList.add('running');
    autoTimer = setInterval(() => {
      if (current < TOTAL - 1) navigate(1);
      else stopAuto();
    }, AUTO_DELAY);
  }

  function stopAuto() {
    autoPlay = false;
    autoBtn.textContent = '▶ Auto';
    autoBtn.classList.remove('running');
    clearInterval(autoTimer);
  }

  function startPresentation() {
    document.getElementById('cover').classList.add('hidden');
    document.getElementById('slideshow').style.display = 'flex';
    document.getElementById('hint').style.display = 'block';
    goTo(0);
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') navigate(1);
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') navigate(-1);
    if (e.key === ' ') { e.preventDefault(); toggleAuto(); }
    if (e.key === 'Escape') { stopAuto(); document.getElementById('cover').classList.remove('hidden'); document.getElementById('slideshow').style.display = 'none'; }
  });

  // Init first slide
  if (slides.length > 0) slides[0].classList.add('active');
</script>
</body>
</html>`.replace('${validSlides + 1}', validSlides.length + 1 + '');
}

const TOTAL_SLIDES = 13; // referenced in template literal above

main().catch(err => {
  console.error('\n❌ Erro:', err.message);
  process.exit(1);
});
