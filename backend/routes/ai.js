const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Student = require('../models/Student');

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-5-20251001';

async function callClaude(system, userMessage, maxTokens = 800) {
  const fetch = (...args) => import('node-fetch').then(m => m.default(...args));
  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  if (!data.content || !data.content[0] || !data.content[0].text) {
    throw new Error('Réponse vide de Claude');
  }
  return data.content[0].text;
}

// Build notes context string
function buildNotesContext(notes) {
  if (!notes || !notes.length) return 'Aucune note enregistrée.';
  return notes.map(n => {
    const parts = [`${n.matiere}: ${n.note}/20 (coeff:${n.coefficient})`];
    if (n.tp    != null) parts.push(`TP:${n.tp}`);
    if (n.cours != null) parts.push(`Cours:${n.cours}`);
    if (n.examen != null) parts.push(`Examen:${n.examen}`);
    return parts.join(', ');
  }).join('\n');
}

// Calculate weighted average
function calcMoyenne(notes) {
  if (!notes || !notes.length) return null;
  const somme = notes.reduce((a, n) => a + n.note * (n.coefficient || 1), 0);
  const coeff = notes.reduce((a, n) => a + (n.coefficient || 1), 0);
  return (somme / coeff).toFixed(2);
}

// POST /api/ai/chat
router.post('/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message vide.' });
    }

    const student = await Student.findById(req.user.id).select('-password');
    const notes = student?.notes || [];
    const notesContext = buildNotesContext(notes);
    const moyenne = calcMoyenne(notes);

    const system = `Tu es un agent IA assistant intelligent pour des étudiants en 2ème année DSI (Développement des Systèmes d'Information) en Tunisie.

Tu aides les étudiants à :
- Comprendre leurs cours : Algorithmique, Bases de données, Réseaux, Développement Web, Mathématiques, Systèmes d'Exploitation, React, Angular, Node.js, Python, Java
- Analyser leurs notes et donner des conseils personnalisés
- Proposer des plans d'amélioration concrets pour les matières faibles (note < 10)
- Répondre à des questions techniques précises avec des exemples de code

Réponds TOUJOURS en français, de manière bienveillante, concise et structurée.
Utilise des emojis pour rendre les réponses plus lisibles.
Pour les questions techniques, inclus des exemples concrets ou du pseudo-code quand c'est utile.

=== Contexte de l'étudiant ===
Nom: ${student?.prenom || ''} ${student?.nom || ''}
Matricule: ${student?.matricule || ''}
Moyenne générale: ${moyenne ? moyenne + '/20' : 'Aucune note'}
Notes:
${notesContext}`;

    const reply = await callClaude(system, message);
    res.json({ reply });

  } catch (err) {
    console.error('AI Chat error:', err.message);
    res.status(500).json({ message: 'Le service IA est temporairement indisponible. Réessayez dans un instant.' });
  }
});

// GET /api/ai/analyze
router.get('/analyze', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select('-password');
    const notes = student?.notes || [];

    if (!notes.length) {
      return res.json({ reply: '📊 Ajoutez vos notes pour recevoir une analyse personnalisée de vos performances !' });
    }

    const notesContext = buildNotesContext(notes);
    const moyenne = calcMoyenne(notes);

    const prompt = `Voici les notes d'un étudiant DSI :

${notesContext}

Moyenne générale pondérée : ${moyenne}/20

Fais une analyse personnalisée en 3-4 phrases maximum :
1. Évalue le niveau global (excellent/bon/moyen/insuffisant)
2. Identifie la matière la plus faible et propose UN conseil pratique spécifique
3. Identifie le point fort et encourage l'étudiant
4. Termine par une phrase de motivation courte et sincère

Sois chaleureux, direct et constructif. Utilise des emojis.`;

    const reply = await callClaude(
      'Tu es un conseiller pédagogique bienveillant et expert pour étudiants DSI en Tunisie. Réponds en français.',
      prompt,
      400
    );

    res.json({ reply });
  } catch (err) {
    console.error('AI Analyze error:', err.message);
    res.status(500).json({ message: 'Analyse temporairement indisponible.' });
  }
});

module.exports = router;
