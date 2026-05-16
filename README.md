# Quizz R1

Mini-application web personnelle d'entraînement à la règle **APSAD R1** (sprinkler).
Mobile-first, 100% client-side, hébergement gratuit sur GitHub Pages.

---

## Démarrage en 3 commandes

```bash
npm install
npm run dev
```

L'app tourne sur `http://localhost:5173`. La banque de questions de démo (15 questions sourcées R1) se charge automatiquement.

Pour une vraie session sur iPhone :

```bash
npm run dev -- --host
```

Puis depuis ton iPhone (sur le même Wi-Fi), ouvre l'URL réseau affichée dans la console.

---

## Modes de jeu

| Mode | Comportement |
|---|---|
| **Quizz libre** | Mode infini. Algo adaptatif : SRS + pondération par chapitres faibles + édition 80/20 (2025/antérieures). |
| **Daily challenge** | 10 questions identiques pour toute la journée, seedées sur la date. Score conservé. |
| **Survival** | Fin de partie à la 1ʳᵉ erreur. Record persistant. |
| **Audit terrain** | Uniquement les questions de scénario Q1 / vérification semestrielle. |
| **Révision ciblée** | Choix d'un chapitre, sans gain XP (mode entraînement pur). |

---

## Système de progression

- **XP** : 10 par bonne réponse (15 si multi), 5 par erreur (encourage à essayer).
- **Bonus aléatoire** : ~5% des questions valent ×2 XP (affiché AVANT validation, transparent).
- **Bonus streak quotidien** : +25 XP × (jours/7), plafonné à 200 XP/jour, appliqué à la 1ʳᵉ réponse du jour.
- **Niveaux 1→5** dérivés du taux de réussite **après 50 questions répondues** :
  - N1 Apprenti (<50%) · N2 Initié (50-65%) · N3 Confirmé (65-75%) · N4 Expert (75-85%) · N5 Maître R1 (≥85%)
- **Streak jour** : visualisé par un bulbe de sprinkler qui chauffe (0 → rouge plein à 30 jours).
- **Freezes** : 2 jokers/mois, renouvelés le 1er. Consommés silencieusement sur 1 jour sauté. Au-delà, le streak retombe à 0 sans drame.
- **Daily quests** : 3 quêtes tirées d'un pool de 6 chaque jour à 4h locale. +100 XP de bonus si toutes complétées.
- **25 badges** à débloquer : régularité, performance, volume, niveau, modes, spéciaux.

---

## Format JSON des questions

L'app charge `public/questions.example.json` par défaut. Pour importer ta propre banque, ouvre **Stats → ⚙ → Importer un .json**.

Chaque question respecte ce schéma :

```json
{
  "id": "r1-2025-10-5-001",
  "edition": "2025",
  "chapitre": "10.5",
  "theme": "Courbe pompe",
  "difficulte": 4,
  "multi": false,
  "mode_audit": true,
  "enonce": "Lors de l'essai semestriel...",
  "propositions": ["Prop A", "Prop B", "Prop C", "Prop D"],
  "bonnes_reponses": [1],
  "explication": "R1 §10.5 : à Q130%...",
  "reference": "R1 §10.5 (édition 2025)"
}
```

| Champ | Description |
|---|---|
| `id` | Identifiant unique (string). Pas d'espaces. |
| `edition` | Édition de la R1 : `"2025"`, `"2020"`, `"2014"`, `"2008"`, `"1984"`. |
| `chapitre` | Notation R1 : `"10.5"`, `"19.2.4"`, `"T6.1"`. Sert au regroupement et à la révision ciblée. |
| `theme` | Libellé court affiché en métadonnée (ex. `"Pompes"`, `"Courbe pompe"`). |
| `difficulte` | Entier 1-5. Sert au filtrage par niveau (un joueur N3 voit max difficulté 4). |
| `multi` | `true` si plusieurs bonnes réponses, sinon `false`. |
| `mode_audit` | `true` si scénario de vérification semestrielle (Q1, audit terrain). |
| `enonce` | Question, formulée précisément. |
| `propositions` | Exactement 4 propositions (tableau). |
| `bonnes_reponses` | Indices 0-based des bonnes propositions. Tableau trié recommandé. |
| `explication` | Explication didactique + raison du choix. |
| `reference` | Référence normative complète pour ta crédibilité d'inspecteur. |

