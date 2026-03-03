"""
Agent IA - Flask API
Anaconda environment: ai-agent
Installez avec: pip install flask flask-cors openai langchain
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import re

app = Flask(__name__)
CORS(app)

# ============================================
# Base de connaissances DSI intégrée
# ============================================
DSI_KNOWLEDGE = {
    "python": "Python est un langage de programmation puissant. En DSI, on l'utilise pour l'analyse de données, le machine learning et les scripts d'automatisation.",
    "java": "Java est orienté objet, utilisé pour les applications d'entreprise. En DSI, vous l'étudierez pour les design patterns et la POO avancée.",
    "algorithme": "Un algorithme est une suite d'instructions pour résoudre un problème. La complexité algorithmique (O(n), O(log n)) est essentielle à maîtriser.",
    "base de données": "Les BDD relationnelles (MySQL, PostgreSQL) et NoSQL (MongoDB) sont toutes deux importantes. SQL reste fondamental pour tout développeur.",
    "réseau": "Les réseaux informatiques couvrent TCP/IP, HTTP, les protocoles de communication. Indispensable pour comprendre les architectures web.",
    "machine learning": "Le ML utilise des données pour entraîner des modèles prédictifs. Scikit-learn avec Python est le point d'entrée idéal.",
    "web": "Le développement web full-stack inclut HTML/CSS, JavaScript (React, Angular), et les backends (Node.js, PHP/Symfony).",
    "mongodb": "MongoDB est une base de données NoSQL orientée documents. Parfaite pour les applications JavaScript avec Mongoose comme ODM.",
    "react": "React est une bibliothèque JavaScript pour créer des interfaces. Les hooks (useState, useEffect) sont au cœur de React moderne.",
    "angular": "Angular est un framework TypeScript complet avec injection de dépendances, modules, et composants structurés.",
}

def get_ai_response(question: str) -> str:
    """Génère une réponse intelligente basée sur la question"""
    question_lower = question.lower()

    # Cherche dans la base de connaissances
    for keyword, response in DSI_KNOWLEDGE.items():
        if keyword in question_lower:
            return f"📚 {response}"

    # Réponses contextuelles
    if any(w in question_lower for w in ['bonjour', 'salut', 'hello', 'bonsoir']):
        return "👋 Bonjour ! Je suis votre assistant IA DSI. Posez-moi des questions sur la programmation, les bases de données, les réseaux ou vos cours !"

    if any(w in question_lower for w in ['moyenne', 'note', 'résultat']):
        return "📊 Pour calculer votre moyenne pondérée : Σ(note × coefficient) / Σ(coefficients). Consultez votre dashboard pour voir vos statistiques en temps réel !"

    if any(w in question_lower for w in ['révision', 'réviser', 'exam', 'examen']):
        tips = [
            "✅ Technique Pomodoro : 25 min de travail, 5 min de pause",
            "✅ Relisez vos TDs et exercices corrigés en priorité",
            "✅ Faites des mind maps pour les concepts complexes",
            "✅ Expliquez les concepts à voix haute — si vous pouvez expliquer, vous avez compris !",
        ]
        return "📖 Conseils de révision :\n" + "\n".join(tips)

    if any(w in question_lower for w in ['projet', 'mini-projet', 'travail']):
        return "🚀 Pour un bon projet DSI : 1) Analysez les besoins, 2) Concevez l'architecture (UML), 3) Développez par modules, 4) Testez chaque composant, 5) Documentez votre code !"

    if any(w in question_lower for w in ['aide', 'help', 'comment']):
        return "🤖 Je peux vous aider sur : Python, Java, Algorithmes, BDD (SQL/MongoDB), Réseaux, React, Angular, Machine Learning, conseils de révision et gestion de projet. Posez votre question !"

    # Réponse par défaut
    fallback = [
        f"🤔 Bonne question sur '{question[:40]}...' ! En DSI, il est important d'approfondir ce sujet. Consultez vos cours ou demandez à votre professeur pour plus de détails.",
        f"💡 Pour '{question[:40]}...', je vous recommande de chercher dans les ressources de votre cours ou sur MDN/docs officielles.",
        f"📚 '{question[:40]}...' est un sujet que vous étudierez en détail dans votre formation DSI. N'hésitez pas à être plus précis !",
    ]
    return random.choice(fallback)


# ============================================
# Routes Flask
# ============================================

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'Agent IA DSI opérationnel 🤖'})


@app.route('/ask', methods=['POST'])
def ask():
    """Endpoint principal de l'agent IA"""
    data = request.get_json()
    if not data or 'question' not in data:
        return jsonify({'error': 'Champ "question" requis'}), 400

    question = data['question'].strip()
    if not question:
        return jsonify({'error': 'Question vide'}), 400

    response = get_ai_response(question)
    return jsonify({
        'question': question,
        'answer': response,
        'agent': 'DSI-AI-Agent v1.0'
    })


