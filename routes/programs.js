const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const programController = require('../controllers/programController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const programValidation = [
    body('name').notEmpty().trim(),
    body('code').notEmpty().trim(),
    body('duration_years').isInt({ min: 1, max: 6 })
];

router.get('/', programController.getAllPrograms);
router.get('/:id', programController.getProgramById);
router.post('/', authenticateToken, authorizeRoles('admin'), programValidation, programController.createProgram);
router.put('/:id', authenticateToken, authorizeRoles('admin'), programValidation, programController.updateProgram);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), programController.deleteProgram);

module.exports = router;