const express = require('express');
const router  = express.Router();
const Student = require('../models/Student');
const auth    = require('../middleware/auth');

// GET /api/grades/stats - statistiques des notes de l'étudiant connecté
router.get('/stats', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ message: 'Étudiant non trouvé.' });

    const notes = student.notes;
    if (!notes.length) return res.json({ moyenne: 0, max: 0, min: 0, total: 0, parSemestre: {}, notes: [] });

    const total = notes.length;
    const somme      = notes.reduce((acc, n) => acc + (n.note * (n.coefficient || 1)), 0);
    const totalCoeff = notes.reduce((acc, n) => acc + (n.coefficient || 1), 0);
    const moyenne = totalCoeff > 0 ? parseFloat((somme / totalCoeff).toFixed(2)) : 0;
    const max = Math.max(...notes.map(n => n.note));
    const min = Math.min(...notes.map(n => n.note));

    // Par semestre — weighted average per semester
    const parSemestre = {};
    notes.forEach(n => {
      const s = n.semestre || 'S1';
      if (!parSemestre[s]) parSemestre[s] = { notes: [], somme: 0, totalCoeff: 0 };
      parSemestre[s].notes.push(n.note);
      parSemestre[s].somme      += n.note * (n.coefficient || 1);
      parSemestre[s].totalCoeff += (n.coefficient || 1);
    });

    // Simplify parSemestre for response
    const parSemestreSimple = {};
    Object.entries(parSemestre).forEach(([sem, data]) => {
      parSemestreSimple[sem] = {
        notes: data.notes,
        moyenne: data.totalCoeff > 0 ? parseFloat((data.somme / data.totalCoeff).toFixed(2)) : 0
      };
    });

    res.json({ moyenne, max, min, total, parSemestre: parSemestreSimple, notes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
