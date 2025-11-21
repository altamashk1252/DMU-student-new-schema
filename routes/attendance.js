const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const attendanceValidation = [
    body('lecture_id').notEmpty(),
    body('student_id').notEmpty(),
    body('status').isIn(['present', 'absent', 'late', 'excused'])
];

router.post('/', authenticateToken, authorizeRoles('admin', 'lecturer'), attendanceValidation, attendanceController.takeAttendance);
router.get('/lecture/:id', authenticateToken, attendanceController.getAttendanceByLecture);
router.get('/student/:student_id?', authenticateToken, attendanceController.getStudentAttendance);

module.exports = router;