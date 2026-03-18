const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Serve uploaded receipts as static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/budget',   require('./routes/budget'));
app.use('/api/admin',    require('./routes/admin'));

app.get('/api/health', (_, res) => res.json({ status: 'OK' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/office_expenses')
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
  })
  .catch((err) => { console.error('❌ MongoDB error:', err.message); process.exit(1); });
