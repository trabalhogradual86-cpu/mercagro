const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/reviewController');

router.post('/', auth, ctrl.create);
router.get('/user/:userId', ctrl.getForUser);
router.get('/rental/:rentalId', ctrl.getForRental);

module.exports = router;
