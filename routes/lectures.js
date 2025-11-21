const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const lectureController = require('../controllers/lectureController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Validation rules
const lectureValidation = [
    body('subject_id').notEmpty(),
    body('title').notEmpty().trim(),
    body('scheduled_date').isDate(),
    body('start_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('end_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('room').optional().trim()
];

const updateLectureValidation = [
    body('title').optional().notEmpty().trim(),
    body('scheduled_date').optional().isDate(),
    body('start_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('end_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('room').optional().trim(),
    body('status').optional().isIn(['scheduled', 'ongoing', 'completed', 'cancelled'])
];

// Routes
router.post('/', authenticateToken, authorizeRoles('admin', 'lecturer'), lectureValidation, lectureController.scheduleLecture);
router.get('/', authenticateToken, lectureController.getLectures);
router.get('/:id', authenticateToken, lectureController.getLectureById);
router.put('/:id', authenticateToken, authorizeRoles('admin', 'lecturer'), updateLectureValidation, lectureController.updateLecture);
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'lecturer'), lectureController.deleteLecture);

module.exports = router;