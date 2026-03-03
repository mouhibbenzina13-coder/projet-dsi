const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const Student = require('../models/Student');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { nom, prenom, email, password } = req.body;
    const exists = await Student.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email déjà utilisé.' });

    const matricule = 'DSI-' + Date.now().toString().slice(-6);
    const student = new Student({ nom, prenom, email, password, matricule });
    await student.save();

    const token = jwt.sign({ id: student._id, email }, process.env.JWT_SECRET || 'dsi_secret_key', { expiresIn: '7d' });
    res.status(201).json({ token, student: { id: student._id, nom, prenom, email, matricule } });
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

    const token = jwt.sign({ id: student._id, email }, process.env.JWT_SECRET || 'dsi_secret_key', { expiresIn: '7d' });
    res.json({ token, student: { id: student._id, nom: student.nom, prenom: student.prenom, email, matricule: student.matricule } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
