const pool = require('../config/database');
const { validationResult } = require('express-validator');

exports.createSubject = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, code, program_id, academic_year, semester, credits, description } = req.body;

        const result = await pool.query(
            'INSERT INTO subjects (name, code, program_id, academic_year, semester, credits, description) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [name, code, program_id, academic_year, semester, credits, description]
        );

        res.status(201).json({
            message: 'Subject created successfully',
            subject: result.rows[0]
        });
    } catch (error) {
        console.error('Create subject error:', error);
        res.status(500).json({ error: 'Server error creating subject' });
    }
};

exports.getAllSubjects = async (req, res) => {
    try {
        const { program_id, academic_year, semester } = req.query;
        
        let query = `
            SELECT s.*, p.name as program_name 
            FROM subjects s 
            JOIN programs p ON s.program_id = p.id
            WHERE 1=1
        `;
        let params = [];
        let paramCount = 0;

        if (program_id) {
            paramCount++;
            query += ` AND s.program_id = $${paramCount}`;
            params.push(program_id);
        }

        if (academic_year) {
            paramCount++;
            query += ` AND s.academic_year = $${paramCount}`;
            params.push(parseInt(academic_year));
        }

        if (semester) {
            paramCount++;
            query += ` AND s.semester = $${paramCount}`;
            params.push(parseInt(semester));
        }

        query += ' ORDER BY s.academic_year, s.semester, s.name';

        const result = await pool.query(query, params);
        res.json({ 
            message: 'Subjects retrieved successfully',
            subjects: result.rows 
        });
    } catch (error) {
        console.error('Get all subjects error:', error);
        res.status(500).json({ error: 'Server error fetching subjects' });
    }
};

// ADD THIS MISSING FUNCTION
exports.getSubjectById = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT s.*, p.name as program_name 
             FROM subjects s 
             JOIN programs p ON s.program_id = p.id 
             WHERE s.id = $1`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Subject not found' });
        }

        res.json({
            message: 'Subject retrieved successfully',
            subject: result.rows[0]
        });
    } catch (error) {
        console.error('Get subject by ID error:', error);
        res.status(500).json({ error: 'Server error fetching subject' });
    }
};

// ADD THIS MISSING FUNCTION
exports.getSubjectsByProgramAndYear = async (req, res) => {
    try {
        const { program_id, academic_year } = req.params;

        const result = await pool.query(
            `SELECT s.*, p.name as program_name 
             FROM subjects s 
             JOIN programs p ON s.program_id = p.id 
             WHERE s.program_id = $1 AND s.academic_year = $2 
             ORDER BY s.semester, s.name`,
            [program_id, parseInt(academic_year)]
        );

        res.json({
            message: `Subjects for year ${academic_year} retrieved successfully`,
            subjects: result.rows
        });
    } catch (error) {
        console.error('Get subjects by program and year error:', error);
        res.status(500).json({ error: 'Server error fetching subjects' });
    }
};

// ADD THIS MISSING FUNCTION
exports.updateSubject = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, credits, description } = req.body;

        const result = await pool.query(
            'UPDATE subjects SET name = $1, credits = $2, description = $3 WHERE id = $4 RETURNING *',
            [name, credits, description, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Subject not found' });
        }

        res.json({
            message: 'Subject updated successfully',
            subject: result.rows[0]
        });
    } catch (error) {
        console.error('Update subject error:', error);
        res.status(500).json({ error: 'Server error updating subject' });
    }
};