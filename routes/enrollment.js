const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Validation rules
const programEnrollmentValidation = [
    body('student_id').notEmpty(),
    body('program_id').notEmpty(),
    body('enrollment_date').isDate(),
    body('current_year').optional().isInt({ min: 1, max: 6 }),
    body('current_semester').optional().isInt({ min: 1, max: 2 })
];

const subjectEnrollmentValidation = [
    body('student_id').notEmpty(),
    body('subject_id').notEmpty(),
    body('academic_year').isInt({ min: 1, max: 6 }),
    body('semester').isInt({ min: 1, max: 2 }),
    body('enrollment_date').isDate()
];

const subjectAssignmentValidation = [
    body('lecturer_id').notEmpty(),
    body('subject_id').notEmpty(),
    body('assigned_date').isDate()
];

// Enrollment routes
router.post('/programs', authenticateToken, authorizeRoles('admin'), programEnrollmentValidation, enrollmentController.enrollStudentInProgram);
router.post('/subjects', authenticateToken, authorizeRoles('admin'), subjectEnrollmentValidation, enrollmentController.enrollStudentInSubject);
router.post('/assign-lecturer', authenticateToken, authorizeRoles('admin'), subjectAssignmentValidation, enrollmentController.assignLecturerToSubject);

// Student academic info routes
router.get('/students/:id/academic-profile', authenticateToken, userController.getStudentAcademicProfile);
router.get('/programs/:program_id/students', authenticateToken, userController.getStudentsByProgram);
router.get('/programs/:program_id/year/:year/students', authenticateToken, userController.getStudentsByProgram);

module.exports = router;