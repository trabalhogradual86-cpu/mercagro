const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/auctionController');

router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);
router.post('/', auth, ctrl.create);
router.post('/:id/bid', auth, ctrl.bid);

module.exports = router;
