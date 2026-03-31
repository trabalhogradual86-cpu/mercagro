const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');

router.use(adminAuth);

router.get('/stats', adminController.getStats);

router.get('/users', adminController.listUsers);
router.patch('/users/:id/block', adminController.toggleBlockUser);

router.get('/equipment', adminController.listEquipment);
router.patch('/equipment/:id/approve', adminController.approveEquipment);
router.patch('/equipment/:id/reject', adminController.rejectEquipment);

router.get('/rentals', adminController.listRentals);
router.patch('/rentals/:id/cancel', adminController.cancelRental);

router.get('/auctions', adminController.listAuctions);
router.patch('/auctions/:id/cancel', adminController.cancelAuction);

router.get('/accounting', adminController.getAccounting);

module.exports = router;
