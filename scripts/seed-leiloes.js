/**
 * seed-leiloes.js
 * Cria leilões ativos e agendados com equipamentos disponíveis.
 * Pode ser rodado múltiplas vezes sem duplicar.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function main() {
  console.log('\n=== Seed de Leilões Ativos ===\n');

  // 1. Busca owners
  const { data: owners } = await supabase
    .from('profiles')
    .select('id')
    .in('user_type', ['owner', 'both'])
    .eq('is_blocked', false);

  if (!owners?.length) { console.error('Nenhum owner encontrado.'); return; }

  // 2. Busca equipamentos aprovados e disponíveis (não em leilão ativo)
  const { data: allEquipment } = await supabase
    .from('equipment')
    .select('id, owner_id, name, daily_rate, category')
    .eq('approval_status', 'approved')
    .in('status', ['available', 'inactive'])
    .order('created_at', { ascending: false })
    .limit(60);

  if (!allEquipment?.length) { console.error('Nenhum equipamento disponível.'); return; }

  console.log(`Equipamentos disponíveis: ${allEquipment.length}`);
  console.log(`Owners encontrados: ${owners.length}\n`);

  // 3. Cancela leilões expirados (status active/scheduled mas ends_at no passado)
  const { data: expired } = await supabase
    .from('auctions')
    .select('id')
    .in('status', ['active', 'scheduled'])
    .lt('ends_at', new Date().toISOString());

  if (expired?.length) {
    await supabase
      .from('auctions')
      .update({ status: 'finished' })
      .in('id', expired.map(a => a.id));
    console.log(`Leilões expirados finalizados: ${expired.length}`);
  }

  // 4. Reativa equipamentos de leilões finalizados para 'available'
  if (expired?.length) {
    const { data: expiredAuctions } = await supabase
      .from('auctions')
      .select('equipment_id')
      .in('id', expired.map(a => a.id));

    if (expiredAuctions?.length) {
      await supabase
        .from('equipment')
        .update({ status: 'available' })
        .in('id', expiredAuctions.map(a => a.equipment_id));
    }
  }

  // 5. Verifica quantos leilões ativos já existem
  const { data: existingActive } = await supabase
    .from('auctions')
    .select('id, equipment_id')
    .in('status', ['active', 'scheduled']);

  const existingEqIds = new Set((existingActive || []).map(a => a.equipment_id));
  console.log(`Leilões já ativos/agendados: ${existingActive?.length || 0}`);

  // 6. Filtra equipamentos sem leilão ativo
  const available = allEquipment.filter(eq => !existingEqIds.has(eq.id));
  console.log(`Equipamentos prontos para leilão: ${available.length}\n`);

  const now = new Date();

  // Cria 12 leilões ativos e 6 agendados
  const configs = [
    // 12 ativos — já iniciaram, encerram em 1-5 dias
    ...Array.from({ length: 12 }, (_, i) => ({
      status: 'active',
      starts_at: new Date(now.getTime() - rand(1, 12) * 3600000).toISOString(),
      ends_at: new Date(now.getTime() + rand(1, 5) * 86400000 + rand(1, 23) * 3600000).toISOString(),
    })),
    // 6 agendados — iniciam em 1-3 dias
    ...Array.from({ length: 6 }, (_, i) => ({
      status: 'scheduled',
      starts_at: new Date(now.getTime() + rand(1, 3) * 86400000).toISOString(),
      ends_at: new Date(now.getTime() + rand(4, 8) * 86400000).toISOString(),
    })),
  ];

  let created = 0;
  const shuffled = [...available].sort(() => Math.random() - 0.5);

  for (let i = 0; i < Math.min(configs.length, shuffled.length); i++) {
    const eq = shuffled[i];
    const cfg = configs[i];
    const startPrice = Math.round(Number(eq.daily_rate) * rand(3, 8));
    const minIncrement = pick([50, 100, 150, 200]);

    // Atualiza equipamento para status 'auction'
    await supabase
      .from('equipment')
      .update({ status: 'auction' })
      .eq('id', eq.id);

    // Cria o leilão
    const { data: auction, error } = await supabase
      .from('auctions')
      .insert({
        equipment_id: eq.id,
        owner_id: eq.owner_id,
        start_price: startPrice,
        current_price: cfg.status === 'active' ? startPrice + rand(1, 5) * minIncrement : null,
        min_increment: minIncrement,
        starts_at: cfg.starts_at,
        ends_at: cfg.ends_at,
        status: cfg.status,
      })
      .select('id')
      .single();

    if (error) {
      console.log(`  ERRO ${eq.name}: ${error.message}`);
      continue;
    }

    // Adiciona alguns lances nos ativos
    if (cfg.status === 'active') {
      const bidders = owners.filter(o => o.id !== eq.owner_id);
      const numBids = rand(2, 8);
      let price = startPrice;

      for (let b = 0; b < Math.min(numBids, bidders.length); b++) {
        price += rand(1, 3) * minIncrement;
        await supabase.from('bids').insert({
          auction_id: auction.id,
          bidder_id: pick(bidders).id,
          amount: price,
          created_at: new Date(now.getTime() - rand(1, 60) * 60000).toISOString(),
        });
      }

      // Atualiza current_price com o maior lance
      await supabase
        .from('auctions')
        .update({ current_price: price })
        .eq('id', auction.id);
    }

    created++;
    const tipo = cfg.status === 'active' ? 'ATIVO' : 'AGENDADO';
    console.log(`  [${tipo}] ${eq.name} — R$ ${startPrice} (inc. R$ ${minIncrement})`);
  }

  console.log(`\nLeiloes criados: ${created}`);
  console.log('\nVerificando resultado...');

  const { data: final } = await supabase
    .from('auctions')
    .select('status')
    .in('status', ['active', 'scheduled']);

  const ativos = final?.filter(a => a.status === 'active').length || 0;
  const agendados = final?.filter(a => a.status === 'scheduled').length || 0;
  console.log(`  Ativos: ${ativos} | Agendados: ${agendados}\n`);
}

main().catch(err => { console.error('Erro:', err.message); process.exit(1); });
