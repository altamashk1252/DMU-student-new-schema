const pool = require('../config/database');
const { validationResult } = require('express-validator');

exports.takeAttendance = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { lecture_id, student_id, status, notes } = req.body;
        const marked_by = req.user.id;

        // Check if attendance already exists
        const existing = await pool.query(
            'SELECT id FROM attendance WHERE lecture_id = $1 AND student_id = $2',
            [lecture_id, student_id]
        );

        let result;
        if (existing.rows.length > 0) {
            // Update existing attendance
            result = await pool.query(
                'UPDATE attendance SET status = $1, notes = $2, marked_by = $3 WHERE lecture_id = $4 AND student_id = $5 RETURNING *',
                [status, notes, marked_by, lecture_id, student_id]
            );
        } else {
            // Create new attendance record
            result = await pool.query(
                'INSERT INTO attendance (lecture_id, student_id, status, marked_by, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [lecture_id, student_id, status, marked_by, notes]
            );
        }

        res.json({
            message: 'Attendance recorded successfully',
            attendance: result.rows[0]
        });
    } catch (error) {
        console.error('Take attendance error:', error);
        res.status(500).json({ error: 'Server error recording attendance' });
    }
};

exports.getAttendanceByLecture = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT a.*, u.first_name, u.last_name, u.email 
             FROM attendance a 
             JOIN users u ON a.student_id = u.id 
             WHERE a.lecture_id = $1 
             ORDER BY u.first_name, u.last_name`,
            [id]
        );

        res.json({ 
            message: 'Attendance retrieved successfully',
            attendance: result.rows 
        });
    } catch (error) {
        console.error('Get attendance by lecture error:', error);
        res.status(500).json({ error: 'Server error fetching attendance' });
    }
};

exports.getStudentAttendance = async (req, res) => {
    try {
        const student_id = req.user.role === 'student' ? req.user.id : req.params.student_id;
        
        const result = await pool.query(
            `SELECT a.*, l.title as lecture_title, l.scheduled_date, 
                    s.name as subject_name, s.code as subject_code,
                    u.first_name as lecturer_first_name, u.last_name as lecturer_last_name
             FROM attendance a 
             JOIN lectures l ON a.lecture_id = l.id 
             JOIN subjects s ON l.subject_id = s.id 
             JOIN users u ON l.lecturer_id = u.id 
             WHERE a.student_id = $1 
             ORDER BY l.scheduled_date DESC`,
            [student_id]
        );

        res.json({ 
            message: 'Student attendance retrieved successfully',
            attendance: result.rows 
        });
    } catch (error) {
        console.error('Get student attendance error:', error);
        res.status(500).json({ error: 'Server error fetching student attendance' });
    }
};