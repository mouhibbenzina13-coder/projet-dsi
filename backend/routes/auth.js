const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const Student = require('../models/Student');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { nom, prenom, email, password, role } = req.body;

    const exists = await Student.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email déjà utilisé.' });

    // Only allow student or teacher roles on self-registration
    // Admin role must be set manually in DB
    const allowedRoles = ['student', 'teacher'];
    const assignedRole = allowedRoles.includes(role) ? role : 'student';

    const matricule = 'DSI-' + Date.now().toString().slice(-6);
    const student = new Student({ nom, prenom, email, password, matricule, role: assignedRole });
    await student.save();

    const token = jwt.sign(
      { id: student._id, email, role: student.role },
      process.env.JWT_SECRET || 'dsi_secret_key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      student: {
        id: student._id,
        nom, prenom, email,
        matricule,
        role: student.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const student = await Student.findOne({ email });
    if (!student) return res.status(400).json({ message: 'Email ou mot de passe incorrect.' });

    const valid = await student.comparePassword(password);
    if (!valid) return res.status(400).json({ message: 'Email ou mot de passe incorrect.' });

    const token = jwt.sign(
      { id: student._id, email, role: student.role },
      process.env.JWT_SECRET || 'dsi_secret_key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      student: {
        id: student._id,
        nom: student.nom,
        prenom: student.prenom,
        email,
        matricule: student.matricule,
        role: student.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
