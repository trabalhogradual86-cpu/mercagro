const router = require('express').Router();
const auth = require('../middleware/auth');
const supabase = require('../lib/supabase');

// Cria ou atualiza perfil após cadastro
router.post('/profile', auth, async (req, res, next) => {
  try {
    const { full_name, cpf_cnpj, user_type, location_city, location_state, location_lat, location_lng } = req.body;

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: req.user.id,
        full_name,
        cpf_cnpj,
        user_type,
        location_city,
        location_state,
        location_lat,
        location_lng,
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Busca perfil do usuário logado
router.get('/profile', auth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
