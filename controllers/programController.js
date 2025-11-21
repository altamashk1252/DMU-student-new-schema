const pool = require('../config/database');
const { validationResult } = require('express-validator');

exports.createProgram = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, code, duration_years, description } = req.body;

        const result = await pool.query(
            'INSERT INTO programs (name, code, duration_years, description) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, code, duration_years, description]
        );

        res.status(201).json({
            message: 'Program created successfully',
            program: result.rows[0]
        });
    } catch (error) {
        console.error('Create program error:', error);
        res.status(500).json({ error: 'Server error creating program' });
    }
};

exports.getAllPrograms = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM programs ORDER BY name');
        res.json({ 
            message: 'Programs retrieved successfully',
            programs: result.rows 
        });
    } catch (error) {
        console.error('Get all programs error:', error);
        res.status(500).json({ error: 'Server error fetching programs' });
    }
};

exports.getProgramById = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM programs WHERE id = $1', [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Program not found' });
        }

        res.json({
            message: 'Program retrieved successfully',
            program: result.rows[0]
        });
    } catch (error) {
        console.error('Get program by ID error:', error);
        res.status(500).json({ error: 'Server error fetching program' });
    }
};

exports.updateProgram = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, duration_years, description } = req.body;

        const result = await pool.query(
            'UPDATE programs SET name = $1, duration_years = $2, description = $3 WHERE id = $4 RETURNING *',
            [name, duration_years, description, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Program not found' });
        }

        res.json({
            message: 'Program updated successfully',
            program: result.rows[0]
        });
    } catch (error) {
        console.error('Update program error:', error);
        res.status(500).json({ error: 'Server error updating program' });
    }
};

exports.deleteProgram = async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM programs WHERE id = $1 RETURNING id', [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Program not found' });
        }

        res.json({
            message: 'Program deleted successfully'
        });
    } catch (error) {
        console.error('Delete program error:', error);
        res.status(500).json({ error: 'Server error deleting program' });
    }
};