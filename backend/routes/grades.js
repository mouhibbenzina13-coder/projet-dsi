const express = require('express');
const router  = express.Router();
const Student = require('../models/Student');
const auth    = require('../middleware/auth');

// GET /api/grades/stats - statistiques des notes de l'étudiant connecté
router.get('/stats', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    const notes = student.notes;

    if (!notes.length) return res.json({ moyenne: 0, max: 0, min: 0, total: 0 });

    const total = notes.length;
    const somme = notes.reduce((acc, n) => acc + (n.note * (n.coefficient || 1)), 0);
    const totalCoeff = notes.reduce((acc, n) => acc + (n.coefficient || 1), 0);
    const moyenne = (somme / totalCoeff).toFixed(2);
    const max = Math.max(...notes.map(n => n.note));
    const min = Math.min(...notes.map(n => n.note));

    // Par semestre
    const parSemestre = {};
    notes.forEach(n => {
      const s = n.semestre || 'S1';
      if (!parSemestre[s]) parSemestre[s] = [];
      parSemestre[s].push(n.note);
    });

    res.json({ moyenne: parseFloat(moyenne), max, min, total, parSemestre, notes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
