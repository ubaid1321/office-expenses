const express = require('express');
const User = require('../models/User');
const Expense = require('../models/Expense');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(protect, adminOnly);

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort('name');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'employee'].includes(role))
      return res.status(400).json({ message: 'Invalid role' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ message: 'Cannot delete yourself' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
