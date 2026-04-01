const supabase = require('../lib/supabase');

// Corrige equipamentos presos em 'rented' ou 'auction' quando suas locações/leilões já encerraram
async function auditEquipment() {
  // Equipamentos em 'rented' sem locação ativa ou confirmada
  const { data: stuckRented, error: rentErr } = await supabase
    .from('equipment')
    .select('id')
    .eq('status', 'rented')
    .not(
      'id',
      'in',
      `(SELECT equipment_id FROM rentals WHERE status IN ('confirmed','active'))`
    );

  if (rentErr) {
    console.error('[equipmentAuditor] Erro ao auditar rented:', rentErr.message);
  } else if (stuckRented.length > 0) {
    const ids = stuckRented.map((e) => e.id);
    await supabase.from('equipment').update({ status: 'available' }).in('id', ids);
    console.log(`[equipmentAuditor] ${ids.length} equipamento(s) corrigido(s) de 'rented' → 'available'`);
  }

  // Equipamentos em 'auction' sem leilão ativo ou agendado
  const { data: stuckAuction, error: aucErr } = await supabase
    .from('equipment')
    .select('id')
    .eq('status', 'auction')
    .not(
      'id',
      'in',
      `(SELECT equipment_id FROM auctions WHERE status IN ('scheduled','active'))`
    );

  if (aucErr) {
    console.error('[equipmentAuditor] Erro ao auditar auction:', aucErr.message);
  } else if (stuckAuction.length > 0) {
    const ids = stuckAuction.map((e) => e.id);
    await supabase.from('equipment').update({ status: 'available' }).in('id', ids);
    console.log(`[equipmentAuditor] ${ids.length} equipamento(s) corrigido(s) de 'auction' → 'available'`);
  }
}

module.exports = auditEquipment;
