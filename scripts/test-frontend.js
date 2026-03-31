/**
 * test-frontend.js — Debug visual do sistema Mercagro
 */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const sleep = ms => new Promise(r => setTimeout(r, ms));
const BASE = 'http://localhost:5173';
const SCREENSHOTS_DIR = path.join(__dirname, '../screenshots');

const ADMIN = { email: 'admin@mercagro.com', password: 'Admin@123456' };
const USER  = { email: 'usuario@mercagro.com', password: 'User@123456' };

if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

async function screenshot(page, name) {
  const file = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`  📸 ${name}.png`);
}

async function waitForLoad(page, timeout = 10000) {
  // Espera o spinner de carregamento sumir
  await page.waitForFunction(
    () => !document.querySelector('.loading') && document.readyState === 'complete',
    { timeout }
  ).catch(() => {});
  await sleep(500);
}

async function login(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await sleep(800);
  // Limpar e preencher campos
  const emailInput = await page.$('input[type="email"]');
  const passInput  = await page.$('input[type="password"]');
  await emailInput.click({ clickCount: 3 });
  await emailInput.type(email, { delay: 30 });
  await passInput.click({ clickCount: 3 });
  await passInput.type(password, { delay: 30 });
  await page.click('button[type="submit"]');
  // Aguarda navegar para fora do login
  await page.waitForFunction(
    () => !window.location.href.includes('/login'),
    { timeout: 10000 }
  ).catch(() => {});
  await waitForLoad(page);
}

async function main() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--window-size=1280,800'],
    defaultViewport: { width: 1280, height: 800 },
  });

  const results = [];
  const consoleErrors = [];

  async function test(name, fn) {
    process.stdout.write(`\n🧪 ${name}...`);
    try {
      await fn();
      results.push({ name, ok: true });
      console.log(' ✅');
    } catch (err) {
      results.push({ name, ok: false, error: err.message });
      console.log(` ❌ ${err.message}`);
    }
  }

  const page = await browser.newPage();
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push(err.message));

  console.log('\n═══════════════════════════════════════');
  console.log('  MERCAGRO — Debug Visual Frontend');
  console.log('═══════════════════════════════════════\n');

  // ── Páginas públicas ──────────────────────────────────────────────

  await test('Home', async () => {
    await page.goto(BASE, { waitUntil: 'networkidle2' });
    await sleep(1000);
    await screenshot(page, '01-home');
  });

  await test('Catálogo Equipamentos', async () => {
    await page.goto(`${BASE}/equipment`, { waitUntil: 'networkidle2' });
    await sleep(2000);
    await screenshot(page, '02-equipment');
    const text = await page.evaluate(() => document.body.innerText);
    if (text.includes('Não foi possível')) throw new Error('Erro ao carregar equipamentos');
  });

  await test('Leilões', async () => {
    await page.goto(`${BASE}/auctions`, { waitUntil: 'networkidle2' });
    await sleep(1500);
    await screenshot(page, '03-auctions');
  });

  // ── Login usuário comum ───────────────────────────────────────────

  await test('Login (usuário comum)', async () => {
    await login(page, USER.email, USER.password);
    const url = page.url();
    await screenshot(page, '04-login-usuario');
    if (url.includes('/login')) throw new Error('Credenciais inválidas ou login falhou');
  });

  await test('Dashboard', async () => {
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle2' });
    await waitForLoad(page);
    await screenshot(page, '05-dashboard');
    const text = await page.evaluate(() => document.body.innerText);
    if (!text.includes('Olá')) throw new Error('Dashboard não carregou — texto "Olá" não encontrado');
  });

  await test('Minhas Locações', async () => {
    await page.goto(`${BASE}/my-rentals`, { waitUntil: 'networkidle2' });
    await waitForLoad(page);
    await screenshot(page, '06-my-rentals');
  });

  await test('Perfil', async () => {
    await page.goto(`${BASE}/profile`, { waitUntil: 'networkidle2' });
    await waitForLoad(page);
    await screenshot(page, '07-profile');
    const hasForm = await page.$('form');
    if (!hasForm) throw new Error('Formulário não encontrado');
  });

  await test('Cadastrar Equipamento', async () => {
    await page.goto(`${BASE}/equipment/new`, { waitUntil: 'networkidle2' });
    await waitForLoad(page);
    await screenshot(page, '08-equipment-new');
    const hasForm = await page.$('form');
    if (!hasForm) throw new Error('Formulário não encontrado');
  });

  // ── Login admin ───────────────────────────────────────────────────

  await test('Login Admin', async () => {
    // Deslogar primeiro
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await sleep(500);
    await login(page, ADMIN.email, ADMIN.password);
    const url = page.url();
    await screenshot(page, '09-login-admin');
    if (url.includes('/login')) throw new Error('Login admin falhou');
  });

  await test('Painel Admin (rota /admin)', async () => {
    await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle2' });
    // Espera "Painel Administrativo" aparecer ou timeout
    await page.waitForFunction(
      () => document.body.innerText.includes('Painel Administrativo') ||
            window.location.href.includes('/dashboard'),
      { timeout: 8000 }
    ).catch(() => {});
    await screenshot(page, '10-admin');
    const text = await page.evaluate(() => document.body.innerText);
    const url  = page.url();
    if (!text.includes('Painel Administrativo')) {
      throw new Error(url.includes('/dashboard')
        ? 'Redirecionado para /dashboard — is_admin não reconhecido'
        : 'Painel admin não carregou');
    }
  });

  await test('Meus Equipamentos', async () => {
    await page.goto(`${BASE}/my-equipment`, { waitUntil: 'networkidle2' });
    await waitForLoad(page);
    await screenshot(page, '11-my-equipment');
  });

  await test('Onboarding', async () => {
    await page.goto(`${BASE}/onboarding`, { waitUntil: 'networkidle2' });
    await waitForLoad(page);
    await screenshot(page, '12-onboarding');
    const text = await page.evaluate(() => document.body.innerText);
    if (!text.includes('Olá')) throw new Error('Onboarding não carregou');
  });

  // ── Erros de console ─────────────────────────────────────────────

  const relevantErrors = consoleErrors.filter(e =>
    !e.includes('favicon') && !e.includes('ResizeObserver')
  );

  if (relevantErrors.length > 0) {
    console.log('\n⚠️  Erros de console:');
    relevantErrors.slice(0, 8).forEach(e => console.log(`   • ${e.substring(0, 120)}`));
  } else {
    console.log('\n✅ Nenhum erro de console relevante.');
  }

  // ── Resumo ────────────────────────────────────────────────────────

  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;

  console.log('\n═══════════════════════════════════════');
  console.log('  RESUMO');
  console.log('═══════════════════════════════════════');
  results.forEach(r => {
    console.log(`  ${r.ok ? '✅' : '❌'} ${r.name}${r.error ? ' — ' + r.error : ''}`);
  });
  console.log(`\n  ${passed} passou · ${failed} falhou`);
  console.log(`  Screenshots: ${SCREENSHOTS_DIR}`);
  console.log('═══════════════════════════════════════\n');

  console.log('Navegador aberto por 20s para inspeção...');
  await sleep(20000);
  await browser.close();
}

main().catch(err => {
  console.error('Erro fatal:', err.message);
  process.exit(1);
});