@app.route('/analyse-notes', methods=['POST'])
def analyse_notes():
    """Analyse les notes et donne des conseils personnalisés"""
    data = request.get_json()
    notes = data.get('notes', [])

    if not notes:
        return jsonify({'conseil': 'Aucune note à analyser. Ajoutez vos notes dans votre dashboard !'})

    moyenne = sum(n['note'] for n in notes) / len(notes)
    conseils = []

    if moyenne >= 16:
        conseils.append("🌟 Excellent niveau ! Vous êtes dans le top de votre promotion.")
        conseils.append("💡 Pensez à aider vos camarades et à approfondir avec des projets personnels.")
    elif moyenne >= 14:
        conseils.append("✅ Très bon niveau ! Continuez sur cette lancée.")
        conseils.append("📈 Pour progresser encore, renforcez vos points faibles.")
    elif moyenne >= 10:
        conseils.append("⚠️ Niveau correct mais des progrès sont possibles.")
        conseils.append("📚 Identifiez les matières difficiles et consacrez-y plus de temps.")
    else:
        conseils.append("🚨 Attention ! Votre moyenne est insuffisante.")
        conseils.append("🆘 Consultez votre professeur et mettez en place un plan de rattrapage.")

    # Matière la plus faible
    if notes:
        plus_faible = min(notes, key=lambda n: n['note'])
        conseils.append(f"🎯 Focus sur : {plus_faible['matiere']} ({plus_faible['note']}/20)")

    return jsonify({
        'moyenne': round(moyenne, 2),
        'niveau': 'Excellent' if moyenne >= 16 else 'Très bien' if moyenne >= 14 else 'Bien' if moyenne >= 10 else 'Insuffisant',
        'conseils': conseils
    })


@app.route('/quiz', methods=['GET'])
def quiz():
    """Génère un quiz aléatoire pour réviser"""
    questions = [
        {
            'question': "Quelle est la complexité temporelle d'un tri rapide (QuickSort) en moyenne ?",
            'options': ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'],
            'answer': 1,
            'explication': 'QuickSort a une complexité moyenne de O(n log n), mais O(n²) dans le pire cas.'
        },
        {
            'question': "Qu'est-ce qu'une clé étrangère en SQL ?",
            'options': ['Une clé de chiffrement', 'Une référence vers la clé primaire d\'une autre table', 'Un index unique', 'Un type de jointure'],
            'answer': 1,
            'explication': 'La clé étrangère (FOREIGN KEY) assure l\'intégrité référentielle entre deux tables.'
        },
        {
            'question': "Quel hook React permet de gérer les effets de bord ?",
            'options': ['useState', 'useEffect', 'useContext', 'useRef'],
            'answer': 1,
            'explication': 'useEffect s\'exécute après chaque rendu et gère les appels API, abonnements, etc.'
        },
        {
            'question': "Quelle commande crée un nouveau projet Angular ?",
            'options': ['ng create app', 'ng new mon-app', 'angular new mon-app', 'npx angular mon-app'],
            'answer': 1,
            'explication': 'ng new est la commande Angular CLI pour créer un nouveau projet.'
        },
        {
            'question': "Dans MongoDB, comment s'appelle un enregistrement ?",
            'options': ['Row (ligne)', 'Record', 'Document', 'Tuple'],
            'answer': 2,
            'explication': 'MongoDB stocke les données sous forme de documents JSON (BSON).'
        },
    ]
    q = random.choice(questions)
    return jsonify(q)


if __name__ == '__main__':
    print("🤖 Agent IA DSI démarré sur http://localhost:8000")
    app.run(debug=True, port=8000)
