/**
 * setup-admin.js
 * Aplica a migration 006 e configura o admin@mercagro.com
 *
 * Uso: node scripts/setup-admin.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = 'admin@mercagro.com';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não encontradas no .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Extrai o project ref da URL (ex: ksmcsmlihchnamtsfvnu)
const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];

// ── Helper: chama a Management API do Supabase para rodar SQL ─────────────────
function runSqlViaApi(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${projectRef}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ ok: true, data });
        } else {
          resolve({ ok: false, status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── SQL da migration 006 ──────────────────────────────────────────────────────
const MIGRATION_SQL = [
  `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false`,
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

async function applyMigration() {
  console.log('\n📦 Aplicando migration 006_admin...');
  let usedApi = false;

  for (const sql of MIGRATION_SQL) {
    const preview = sql.length > 70 ? sql.substring(0, 70) + '...' : sql;
    const result = await runSqlViaApi(sql);

    if (result.ok) {
      usedApi = true;
      console.log(`  ✓ ${preview}`);
    } else {
      // Management API recusou (precisa de PAT), tenta via RPC se existir
      if (!usedApi && result.status === 401) {
        console.log('  ⚠ Management API requer token pessoal. Tentando abordagem alternativa...');
        return false;
      }
      const msg = (() => { try { return JSON.parse(result.data)?.message || result.data; } catch { return result.data; } })();
      console.log(`  ⚠ ${preview}\n     → ${msg}`);
    }
  }
  return usedApi;
}

async function setAdmin() {
  console.log('\n👤 Configurando admin@mercagro.com...');

  // Busca o usuário admin
  const { data: users, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) throw listErr;

  const adminUser = users.users.find(u => u.email === ADMIN_EMAIL);
  if (!adminUser) {
    console.log(`  ⚠ Usuário ${ADMIN_EMAIL} não encontrado. Execute o seed primeiro: node seed.js`);
    return false;
  }

  // Tenta update (só funciona se a coluna is_admin já existe)
  const { error } = await supabase
    .from('profiles')
    .update({ is_admin: true })
    .eq('id', adminUser.id);

  if (error) {
    if (error.message.includes('column') && error.message.includes('is_admin')) {
      console.log('  ⚠ Coluna is_admin ainda não existe. A migration precisa ser aplicada primeiro.');
      return false;
    }
    throw error;
  }

  console.log(`  ✓ ${ADMIN_EMAIL} definido como ADMIN`);
  return true;
}

async function approveExistingEquipment() {
  console.log('\n🚜 Aprovando equipamentos existentes...');
  const { data, error } = await supabase
    .from('equipment')
    .update({ approval_status: 'approved' })
    .is('approval_status', null);

  if (error && error.message.includes('approval_status')) {
    console.log('  ⚠ Coluna approval_status ainda não existe. Execute a migration primeiro.');
    return;
  }
  console.log('  ✓ Equipamentos existentes aprovados');
}

async function updatePlatformFees() {
  console.log('\n💰 Calculando taxas das locações existentes (1%)...');
  const { data: rentals, error } = await supabase
    .from('rentals')
    .select('id, total_amount')
    .eq('platform_fee', 0);

  if (error) {
    if (error.message.includes('platform_fee')) {
      console.log('  ⚠ Coluna platform_fee ainda não existe. Execute a migration primeiro.');
      return;
    }
    throw error;
  }

  if (!rentals || rentals.length === 0) {
    console.log('  ✓ Nenhuma locação para atualizar');
    return;
  }

  for (const r of rentals) {
    const fee = parseFloat((Number(r.total_amount) * 0.01).toFixed(2));
    await supabase.from('rentals').update({ platform_fee: fee }).eq('id', r.id);
  }
  console.log(`  ✓ ${rentals.length} locações atualizadas com taxa de 1%`);
}

function printManualInstructions() {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║              INSTRUÇÕES — APLICAR MIGRATION MANUALMENTE          ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  1. Acesse: https://supabase.com/dashboard/project/${projectRef}/sql  ║
║  2. Cole e execute o conteúdo de:                                ║
║     supabase/migrations/006_admin.sql                            ║
║  3. Depois rode este script novamente:                           ║
║     node scripts/setup-admin.js                                  ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
`);
}

async function main() {
  console.log('🚀 Mercagro — Setup Admin\n');
  console.log(`   Projeto: ${projectRef}`);
  console.log(`   Admin:   ${ADMIN_EMAIL}`);

  try {
    // 1. Tenta aplicar migration via API
    const migrationOk = await applyMigration();

    if (!migrationOk) {
      printManualInstructions();
      // Ainda tenta o resto caso as colunas já existam de uma run anterior
    }

    // 2. Configura admin
    const adminOk = await setAdmin();

    // 3. Aprovações e taxas (dados, não DDL)
    await approveExistingEquipment();
    await updatePlatformFees();

    if (!migrationOk) {
      console.log('\n⚠ Migration não pôde ser aplicada automaticamente.');
      console.log('  Siga as instruções acima e rode o script novamente.\n');
      process.exit(1);
    }

    console.log(`
✅ Setup concluído com sucesso!

   Credenciais de acesso:
   ┌─────────────────────────────────────────────┐
   │  ADMIN  → admin@mercagro.com | Admin@123456  │
   │  USER   → usuario@mercagro.com | User@123456 │
   └─────────────────────────────────────────────┘

   O painel admin está disponível em: /admin
`);
  } catch (err) {
    console.error('\n❌ Erro:', err.message);
    process.exit(1);
  }
}

main();
