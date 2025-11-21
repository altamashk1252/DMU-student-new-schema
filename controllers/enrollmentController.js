const pool = require('../config/database');
const { validationResult } = require('express-validator');

exports.enrollStudentInProgram = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { student_id, program_id, enrollment_date, current_year, current_semester } = req.body;

        // Check if student exists and is actually a student
        const studentCheck = await pool.query(
            'SELECT id FROM users WHERE id = $1 AND role = $2',
            [student_id, 'student']
        );

        if (studentCheck.rows.length === 0) {
            return res.status(400).json({ error: 'Student not found or invalid role' });
        }

        // Check if program exists
        const programCheck = await pool.query(
            'SELECT id FROM programs WHERE id = $1',
            [program_id]
        );

        if (programCheck.rows.length === 0) {
            return res.status(400).json({ error: 'Program not found' });
        }

        // Check if already enrolled
        const existingEnrollment = await pool.query(
            'SELECT id FROM program_enrollments WHERE student_id = $1 AND program_id = $2 AND status = $3',
            [student_id, program_id, 'active']
        );

        if (existingEnrollment.rows.length > 0) {
            return res.status(400).json({ error: 'Student is already enrolled in this program' });
        }

        const result = await pool.query(
            `INSERT INTO program_enrollments (student_id, program_id, enrollment_date, current_year, current_semester) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [student_id, program_id, enrollment_date, current_year || 1, current_semester || 1]
        );

        res.status(201).json({
            message: 'Student enrolled in program successfully',
            enrollment: result.rows[0]
        });
    } catch (error) {
        console.error('Enroll student error:', error);
        res.status(500).json({ error: 'Server error enrolling student' });
    }
};

exports.enrollStudentInSubject = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { student_id, subject_id, academic_year, semester, enrollment_date } = req.body;

        // Get the student's active program enrollment
        const programEnrollment = await pool.query(`
            SELECT pe.id, pe.current_year, pe.current_semester 
            FROM program_enrollments pe
            JOIN subjects s ON pe.program_id = s.program_id
            WHERE pe.student_id = $1 AND s.id = $2 AND pe.status = 'active'
        `, [student_id, subject_id]);

        if (programEnrollment.rows.length === 0) {
            return res.status(400).json({ error: 'Student is not enrolled in the program that offers this subject' });
        }

        const program_enrollment_id = programEnrollment.rows[0].id;

        const result = await pool.query(
            `INSERT INTO subject_enrollments 
             (student_id, subject_id, program_enrollment_id, academic_year, semester, enrollment_date) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [student_id, subject_id, program_enrollment_id, academic_year, semester, enrollment_date]
        );

        res.status(201).json({
            message: 'Student enrolled in subject successfully',
            enrollment: result.rows[0]
        });
    } catch (error) {
        console.error('Enroll student in subject error:', error);
        res.status(500).json({ error: 'Server error enrolling student in subject' });
    }
};

exports.assignLecturerToSubject = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { lecturer_id, subject_id, assigned_date } = req.body;

        // Check if lecturer exists and is actually a lecturer
        const lecturerCheck = await pool.query(
            'SELECT id FROM users WHERE id = $1 AND role = $2',
            [lecturer_id, 'lecturer']
        );

        if (lecturerCheck.rows.length === 0) {
            return res.status(400).json({ error: 'Lecturer not found or invalid role' });
        }

        const result = await pool.query(
            `INSERT INTO subject_assignments (lecturer_id, subject_id, assigned_date) 
             VALUES ($1, $2, $3) RETURNING *`,
            [lecturer_id, subject_id, assigned_date]
        );

        res.status(201).json({
            message: 'Lecturer assigned to subject successfully',
            assignment: result.rows[0]
        });
    } catch (error) {
        console.error('Assign lecturer error:', error);
        res.status(500).json({ error: 'Server error assigning lecturer' });
    }
};