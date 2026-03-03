const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const StudentSchema = new mongoose.Schema({
  nom:      { type: String, required: true },
  prenom:   { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  matricule:{ type: String, unique: true },
  niveau:   { type: String, default: '2ème DSI' },
  avatar:   { type: String, default: '' },
  notes: [{
    matiere:    String,
    note:       Number,
    coefficient:{ type: Number, default: 1 },
    semestre:   String,
  }],
  createdAt: { type: Date, default: Date.now }
});

// Hash password before save
StudentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

StudentSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('Student', StudentSchema);
