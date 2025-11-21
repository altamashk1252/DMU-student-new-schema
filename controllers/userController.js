const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

exports.getAllUsers = async (req, res) => {
    try {
        const { role } = req.query;
        
        let query = 'SELECT id, email, role, first_name, last_name, phone, created_at FROM users';
        let params = [];
        
        if (role) {
            query += ' WHERE role = $1';
            params.push(role);
        }
        
        query += ' ORDER BY created_at DESC';
        
        const result = await pool.query(query, params);
        
        res.json({ 
            message: 'Users retrieved successfully',
            count: result.rows.length,
            users: result.rows
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ error: 'Server error fetching users' });
    }
};

exports.getUserById = async (req, res) => {
    try {
        // Users can only access their own data unless they're admin
        if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const result = await pool.query(
            'SELECT id, email, role, first_name, last_name, phone, created_at FROM users WHERE id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ 
            message: 'User retrieved successfully',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({ error: 'Server error fetching user' });
    }
};

exports.createUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, role, first_name, last_name, phone } = req.body;

        // Check if user exists
        const userExists = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const result = await pool.query(
            `INSERT INTO users (email, password, role, first_name, last_name, phone) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING id, email, role, first_name, last_name, phone, created_at`,
            [email, hashedPassword, role, first_name, last_name, phone]
        );

        res.status(201).json({
            message: 'User created successfully',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Server error creating user' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Users can only update their own data unless they're admin
        if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { first_name, last_name, phone, email } = req.body;
        
        let query = 'UPDATE users SET ';
        let params = [];
        let updates = [];

        if (first_name) {
            updates.push(`first_name = $${updates.length + 1}`);
            params.push(first_name);
        }
        if (last_name) {
            updates.push(`last_name = $${updates.length + 1}`);
            params.push(last_name);
        }
        if (phone) {
            updates.push(`phone = $${updates.length + 1}`);
            params.push(phone);
        }
        if (email) {
            updates.push(`email = $${updates.length + 1}`);
            params.push(email);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        query += updates.join(', ') + ` WHERE id = $${params.length + 1} RETURNING id, email, role, first_name, last_name, phone, created_at`;
        params.push(req.params.id);

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            message: 'User updated successfully',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Server error updating user' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING id',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Server error deleting user' });
    }
};

// ADD THIS MISSING FUNCTION
exports.getUsersByRole = async (req, res) => {
    try {
        const { role } = req.params;
        
        if (!['admin', 'lecturer', 'student'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const result = await pool.query(
            'SELECT id, email, role, first_name, last_name, phone, created_at FROM users WHERE role = $1 ORDER BY created_at DESC',
            [role]
        );
        
        res.json({
            message: `Users with role ${role} retrieved successfully`,
            count: result.rows.length,
            users: result.rows
        });
    } catch (error) {
        console.error('Get users by role error:', error);
        res.status(500).json({ error: 'Server error fetching users by role' });
    }
};

// ADD THESE STUDENT ACADEMIC FUNCTIONS
exports.getStudentAcademicProfile = async (req, res) => {
    try {
        const studentId = req.params.id;
        
        // Users can only access their own data unless they're admin
        if (req.user.role !== 'admin' && req.user.id !== studentId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const academicProfile = await pool.query(`
            SELECT 
                u.id, u.first_name, u.last_name, u.email, u.phone,
                p.name as program_name, p.code as program_code, p.duration_years,
                pe.current_year, pe.current_semester, pe.status as enrollment_status,
                pe.total_credits_earned, pe.cgpa, pe.enrollment_date
            FROM users u
            JOIN program_enrollments pe ON u.id = pe.student_id
            JOIN programs p ON pe.program_id = p.id
            WHERE u.id = $1 AND pe.status = 'active'
        `, [studentId]);

        if (academicProfile.rows.length === 0) {
            return res.status(404).json({ error: 'Student academic profile not found' });
        }

        const currentSubjects = await pool.query(`
            SELECT 
                s.name, s.code, s.credits,
                CONCAT(u.first_name, ' ', u.last_name) as lecturer
            FROM subject_enrollments se
            JOIN subjects s ON se.subject_id = s.id
            JOIN program_enrollments pe ON se.program_enrollment_id = pe.id
            LEFT JOIN subject_assignments sa ON s.id = sa.subject_id
            LEFT JOIN users u ON sa.lecturer_id = u.id
            WHERE se.student_id = $1 
            AND se.academic_year = pe.current_year
            AND se.semester = pe.current_semester
            AND se.status = 'enrolled'
        `, [studentId]);

        res.json({
            student: {
                id: academicProfile.rows[0].id,
                first_name: academicProfile.rows[0].first_name,
                last_name: academicProfile.rows[0].last_name,
                email: academicProfile.rows[0].email,
                phone: academicProfile.rows[0].phone
            },
            academic_profile: {
                program: {
                    name: academicProfile.rows[0].program_name,
                    code: academicProfile.rows[0].program_code,
                    duration_years: academicProfile.rows[0].duration_years
                },
                current_year: academicProfile.rows[0].current_year,
                current_semester: academicProfile.rows[0].current_semester,
                enrollment_status: academicProfile.rows[0].enrollment_status,
                total_credits_earned: academicProfile.rows[0].total_credits_earned,
                cgpa: academicProfile.rows[0].cgpa,
                enrollment_date: academicProfile.rows[0].enrollment_date
            },
            current_subjects: currentSubjects.rows
        });

    } catch (error) {
        console.error('Get student academic profile error:', error);
        res.status(500).json({ error: 'Server error fetching academic profile' });
    }
};


exports.enrollStudentInProgram = async (req, res) => {
    try {
        const { student_id, program_id, enrollment_date, current_year, current_semester, status } = req.body;

        // Basic validation
        if (!student_id || !program_id || !enrollment_date) {
            return res.status(400).json({ error: 'student_id, program_id, and enrollment_date are required' });
        }

        // Check if student exists and is a student
        const studentRes = await pool.query('SELECT id, role FROM users WHERE id = $1', [student_id]);
        if (studentRes.rows.length === 0 || studentRes.rows[0].role !== 'student') {
            return res.status(404).json({ error: 'Student not found or not a student user' });
        }

        // Check if program exists
        const programRes = await pool.query('SELECT id FROM programs WHERE id = $1', [program_id]);
        if (programRes.rows.length === 0) {
            return res.status(404).json({ error: 'Program not found' });
        }

        // Insert enrollment
        const result = await pool.query(
            `INSERT INTO program_enrollments (student_id, program_id, enrollment_date, current_year, current_semester, status)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, student_id, program_id, enrollment_date, current_year, current_semester, status`,
            [student_id, program_id, enrollment_date, current_year || 1, current_semester || 1, status || 'active']
        );

        res.status(201).json({
            message: 'Student enrolled in program successfully',
            enrollment: result.rows[0]
        });
    } catch (error) {
        console.error('Enroll student in program error:', error);
        res.status(500).json({ error: 'Server error enrolling student in program' });
    }
};

// ...existing code...