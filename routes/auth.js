const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Validation rules
const registerValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['admin', 'lecturer', 'student']),
    body('first_name').notEmpty().trim(),
    body('last_name').notEmpty().trim(),
    body('phone').optional().isMobilePhone()
];

const loginValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
];

// Routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.get('/profile', authenticateToken, authController.getProfile);

// Test route
router.get('/test', (req, res) => {
    res.json({ 
        message: 'Auth route is working!',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;