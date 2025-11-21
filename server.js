const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const programRoutes = require('./routes/programs');
const subjectRoutes = require('./routes/subjects');
const lectureRoutes = require('./routes/lectures');
const attendanceRoutes = require('./routes/attendance');
const enrollmentRoutes = require('./routes/enrollment');


// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/lectures', lectureRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/enrollments', enrollmentRoutes);


// Health check route
app.get('/api/health', (req, res) => {
    res.json({ 
        message: 'Dubai Medical University API is running!',
        timestamp: new Date().toISOString(),
        availableRoutes: [
            '/api/auth',
            '/api/users', 
            '/api/programs',
            '/api/subjects',
            '/api/lectures',
            '/api/attendance'
        ]
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Welcome to Dubai Medical University API',
        status: 'Server is running successfully',
        version: '1.0.0'
    });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces


app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
    console.log(`🔗 Home: http://localhost:${PORT}/`);
    console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
    console.log(`👥 Users: http://localhost:${PORT}/api/users`);
});