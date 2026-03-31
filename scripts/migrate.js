/**
 * migrate.js — Aplica a migration 006_admin via supabase-js + service_role
 * Verifica quais colunas existem e aplica o que falta via Management API
 */

const path = require('path');
require(path.join(__dirname, '../server/node_modules/dotenv')).config({ path: path.join(__dirname, '../.env') });
const { createClient } = require(path.join(__dirname, '../server/node_modules/@supabase/supabase-js'));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkColumns() {
  console.log('\n📋 Verificando estado atual do banco...\n');

  const checks = {
    profiles_is_blocked: false,
    equipment_approval_status: false,
    rentals_platform_fee: false,
  };

  // Checar is_blocked em profiles
  try {
    const { error } = await supabase.from('profiles').select('is_blocked').limit(1);
    if (!error) checks.profiles_is_blocked = true;
  } catch {}

  // Checar approval_status em equipment
  try {
    const { error } = await supabase.from('equipment').select('approval_status').limit(1);
    if (!error) checks.equipment_approval_status = true;
  } catch {}

  // Checar platform_fee em rentals
  try {
    const { error } = await supabase.from('rentals').select('platform_fee').limit(1);
    if (!error) checks.rentals_platform_fee = true;
  } catch {}

  return checks;
}

async function applyMigrationViaAPI(sql) {
  const ref = process.env.SUPABASE_URL.match(/https:\/\/([^.]+)/)[1];
  const url = `https://api.supabase.com/v1/projects/${ref}/database/query`;

  const pat = process.env.SUPABASE_PAT;
  if (!pat) return null;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${pat}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  return res.ok ? await res.json() : null;
}

async function run() {
  const checks = await checkColumns();

  console.log('Estado das colunas:');
  console.log(` profiles.is_blocked      : ${checks.profiles_is_blocked ? '✅ existe' : '❌ falta'}`);
  console.log(` equipment.approval_status: ${checks.equipment_approval_status ? '✅ existe' : '❌ falta'}`);
  console.log(` rentals.platform_fee     : ${checks.rentals_platform_fee ? '✅ existe' : '❌ falta'}`);

  const allExist = Object.values(checks).every(Boolean);

  if (allExist) {
    console.log('\n✅ Todas as colunas já existem! Aplicando updates de dados...\n');
    await applyDataUpdates();
    await verifyAdminUser();
    console.log('\n✅ Migration completa!\n');
    return;
  }

  // Tentar via Management API (precisa de SUPABASE_PAT no .env)
  const pat = process.env.SUPABASE_PAT;
  if (pat) {
    console.log('\n🔑 PAT encontrado, aplicando DDL via Management API...');
    await applyDDL();
    await applyDataUpdates();
    await verifyAdminUser();
    console.log('\n✅ Migration completa!\n');
  } else {
    console.log('\n⚠️  Colunas ausentes precisam ser criadas via SQL Editor.');
    console.log('\n📝 Cole o SQL abaixo em:');
    console.log('   https://supabase.com/dashboard/project/ksmcsmlihchnamtsfvnu/sql/new\n');
    console.log('─'.repeat(70));

    const missingSQL = [];
    if (!checks.profiles_is_blocked)
      missingSQL.push(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false;`);
    if (!checks.equipment_approval_status)
      missingSQL.push(
        `ALTER TABLE equipment ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending'\n  CHECK (approval_status IN ('pending', 'approved', 'rejected'));`,
        `UPDATE equipment SET approval_status = 'approved' WHERE approval_status IS NULL OR approval_status = 'pending';`
      );
    if (!checks.rentals_platform_fee) {
      missingSQL.push(
        `ALTER TABLE rentals ADD COLUMN IF NOT EXISTS platform_fee numeric(10,2) DEFAULT 0;`,
        `UPDATE rentals SET platform_fee = ROUND(total_amount * 0.01, 2) WHERE platform_fee = 0;`
      );
    }

    // Sempre recriar as policies
    missingSQL.push(
      `DROP POLICY IF EXISTS "Equipamentos públicos" ON equipment;`,
      `CREATE POLICY "Equipamentos públicos" ON equipment FOR SELECT\n  USING (status != 'inactive' AND approval_status = 'approved');`,
      `DROP POLICY IF EXISTS "Dono gerencia equipamento" ON equipment;`,
      `CREATE POLICY "Dono gerencia equipamento" ON equipment FOR ALL\n  USING (auth.uid() = owner_id);`
    );

    console.log(missingSQL.join('\n\n'));
    console.log('\n' + '─'.repeat(70));
    console.log('\nApós rodar o SQL, execute este script novamente para verificar.\n');
  }
}

