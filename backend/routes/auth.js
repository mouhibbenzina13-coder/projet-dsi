const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const Student = require('../models/Student');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { nom, prenom, email, password, role } = req.body;
    const exists = await Student.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email déjà utilisé.' });

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
      student: { id: student._id, nom, prenom, email, matricule, role: student.role }
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

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const student = await Student.findOne({ email });
    // Always return success to prevent email enumeration
    if (!student) return res.json({ message: 'Email envoyé si le compte existe.' });

    const token = crypto.randomBytes(32).toString('hex');
    student.resetToken = token;
    student.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await student.save();

    // In production, send email here with nodemailer
    // For now just return success
    console.log(`Reset token for ${email}: ${token}`);
    res.json({ message: 'Email envoyé si le compte existe.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const student = await Student.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });
    if (!student) return res.status(400).json({ message: 'Token invalide ou expiré.' });

    student.password = password;
    student.resetToken = undefined;
    student.resetTokenExpiry = undefined;
    await student.save();

    res.json({ message: 'Mot de passe réinitialisé avec succès.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
