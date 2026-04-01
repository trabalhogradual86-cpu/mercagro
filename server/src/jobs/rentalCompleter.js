const supabase = require('../lib/supabase');

// Completa locações ativas cuja end_date já passou e libera o equipamento
async function completeRentals() {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('rentals')
    .update({ status: 'completed' })
    .eq('status', 'active')
    .lt('end_date', today)
    .select('id, equipment_id');

  if (error) {
    console.error('[rentalCompleter] Erro:', error.message);
    return;
  }

  if (data.length === 0) return;

  const equipmentIds = data.map((r) => r.equipment_id);
  const { error: eqErr } = await supabase
    .from('equipment')
    .update({ status: 'available' })
    .in('id', equipmentIds);

  if (eqErr) {
    console.error('[rentalCompleter] Erro ao liberar equipamentos:', eqErr.message);
    return;
  }

  console.log(`[rentalCompleter] ${data.length} locação(ões) concluída(s), ${equipmentIds.length} equipamento(s) liberado(s)`);
}

module.exports = completeRentals;
