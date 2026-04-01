const cron = require('node-cron');
const activateRentals = require('./rentalActivator');
const completeRentals = require('./rentalCompleter');
const activateAuctions = require('./auctionActivator');
const finalizeAuctions = require('./auctionFinalizer');
const expirePendingRentals = require('./rentalExpirer');
const auditEquipment = require('./equipmentAuditor');

// A cada hora: ativa locações confirmadas cuja start_date chegou
cron.schedule('0 * * * *', activateRentals);

// A cada hora: conclui locações ativas cuja end_date passou
cron.schedule('0 * * * *', completeRentals);

// A cada 5 minutos: ativa leilões agendados cujo starts_at chegou
cron.schedule('*/5 * * * *', activateAuctions);

// A cada 5 minutos: finaliza leilões ativos cujo ends_at passou
cron.schedule('*/5 * * * *', finalizeAuctions);

// Diariamente à meia-noite: cancela locações pendentes sem confirmação há 3+ dias
cron.schedule('0 0 * * *', expirePendingRentals);

// Diariamente às 2h: corrige equipamentos com status inconsistente
cron.schedule('0 2 * * *', auditEquipment);

console.log('[jobs] Cron jobs registrados');
