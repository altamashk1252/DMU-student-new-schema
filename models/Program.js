const pool = require('../config/database');

class Program {
    static async create(programData) {
        const { name, code, duration_years, description } = programData;
        const result = await pool.query(
            'INSERT INTO programs (name, code, duration_years, description) VALUES ($1, $2, $3, $4) RETURNING id',
            [name, code, duration_years, description]
        );
        return result.rows[0].id;
    }

    static async findAll() {
        const result = await pool.query('SELECT * FROM programs ORDER BY name');
        return result.rows;
    }

    static async findById(id) {
        const result = await pool.query('SELECT * FROM programs WHERE id = $1', [id]);
        return result.rows[0];
    }

    static async update(id, programData) {
        const { name, duration_years, description } = programData;
        const result = await pool.query(
            'UPDATE programs SET name = $1, duration_years = $2, description = $3 WHERE id = $4',
            [name, duration_years, description, id]
        );
        return result.rowCount;
    }

    static async delete(id) {
        const result = await pool.query('DELETE FROM programs WHERE id = $1', [id]);
        return result.rowCount;
    }
}

module.exports = Program;