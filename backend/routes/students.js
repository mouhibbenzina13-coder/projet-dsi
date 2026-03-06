const express = require('express');
const router  = express.Router();
const Student = require('../models/Student');
const auth    = require('../middleware/auth');

// GET /api/students
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
      req.user.id, { nom, prenom, avatar }, { new: true }
    ).select('-password');
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/students/me/notes
router.post('/me/notes', auth, async (req, res) => {
  try {
    const { matiere, coefficient, semestre } = req.body;
    let { tp, cours, examen, note } = req.body;

    // Convert empty strings to undefined
    tp     = (tp !== '' && tp != null)     ? parseFloat(tp)     : undefined;
    cours  = (cours !== '' && cours != null) ? parseFloat(cours)  : undefined;
    examen = (examen !== '' && examen != null) ? parseFloat(examen) : undefined;

    if (!matiere) return res.status(400).json({ message: 'Le nom de la matière est requis.' });

    // Calculate weighted average: TP×30% + Cours×30% + Examen×40%
    let calculatedNote;
    if (note !== undefined && note !== '' && note != null) {
      calculatedNote = parseFloat(note);
    } else {
      let sum = 0, weight = 0;
      if (tp !== undefined)     { sum += tp     * 0.3; weight += 0.3; }
      if (cours !== undefined)  { sum += cours  * 0.3; weight += 0.3; }
      if (examen !== undefined) { sum += examen * 0.4; weight += 0.4; }
      if (weight === 0) return res.status(400).json({ message: 'Entrez au moins une note (TP, Cours ou Examen).' });
      calculatedNote = parseFloat((sum / weight).toFixed(2));
    }

    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ message: 'Étudiant non trouvé.' });

    const newNote = {
      matiere,
      note: calculatedNote,
      coefficient: parseInt(coefficient) || 1,
      semestre: semestre || 'S1'
    };
    if (tp !== undefined)     newNote.tp     = tp;
    if (cours !== undefined)  newNote.cours  = cours;
    if (examen !== undefined) newNote.examen = examen;

    student.notes.push(newNote);
    await student.save();
    res.json(student.notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/students/me/notes/:noteId  — update an existing note
router.put('/me/notes/:noteId', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ message: 'Étudiant non trouvé.' });

    const note = student.notes.id(req.params.noteId);
    if (!note) return res.status(404).json({ message: 'Note non trouvée.' });

    const { matiere, tp, cours, examen, coefficient, semestre } = req.body;
    if (matiere)     note.matiere     = matiere;
    if (coefficient) note.coefficient = parseInt(coefficient);
    if (semestre)    note.semestre    = semestre;

    const tpV     = (tp     !== '' && tp     != null) ? parseFloat(tp)     : note.tp;
    const coursV  = (cours  !== '' && cours  != null) ? parseFloat(cours)  : note.cours;
    const examenV = (examen !== '' && examen != null) ? parseFloat(examen) : note.examen;

    note.tp     = tpV;
    note.cours  = coursV;
    note.examen = examenV;

    // Recalculate weighted average
    let sum = 0, weight = 0;
    if (tpV     != null) { sum += tpV     * 0.3; weight += 0.3; }
    if (coursV  != null) { sum += coursV  * 0.3; weight += 0.3; }
    if (examenV != null) { sum += examenV * 0.4; weight += 0.4; }
    if (weight > 0) note.note = parseFloat((sum / weight).toFixed(2));

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
