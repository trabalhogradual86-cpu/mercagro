/**
 * screenshot-pages.js — Captura screenshots de todas as páginas do Mercagro
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
  console.log(`  screenshot: ${name}.png`);
}

async function waitForLoad(page, timeout = 10000) {
  await page.waitForFunction(
    () => !document.querySelector('.loading') && document.readyState === 'complete',
    { timeout }
  ).catch(() => {});
  await sleep(600);
}

async function login(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await sleep(800);
  const emailInput = await page.$('input[type="email"]');
  const passInput  = await page.$('input[type="password"]');
  await emailInput.click({ clickCount: 3 });
  await emailInput.type(email, { delay: 30 });
  await passInput.click({ clickCount: 3 });
  await passInput.type(password, { delay: 30 });
  await page.click('button[type="submit"]');
  await page.waitForFunction(
    () => !window.location.href.includes('/login'),
    { timeout: 10000 }
  ).catch(() => {});
  await waitForLoad(page);
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--window-size=1280,900'],
    defaultViewport: { width: 1280, height: 900 },
  });

  const page = await browser.newPage();
  console.log('\n=== MERCAGRO — Screenshots ===\n');

  // ── Páginas públicas ──────────────────────────────────────────────
  console.log('Capturando páginas públicas...');

  await page.goto(BASE, { waitUntil: 'networkidle2' });
  await sleep(1000);
  await screenshot(page, '01-home');

  await page.goto(`${BASE}/equipment`, { waitUntil: 'networkidle2' });
  await sleep(2000);
  await screenshot(page, '02-equipment');

  await page.goto(`${BASE}/auctions`, { waitUntil: 'networkidle2' });
  await sleep(1500);
  await screenshot(page, '03-auctions');

  // ── Login usuário comum ───────────────────────────────────────────
  console.log('Login com usuario@mercagro.com...');
  await login(page, USER.email, USER.password);

  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle2' });
  await waitForLoad(page);
  await screenshot(page, '04-dashboard');

  await page.goto(`${BASE}/my-rentals`, { waitUntil: 'networkidle2' });
  await waitForLoad(page);
  await screenshot(page, '05-my-rentals');

  await page.goto(`${BASE}/profile`, { waitUntil: 'networkidle2' });
  await waitForLoad(page);
  await screenshot(page, '06-profile');

  await page.goto(`${BASE}/my-equipment`, { waitUntil: 'networkidle2' });
  await waitForLoad(page);
  await screenshot(page, '07-my-equipment');

  await page.goto(`${BASE}/onboarding`, { waitUntil: 'networkidle2' });
  await waitForLoad(page);
  await screenshot(page, '08-onboarding');

  // ── Login admin ───────────────────────────────────────────────────
  console.log('Login com admin@mercagro.com...');
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await sleep(500);
  await login(page, ADMIN.email, ADMIN.password);

  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle2' });
  await page.waitForFunction(
    () => document.body.innerText.includes('Painel Administrativo') ||
          window.location.href.includes('/dashboard'),
    { timeout: 8000 }
  ).catch(() => {});
  await sleep(800);
  await screenshot(page, '09-admin');

  console.log(`\nScreenshots salvos em: ${SCREENSHOTS_DIR}`);
  await browser.close();
}

main().catch(err => {
  console.error('Erro fatal:', err.message);
  process.exit(1);
});
