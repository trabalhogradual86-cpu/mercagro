const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/aiController');

router.use(auth);

router.post('/recommend', ctrl.recommend);
router.post('/price', ctrl.price);

module.exports = router;
