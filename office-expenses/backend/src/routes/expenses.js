const express = require('express');
const fs = require('fs');
const path = require('path');
const Expense = require('../models/Expense');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();
router.use(protect);

// GET /api/expenses — all expenses (everyone sees everyone's)
router.get('/', async (req, res) => {
  try {
    const { month, year, category, user: userId, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (month && year) {
      const m = parseInt(month), y = parseInt(year);
      filter.date = { $gte: new Date(y, m - 1, 1), $lte: new Date(y, m, 0, 23, 59, 59) };
    }
    if (category) filter.category = category;
    if (userId)   filter.spentBy  = userId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .populate('spentBy', 'name department')
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Expense.countDocuments(filter),
    ]);

    res.json({ expenses, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/expenses/summary — totals by category + per person
router.get('/summary', async (req, res) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year  = parseInt(req.query.year)  || now.getFullYear();
    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 0, 23, 59, 59);
    const match = { date: { $gte: start, $lte: end } };

    const [byCategory, byPerson] = await Promise.all([
      Expense.aggregate([
        { $match: match },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      Expense.aggregate([
        { $match: match },
        { $group: { _id: '$spentBy', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { total: 1, count: 1, 'user.name': 1, 'user.department': 1 } },
      ]),
    ]);

    res.json({ byCategory, byPerson });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/expenses — add expense with optional receipt
router.post('/', upload.single('receipt'), async (req, res) => {
  try {
    const { description, amount, category, date, notes } = req.body;
    if (!description || !amount || !category || !date)
      return res.status(400).json({ message: 'description, amount, category, date are required' });

    const expense = await Expense.create({
      description,
      amount: parseFloat(amount),
      category,
      date: new Date(date),
      notes: notes || '',
      receipt: req.file ? req.file.filename : null,
      spentBy: req.user._id,
    });

    const populated = await expense.populate('spentBy', 'name department');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/expenses/:id — edit own expense (admin can edit any)
router.put('/:id', upload.single('receipt'), async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Not found' });

    const isOwner = expense.spentBy.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorised to edit this expense' });

    const { description, amount, category, date, notes } = req.body;
    if (description) expense.description = description;
    if (amount)      expense.amount = parseFloat(amount);
    if (category)    expense.category = category;
    if (date)        expense.date = new Date(date);
    if (notes !== undefined) expense.notes = notes;

    if (req.file) {
      // Delete old receipt file if exists
      if (expense.receipt) {
        const old = path.join(__dirname, '../../uploads', expense.receipt);
        if (fs.existsSync(old)) fs.unlinkSync(old);
      }
      expense.receipt = req.file.filename;
    }

    await expense.save();
    const populated = await expense.populate('spentBy', 'name department');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/expenses/:id — own expense or admin deletes any
router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Not found' });

    const isOwner = expense.spentBy.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorised to delete this expense' });

    // Delete receipt file
    if (expense.receipt) {
      const filePath = path.join(__dirname, '../../uploads', expense.receipt);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await expense.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
