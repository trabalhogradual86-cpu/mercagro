const supabase = require('../lib/supabase');

async function create(req, res, next) {
  try {
    const { equipment_id, start_date, end_date } = req.body;

    const { data: equipment, error: eqErr } = await supabase
      .from('equipment')
      .select('owner_id, daily_rate, status')
      .eq('id', equipment_id)
      .single();

    if (eqErr || !equipment) return res.status(404).json({ error: 'Equipamento não encontrado' });
    if (equipment.status !== 'available') return res.status(400).json({ error: 'Equipamento não disponível' });
    if (equipment.owner_id === req.user.id) return res.status(400).json({ error: 'Você não pode alugar seu próprio equipamento' });

    const days = Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24));
    if (days <= 0) return res.status(400).json({ error: 'Período inválido' });

    const total_amount = days * equipment.daily_rate;

    const { data, error } = await supabase
      .from('rentals')
      .insert({
        equipment_id,
        renter_id: req.user.id,
        owner_id: equipment.owner_id,
        start_date,
        end_date,
        daily_rate: equipment.daily_rate,
        total_amount,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

async function myRentals(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('rentals')
      .select('*, equipment(name, brand, model, photos), profiles!rentals_owner_id_fkey(full_name)')
      .eq('renter_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function incoming(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('rentals')
      .select('*, equipment(name, brand, model, photos), profiles!rentals_renter_id_fkey(full_name)')
      .eq('owner_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function confirm(req, res, next) {
  try {
    const { data: rental, error: fetchErr } = await supabase
      .from('rentals')
      .select('owner_id, status')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !rental) return res.status(404).json({ error: 'Locação não encontrada' });
    if (rental.owner_id !== req.user.id) return res.status(403).json({ error: 'Sem permissão' });
    if (rental.status !== 'pending') return res.status(400).json({ error: 'Locação não está pendente' });

    const { data, error } = await supabase
      .from('rentals')
      .update({ status: 'confirmed' })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Atualiza status do equipamento para rented
    await supabase
      .from('equipment')
      .update({ status: 'rented' })
      .eq('id', data.equipment_id);

    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function cancel(req, res, next) {
  try {
    const { data: rental, error: fetchErr } = await supabase
      .from('rentals')
      .select('owner_id, renter_id, status, equipment_id')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !rental) return res.status(404).json({ error: 'Locação não encontrada' });

    const isOwner = rental.owner_id === req.user.id;
    const isRenter = rental.renter_id === req.user.id;
    if (!isOwner && !isRenter) return res.status(403).json({ error: 'Sem permissão' });
    if (!['pending', 'confirmed'].includes(rental.status)) {
      return res.status(400).json({ error: 'Locação não pode ser cancelada' });
    }

    const { data, error } = await supabase
      .from('rentals')
      .update({ status: 'cancelled' })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('equipment')
      .update({ status: 'available' })
      .eq('id', rental.equipment_id);

    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { create, myRentals, incoming, confirm, cancel };
