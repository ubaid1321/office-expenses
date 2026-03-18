const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  description: { type: String, required: true, trim: true, maxlength: 200 },
  amount:      { type: Number, required: true, min: 0.01 },
  category: {
    type: String,
    required: true,
    enum: ['Travel','Food & Drinks','Office Supplies','Client Entertainment',
           'Accommodation','Communication','Utilities','Maintenance','Miscellaneous'],
  },
  date:        { type: Date, required: true, default: Date.now },
  receipt:     { type: String, default: null }, // filename of uploaded file
  notes:       { type: String, default: '', maxlength: 500 },
  spentBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

expenseSchema.index({ spentBy: 1, date: -1 });
expenseSchema.index({ date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);
