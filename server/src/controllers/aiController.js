const openaiService = require('../services/openaiService');

async function recommend(req, res, next) {
  try {
    const { crop_type, soil_type, area_ha, location_city, location_state, period } = req.body;
    const result = await openaiService.recommendEquipment({ crop_type, soil_type, area_ha, location_city, location_state, period });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function price(req, res, next) {
  try {
    const { equipment_category, brand, model, year, location_state } = req.body;
    const result = await openaiService.suggestPrice({ equipment_category, brand, model, year, location_state });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { recommend, price };
