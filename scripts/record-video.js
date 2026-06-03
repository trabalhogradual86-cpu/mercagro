/**
 * record-video.js — MERCAGRO Demo Video
 * Grava apresentação completa do sistema para o TCC.
 *
 * Fluxos cobertos:
 *  1. Página Inicial (Home)
 *  2. Catálogo de Equipamentos + filtros
 *  3. Detalhe de Equipamento + análise de preço IA
 *  4. Leilões ao vivo
 *  5. Detalhe de Leilão
 *  6. Login como produtor
 *  7. Dashboard
 *  8. Minhas Locações
 *  9. Consultor IA (recomendação)
 * 10. Logout → Login como proprietário
 * 11. Meus Equipamentos (tabas: equipamentos + solicitações)
 * 12. Criar Leilão (modal)
 * 13. Perfil do usuário
 * 14. Login como admin
 * 15. Painel Admin — 6 abas
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
const WEBM    = path.join(OUT_DIR, 'mercagro-apresentacao.webm');
const MP4     = path.join(OUT_DIR, 'mercagro-apresentacao.mp4');

const ADMIN       = { email: 'admin@mercagro.com',           password: 'Admin@123456' };
const PROPRIETARIO = { email: 'proprietario1@mercagro.com',  password: 'Teste@123456' };
const PRODUTOR    = { email: 'produtor1@mercagro.com',       password: 'Teste@123456' };

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

/* ── helpers ─────────────────────────────────────────────────── */

async function waitLoad(page, timeout = 12000) {
  await page.waitForFunction(
    () => !document.querySelector('.loading') && document.readyState === 'complete',
    { timeout }
  ).catch(() => {});
  await sleep(700);
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

async function smoothScroll(page, amount = 500) {
  await page.evaluate(async (px) => {
    return new Promise(r => {
      let moved = 0;
      const step = () => {
        const chunk = Math.min(12, px - moved);
        window.scrollBy(0, chunk);
        moved += chunk;
        if (moved < px) requestAnimationFrame(step);
        else setTimeout(r, 120);
      };
      requestAnimationFrame(step);
    });
  }, amount);
}

async function scrollTop(page) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await sleep(600);
}

async function loginAs(page, { email, password }) {
  await page.goto(`${BASE}/entrar`, { waitUntil: 'networkidle2' });
  await sleep(1000);

  // Digita devagar para efeito visual
  await page.click('input[type="email"]');
  for (const c of email) { await page.type('input[type="email"]', c); await sleep(45); }
  await sleep(300);
  await page.click('input[type="password"]');
  for (const c of password) { await page.type('input[type="password"]', c); await sleep(40); }
  await sleep(500);

  // Garante valores via React antes de submeter
  await typeReact(page, 'input[type="email"]', email);
  await typeReact(page, 'input[type="password"]', password);
  await sleep(300);

  await page.click('button[type="submit"]');
  await page.waitForFunction(
    () => !window.location.href.includes('/entrar'),
    { timeout: 15000 }
  ).catch(() => {});
  await waitLoad(page);
}

async function logout(page) {
  // Abre menu avatar e clica em Sair
  const avatarBtn = await page.$('button[style*="border-radius: 50%"], button[style*="border-radius:50%"]');
  if (avatarBtn) {
    await avatarBtn.click();
    await sleep(600);
    const btns = await page.$$('button');
    for (const btn of btns) {
      const txt = await page.evaluate(el => el.textContent.trim(), btn);
      if (txt === 'Sair') { await btn.click(); break; }
    }
    await sleep(1000);
  } else {
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle2' });
  }
}

async function clickTabContaining(page, text) {
  const tabs = await page.$$('.tab-item, .tab-btn, button[class*="tab"]');
  for (const tab of tabs) {
    const txt = await page.evaluate(el => el.textContent.trim(), tab);
    if (txt.toLowerCase().includes(text.toLowerCase())) {
      await tab.click();
      await sleep(1000);
      return true;
    }
  }
  return false;
}