async function applyDDL() {
  const statements = [
    `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false`,
    `ALTER TABLE equipment ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'))`,
    `ALTER TABLE rentals ADD COLUMN IF NOT EXISTS platform_fee numeric(10,2) DEFAULT 0`,
    `DROP POLICY IF EXISTS "Equipamentos públicos" ON equipment`,
    `CREATE POLICY "Equipamentos públicos" ON equipment FOR SELECT USING (status != 'inactive' AND approval_status = 'approved')`,
    `DROP POLICY IF EXISTS "Dono gerencia equipamento" ON equipment`,
    `CREATE POLICY "Dono gerencia equipamento" ON equipment FOR ALL USING (auth.uid() = owner_id)`,
  ];

  for (const sql of statements) {
    const result = await applyMigrationViaAPI(sql);
    if (result !== null) {
      console.log(` ✅ ${sql.substring(0, 60)}...`);
    } else {
      console.log(` ❌ Falhou: ${sql.substring(0, 60)}...`);
    }
  }
}

async function applyDataUpdates() {
  // Aprovar equipamentos existentes sem approval_status
  try {
    const { data: eqs } = await supabase
      .from('equipment')
      .select('id, approval_status')
      .or('approval_status.is.null,approval_status.eq.pending');

    if (eqs && eqs.length > 0) {
      const ids = eqs.map(e => e.id);
      const { error } = await supabase
        .from('equipment')
        .update({ approval_status: 'approved' })
        .in('id', ids);
      if (!error) console.log(` ✅ ${ids.length} equipamento(s) aprovado(s)`);
    } else {
      console.log(' ✅ Equipamentos já aprovados');
    }
  } catch (e) {
    console.log(' ⚠️  Não foi possível aprovar equipamentos:', e.message);
  }

  // Calcular platform_fee para locações existentes
  try {
    const { data: rentals } = await supabase
      .from('rentals')
      .select('id, total_amount, platform_fee')
      .eq('platform_fee', 0);

    if (rentals && rentals.length > 0) {
      for (const r of rentals) {
        await supabase
          .from('rentals')
          .update({ platform_fee: parseFloat((r.total_amount * 0.01).toFixed(2)) })
          .eq('id', r.id);
      }
      console.log(` ✅ platform_fee calculado para ${rentals.length} locação(ões)`);
    } else {
      console.log(' ✅ platform_fee já calculado');
    }
  } catch (e) {
    console.log(' ⚠️  Não foi possível atualizar platform_fee:', e.message);
  }
}

async function verifyAdminUser() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, is_admin')
    .eq('email', 'admin@mercagro.com')
    .single();

  if (error || !data) {
    console.log(' ⚠️  Usuário admin@mercagro.com não encontrado');
    return;
  }

  if (!data.is_admin) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', data.id);
    if (!updateError) console.log(' ✅ admin@mercagro.com marcado como admin');
  } else {
    console.log(' ✅ admin@mercagro.com já é admin');
  }

  // Garantir que usuario@mercagro.com não é admin
  const { data: regular } = await supabase
    .from('profiles')
    .select('id, is_admin')
    .eq('email', 'usuario@mercagro.com')
    .single();

  if (regular && regular.is_admin) {
    await supabase.from('profiles').update({ is_admin: false }).eq('id', regular.id);
    console.log(' ✅ usuario@mercagro.com removido de admin');
  }
}

run().catch(console.error);
