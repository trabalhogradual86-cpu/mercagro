require('dotenv').config({ path: '../../.env' });
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const equipmentRoutes = require('./routes/equipment');
const rentalRoutes = require('./routes/rentals');
const auctionRoutes = require('./routes/auctions');
const aiRoutes = require('./routes/ai');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor Mercagro rodando na porta ${PORT}`);
});
