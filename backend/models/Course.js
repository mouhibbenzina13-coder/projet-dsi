const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  nom:         { type: String, required: true },
  code:        { type: String, unique: true },
  description: String,
  professeur:  String,
  semestre:    { type: String, enum: ['S1', 'S2'], default: 'S1' },
  coefficient: { type: Number, default: 1 },
  heures:      { type: Number, default: 30 },
  couleur:     { type: String, default: '#6ee7b7' },
  createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', CourseSchema);
