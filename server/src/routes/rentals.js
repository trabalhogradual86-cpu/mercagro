const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/rentalController');

router.use(auth);

router.post('/', ctrl.create);
router.get('/my', ctrl.myRentals);
router.get('/incoming', ctrl.incoming);
router.patch('/:id/confirm', ctrl.confirm);
router.patch('/:id/cancel', ctrl.cancel);
router.patch('/:id/complete', ctrl.complete);

module.exports = router;
