/**
 * run-migration.js
 * 1. Abre Edge com o perfil do usuário
 * 2. Navega para Supabase Settings > Database para pegar a DB URL
 * 3. Conecta via pg e executa a migration diretamente
 */
const puppeteer = require('puppeteer');
const { Client } = require(require('path').join(__dirname, '../server/node_modules/pg'));

const sleep = ms => new Promise(r => setTimeout(r, ms));

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const EDGE_USER_DATA = 'C:\\Users\\paulo\\AppData\\Local\\Microsoft\\Edge\\User Data';
const SETTINGS_URL = 'https://supabase.com/dashboard/project/ksmcsmlihchnamtsfvnu/settings/database';

const MIGRATION_STATEMENTS = [
  `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false`,
  `ALTER TABLE equipment ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'))`,
  `UPDATE equipment SET approval_status = 'approved' WHERE approval_status IS NULL OR approval_status = 'pending'`,
  `ALTER TABLE rentals ADD COLUMN IF NOT EXISTS platform_fee numeric(10,2) DEFAULT 0`,
  `UPDATE rentals SET platform_fee = ROUND(total_amount * 0.01, 2) WHERE platform_fee = 0`,
  `DROP POLICY IF EXISTS "Equipamentos públicos" ON equipment`,
  `CREATE POLICY "Equipamentos públicos" ON equipment FOR SELECT USING (status != 'inactive' AND approval_status = 'approved')`,
  `DROP POLICY IF EXISTS "Dono gerencia equipamento" ON equipment`,
  `CREATE POLICY "Dono gerencia equipamento" ON equipment FOR ALL USING (auth.uid() = owner_id)`,
];

async function getDbUrl(browser) {
  console.log('🔑 Obtendo connection string do Supabase...');
  const page = await browser.newPage();
  await page.goto(SETTINGS_URL, { waitUntil: 'networkidle2', timeout: 40000 }).catch(() => {});
  await sleep(4000);

  // Se precisar de login
  if (page.url().includes('sign-in') || page.url().includes('login')) {
    console.log('⚠️  Faça login no Edge que abriu e aguarde...');
    await page.waitForFunction(
      () => !window.location.href.includes('sign-in') && !window.location.href.includes('login'),
      { timeout: 120000 }
    );
    await page.goto(SETTINGS_URL, { waitUntil: 'networkidle2', timeout: 40000 });
    await sleep(4000);
  }

  await page.screenshot({ path: 'db-settings.png' });

  // Tentar revelar a senha clicando no botão de reveal
  try {
    // Procurar botão "Reveal" ou "Show"
    const revealBtn = await page.$('[data-testid="reveal-password"], button[aria-label*="reveal"], button[aria-label*="Reveal"], button[aria-label*="show"]');
    if (revealBtn) {
      await revealBtn.click();
      await sleep(1000);
    }
  } catch {}

  // Extrair a URI de conexão direta do DOM
  const dbUrl = await page.evaluate(() => {
    // Procurar por campos de input que contenham a string de conexão
    const inputs = Array.from(document.querySelectorAll('input, textarea, code, pre'));
    for (const el of inputs) {
      const val = el.value || el.textContent || '';
      if (val.includes('postgresql://') && val.includes('supabase.co')) {
        return val.trim();
      }
    }
    // Buscar no texto completo da página
    const text = document.body.innerText;
    const match = text.match(/postgresql:\/\/postgres:[^@\s]+@[^\s]+/);
    return match ? match[0] : null;
  });

  await page.close();
  return dbUrl;
}

async function runMigration(connectionString) {
  console.log('\n🔧 Conectando ao banco de dados...');

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('✅ Conectado!');

  let passed = 0;
  let failed = 0;

  for (const sql of MIGRATION_STATEMENTS) {
    try {
      await client.query(sql);
      console.log(` ✅ ${sql.substring(0, 70)}...`);
      passed++;
    } catch (err) {
      if (err.message.includes('already exists') || err.message.includes('already exists')) {
        console.log(` ✅ (já existe) ${sql.substring(0, 60)}...`);
        passed++;
      } else {
        console.log(` ❌ ${err.message.substring(0, 80)}`);
        failed++;
      }
    }
  }

  // Setar admin
  try {
    await client.query(`UPDATE profiles SET is_admin = true WHERE email = 'admin@mercagro.com'`);
    await client.query(`UPDATE profiles SET is_admin = false WHERE email = 'usuario@mercagro.com'`);
    console.log(' ✅ admin@mercagro.com configurado como admin');
  } catch (err) {
    console.log(' ⚠️  Não foi possível setar admin:', err.message);
  }

  await client.end();
  console.log(`\n✅ Migration completa: ${passed} ok, ${failed} erros`);
}

async function main() {
  // Tentar primeiro com a URL construída se tivermos a senha salva
  const savedUrl = process.env.DATABASE_URL;
  if (savedUrl) {
    await runMigration(savedUrl);
    return;
  }

  // Abrir Edge para extrair a URL
  console.log('🌐 Abrindo Edge para obter credenciais do Supabase...');
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: EDGE_PATH,
    userDataDir: EDGE_USER_DATA,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--profile-directory=Default'],
    defaultViewport: { width: 1280, height: 800 },
  });

  try {
    const dbUrl = await getDbUrl(browser);

    if (dbUrl) {
      console.log('✅ Connection string encontrada!');
      await runMigration(dbUrl);
    } else {
      console.log('\n❌ Não consegui extrair a connection string automaticamente.');
      console.log('\n📋 Faça manualmente:');
      console.log('1. No Edge aberto, vá em: Settings > Database');
      console.log('2. Copie a "Connection string" (Direct)');
      console.log('3. Cole em DATABASE_URL= no arquivo .env');
      console.log('4. Rode: node scripts/run-migration.js');
      await sleep(30000);
    }
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
