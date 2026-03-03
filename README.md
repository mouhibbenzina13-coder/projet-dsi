# 🎓 EduDSI — Mini-Projet Full-Stack 2ème DSI

Plateforme complète de gestion étudiante avec Agent IA intégré.

---

## 🏗️ Architecture

```
projet-dsi/
├── frontend/          → HTML/CSS/JS (React-style, port 3000)
├── backend/           → Express.js + MongoDB (port 5000)
├── ai-agent/          → Python Flask + Agent IA (port 8000)
└── README.md
```

---

## 🚀 Technologies utilisées

| Technologie   | Rôle                              | Port  |
|---------------|-----------------------------------|-------|
| HTML/JS/CSS   | Frontend interactif               | 3000  |
| Express.js    | API REST Backend                  | 5000  |
| MongoDB       | Base de données NoSQL             | 27017 |
| Python/Flask  | Agent IA + analyse des notes      | 8000  |
| JWT           | Authentification sécurisée        | —     |
| Mongoose      | ODM pour MongoDB                  | —     |

---

## 📦 Installation

### 1. Backend Express.js
```bash
cd backend
npm install
# Configurez .env (MONGO_URI, JWT_SECRET)
npm run dev
# → http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
# Ouvrez index.html dans votre navigateur
# Ou: npx serve . → http://localhost:3000
```

### 3. Agent IA Python
```bash
cd ai-agent
conda create -n ai-agent python=3.10
conda activate ai-agent
pip install -r requirements.txt
python agent.py
# → http://localhost:8000
```

---

## 🔌 API Endpoints

### Auth
| Méthode | Route               | Description          |
|---------|---------------------|----------------------|
| POST    | /api/auth/register  | Inscription          |
| POST    | /api/auth/login     | Connexion (JWT)      |

### Étudiants
| Méthode | Route               | Description          |
|---------|---------------------|----------------------|
| GET     | /api/students/me    | Mon profil           |
| PUT     | /api/students/me    | Modifier mon profil  |
| POST    | /api/students/me/notes | Ajouter une note  |

### Cours
| Méthode | Route               | Description          |
|---------|---------------------|----------------------|
| GET     | /api/courses        | Liste des cours      |
| POST    | /api/courses        | Créer un cours       |
| DELETE  | /api/courses/:id    | Supprimer un cours   |

### Notes
| Méthode | Route               | Description          |
|---------|---------------------|----------------------|
| GET     | /api/grades/stats   | Statistiques notes   |

### Agent IA
| Méthode | Route               | Description          |
|---------|---------------------|----------------------|
| GET     | /health             | Status de l'agent    |
| POST    | /ask                | Poser une question   |
| POST    | /analyse-notes      | Analyser les notes   |
| GET     | /quiz               | Obtenir un quiz      |

---

## ✨ Fonctionnalités

- 🔐 **Authentification** JWT (login / register)
- 📊 **Dashboard** avec statistiques en temps réel
- 📚 **Gestion des cours** (ajouter, supprimer, couleurs)
- 📝 **Suivi des notes** avec calcul automatique de moyenne
- 📅 **Emploi du temps** hebdomadaire visuel
- 🤖 **Agent IA** avec base de connaissances DSI intégrée
- 🧠 **Quiz interactif** avec 8+ questions DSI
- 👤 **Profil étudiant** modifiable

---

## 👤 Compte démo
```
Email:    demo@dsi.edu
Password: demo123
```

---

## 📚 Fait pour 2ème Année DSI — Bonne chance ! 🚀
