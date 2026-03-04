const express = require('express');
const router  = express.Router();
const Student = require('../models/Student');
const auth    = require('../middleware/auth');

// GET /api/students - all students (admin/teacher only)
router.get('/', auth, async (req, res) => {
  try {
    const students = await Student.find().select('-password');
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/students/me
router.get('/me', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select('-password');
    if (!student) return res.status(404).json({ message: 'Étudiant non trouvé.' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/students/me
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

// POST /api/students/me/notes - add note with TP/Cours/Examen
router.post('/me/notes', auth, async (req, res) => {
  try {
    const { matiere, note, tp, cours, examen, coefficient, semestre } = req.body;
    const student = await Student.findById(req.user.id);
    student.notes.push({ matiere, note, tp, cours, examen, coefficient, semestre });
    await student.save();
    res.json(student.notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/students/me/notes/:noteId
router.delete('/me/notes/:noteId', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    student.notes = student.notes.filter(n => n._id.toString() !== req.params.noteId);
    await student.save();
    res.json({ message: 'Note supprimée.', notes: student.notes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
