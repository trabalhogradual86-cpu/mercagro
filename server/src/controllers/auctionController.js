const supabase = require('../lib/supabase');

async function list(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('auctions')
      .select('*, equipment(name, brand, model, photos, category), profiles!auctions_owner_id_fkey(full_name)')
      .in('status', ['scheduled', 'active'])
      .order('ends_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('auctions')
      .select('*, equipment(*), profiles!auctions_owner_id_fkey(full_name)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Leilão não encontrado' });

    const { data: bids } = await supabase
      .from('bids')
      .select('*, profiles(full_name)')
      .eq('auction_id', req.params.id)
      .order('amount', { ascending: false })
      .limit(20);

    res.json({ ...data, bids: bids || [] });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { equipment_id, start_price, min_increment, starts_at, ends_at } = req.body;

    const { data: equipment } = await supabase
      .from('equipment')
      .select('owner_id, status')
      .eq('id', equipment_id)
      .single();

    if (!equipment) return res.status(404).json({ error: 'Equipamento não encontrado' });
    if (equipment.owner_id !== req.user.id) return res.status(403).json({ error: 'Sem permissão' });
    if (equipment.status !== 'available') return res.status(400).json({ error: 'Equipamento não disponível' });

    const { data, error } = await supabase
      .from('auctions')
      .insert({
        equipment_id,
        owner_id: req.user.id,
        start_price,
        current_price: start_price,
        min_increment: min_increment || 50,
        starts_at,
        ends_at,
        status: new Date(starts_at) <= new Date() ? 'active' : 'scheduled',
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from('equipment').update({ status: 'auction' }).eq('id', equipment_id);

    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

async function bid(req, res, next) {
  try {
    const { amount } = req.body;

    const { data: auction, error: aErr } = await supabase
      .from('auctions')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (aErr || !auction) return res.status(404).json({ error: 'Leilão não encontrado' });
    if (auction.status !== 'active') return res.status(400).json({ error: 'Leilão não está ativo' });
    if (auction.owner_id === req.user.id) return res.status(400).json({ error: 'Dono não pode dar lances' });
    if (new Date() > new Date(auction.ends_at)) return res.status(400).json({ error: 'Leilão encerrado' });

    const minRequired = (auction.current_price || auction.start_price) + auction.min_increment;
    if (amount < minRequired) {
      return res.status(400).json({ error: `Lance mínimo: R$ ${minRequired.toFixed(2)}` });
    }

    const { data: newBid, error: bidErr } = await supabase
      .from('bids')
      .insert({ auction_id: auction.id, bidder_id: req.user.id, amount })
      .select()
      .single();

    if (bidErr) throw bidErr;

    await supabase
      .from('auctions')
      .update({ current_price: amount })
      .eq('id', auction.id);

    res.status(201).json(newBid);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, bid };
