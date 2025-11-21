const pool = require('../config/database');
const { validationResult } = require('express-validator');

exports.scheduleLecture = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { subject_id, title, description, scheduled_date, start_time, end_time, room } = req.body;
        const lecturer_id = req.user.id;

        const result = await pool.query(
            `INSERT INTO lectures (subject_id, lecturer_id, title, description, scheduled_date, start_time, end_time, room) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [subject_id, lecturer_id, title, description, scheduled_date, start_time, end_time, room]
        );

        res.status(201).json({
            message: 'Lecture scheduled successfully',
            lecture: result.rows[0]
        });
    } catch (error) {
        console.error('Schedule lecture error:', error);
        res.status(500).json({ error: 'Server error scheduling lecture' });
    }
};

exports.getLectures = async (req, res) => {
    try {
        const { subject_id, lecturer_id, date } = req.query;
        
        let query = `
            SELECT l.*, s.name as subject_name, s.code as subject_code,
                   u.first_name, u.last_name, p.name as program_name
            FROM lectures l 
            JOIN subjects s ON l.subject_id = s.id 
            JOIN users u ON l.lecturer_id = u.id 
            JOIN programs p ON s.program_id = p.id 
            WHERE 1=1
        `;
        let params = [];
        let paramCount = 0;

        if (subject_id) {
            paramCount++;
            query += ` AND l.subject_id = $${paramCount}`;
            params.push(subject_id);
        }

        if (lecturer_id) {
            paramCount++;
            query += ` AND l.lecturer_id = $${paramCount}`;
            params.push(lecturer_id);
        }

        if (date) {
            paramCount++;
            query += ` AND l.scheduled_date = $${paramCount}`;
            params.push(date);
        }

        query += ' ORDER BY l.scheduled_date, l.start_time';

        const result = await pool.query(query, params);
        res.json({ 
            message: 'Lectures retrieved successfully',
            lectures: result.rows 
        });
    } catch (error) {
        console.error('Get lectures error:', error);
        res.status(500).json({ error: 'Server error fetching lectures' });
    }
};

exports.getLectureById = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT l.*, s.name as subject_name, s.code as subject_code,
                    u.first_name, u.last_name, p.name as program_name
             FROM lectures l 
             JOIN subjects s ON l.subject_id = s.id 
             JOIN users u ON l.lecturer_id = u.id 
             JOIN programs p ON s.program_id = p.id 
             WHERE l.id = $1`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Lecture not found' });
        }

        res.json({
            message: 'Lecture retrieved successfully',
            lecture: result.rows[0]
        });
    } catch (error) {
        console.error('Get lecture by ID error:', error);
        res.status(500).json({ error: 'Server error fetching lecture' });
    }
};

exports.updateLecture = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, description, scheduled_date, start_time, end_time, room, status } = req.body;
        
        // Check if lecture exists and user has permission
        const lectureCheck = await pool.query(
            'SELECT * FROM lectures WHERE id = $1 AND lecturer_id = $2',
            [req.params.id, req.user.id]
        );

        if (lectureCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Lecture not found or access denied' });
        }

        const result = await pool.query(
            `UPDATE lectures SET title = $1, description = $2, scheduled_date = $3, 
             start_time = $4, end_time = $5, room = $6, status = $7 
             WHERE id = $8 RETURNING *`,
            [title, description, scheduled_date, start_time, end_time, room, status, req.params.id]
        );

        res.json({
            message: 'Lecture updated successfully',
            lecture: result.rows[0]
        });
    } catch (error) {
        console.error('Update lecture error:', error);
        res.status(500).json({ error: 'Server error updating lecture' });
    }
};

exports.deleteLecture = async (req, res) => {
    try {
        // Check if lecture exists and user has permission
        const lectureCheck = await pool.query(
            'SELECT * FROM lectures WHERE id = $1 AND lecturer_id = $2',
            [req.params.id, req.user.id]
        );

        if (lectureCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Lecture not found or access denied' });
        }

        const result = await pool.query(
            'DELETE FROM lectures WHERE id = $1 RETURNING id',
            [req.params.id]
        );

        res.json({
            message: 'Lecture deleted successfully'
        });
    } catch (error) {
        console.error('Delete lecture error:', error);
        res.status(500).json({ error: 'Server error deleting lecture' });
    }
};