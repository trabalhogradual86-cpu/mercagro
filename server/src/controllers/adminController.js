const supabase = require('../lib/supabase');

// GET /api/admin/stats
async function getStats(req, res) {
  try {
    const [
      { count: totalUsers },
      { count: totalEquipment },
      { count: pendingEquipment },
      { count: activeRentals },
      { data: feeData }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('equipment').select('*', { count: 'exact', head: true }),
      supabase.from('equipment').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending'),
      supabase.from('rentals').select('*', { count: 'exact', head: true }).in('status', ['confirmed', 'active']),
      supabase.from('rentals').select('platform_fee').in('status', ['confirmed', 'active', 'completed'])
    ]);

    const totalFees = (feeData || []).reduce((acc, r) => acc + Number(r.platform_fee || 0), 0);

    res.json({
      totalUsers: totalUsers || 0,
      totalEquipment: totalEquipment || 0,
      pendingEquipment: pendingEquipment || 0,
      activeRentals: activeRentals || 0,
      totalFees: totalFees.toFixed(2)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/admin/users
async function listUsers(req, res) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, cpf_cnpj, user_type, location_city, location_state, is_admin, is_blocked, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PATCH /api/admin/users/:id/block
async function toggleBlockUser(req, res) {
  try {
    const { id } = req.params;

    const { data: current } = await supabase
      .from('profiles')
      .select('is_blocked')
      .eq('id', id)
      .single();

    if (!current) return res.status(404).json({ error: 'Usuário não encontrado' });

    const { data, error } = await supabase
      .from('profiles')
      .update({ is_blocked: !current.is_blocked })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/admin/equipment
async function listEquipment(req, res) {
  try {
    const { data, error } = await supabase
      .from('equipment')
      .select('id, name, category, brand, model, year, daily_rate, location_city, location_state, status, approval_status, created_at, profiles(full_name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PATCH /api/admin/equipment/:id/approve
async function approveEquipment(req, res) {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('equipment')
      .update({ approval_status: 'approved' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PATCH /api/admin/equipment/:id/reject
async function rejectEquipment(req, res) {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('equipment')
      .update({ approval_status: 'rejected', status: 'inactive' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/admin/rentals
async function listRentals(req, res) {
  try {
    const { data, error } = await supabase
      .from('rentals')
      .select(`
        id, start_date, end_date, daily_rate, total_amount, platform_fee, status, created_at,
        equipment(name, category),
        renter:profiles!rentals_renter_id_fkey(full_name),
        owner:profiles!rentals_owner_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PATCH /api/admin/rentals/:id/cancel
async function cancelRental(req, res) {
  try {
    const { id } = req.params;

    const { data: rental } = await supabase
      .from('rentals')
      .select('equipment_id, status')
      .eq('id', id)
      .single();

    if (!rental) return res.status(404).json({ error: 'Locação não encontrada' });
    if (!['pending', 'confirmed', 'active'].includes(rental.status)) {
      return res.status(400).json({ error: 'Apenas locações ativas podem ser canceladas' });
    }

    await Promise.all([
      supabase.from('rentals').update({ status: 'cancelled' }).eq('id', id),
      supabase.from('equipment').update({ status: 'available' }).eq('id', rental.equipment_id)
    ]);

    res.json({ message: 'Locação cancelada pelo admin' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/admin/auctions
async function listAuctions(req, res) {
  try {
    const { data, error } = await supabase
      .from('auctions')
      .select(`
        id, start_price, current_price, min_increment, starts_at, ends_at, status, created_at,
        equipment(name, category),
        owner:profiles!auctions_owner_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PATCH /api/admin/auctions/:id/cancel
async function cancelAuction(req, res) {
  try {
    const { id } = req.params;

    const { data: auction } = await supabase
      .from('auctions')
      .select('equipment_id, status')
      .eq('id', id)
      .single();

    if (!auction) return res.status(404).json({ error: 'Leilão não encontrado' });
    if (!['scheduled', 'active'].includes(auction.status)) {
      return res.status(400).json({ error: 'Apenas leilões ativos ou agendados podem ser cancelados' });
    }

    await Promise.all([
      supabase.from('auctions').update({ status: 'cancelled' }).eq('id', id),
      supabase.from('equipment').update({ status: 'available' }).eq('id', auction.equipment_id)
    ]);

    res.json({ message: 'Leilão cancelado pelo admin' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/admin/accounting
async function getAccounting(req, res) {
  try {
    const { data, error } = await supabase
      .from('rentals')
      .select(`
        id, total_amount, platform_fee, status, created_at,
        equipment(name),
        renter:profiles!rentals_renter_id_fkey(full_name),
        owner:profiles!rentals_owner_id_fkey(full_name)
      `)
      .in('status', ['confirmed', 'active', 'completed'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    const totalRevenue = (data || []).reduce((acc, r) => acc + Number(r.platform_fee || 0), 0);

    res.json({
      rentals: data,
      totalRevenue: totalRevenue.toFixed(2)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getStats,
  listUsers,
  toggleBlockUser,
  listEquipment,
  approveEquipment,
  rejectEquipment,
  listRentals,
  cancelRental,
  listAuctions,
  cancelAuction,
  getAccounting
};
