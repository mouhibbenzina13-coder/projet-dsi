"""
Agent IA DSI — Flask API (Fixed)
Utilise l'API Claude d'Anthropic pour des réponses intelligentes réelles.
Installation: pip install flask flask-cors requests python-dotenv
"""

import os
import json
import random
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')
ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
MODEL = 'claude-haiku-4-5-20251001'  # Fast & cheap for agent use

SYSTEM_PROMPT = """Tu es un assistant IA intelligent et bienveillant pour des étudiants en 2ème année DSI (Développement des Systèmes d'Information) en Tunisie.

Tu maîtrises parfaitement :
- Programmation : Python, Java, JavaScript, TypeScript
- Web : HTML/CSS, React, Angular, Node.js, Express.js
- Bases de données : SQL (MySQL, PostgreSQL), MongoDB, Mongoose
- Algorithmique : complexité, tri, structures de données (arbres, graphes, listes)
- Réseaux : TCP/IP, HTTP/HTTPS, DNS, protocoles
- Systèmes d'exploitation : Linux, processus, mémoire
- Mathématiques : algèbre linéaire, statistiques, probabilités
- Machine Learning : Scikit-learn, NumPy, Pandas
- Méthodes de travail : révision, organisation, gestion du temps

Règles :
- Réponds TOUJOURS en français
- Sois bienveillant, précis et pédagogique
- Utilise des emojis pour structurer
- Donne des exemples concrets et du code quand pertinent
- Pour les matières difficiles, propose des ressources ou exercices pratiques
- Maximum 300 mots par réponse sauf si l'étudiant demande plus de détails"""


