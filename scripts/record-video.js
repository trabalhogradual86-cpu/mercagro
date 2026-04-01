/**
 * record-video.js
 * Grava um vídeo MP4 navegando pelo sistema Mercagro —
 * simula acesso real: home, catálogo, leilões, login, dashboard,
 * meus equipamentos, perfil, painel admin.
 *
 * Usa Puppeteer screencast (→ webm) + ffmpeg (→ mp4).
 */
const puppeteer = require('../node_modules/puppeteer');
const { execSync, spawnSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const sleep = ms => new Promise(r => setTimeout(r, ms));

const BASE   = 'http://localhost:5173';
const FFMPEG_DIR = 'C:/Users/paulo/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1-full_build/bin';
const FFMPEG = path.join(FFMPEG_DIR, 'ffmpeg.exe');

// Adiciona ffmpeg ao PATH para que o Puppeteer screencast também encontre
process.env.PATH = FFMPEG_DIR + path.delimiter + (process.env.PATH || '');
const OUT_DIR = path.join(__dirname, '../demo');
const WEBM    = path.join(OUT_DIR, 'mercagro-demo.webm');
const MP4     = path.join(OUT_DIR, 'mercagro-demo.mp4');

const ADMIN = { email: 'admin@mercagro.com', password: 'Admin@123456' };
const USER  = { email: 'usuario@mercagro.com', password: 'User@123456' };

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

/* ── helpers ────────────────────────────────────────────────────────── */

async function waitLoad(page) {
  await page.waitForFunction(
    () => !document.querySelector('.loading') && document.readyState === 'complete',
    { timeout: 15000 }
  ).catch(() => {});
  await sleep(600);
}

async function typeReact(page, selector, value) {
  await page.focus(selector);
  await page.evaluate((sel, val) => {
    const el = document.querySelector(sel);
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, selector, value);
}

async function loginAs(page, { email, password }) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await sleep(800);
  await typeReact(page, 'input[type="email"]', email);
  await typeReact(page, 'input[type="password"]', password);
  await sleep(500);
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => !window.location.href.includes('/login'), { timeout: 12000 }).catch(() => {});
  await waitLoad(page);
}

async function smoothScroll(page, amount = 600) {
  await page.evaluate(async (px) => {
    return new Promise(r => {
      let moved = 0;
      const step = () => {
        const chunk = Math.min(15, px - moved);
        window.scrollBy(0, chunk);
        moved += chunk;
        if (moved < px) requestAnimationFrame(step);
        else setTimeout(r, 100);
      };
      requestAnimationFrame(step);
    });
  }, amount);
}

/* ── main ───────────────────────────────────────────────────────────── */

