/**
 * record-video.js — MERCAGRO Demo Video (v2)
 * Grava apresentação completa do sistema para o TCC.
 *
 * Fluxos cobertos:
 *  1.  Página Inicial (Home) — scroll e CTAs
 *  2.  Cadastro de novo usuário produtor
 *  3.  Login como produtor
 *  4.  Dashboard do produtor
 *  5.  Catálogo de Equipamentos + filtros
 *  6.  Detalhe de Equipamento + análise de preço IA
 *  7.  Leilões ao vivo — lista
 *  8.  Detalhe de Leilão — dar lance
 *  9.  Consultor IA (recomendação)
 * 10.  Minhas Locações
 * 11.  Chatbot — interação
 * 12.  Logout → Login como Proprietário
 * 13.  Meus Equipamentos — abas Equipamentos e Solicitações
 * 14.  Criar Leilão (modal preenchido)
 * 15.  Perfil do usuário
 * 16.  Login como Admin
 * 17.  Painel Admin — todas as 6 abas
 */

const puppeteer = require('../node_modules/puppeteer');
const { spawnSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const sleep = ms => new Promise(r => setTimeout(r, ms));

const BASE = 'http://localhost:5173';

const FFMPEG_CANDIDATES = [
  'C:/Users/paulo/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1-full_build/bin/ffmpeg.exe',
  'C:/ffmpeg/bin/ffmpeg.exe',
  'ffmpeg',
];

function findFfmpeg() {
  for (const p of FFMPEG_CANDIDATES) {
    try {
      const r = spawnSync(p, ['-version'], { stdio: 'pipe' });
      if (r.status === 0) return p;
    } catch { /* continua */ }
  }
  return null;
}

const OUT_DIR = path.join(__dirname, '../demo');
const WEBM    = path.join(OUT_DIR, 'mercagro-demo.webm');
const MP4     = path.join(OUT_DIR, 'mercagro-demo.mp4');

const ADMIN        = { email: 'admin@mercagro.com',          password: 'Admin@123456' };
const PROPRIETARIO = { email: 'proprietario1@mercagro.com', password: 'Teste@123456' };
const PRODUTOR     = { email: 'produtor1@mercagro.com',     password: 'Teste@123456' };
// Conta de demo para cadastro (pode já existir — erro é ignorado)
const NOVO_USUARIO = {
  fullName: 'João Demo TCC',
  email: `demo.tcc.${Date.now()}@mercagro.com`,
  password: 'Demo@123456',
};

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

/* ── helpers ─────────────────────────────────────────────────── */

async function waitLoad(page, timeout = 10000) {
  await page.waitForFunction(
    () => !document.querySelector('.loading') && document.readyState === 'complete',
    { timeout }
  ).catch(() => {});
  await sleep(500);
}

async function typeReact(page, selector, value) {
  await page.evaluate((sel, val) => {
    const el = document.querySelector(sel);
    if (!el) return;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, selector, value);
}

async function smoothScroll(page, amount = 400) {
  await page.evaluate(async (px) => {
    return new Promise(r => {
      let moved = 0;
      const step = () => {
        const chunk = Math.min(16, px - moved);
        window.scrollBy(0, chunk);
        moved += chunk;
        if (moved < px) requestAnimationFrame(step);
        else setTimeout(r, 80);
      };
      requestAnimationFrame(step);
    });
  }, amount);
}

async function scrollTop(page) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await sleep(500);
}

async function loginAs(page, { email, password }) {
  await page.goto(`${BASE}/entrar`, { waitUntil: 'networkidle2' });
  await sleep(700);
  await page.click('input[type="email"]');
  for (const c of email) { await page.type('input[type="email"]', c); await sleep(35); }
  await sleep(200);
  await page.click('input[type="password"]');
  for (const c of password) { await page.type('input[type="password"]', c); await sleep(30); }
  await sleep(300);
  await typeReact(page, 'input[type="email"]', email);
  await typeReact(page, 'input[type="password"]', password);
  await sleep(200);
  await page.click('button[type="submit"]');
  await page.waitForFunction(
    () => !window.location.href.includes('/entrar'),
    { timeout: 15000 }
  ).catch(() => {});
  await waitLoad(page);
}

async function logout(page) {
  const avatarBtn = await page.$('button[style*="border-radius: 50%"], button[style*="border-radius:50%"]');
  if (avatarBtn) {
    await avatarBtn.click();
    await sleep(500);
    const btns = await page.$$('button');
    for (const btn of btns) {
      const txt = await page.evaluate(el => el.textContent.trim(), btn);
      if (txt === 'Sair') { await btn.click(); break; }
    }
    await sleep(800);
  } else {
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle2' });
  }
}

async function clickTabContaining(page, text) {
  const tabs = await page.$$('.tab-item, .tab-btn, button[class*="tab"], button');
  for (const tab of tabs) {
    const txt = await page.evaluate(el => el.textContent.trim(), tab);
    if (txt.toLowerCase().includes(text.toLowerCase())) {
      await tab.click();
      await sleep(800);
      return true;
    }
  }
  return false;
}

async function clickButtonContaining(page, text) {
  const btns = await page.$$('button');
  for (const btn of btns) {
    const txt = await page.evaluate(el => el.textContent.trim(), btn);
    if (txt.toLowerCase().includes(text.toLowerCase())) {
      await btn.click();
      return true;
    }
  }
  return false;
}

/* ── main ────────────────────────────────────────────────────── */

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║   MERCAGRO — Gravação de Demonstração Final v2    ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  try {
    const http = require('http');
    await new Promise((res, rej) => {
      const req = http.get(`${BASE}`, r => { r.resume(); res(); });
      req.on('error', rej);
      req.setTimeout(3000, () => { req.destroy(); rej(); });
    });
  } catch {
    console.error('  Frontend nao encontrado em', BASE);
    console.error('  Execute: npm run dev\n');
    process.exit(1);
  }

  const ffmpeg = findFfmpeg();
  if (!ffmpeg) console.warn('  ffmpeg nao encontrado — gerando apenas .webm\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--disable-features=VizDisplayCompositor'],
    defaultViewport: { width: 1440, height: 860 },
  });

  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(30000);

  console.log('  Iniciando gravacao...\n');
  const recorder = await page.screencast({ path: WEBM });

  /* ━━ CENA 1 — Home ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('  [1/17] Home');
  await page.goto(BASE, { waitUntil: 'networkidle2' });
  await sleep(2000);
  await smoothScroll(page, 500);
  await sleep(1200);
  await smoothScroll(page, 600);
  await sleep(1200);
  await scrollTop(page);
  await sleep(800);

  /* ━━ CENA 2 — Cadastro ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('  [2/17] Cadastro de novo usuario');
  await page.goto(`${BASE}/cadastrar`, { waitUntil: 'networkidle2' });
  await sleep(800);

  // Preenche nome completo
  const nameInput = await page.$('input[name="fullName"], input[placeholder*="nome"], input[placeholder*="Nome"]');
  if (nameInput) {
    await nameInput.click();
    for (const c of NOVO_USUARIO.fullName) { await page.type('input[name="fullName"], input[placeholder*="nome"], input[placeholder*="Nome"]', c); await sleep(40); }
  }
  await sleep(200);

  // Email
  await page.click('input[type="email"]');
  for (const c of NOVO_USUARIO.email) { await page.type('input[type="email"]', c); await sleep(35); }
  await sleep(200);

  // Senha
  const pwInputs = await page.$$('input[type="password"]');
  if (pwInputs.length > 0) {
    await pwInputs[0].click();
    for (const c of NOVO_USUARIO.password) { await pwInputs[0].type(c); await sleep(30); }
  }
  if (pwInputs.length > 1) {
    await pwInputs[1].click();
    for (const c of NOVO_USUARIO.password) { await pwInputs[1].type(c); await sleep(30); }
  }
  await sleep(400);

  // Tenta selecionar tipo "Produtor"
  const radios = await page.$$('input[type="radio"]');
  for (const radio of radios) {
    const val = await page.evaluate(el => el.value, radio);
    if (val === 'tenant' || val === 'produtor') { await radio.click(); break; }
  }
  await sleep(300);

  await page.click('button[type="submit"]');
  await sleep(2000);
  await waitLoad(page);
  await sleep(800);

  /* ━━ CENA 3 — Login ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('  [3/17] Login como produtor');
  await loginAs(page, PRODUTOR);
  await sleep(800);

  /* ━━ CENA 4 — Dashboard ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('  [4/17] Dashboard');
  await page.goto(`${BASE}/painel`, { waitUntil: 'networkidle2' });
  await waitLoad(page);
  await sleep(1800);
  await smoothScroll(page, 500);
  await sleep(1200);
  await scrollTop(page);
  await sleep(600);

  /* ━━ CENA 5 — Catálogo de Equipamentos ━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('  [5/17] Equipamentos');
  await page.goto(`${BASE}/equipamentos`, { waitUntil: 'networkidle2' });
  await waitLoad(page);
  await sleep(1800);
  await smoothScroll(page, 400);
  await sleep(1000);

  // Filtro por categoria
  const selects = await page.$$('select');
  if (selects.length > 0) {
    await page.select('select', 'Trator').catch(() => {});
    await sleep(1200);
    await page.select('select', '').catch(() => {});
    await sleep(600);
  }

  // Busca por texto
  const searchInput = await page.$('input[placeholder*="uscar"], input[placeholder*="esquis"]');
  if (searchInput) {
    await searchInput.click();
    for (const c of 'John Deere') { await searchInput.type(c); await sleep(50); }
    await sleep(1000);
    // Limpa
    await page.evaluate(el => { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); }, searchInput);
    await sleep(600);
  }

  /* ━━ CENA 6 — Detalhe de Equipamento ━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('  [6/17] Detalhe de Equipamento');
  const cards = await page.$$('.card.card-hover, .card-hover');
  if (cards.length > 0) {
    await cards[0].click();
    await waitLoad(page);
    await sleep(2000);
    await smoothScroll(page, 400);
    await sleep(1200);

    // Analisar preço com IA
    const found = await clickButtonContaining(page, 'IA');
    if (!found) await clickButtonContaining(page, 'Analisar');
    await sleep(3000);
    await smoothScroll(page, 300);
    await sleep(1000);
    await scrollTop(page);
  }

  /* ━━ CENA 7 — Leilões ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('  [7/17] Leiloes ao vivo');
  await page.goto(`${BASE}/leiloes`, { waitUntil: 'networkidle2' });
  await waitLoad(page);
  await sleep(2000);
  await smoothScroll(page, 400);
  await sleep(1000);

  /* ━━ CENA 8 — Detalhe de Leilão + lance ━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('  [8/17] Detalhe de Leilao e lance');
  const leilaoCards = await page.$$('.card.card-hover, .card-hover');
  if (leilaoCards.length > 0) {
    await leilaoCards[0].click();
    await waitLoad(page);
    await sleep(2000);
    await smoothScroll(page, 300);
    await sleep(1000);

    // Tenta dar lance
    const lanceInput = await page.$('input[type="number"][placeholder*="lance"], input[type="number"][placeholder*="Lance"]');
    if (lanceInput) {
      await lanceInput.click();
      await page.evaluate(el => { el.value = ''; }, lanceInput);
      await page.type('input[type="number"]', '2500', { delay: 60 });
      await sleep(800);
      await clickButtonContaining(page, 'Lance');
      await sleep(1500);
    }
    await scrollTop(page);
    await sleep(600);
  }

  /* ━━ CENA 9 — Consultor IA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('  [9/17] Consultor IA');
  await page.goto(`${BASE}/consultor-ia`, { waitUntil: 'networkidle2' });
  await waitLoad(page);
  await sleep(1200);

  await page.select('select', 'Soja').catch(async () => {
    const selects2 = await page.$$('select');
    if (selects2.length) await selects2[0].select('Soja').catch(() => {});
  });
  await sleep(300);

  const areaInput = await page.$('input[type="number"]');
  if (areaInput) { await typeReact(page, 'input[type="number"]', '200'); await sleep(200); }

  const cityInput = await page.$('input[placeholder*="cidade"], input[placeholder*="Cidade"], input[type="text"]');
  if (cityInput) {
    await page.evaluate(el => { el.value = ''; }, cityInput);
    const sel = 'input[placeholder*="cidade"], input[placeholder*="Cidade"], input[type="text"]';
    await typeReact(page, sel, 'Sorriso').catch(() => {});
    await sleep(200);
  }

  const submitBtn = await page.$('button[type="submit"]');
  if (submitBtn) {
    await submitBtn.click();
    await sleep(4500);
    await smoothScroll(page, 400);
    await sleep(1500);
  }

  /* ━━ CENA 10 — Minhas Locações ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('  [10/17] Minhas Locacoes');
  await page.goto(`${BASE}/minhas-locacoes`, { waitUntil: 'networkidle2' });
  await waitLoad(page);
  await sleep(1800);
  await smoothScroll(page, 400);
  await sleep(1200);

  const avaliarBtn = await page.$('button[style*="amber"]');
  if (avaliarBtn) {
    await page.evaluate(el => el.scrollIntoView({ behavior: 'smooth' }), avaliarBtn);
    await sleep(600);
    await avaliarBtn.click();
    await sleep(1200);
    const cancelBtns = await page.$$('button');
    for (const btn of cancelBtns) {
      const txt = await page.evaluate(el => el.textContent.trim(), btn);
      if (txt === 'Cancelar') { await btn.click(); break; }
    }
    await sleep(400);
  }

  /* ━━ CENA 11 — Chatbot ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('  [11/17] Chatbot');
  await page.goto(`${BASE}/equipamentos`, { waitUntil: 'networkidle2' });
  await waitLoad(page);
  await sleep(1000);

  // Abre o chatbot (botão FAB fixo no canto inferior direito)
  const fabBtn = await page.$('button[aria-label="Abrir assistente virtual"]');
  if (fabBtn) {
    await fabBtn.click();
    await sleep(800);

    // Digita uma pergunta
    const chatInput = await page.$('input[placeholder*="pergunta"]');
    if (chatInput) {
      const pergunta = 'Como funciona o leilão?';
      for (const c of pergunta) { await chatInput.type(c); await sleep(45); }
      await sleep(400);
      await page.keyboard.press('Enter');
      await sleep(2200); // aguarda resposta simulada

      // Segunda pergunta
      const pergunta2 = 'Como locar um equipamento?';
      for (const c of pergunta2) { await chatInput.type(c); await sleep(40); }
      await sleep(300);
      await page.keyboard.press('Enter');
      await sleep(2200);

      // Fecha o chat
      await fabBtn.click();
      await sleep(600);
    }
  }

  /* ━━ CENA 12 — Logout → Login Proprietário ━━━━━━━━━━━━━━━━━━━━ */
  console.log('  [12/17] Logout e login como proprietario');
  await logout(page);
  await sleep(600);
  await loginAs(page, PROPRIETARIO);
  await sleep(600);

  /* ━━ CENA 13 — Meus Equipamentos ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('  [13/17] Meus Equipamentos');
  await page.goto(`${BASE}/meus-equipamentos`, { waitUntil: 'networkidle2' });
  await waitLoad(page);
  await sleep(1800);
  await smoothScroll(page, 400);
  await sleep(1000);
  await clickTabContaining(page, 'Solicitações');
  await sleep(1200);
  await clickTabContaining(page, 'Equipamentos');
  await sleep(1000);

  /* ━━ CENA 14 — Criar Leilão ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('  [14/17] Criar Leilao (modal)');
  // Procura botão de criar leilão em qualquer card de equipamento
  const leilaoButtons = await page.$$('button');
  let auctionBtnFound = false;
  for (const btn of leilaoButtons) {
    const txt = await page.evaluate(el => el.textContent.trim(), btn);
    if (txt.toLowerCase().includes('leilão') || txt.toLowerCase().includes('leilao')) {
      await page.evaluate(el => el.scrollIntoView({ behavior: 'smooth' }), btn);
      await sleep(600);
      await btn.click();
      auctionBtnFound = true;
      await sleep(1200);
      break;
    }
  }

  if (auctionBtnFound) {
    // Preenche valores no modal
    const numInputs = await page.$$('input[type="number"]');
    if (numInputs.length > 0) {
      await numInputs[0].click();
      await page.evaluate(el => { el.value = ''; }, numInputs[0]);
      await page.type('input[type="number"]', '2000', { delay: 60 });
      await sleep(500);
    }
    if (numInputs.length > 1) {
      await numInputs[1].click();
      await page.evaluate(el => { el.value = ''; }, numInputs[1]);
      await numInputs[1].type('200', { delay: 60 });
      await sleep(400);
    }
    await sleep(1000);
    // Fecha o modal
    const cancelBtn = await page.$('button[style*="var(--gray-700)"]');
    if (cancelBtn) { await cancelBtn.click(); }
    else { await page.mouse.click(50, 50); }
    await sleep(600);
  }

  /* ━━ CENA 15 — Perfil ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('  [15/17] Perfil');
  await page.goto(`${BASE}/perfil`, { waitUntil: 'networkidle2' });
  await waitLoad(page);
  await sleep(1800);
  await smoothScroll(page, 300);
  await sleep(1000);

  /* ━━ CENA 16 — Login Admin ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('  [16/17] Login Admin');
  await logout(page);
  await sleep(500);
  await loginAs(page, ADMIN);
  await sleep(600);

  /* ━━ CENA 17 — Painel Admin ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('  [17/17] Painel Admin — todas as abas');
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle2' });
  await page.waitForFunction(
    () => document.body.innerText.includes('Admin') || document.body.innerText.includes('Painel'),
    { timeout: 12000 }
  ).catch(() => {});
  await sleep(2000);
  await smoothScroll(page, 300);
  await sleep(800);

  for (const label of ['Usuários', 'Equipamentos', 'Locações', 'Leilões', 'Contabilidade']) {
    const found = await clickTabContaining(page, label);
    if (found) {
      await smoothScroll(page, 200);
      await sleep(1200);
    }
  }
  await clickTabContaining(page, 'Geral');
  await sleep(1200);

  /* ━━ FIM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  await sleep(800);
  console.log('\n  Finalizando gravacao...');
  await recorder.stop();
  await browser.close();

  console.log(`  Arquivo webm: ${WEBM}`);

  if (ffmpeg) {
    console.log('  Convertendo para mp4...');
    const result = spawnSync(ffmpeg, [
      '-y', '-i', WEBM,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '18',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      MP4,
    ], { stdio: 'pipe' });

    if (result.status === 0) {
      const size = (fs.statSync(MP4).size / 1024 / 1024).toFixed(1);
      console.log(`\n╔═══════════════════════════════════════════════════╗`);
      console.log(`║   Video gerado com sucesso!                       ║`);
      console.log(`╚═══════════════════════════════════════════════════╝`);
      console.log(`\n  Arquivo: ${MP4}`);
      console.log(`  Tamanho: ${size} MB\n`);
      fs.unlinkSync(WEBM);
    } else {
      console.log('  ffmpeg falhou. Webm disponivel em:', WEBM);
    }
  } else {
    const size = (fs.statSync(WEBM).size / 1024 / 1024).toFixed(1);
    console.log(`\n  Webm disponivel: ${WEBM} (${size} MB)`);
    console.log('  Instale ffmpeg para converter para mp4.\n');
  }
}

main().catch(err => {
  console.error('\nErro fatal:', err.message);
  process.exit(1);
});
