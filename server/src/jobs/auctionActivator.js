const supabase = require('../lib/supabase');

// Ativa leilões agendados cujo starts_at já chegou
async function activateAuctions() {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('auctions')
    .update({ status: 'active' })
    .eq('status', 'scheduled')
    .lte('starts_at', now)
    .select('id, equipment_id');

  if (error) {
    console.error('[auctionActivator] Erro:', error.message);
    return;
  }

  if (data.length === 0) return;

  // Garante que o equipamento está marcado como em leilão
  const equipmentIds = data.map((a) => a.equipment_id);
  await supabase.from('equipment').update({ status: 'auction' }).in('id', equipmentIds);

  console.log(`[auctionActivator] ${data.length} leilão(ões) ativado(s)`);
}

module.exports = activateAuctions;