async function main() {
  console.log('\n╔═══════════════════════════════════════════════╗');
  console.log('║  MERCAGRO — Gravação de Vídeo Demo           ║');
  console.log('╚═══════════════════════════════════════════════╝\n');

  // Verifica se o frontend está rodando
  try {
    const http = require('http');
    await new Promise((res, rej) => {
      const req = http.get('http://localhost:5173', r => { r.resume(); res(); });
      req.on('error', rej);
      req.setTimeout(3000, () => { req.destroy(); rej(new Error('timeout')); });
    });
  } catch {
    console.error('❌ Frontend não está rodando em http://localhost:5173');
    console.error('   Execute "npm run dev" na pasta client primeiro.');
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
    ],
    defaultViewport: { width: 1440, height: 860 },
  });

  const page = await browser.newPage();

  console.log('  🎬 Iniciando gravação...\n');

  // Inicia screencast (puppeteer v22+)
  const recorder = await page.screencast({ path: WEBM });

  /* ══════════════════════════════════════════════════════
     CENA 1 — Página Inicial (home)
  ══════════════════════════════════════════════════════ */
  console.log('  📽  Cena 1: Página Inicial');
  await page.goto(BASE, { waitUntil: 'networkidle2' });
  await sleep(2500);
  await smoothScroll(page, 500);
  await sleep(1500);
  await smoothScroll(page, 600);
  await sleep(1500);
  // Scroll back to top
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await sleep(1000);

  /* ══════════════════════════════════════════════════════
     CENA 2 — Catálogo de Equipamentos
  ══════════════════════════════════════════════════════ */
  console.log('  📽  Cena 2: Catálogo de Equipamentos');
  await page.goto(`${BASE}/equipment`, { waitUntil: 'networkidle2' });
  await sleep(2000);
  await smoothScroll(page, 400);
  await sleep(1800);

  /* ══════════════════════════════════════════════════════
     CENA 3 — Leilões
  ══════════════════════════════════════════════════════ */
  console.log('  📽  Cena 3: Leilões Online');
  await page.goto(`${BASE}/auctions`, { waitUntil: 'networkidle2' });
  await sleep(2000);
  await smoothScroll(page, 400);
  await sleep(1500);

  /* ══════════════════════════════════════════════════════
     CENA 4 — Login como usuário comum
  ══════════════════════════════════════════════════════ */
  console.log('  📽  Cena 4: Login de Usuário');
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await sleep(1200);
  // Digita email devagar (efeito cinematográfico)
  await page.click('input[type="email"]');
  await sleep(200);
  for (const char of USER.email) {
    await page.type('input[type="email"]', char);
    await sleep(60);
  }
  await sleep(400);
  await page.click('input[type="password"]');
  await sleep(200);
  for (const char of USER.password) {
    await page.type('input[type="password"]', char);
    await sleep(55);
  }
  await sleep(700);
  // Fix: set value via React setter before submit
  await typeReact(page, 'input[type="email"]', USER.email);
  await typeReact(page, 'input[type="password"]', USER.password);
  await sleep(300);
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => !window.location.href.includes('/login'), { timeout: 12000 }).catch(() => {});
  await waitLoad(page);

  /* ══════════════════════════════════════════════════════
     CENA 5 — Dashboard
  ══════════════════════════════════════════════════════ */
  console.log('  📽  Cena 5: Dashboard do Usuário');
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle2' });
  await waitLoad(page);
  await sleep(2000);
  await smoothScroll(page, 400);
  await sleep(1500);

  /* ══════════════════════════════════════════════════════
     CENA 6 — Minhas Locações
  ══════════════════════════════════════════════════════ */
  console.log('  📽  Cena 6: Minhas Locações');
  await page.goto(`${BASE}/my-rentals`, { waitUntil: 'networkidle2' });
  await waitLoad(page);
  await sleep(2000);

  /* ══════════════════════════════════════════════════════
     CENA 7 — Meus Equipamentos
  ══════════════════════════════════════════════════════ */
  console.log('  📽  Cena 7: Meus Equipamentos');
  await page.goto(`${BASE}/my-equipment`, { waitUntil: 'networkidle2' });
  await waitLoad(page);
  await sleep(1800);
  // Clicar em abas se existirem
  const tabs = await page.$$('.tab-btn');
  if (tabs.length > 1) {
    await tabs[1].click();
    await sleep(1200);
    await tabs[0].click();
    await sleep(800);
  }

  /* ══════════════════════════════════════════════════════
     CENA 8 — Cadastrar Equipamento
  ══════════════════════════════════════════════════════ */
  console.log('  📽  Cena 8: Formulário de Cadastro');
  await page.goto(`${BASE}/equipment/new`, { waitUntil: 'networkidle2' });
  await waitLoad(page);
  await sleep(1500);
  await smoothScroll(page, 400);
  await sleep(1500);
  await smoothScroll(page, 400);
  await sleep(1000);

  /* ══════════════════════════════════════════════════════
     CENA 9 — Perfil
  ══════════════════════════════════════════════════════ */
  console.log('  📽  Cena 9: Perfil do Usuário');
  await page.goto(`${BASE}/profile`, { waitUntil: 'networkidle2' });
  await waitLoad(page);
  await sleep(2000);

  /* ══════════════════════════════════════════════════════
     CENA 10 — Login Admin
  ══════════════════════════════════════════════════════ */
  console.log('  📽  Cena 10: Login Admin');
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await sleep(400);
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await sleep(1000);
  for (const char of ADMIN.email) {
    await page.type('input[type="email"]', char);
    await sleep(55);
  }
  await sleep(400);
  for (const char of ADMIN.password) {
    await page.type('input[type="password"]', char);
    await sleep(50);
  }
  await sleep(600);
  await typeReact(page, 'input[type="email"]', ADMIN.email);
  await typeReact(page, 'input[type="password"]', ADMIN.password);
  await sleep(300);
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => !window.location.href.includes('/login'), { timeout: 12000 }).catch(() => {});
  await waitLoad(page);

  /* ══════════════════════════════════════════════════════
     CENA 11 — Painel Admin — Visão Geral
  ══════════════════════════════════════════════════════ */
  console.log('  📽  Cena 11: Painel Admin — Visão Geral');
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle2' });
  await page.waitForFunction(
    () => document.body.innerText.includes('Painel Administrativo') ||
          document.body.innerText.includes('Admin'),
    { timeout: 10000 }
  ).catch(() => {});
  await sleep(2200);

  /* ══════════════════════════════════════════════════════
     CENA 12 — Admin: navega pelas abas
  ══════════════════════════════════════════════════════ */
  console.log('  📽  Cena 12: Abas do Admin');
  const adminTabs = await page.$$('.tab-btn');
  const tabLabels = ['Usuários', 'Equipamentos', 'Locações', 'Leilões', 'Contabilidade'];
  for (const label of tabLabels) {
    for (const t of adminTabs) {
      const txt = await page.evaluate(el => el.textContent, t);
      if (txt.includes(label)) {
        await t.click();
        await sleep(1400);
        break;
      }
    }
  }
  // Volta para Visão Geral
  if (adminTabs[0]) { await adminTabs[0].click(); await sleep(1000); }

  /* ══════════════════════════════════════════════════════
     CENA 13 — Onboarding
  ══════════════════════════════════════════════════════ */
  console.log('  📽  Cena 13: Tela de Boas-vindas (Onboarding)');
  await page.goto(`${BASE}/onboarding`, { waitUntil: 'networkidle2' });
  await waitLoad(page);
  await sleep(2000);

  /* ══════════════════════════════════════════════════════
     FIM
  ══════════════════════════════════════════════════════ */
  await sleep(800);
  console.log('\n  ⏹  Finalizando gravação...');
  await recorder.stop();
  await browser.close();

  // Converte webm → mp4 com ffmpeg
  console.log('  🔄 Convertendo webm → mp4...');
  const result = spawnSync(FFMPEG, [
    '-y',
    '-i', WEBM,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    MP4,
  ], { stdio: 'pipe' });

  if (result.status === 0) {
    const size = (fs.statSync(MP4).size / 1024 / 1024).toFixed(1);
    console.log(`\n╔═══════════════════════════════════════════════╗`);
    console.log(`║  ✅ Vídeo gerado com sucesso!                 ║`);
    console.log(`╚═══════════════════════════════════════════════╝`);
    console.log(`\n  📹 Arquivo: ${MP4}`);
    console.log(`  📦 Tamanho: ${size} MB\n`);
    // Remove webm intermediário
    fs.unlinkSync(WEBM);
  } else {
    console.log('  ⚠️  ffmpeg falhou. O webm está disponível em:', WEBM);
    console.log('  Erro:', result.stderr?.toString().slice(-300));
  }
}

main().catch(err => {
  console.error('\n❌ Erro fatal:', err.message);
  process.exit(1);
});
