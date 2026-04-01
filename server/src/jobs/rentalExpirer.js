const supabase = require('../lib/supabase');

// Cancela locações pendentes sem confirmação há mais de 3 dias
async function expirePendingRentals() {
  const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('rentals')
    .update({ status: 'cancelled' })
    .eq('status', 'pending')
    .lt('created_at', cutoff)
    .select('id');

  if (error) {
    console.error('[rentalExpirer] Erro:', error.message);
    return;
  }

  if (data.length > 0) {
    console.log(`[rentalExpirer] ${data.length} locação(ões) pendente(s) expirada(s)`);
  }
}

module.exports = expirePendingRentals;
