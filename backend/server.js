const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/courses',  require('./routes/courses'));
app.use('/api/grades',   require('./routes/grades'));
app.use('/api/ai',       require('./routes/ai'));

// Serve frontend static files
const frontendPath = path.join(__dirname, 'frontend');
app.use(express.static(frontendPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));