> 💡 **Astuce** : tu peux exporter ta progression depuis la Bibliothèque pour la sauvegarder, et la ré-importer plus tard ou sur un autre appareil.

---

## Déploiement GitHub Pages

### 1. Ajuste le `base` dans `vite.config.js`

Si ton repo s'appelle `quiz-r1`, laisse `REPO_BASE = "/quiz-r1/"`.
Sinon, remplace par le nom **exact** de ton repo, par exemple `"/r1-trainer/"`.

### 2. Build et déploiement

**Option A — Manuel** (via le package `gh-pages` déjà installé) :

```bash
npm run deploy
```

Ça build dans `dist/` et pousse le contenu sur la branche `gh-pages` de ton repo.

**Option B — GitHub Actions** (recommandé) :

Crée `.github/workflows/deploy.yml` :

```yaml
name: Deploy
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: github-pages
    steps:
      - uses: actions/deploy-pages@v4
```

Puis dans GitHub : **Settings → Pages → Source : GitHub Actions**.

### 3. Accède à l'app

`https://<ton-pseudo>.github.io/quiz-r1/`

---

## Installer sur l'écran d'accueil de l'iPhone

1. Ouvre l'URL de l'app dans Safari (pas Chrome).
2. Bouton partage → **Ajouter à l'écran d'accueil**.
3. L'app s'ouvre en plein écran, sans la barre Safari.
4. Tes données sont stockées dans le localStorage du site — elles persistent même hors-ligne.

### Icônes et splash

Place ces fichiers dans `public/icons/` et `public/splash/` :

- `public/icons/icon-120.png` (120×120)
- `public/icons/icon-152.png` (152×152)
- `public/icons/icon-180.png` (180×180) — la plus visible sur écran d'accueil iOS
- `public/splash/splash-iphone.png` (1170×2532 pour iPhone 13/14 standard)

Pour les générer, le plus simple : prends un PNG carré (le logo bulbe rouge sur fond `#0A0B0F` par exemple), passe-le dans un outil comme [realfavicongenerator.net](https://realfavicongenerator.net/) qui te sort tous les formats.

---

## Architecture

```
src/
├── App.jsx                  — orchestrateur, gère mode actif et cycle question
├── main.jsx                 — point d'entrée React
├── index.css                — design tokens, Tailwind v4, surfaces stratifiées
├── hooks/
│   ├── useStore.js          — reducer central, persistance localStorage
│   └── useQuestions.js      — chargement bank questions
├── lib/
│   ├── storage.js           — wrapper localStorage + state initial
│   ├── srs.js               — spaced repetition (SM-2 simplifié)
│   ├── xp.js                — niveaux, gains XP, bonus
│   ├── streaks.js           — streaks jour + bonnes réponses + freezes
│   ├── badges.js            — catalogue 25 badges + check
│   ├── quests.js            — pool daily quests + tirage seeded
│   ├── picker.js            — algo tirage 3 couches (filtre / SRS / pondération)
│   └── confetti.js          — wrapper canvas-confetti
└── components/
    ├── icons/SprinklerBulb  — icône signature
    ├── ui/                  — primitives (Pill, IconButton, AnimatedNumber)
    ├── quiz/                — écran principal + overlays
    ├── stats/               — écran statistiques
    └── library/             — écran réglages & banque
```

### Pourquoi ce design

- **Rouge incendie #E63946** tenu en signal métier — jamais en décoration.
- **Instrument Serif + Geist + Geist Mono** : éditorial premium, lisibilité parfaite.
- **Surfaces stratifiées** sur fond `#0A0B0F` (jamais noir pur) + grain SVG subtil.
- **Bulbe de sprinkler** comme totem visuel du streak.
- **Animations Framer Motion** : springs serrés (240-320 / 22-30), pas d'élastiques mous.

---

## Garde-fous éthiques

- Pas de notification "tu vas perdre ton streak" culpabilisante.
- Cap journalier configurable (Réglages) : message non-culpabilisant si atteint.
- Freezes consommés silencieusement, avec un message bienveillant à la prochaine ouverture.
- Aucun "social", aucun classement public. Outil de progression personnelle.

---

## Licence

Usage personnel. Les contenus R1 cités sont des propriétés de CNPP / APSAD ; les questions de la démo sont une reformulation des règles à des fins d'apprentissage personnel et ne se substituent pas au document officiel.
