const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();
const genToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// POST /api/auth/register
router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('Name required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Min 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { name, email, password, department, adminCode } = req.body;

      if (await User.findOne({ email }))
        return res.status(400).json({ message: 'Email already registered' });

      // First ever user becomes admin automatically, or use admin code
      const count = await User.countDocuments();
      const role = (count === 0 || adminCode === process.env.ADMIN_CODE) ? 'admin' : 'employee';

      const user = await User.create({ name, email, password, department, role });
      res.status(201).json({ token: genToken(user._id), user: sanitize(user) });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// POST /api/auth/login
router.post('/login',
  [body('email').isEmail(), body('password').notEmpty()],
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+password');
      if (!user || !(await user.comparePassword(password)))
        return res.status(401).json({ message: 'Invalid email or password' });
      res.json({ token: genToken(user._id), user: sanitize(user) });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// GET /api/auth/me
router.get('/me', protect, (req, res) => res.json({ user: sanitize(req.user) }));

const sanitize = (u) => ({ _id: u._id, name: u.name, email: u.email, role: u.role, department: u.department });

module.exports = router;
