const express = require('express');
const router  = express.Router();
const Student = require('../models/Student');
const auth    = require('../middleware/auth');

// GET /api/students - tous les étudiants (admin)
router.get('/', auth, async (req, res) => {
  try {
    const students = await Student.find().select('-password');
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/students/me - profil étudiant connecté
router.get('/me', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select('-password');
    if (!student) return res.status(404).json({ message: 'Étudiant non trouvé.' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/students/me - modifier son profil
router.put('/me', auth, async (req, res) => {
  try {
    const { nom, prenom, avatar } = req.body;
    const student = await Student.findByIdAndUpdate(
      req.user.id,
      { nom, prenom, avatar },
      { new: true }
    ).select('-password');
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/students/me/notes - ajouter une note
router.post('/me/notes', auth, async (req, res) => {
  try {
    const { matiere, note, coefficient, semestre } = req.body;
    const student = await Student.findById(req.user.id);
    student.notes.push({ matiere, note, coefficient, semestre });
    await student.save();
    res.json(student.notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
