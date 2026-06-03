const supabase = require('../lib/supabase');

async function create(req, res, next) {
  try {
    const { rental_id, rating, comment } = req.body;
    const reviewer_id = req.user.id;

    if (!rental_id || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rental_id e rating (1-5) são obrigatórios' });
    }

    // Verificar locação existe e foi concluída
    const { data: rental } = await supabase
      .from('rentals')
      .select('*')
      .eq('id', rental_id)
      .single();

    if (!rental) return res.status(404).json({ error: 'Locação não encontrada' });
    if (rental.status !== 'completed') return res.status(400).json({ error: 'Só é possível avaliar locações concluídas' });

    // Verificar se o reviewer é renter ou owner
    if (reviewer_id !== rental.renter_id && reviewer_id !== rental.owner_id) {
      return res.status(403).json({ error: 'Sem permissão para avaliar esta locação' });
    }

    // A pessoa avaliada é o outro participante
    const reviewed_id = reviewer_id === rental.renter_id ? rental.owner_id : rental.renter_id;

    // Verificar se já avaliou
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('rental_id', rental_id)
      .eq('reviewer_id', reviewer_id)
      .single();

    if (existing) return res.status(400).json({ error: 'Você já avaliou esta locação' });

    const { data, error } = await supabase
      .from('reviews')
      .insert({ rental_id, reviewer_id, reviewed_id, rating, comment })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

async function getForUser(req, res, next) {
  try {
    const { userId } = req.params;
    const { data, error } = await supabase
      .from('reviews')
      .select('*, reviewer:profiles!reviewer_id(full_name)')
      .eq('reviewed_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const avg = data.length
      ? data.reduce((s, r) => s + r.rating, 0) / data.length
      : null;

    res.json({ reviews: data, average: avg ? Math.round(avg * 10) / 10 : null, total: data.length });
  } catch (err) {
    next(err);
  }
}

async function getForRental(req, res, next) {
  try {
    const { rentalId } = req.params;
    const { data, error } = await supabase
      .from('reviews')
      .select('*, reviewer:profiles!reviewer_id(full_name)')
      .eq('rental_id', rentalId);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { create, getForUser, getForRental };
