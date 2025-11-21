const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    static async create(userData) {
        const { email, password, role, first_name, last_name, phone } = userData;
        const hashedPassword = await bcrypt.hash(password, 12);
        
        const result = await pool.query(
            'INSERT INTO users (email, password, role, first_name, last_name, phone) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [email, hashedPassword, role, first_name, last_name, phone]
        );
        return result.rows[0].id;
    }

    static async findByEmail(email) {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        return result.rows[0];
    }

    static async findById(id) {
        const result = await pool.query(
            'SELECT id, email, role, first_name, last_name, phone, created_at FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    static async comparePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    static async getAllUsers(role = null) {
        let query = 'SELECT id, email, role, first_name, last_name, phone, created_at FROM users';
        let params = [];
        
        if (role) {
            query += ' WHERE role = $1';
            params.push(role);
        }
        
        query += ' ORDER BY created_at DESC';
        
        const result = await pool.query(query, params);
        return result.rows;
    }
}

module.exports = User;