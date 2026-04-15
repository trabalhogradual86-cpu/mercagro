const activateRentals = require('../../server/src/jobs/rentalActivator');
const completeRentals = require('../../server/src/jobs/rentalCompleter');
const activateAuctions = require('../../server/src/jobs/auctionActivator');
const finalizeAuctions = require('../../server/src/jobs/auctionFinalizer');
const expirePendingRentals = require('../../server/src/jobs/rentalExpirer');
const auditEquipment = require('../../server/src/jobs/equipmentAuditor');

module.exports = async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const results = {};

  try {
    await activateRentals();
    results.activateRentals = 'ok';
  } catch (e) {
    results.activateRentals = e.message;
  }

  try {
    await completeRentals();
    results.completeRentals = 'ok';
  } catch (e) {
    results.completeRentals = e.message;
  }

  try {
    await activateAuctions();
    results.activateAuctions = 'ok';
  } catch (e) {
    results.activateAuctions = e.message;
  }

  try {
    await finalizeAuctions();
    results.finalizeAuctions = 'ok';
  } catch (e) {
    results.finalizeAuctions = e.message;
  }

  try {
    await expirePendingRentals();
    results.expirePendingRentals = 'ok';
  } catch (e) {
    results.expirePendingRentals = e.message;
  }

  try {
    await auditEquipment();
    results.auditEquipment = 'ok';
  } catch (e) {
    results.auditEquipment = e.message;
  }

  res.json({ ran_at: new Date().toISOString(), results });
};
