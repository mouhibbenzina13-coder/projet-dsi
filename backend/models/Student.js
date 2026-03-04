const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const noteSchema = new mongoose.Schema({
  matiere:     { type: String, required: true },
  note:        { type: Number, required: true },
  tp:          { type: Number },
  cours:       { type: Number },
  examen:      { type: Number },
  coefficient: { type: Number, default: 1 },
  semestre:    { type: String, default: 'S1' },
});

const studentSchema = new mongoose.Schema({
  nom:       { type: String, required: true, trim: true },
  prenom:    { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String, required: true },
  matricule: { type: String, unique: true },
  role:      { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  resetToken:       { type: String },
  resetTokenExpiry: { type: Date },
  notes:     [noteSchema],
  avatar:    { type: String, default: '' },
}, { timestamps: true });

studentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const bcrypt = require('bcryptjs');
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

studentSchema.methods.comparePassword = function(password) {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('Student', studentSchema);
