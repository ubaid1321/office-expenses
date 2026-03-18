const express = require('express');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/budget?month=6&year=2025  — get budget + spent for a month
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year  = parseInt(req.query.year)  || now.getFullYear();

    const budget = await Budget.findOne({ month, year }).populate('setBy', 'name');

    // Total spent this month by everyone
    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 0, 23, 59, 59);

    const [agg] = await Expense.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    res.json({
      budget: budget || null,
      totalSpent: agg?.total || 0,
      expenseCount: agg?.count || 0,
      remaining: budget ? budget.amount - (agg?.total || 0) : null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/budget  — admin sets/updates monthly budget
router.post('/', adminOnly, async (req, res) => {
  try {
    const { amount, month, year, notes } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Valid amount required' });

    const now = new Date();
    const m = month || now.getMonth() + 1;
    const y = year  || now.getFullYear();

    const budget = await Budget.findOneAndUpdate(
      { month: m, year: y },
      { amount, notes: notes || '', setBy: req.user._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json(budget);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
