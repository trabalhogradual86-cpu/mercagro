const supabase = require('../lib/supabase');

// Ativa locações confirmadas cuja start_date já chegou
async function activateRentals() {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('rentals')
    .update({ status: 'active' })
    .eq('status', 'confirmed')
    .lte('start_date', today)
    .select('id');

  if (error) {
    console.error('[rentalActivator] Erro:', error.message);
    return;
  }

  if (data.length > 0) {
    console.log(`[rentalActivator] ${data.length} locação(ões) ativada(s)`);
  }
}

module.exports = activateRentals;
