const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  amount:    { type: Number, required: true, min: 1 },
  month:     { type: Number, required: true }, // 1-12
  year:      { type: Number, required: true },
  setBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notes:     { type: String, default: '' },
}, { timestamps: true });

// Only one budget per month+year
budgetSchema.index({ month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