def call_claude(user_message: str, system: str = SYSTEM_PROMPT, max_tokens: int = 600) -> str:
    """Appelle l'API Claude et retourne la réponse texte."""
    if not ANTHROPIC_API_KEY:
        return "⚠️ Clé API Anthropic manquante. Configurez ANTHROPIC_API_KEY dans votre fichier .env"

    headers = {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
    }
    payload = {
        'model': MODEL,
        'max_tokens': max_tokens,
        'system': system,
        'messages': [{'role': 'user', 'content': user_message}],
    }

    try:
        resp = requests.post(ANTHROPIC_URL, headers=headers, json=payload, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        return data['content'][0]['text']
    except requests.exceptions.Timeout:
        return "⏱️ Délai dépassé. Veuillez réessayer."
    except requests.exceptions.HTTPError as e:
        return f"❌ Erreur API ({e.response.status_code}). Vérifiez votre clé API."
    except Exception as e:
        return f"❌ Erreur inattendue : {str(e)}"


@app.route('/health', methods=['GET'])
def health():
    api_ok = bool(ANTHROPIC_API_KEY)
    return jsonify({
        'status': 'ok',
        'message': 'Agent IA DSI opérationnel 🤖',
        'ai_configured': api_ok,
        'model': MODEL
    })


@app.route('/ask', methods=['POST'])
def ask():
    """Endpoint principal — répond à n'importe quelle question DSI."""
    data = request.get_json()
    if not data or 'question' not in data:
        return jsonify({'error': 'Champ "question" requis'}), 400

    question = data.get('question', '').strip()
    if not question:
        return jsonify({'error': 'Question vide'}), 400

    answer = call_claude(question)
    return jsonify({
        'question': question,
        'answer': answer,
        'agent': f'DSI-AI-Agent v2.0 ({MODEL})'
    })


@app.route('/analyse-notes', methods=['POST'])
def analyse_notes():
    """Analyse les notes et donne des conseils personnalisés avec Claude."""
    data = request.get_json()
    notes = data.get('notes', [])
    student_name = data.get('name', 'l\'étudiant')

    if not notes:
        return jsonify({'conseil': '📊 Aucune note à analyser. Ajoutez vos notes dans votre dashboard !'})

    # Build context
    total_pondere = sum(n['note'] * n.get('coefficient', 1) for n in notes)
    total_coeff = sum(n.get('coefficient', 1) for n in notes)
    moyenne = round(total_pondere / total_coeff, 2) if total_coeff > 0 else 0

    notes_text = '\n'.join([
        f"- {n['matiere']}: {n['note']}/20 (coeff:{n.get('coefficient',1)}"
        + (f", TP:{n['tp']}" if n.get('tp') is not None else '')
        + (f", Cours:{n['cours']}" if n.get('cours') is not None else '')
        + (f", Examen:{n['examen']}" if n.get('examen') is not None else '')
        + ")"
        for n in notes
    ])

    prompt = f"""Voici les notes de {student_name} :

{notes_text}

Moyenne générale pondérée : {moyenne}/20

Analyse ces résultats en 4-5 phrases :
1. Évalue le niveau global
2. Identifie la matière la plus faible avec un conseil précis
3. Mets en valeur le point fort
4. Propose un plan d'action concret pour la semaine
5. Termine par une phrase motivante

Sois chaleureux et constructif."""

    conseil_ia = call_claude(prompt, max_tokens=500)

    # Matière la plus faible
    plus_faible = min(notes, key=lambda n: n['note'])
    niveau = ('Excellent' if moyenne >= 16 else
              'Très bien' if moyenne >= 14 else
              'Bien'      if moyenne >= 10 else 'Insuffisant')

    return jsonify({
        'moyenne': moyenne,
        'niveau': niveau,
        'conseil': conseil_ia,
        'plus_faible': plus_faible['matiere'],
    })


@app.route('/quiz', methods=['GET'])
def quiz():
    """Génère un quiz aléatoire avec Claude (ou depuis la banque statique)."""
    topic = request.args.get('topic', '')

    # Static quiz bank as fallback
    quiz_bank = [
        {'question': "Complexité de QuickSort en moyenne ?",
         'options': ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], 'answer': 1,
         'explication': 'QuickSort : O(n log n) en moyenne, O(n²) dans le pire cas.'},
        {'question': "Qu'est-ce qu'une clé étrangère en SQL ?",
         'options': ['Clé de chiffrement', 'Référence vers une clé primaire d\'une autre table', 'Index unique', 'Type de jointure'],
         'answer': 1, 'explication': 'FOREIGN KEY assure l\'intégrité référentielle.'},
        {'question': "Quel hook React gère les effets de bord ?",
         'options': ['useState', 'useEffect', 'useContext', 'useRef'], 'answer': 1,
         'explication': 'useEffect s\'exécute après le rendu (appels API, abonnements...).'},
        {'question': "Commande pour créer un projet Angular ?",
         'options': ['ng create app', 'ng new mon-app', 'angular new mon-app', 'npx angular'],
         'answer': 1, 'explication': 'ng new est la commande CLI Angular.'},
        {'question': "Dans MongoDB, un enregistrement s'appelle :",
         'options': ['Row', 'Record', 'Document', 'Tuple'], 'answer': 2,
         'explication': 'MongoDB stocke les données en documents JSON/BSON.'},
        {'question': "Combien de couches dans le modèle OSI ?",
         'options': ['4', '5', '6', '7'], 'answer': 3,
         'explication': '7 couches : Physique, Liaison, Réseau, Transport, Session, Présentation, Application.'},
        {'question': "TypeScript est :",
         'options': ['Un langage compilé en C', 'Un superset typé de JavaScript', 'Un framework web', 'Une base de données'],
         'answer': 1, 'explication': 'TypeScript ajoute le typage statique à JavaScript.'},
        {'question': "Méthode HTTP pour créer une ressource REST ?",
         'options': ['GET', 'PUT', 'POST', 'DELETE'], 'answer': 2,
         'explication': 'POST crée une nouvelle ressource. PUT met à jour une existante.'},
    ]

    # If topic provided and API key available, generate with Claude
    if topic and ANTHROPIC_API_KEY:
        prompt = f"""Génère une question de quiz sur le thème "{topic}" pour un étudiant DSI.
Réponds UNIQUEMENT en JSON valide avec cette structure exacte :
{{
  "question": "...",
  "options": ["option A", "option B", "option C", "option D"],
  "answer": <index 0-3 de la bonne réponse>,
  "explication": "Explication courte en 1-2 phrases."
}}"""
        try:
            raw = call_claude(prompt, max_tokens=300)
            # Extract JSON from response
            start = raw.find('{')
            end = raw.rfind('}') + 1
            if start >= 0 and end > start:
                q = json.loads(raw[start:end])
                if all(k in q for k in ['question', 'options', 'answer', 'explication']):
                    return jsonify(q)
        except Exception:
            pass  # Fall through to static bank

    return jsonify(random.choice(quiz_bank))


@app.route('/explain', methods=['POST'])
def explain():
    """Explique un concept DSI en détail."""
    data = request.get_json()
    concept = data.get('concept', '').strip()
    if not concept:
        return jsonify({'error': 'Concept requis'}), 400

    prompt = f"""Explique le concept "{concept}" à un étudiant de 2ème année DSI.

Structure ta réponse ainsi :
1. 📌 Définition simple (2-3 phrases)
2. 💡 Exemple concret (code ou schéma si pertinent)
3. 🔗 Lien avec d'autres concepts DSI
4. ✅ Points clés à retenir (3 maximum)"""

    explanation = call_claude(prompt, max_tokens=700)
    return jsonify({'concept': concept, 'explanation': explanation})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    debug = os.environ.get('FLASK_ENV', 'development') == 'development'
    print(f"🤖 Agent IA DSI v2.0 démarré sur http://localhost:{port}")
    print(f"🔑 API Key configurée: {'✅ Oui' if ANTHROPIC_API_KEY else '❌ Non (ANTHROPIC_API_KEY manquante)'}")
    app.run(debug=debug, port=port, host='0.0.0.0')
