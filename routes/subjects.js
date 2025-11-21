const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const subjectValidation = [
    body('name').notEmpty().trim(),
    body('code').notEmpty().trim(),
    body('program_id').notEmpty(),
    body('academic_year').isInt({ min: 1, max: 6 }),
    body('semester').isInt({ min: 1, max: 2 }),
    body('credits').isInt({ min: 1, max: 12 })
];

router.get('/', subjectController.getAllSubjects);
router.get('/:id', subjectController.getSubjectById);
router.get('/program/:program_id/year/:academic_year', subjectController.getSubjectsByProgramAndYear);
router.post('/', authenticateToken, authorizeRoles('admin'), subjectValidation, subjectController.createSubject);
router.put('/:id', authenticateToken, authorizeRoles('admin'), subjectValidation, subjectController.updateSubject);

module.exports = router;