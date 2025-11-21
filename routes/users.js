const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Validation rules
const createUserValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['admin', 'lecturer', 'student']),
    body('first_name').notEmpty().trim(),
    body('last_name').notEmpty().trim(),
    body('phone').optional().isMobilePhone()
];

const updateUserValidation = [
    body('email').optional().isEmail().normalizeEmail(),
    body('first_name').optional().notEmpty().trim(),
    body('last_name').optional().notEmpty().trim(),
    body('phone').optional().isMobilePhone()
];

// Routes

// Get all users (Admin only)
router.get('/', authenticateToken, authorizeRoles('admin'), userController.getAllUsers);

// Get user by ID (Admin can get any user, users can get their own profile)
router.get('/:id', authenticateToken, userController.getUserById);

// Create new user (Admin only)
router.post('/', authenticateToken, authorizeRoles('admin'), createUserValidation, userController.createUser);

// Update user (Admin can update any user, users can update their own profile)
router.put('/:id', authenticateToken, updateUserValidation, userController.updateUser);

// Delete user (Admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), userController.deleteUser);

// Get users by role (Admin only) - THIS WAS MISSING
router.get('/role/:role', authenticateToken, authorizeRoles('admin'), userController.getUsersByRole);

// Student academic routes
router.get('/:id/academic-profile', authenticateToken, userController.getStudentAcademicProfile);

module.exports = router;