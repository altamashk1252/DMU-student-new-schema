const { Pool } = require('pg');
require('dotenv').config();

const setupDatabase = async () => {
    const pool = new Pool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 5432,
    });

    try {
        // Create database if it doesn't exist
        await pool.query('CREATE DATABASE medical_university_db');
        console.log('Database created successfully');
    } catch (error) {
        if (error.code !== '42P04') { // Database already exists
            console.error('Error creating database:', error);
        }
    } finally {
        await pool.end();
    }

    // Connect to the specific database
    const dbPool = new Pool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 5432,
    });

    try {
        // Create tables
        await dbPool.query(`
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

            -- Users table (for all types of users)
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) CHECK (role IN ('admin', 'lecturer', 'student')) NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                phone VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Programs table
            CREATE TABLE IF NOT EXISTS programs (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                code VARCHAR(50) UNIQUE NOT NULL,
                duration_years INTEGER NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Subjects table with year information (UPDATED VERSION)
            CREATE TABLE IF NOT EXISTS subjects (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                code VARCHAR(50) UNIQUE NOT NULL,
                program_id UUID NOT NULL,
                academic_year INTEGER NOT NULL CHECK (academic_year >= 1 AND academic_year <= 6),
                semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 2),
                credits INTEGER NOT NULL,
                description TEXT,
                FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
            );

            -- Program enrollments
            CREATE TABLE IF NOT EXISTS program_enrollments (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                student_id UUID NOT NULL,
                program_id UUID NOT NULL,
                enrollment_date DATE NOT NULL,
                current_year INTEGER DEFAULT 1,
                current_semester INTEGER DEFAULT 1,
                status VARCHAR(20) CHECK (status IN ('active', 'completed', 'dropped', 'suspended')) DEFAULT 'active',
                total_credits_earned INTEGER DEFAULT 0,
                cgpa DECIMAL(3,2) DEFAULT 0.00,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
                UNIQUE(student_id, program_id)
            );

            -- Subject enrollments
            CREATE TABLE IF NOT EXISTS subject_enrollments (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                student_id UUID NOT NULL,
                subject_id UUID NOT NULL,
                program_enrollment_id UUID NOT NULL,
                academic_year INTEGER NOT NULL,
                semester INTEGER NOT NULL,
                enrollment_date DATE NOT NULL,
                status VARCHAR(20) CHECK (status IN ('enrolled', 'completed', 'dropped', 'failed')) DEFAULT 'enrolled',
                grade VARCHAR(2),
                marks DECIMAL(5,2),
                credits_earned INTEGER DEFAULT 0,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
                FOREIGN KEY (program_enrollment_id) REFERENCES program_enrollments(id) ON DELETE CASCADE,
                UNIQUE(student_id, subject_id, academic_year, semester)
            );

            -- Subject assignments (professors to subjects)
            CREATE TABLE IF NOT EXISTS subject_assignments (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                lecturer_id UUID NOT NULL,
                subject_id UUID NOT NULL,
                assigned_date DATE NOT NULL,
                FOREIGN KEY (lecturer_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
            );

            -- Lectures table
            CREATE TABLE IF NOT EXISTS lectures (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                subject_id UUID NOT NULL,
                lecturer_id UUID NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                scheduled_date DATE NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                room VARCHAR(100),
                status VARCHAR(20) CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')) DEFAULT 'scheduled',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
                FOREIGN KEY (lecturer_id) REFERENCES users(id) ON DELETE CASCADE
            );

            -- Attendance table
            CREATE TABLE IF NOT EXISTS attendance (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                lecture_id UUID NOT NULL,
                student_id UUID NOT NULL,
                status VARCHAR(20) CHECK (status IN ('present', 'absent', 'late', 'excused')) NOT NULL,
                marked_by UUID NOT NULL,
                marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                notes TEXT,
                FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE (lecture_id, student_id)
            );
        `);

        console.log('All tables created successfully!');

        // Create indexes for better performance
        await dbPool.query(`
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
            CREATE INDEX IF NOT EXISTS idx_subjects_program_id ON subjects(program_id);
            CREATE INDEX IF NOT EXISTS idx_subjects_academic_year ON subjects(academic_year);
            CREATE INDEX IF NOT EXISTS idx_subjects_semester ON subjects(semester);
            CREATE INDEX IF NOT EXISTS idx_lectures_subject_id ON lectures(subject_id);
            CREATE INDEX IF NOT EXISTS idx_lectures_lecturer_id ON lectures(lecturer_id);
            CREATE INDEX IF NOT EXISTS idx_lectures_scheduled_date ON lectures(scheduled_date);
            CREATE INDEX IF NOT EXISTS idx_attendance_lecture_id ON attendance(lecture_id);
            CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
            CREATE INDEX IF NOT EXISTS idx_program_enrollments_student_id ON program_enrollments(student_id);
            CREATE INDEX IF NOT EXISTS idx_subject_enrollments_student_id ON subject_enrollments(student_id);
        `);

        console.log('Indexes created successfully!');

    } catch (error) {
        console.error('Error setting up database:', error);
    } finally {
        await dbPool.end();
    }
};

// Run setup if this file is executed directly
if (require.main === module) {
    setupDatabase();
}

module.exports = setupDatabase;