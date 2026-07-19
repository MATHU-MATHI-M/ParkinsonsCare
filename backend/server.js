require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes mapping
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/assessments', require('./routes/assessmentRoutes'));
app.use('/api/medications', require('./routes/medicationRoutes'));
app.use('/api/clinicians', require('./routes/clinicianRoutes'));

// Root diagnostic route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to ParkinsonCare AI REST API',
    status: 'Healthy',
    timestamp: new Date()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Server Error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in development mode on port ${PORT}`);
});
