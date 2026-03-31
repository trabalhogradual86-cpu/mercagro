const supabase = require('../lib/supabase');

async function list(req, res, next) {
  try {
    const { category, city, state, status = 'available' } = req.query;

    let query = supabase
      .from('equipment')
      .select('*, profiles(full_name, location_city)')
      .eq('status', status)
      .eq('approval_status', 'approved');

    if (category) query = query.eq('category', category);
    if (city) query = query.ilike('location_city', `%${city}%`);
    if (state) query = query.eq('location_state', state);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('equipment')
      .select('*, profiles(full_name, location_city, location_state)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Equipamento não encontrado' });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, brand, model, year, category, description, daily_rate,
      location_city, location_state, location_lat, location_lng, photos } = req.body;

    const { data, error } = await supabase
      .from('equipment')
      .insert({
        owner_id: req.user.id,
        name, brand, model, year, category, description, daily_rate,
        location_city, location_state, location_lat, location_lng,
        photos: photos || [],
        approval_status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('equipment')
      .select('owner_id')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !existing) return res.status(404).json({ error: 'Equipamento não encontrado' });
    if (existing.owner_id !== req.user.id) return res.status(403).json({ error: 'Sem permissão' });

    const { data, error } = await supabase
      .from('equipment')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('equipment')
      .select('owner_id')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !existing) return res.status(404).json({ error: 'Equipamento não encontrado' });
    if (existing.owner_id !== req.user.id) return res.status(403).json({ error: 'Sem permissão' });

    const { error } = await supabase
      .from('equipment')
      .update({ status: 'inactive' })
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Equipamento removido' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, update, remove };
