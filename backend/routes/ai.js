const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();
const auth = require('../middleware/auth');
const Student = require('../models/Student');

// POST /api/ai/chat
router.post('/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;

    // Get student notes for context
    const student = await Student.findById(req.user.id);
    const notes = student?.notes || [];
    const notesContext = notes.length > 0
      ? `Notes de l'étudiant: ${notes.map(n => `${n.matiere}: ${n.note}/20`).join(', ')}`
      : 'Aucune note enregistrée.';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `Tu es un agent IA assistant pour des étudiants en 2ème année DSI (Développement des Systèmes d'Information) en Tunisie.
Tu aides les étudiants à comprendre leurs cours : Algorithmique, Bases de données, Réseaux, Développement Web, Mathématiques, Systèmes d'Exploitation, React, Angular, Node.js, Python, Java.
Tu analyses leurs notes et tu donnes des conseils personnalisés pour améliorer leurs résultats.
Pour les mauvaises notes (< 10), tu proposes un plan d'amélioration concret et encourageant.
Réponds toujours en français de manière bienveillante, concise et professionnelle.
Contexte étudiant: ${notesContext}`,
        messages: [{ role: 'user', content: message }]
      })
    });

    const data = await response.json();
    if (!data.content || !data.content[0]) {
      return res.status(500).json({ message: 'Erreur IA' });
    }
    res.json({ reply: data.content[0].text });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/ai/analyze
router.get('/analyze', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    const notes = student?.notes || [];

    if (!notes.length) {
      return res.json({ reply: 'Ajoutez vos notes pour recevoir une analyse personnalisée !' });
    }

    const notesText = notes.map(n =>
      `${n.matiere}: ${n.note}/20 (coeff: ${n.coefficient}${n.tp != null ? ', TP:'+n.tp : ''}${n.cours != null ? ', Cours:'+n.cours : ''}${n.examen != null ? ', Examen:'+n.examen : ''})`
    ).join('\n');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Analyse ces notes d'un étudiant DSI en 2-3 phrases courtes. Identifie la matière la plus faible, donne un conseil pratique et termine par une phrase de motivation. Sois chaleureux et concis.\n\nNotes:\n${notesText}`
        }]
      })
    });

    const data = await response.json();
    res.json({ reply: data.content[0].text });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
