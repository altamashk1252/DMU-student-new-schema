const { Pool } = require('pg');
require('dotenv').config();

const setupDatabase = async () => {
    const dbPool = new Pool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 5432,
        ssl: { rejectUnauthorized: false } // Required for Render
    });

    try {
        console.log("Running database setup...");

        // Enable uuid extension
        await dbPool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

        // Create all tables
        await dbPool.query(`

            -- Users table
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) CHECK (role IN ('admin', 'lecturer', 'student')) NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                phone VARCHAR(20),
                profile_image VARCHAR(500),
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

            -- Subjects table
            CREATE TABLE IF NOT EXISTS subjects (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                code VARCHAR(50) UNIQUE NOT NULL,
                program_id UUID NOT NULL,
                academic_year INTEGER NOT NULL CHECK (academic_year BETWEEN 1 AND 6),
                semester INTEGER NOT NULL CHECK (semester IN (1,2)),
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

            -- Events
            CREATE TABLE IF NOT EXISTS events (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                title VARCHAR(500) NOT NULL,
                description TEXT,
                location VARCHAR(255) NOT NULL,
                image_url TEXT,
                date DATE NOT NULL,
                created_by UUID NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
            );

            -- Event Attendance
            CREATE TABLE IF NOT EXISTS event_attendance (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                event_id UUID NOT NULL,
                student_id UUID NOT NULL,
                marked_by UUID NOT NULL,
                status VARCHAR(20) CHECK (status IN ('present', 'absent')) DEFAULT 'absent',
                marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                notes TEXT,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE (event_id, student_id)
            );

            -- Event Certificates
            CREATE TABLE IF NOT EXISTS event_certificates (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                event_id UUID NOT NULL,
                student_id UUID NOT NULL,
                generated_by UUID NOT NULL,
                certificate_url TEXT,
                certificate_path TEXT,
                status VARCHAR(20) CHECK (status IN ('generated', 'viewed')) DEFAULT 'generated',
                generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                viewed_at TIMESTAMP,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(event_id, student_id)
            );

            -- Email Logs
            CREATE TABLE IF NOT EXISTS certificate_email_logs (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                certificate_id UUID NOT NULL,
                student_email VARCHAR(255) NOT NULL,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(20) CHECK (status IN ('sent', 'failed')) DEFAULT 'sent',
                error_message TEXT,
                FOREIGN KEY (certificate_id) REFERENCES event_certificates(id) ON DELETE CASCADE
            );

            -- Assignments
            CREATE TABLE IF NOT EXISTS subject_assignments (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                lecturer_id UUID NOT NULL,
                subject_id UUID NOT NULL,
                assigned_date DATE NOT NULL,
                FOREIGN KEY (lecturer_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
            );

            -- Lectures
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

            -- Attendance
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

            -- Announcements
            CREATE TABLE IF NOT EXISTS announcements (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                title VARCHAR(500) NOT NULL,
                type VARCHAR(50),
                subject VARCHAR(255),
                image_url TEXT,
                date DATE NOT NULL,
                created_by UUID NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
            );

            -- Campus News
            CREATE TABLE IF NOT EXISTS campus_news (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                title VARCHAR(500) NOT NULL,
                summary TEXT NOT NULL,
                subject VARCHAR(255),
                image_url TEXT,
                date DATE NOT NULL,
                created_by UUID NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
            );

            -- Registrations
            CREATE TABLE IF NOT EXISTS event_registrations (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                event_id UUID NOT NULL,
                user_id UUID NOT NULL,
                registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(20) CHECK (status IN ('registered', 'cancelled')) DEFAULT 'registered',
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE (event_id, user_id)
            );

            -- Student Profiles
            CREATE TABLE IF NOT EXISTS student_profiles (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL UNIQUE,
                roll_no VARCHAR(50) UNIQUE,
                admission_year INTEGER NOT NULL CHECK (admission_year BETWEEN 2000 AND 2030),
                category VARCHAR(50),
                date_of_birth DATE,
                guardian_name VARCHAR(255),
                guardian_mobile VARCHAR(20),
                address TEXT,
                emergency_contact VARCHAR(20),
                blood_group VARCHAR(5),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        console.log("Tables created successfully!");

        // Create indexes
        await dbPool.query(`
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
        `);

        console.log("Indexes created successfully!");

    } catch (error) {
        console.error("Error setting up database:", error);
    } finally {
        await dbPool.end();
    }
};

if (require.main === module) {
    setupDatabase();
}

module.exports = setupDatabase;