/* ── main ────────────────────────────────────────────────────── */

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║   MERCAGRO — Gravação de Apresentação Final       ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  // Verifica frontend
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
  console.log('  [1/15] Home');
  await page.goto(BASE, { waitUntil: 'networkidle2' });
  await sleep(2500);
  await smoothScroll(page, 600);
  await sleep(1800);
  await smoothScroll(page, 700);
  await sleep(1800);
  await scrollTop(page);
  await sleep(1000);

  /* ━━ CENA 2 — Catálogo de Equipamentos ━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('  [2/15] Equipamentos');
  await page.goto(`${BASE}/equipamentos`, { waitUntil: 'networkidle2' });
  await waitLoad(page);
  await sleep(2000);
  await smoothScroll(page, 500);
  await sleep(1500);

  // Clica no filtro de categoria (Trator)
  const selects = await page.$$('select');
  if (selects.length > 0) {
    await page.select('select', 'Trator').catch(() => {});
    await sleep(1500);
    await page.select('select', '').catch(() => {});
    await sleep(800);
  }

  /* ━━ CENA 3 — Detalhe de Equipamento ━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('  [3/15] Detalhe de Equipamento');
  const cards = await page.$$('.card.card-hover, .card-hover');
  if (cards.length > 0) {
    await cards[0].click();
    await waitLoad(page);
    await sleep(2000);
    await smoothScroll(page, 400);
    await sleep(1500);

    // Clicar em "Analisar preço com IA" se disponível
    const allBtns = await page.$$('button');
    for (const btn of allBtns) {
      const txt = await page.evaluate(el => el.textContent, btn);
      if (txt.includes('IA') || txt.includes('Analisar')) {
        await btn.click();
        await sleep(3000);
        break;
      }
    }
    await scrollTop(page);
  } else {
    await page.goto(`${BASE}/equipamentos`, { waitUntil: 'networkidle2' });
    await sleep(1500);
  }

  /* ━━ CENA 4 — Leilões ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('  [4/15] Leiloes');
  await page.goto(`${BASE}/leiloes`, { waitUntil: 'networkidle2' });
  await waitLoad(page);
  await sleep(2000);
  await smoothScroll(page, 400);
  await sleep(1500);

  /* ━━ CENA 5 — Detalhe de Leilão ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('  [5/15] Detalhe de Leilao');
  const leilaoCards = await page.$$('.card.card-hover, .card-hover');
  if (leilaoCards.length > 0) {
    await leilaoCards[0].click();
    await waitLoad(page);
    await sleep(2500);
    await smoothScroll(page, 300);
    await sleep(1500);
    await scrollTop(page);
  }

  /* ━━ CENA 6 — Login como Produtor ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('  [6/15] Login como produtor');
  await loginAs(page, PRODUTOR);
  await sleep(1000);

  /* ━━ CENA 7 — Dashboard ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('  [7/15] Dashboard');
  await page.goto(`${BASE}/painel`, { waitUntil: 'networkidle2' });
  await waitLoad(page);
  await sleep(2000);
  await smoothScroll(page, 400);
  await sleep(1500);
  await scrollTop(page);

  /* ━━ CENA 8 — Minhas Locações ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('  [8/15] Minhas Locacoes');
  await page.goto(`${BASE}/minhas-locacoes`, { waitUntil: 'networkidle2' });
  await waitLoad(page);
  await sleep(2200);
  await smoothScroll(page, 400);
  await sleep(1500);
  // Mostrar botão de avaliar se houver locação concluída
  const avaliarBtn = await page.$('button[style*="amber"]');
  if (avaliarBtn) {
    await page.evaluate(el => el.scrollIntoView({ behavior: 'smooth' }), avaliarBtn);
    await sleep(800);
    await avaliarBtn.click();
    await sleep(1500);
    // Fecha o modal
    const cancelBtns = await page.$$('button');
    for (const btn of cancelBtns) {
      const txt = await page.evaluate(el => el.textContent.trim(), btn);
      if (txt === 'Cancelar') { await btn.click(); break; }
    }
    await sleep(600);
  }

  /* ━━ CENA 9 — Consultor IA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('  [9/15] Consultor IA');
  await page.goto(`${BASE}/consultor-ia`, { waitUntil: 'networkidle2' });
  await waitLoad(page);
  await sleep(1500);

  // Preenche formulário
  await page.select('select[name], select', 'Soja').catch(() => {});
  await sleep(300);

  const areaInput = await page.$('input[type="number"]');
  if (areaInput) {
    await typeReact(page, 'input[type="number"]', '200');
    await sleep(300);
  }

  const cityInputs = await page.$$('input[placeholder*="cidade"], input[placeholder*="Cidade"]');
  if (cityInputs.length > 0) {
    await typeReact(page, 'input[placeholder*="cidade"], input[placeholder*="Cidade"]', 'Sorriso').catch(async () => {
      const inputs = await page.$$('input[type="text"]');
      if (inputs.length > 0) await typeReact(page, 'input[type="text"]', 'Sorriso').catch(() => {});
    });
    await sleep(300);
  }

  await sleep(800);
  const submitBtn = await page.$('button[type="submit"]');
  if (submitBtn) {
    await submitBtn.click();
    await sleep(5000); // aguarda resposta da IA
    await smoothScroll(page, 300);
    await sleep(2000);
  }

  /* ━━ CENA 10 — Logout → Login como Proprietário ━━━━━━━━━━━━━━ */
  console.log('  [10/15] Logout e login como proprietario');
  await logout(page);
  await sleep(800);
  await loginAs(page, PROPRIETARIO);
  await sleep(800);

  /* ━━ CENA 11 — Meus Equipamentos ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('  [11/15] Meus Equipamentos');
  await page.goto(`${BASE}/meus-equipamentos`, { waitUntil: 'networkidle2' });
  await waitLoad(page);
  await sleep(2000);
  await smoothScroll(page, 400);
  await sleep(1500);

  // Alterna para aba Solicitações
  await clickTabContaining(page, 'Solicitações');
  await sleep(1500);
  // Volta para Equipamentos
  await clickTabContaining(page, 'Equipamentos');
  await sleep(1200);

  /* ━━ CENA 12 — Criar Leilão ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('  [12/15] Criar Leilao (modal)');
  const auctionBtn = await page.$('button[style*="fef9c3"], button[style*="fde68a"]');
  if (auctionBtn) {
    await page.evaluate(el => el.scrollIntoView({ behavior: 'smooth' }), auctionBtn);
    await sleep(800);
    await auctionBtn.click();
    await sleep(1500);
    // Preenche preço inicial
    const priceInput = await page.$('input[type="number"][placeholder*="500"]');
    if (priceInput) {
      await priceInput.click();
      await page.type('input[type="number"]', '1500', { delay: 60 });
      await sleep(800);
    }
    // Fecha o modal sem salvar (demonstração)
    const cancelBtn = await page.$('button[style*="var(--gray-700)"]');
    if (cancelBtn) { await cancelBtn.click(); }
    else {
      // Fecha clicando fora
      await page.mouse.click(50, 50);
    }
    await sleep(800);
  }

  /* ━━ CENA 13 — Perfil ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('  [13/15] Perfil');
  await page.goto(`${BASE}/perfil`, { waitUntil: 'networkidle2' });
  await waitLoad(page);
  await sleep(2000);

  /* ━━ CENA 14 — Login Admin ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('  [14/15] Login Admin');
  await logout(page);
  await sleep(600);
  await loginAs(page, ADMIN);
  await sleep(800);

  /* ━━ CENA 15 — Painel Admin ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('  [15/15] Painel Admin — todas as abas');
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle2' });
  await page.waitForFunction(
    () => document.body.innerText.includes('Admin') || document.body.innerText.includes('Painel'),
    { timeout: 12000 }
  ).catch(() => {});
  await sleep(2500);
  await smoothScroll(page, 300);
  await sleep(1000);

  // Navega pelas abas do admin
  const adminTabLabels = ['Usuários', 'Equipamentos', 'Locações', 'Leilões', 'Contabilidade'];
  for (const label of adminTabLabels) {
    const found = await clickTabContaining(page, label);
    if (found) {
      await smoothScroll(page, 200);
      await sleep(1500);
    }
  }
  // Volta para visão geral
  await clickTabContaining(page, 'Geral');
  await sleep(1500);

  /* ━━ FIM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  await sleep(1000);
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
