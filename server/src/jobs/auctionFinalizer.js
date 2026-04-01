const supabase = require('../lib/supabase');

// Finaliza leilões ativos cujo ends_at já passou, define o vencedor e libera o equipamento
async function finalizeAuctions() {
  const now = new Date().toISOString();

  const { data: expiredAuctions, error } = await supabase
    .from('auctions')
    .select('id, equipment_id')
    .eq('status', 'active')
    .lt('ends_at', now);

  if (error) {
    console.error('[auctionFinalizer] Erro ao buscar leilões expirados:', error.message);
    return;
  }

  if (expiredAuctions.length === 0) return;

  for (const auction of expiredAuctions) {
    // Busca o lance vencedor (maior valor)
    const { data: topBid } = await supabase
      .from('bids')
      .select('bidder_id')
      .eq('auction_id', auction.id)
      .order('amount', { ascending: false })
      .limit(1)
      .single();

    const updatePayload = { status: 'finished' };
    if (topBid) updatePayload.winner_id = topBid.bidder_id;

    const { error: updateErr } = await supabase
      .from('auctions')
      .update(updatePayload)
      .eq('id', auction.id);

    if (updateErr) {
      console.error(`[auctionFinalizer] Erro ao finalizar leilão ${auction.id}:`, updateErr.message);
      continue;
    }

    await supabase
      .from('equipment')
      .update({ status: 'available' })
      .eq('id', auction.equipment_id);
  }

  console.log(`[auctionFinalizer] ${expiredAuctions.length} leilão(ões) finalizado(s)`);
}

module.exports = finalizeAuctions;
