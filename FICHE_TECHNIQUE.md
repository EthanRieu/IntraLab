# IntraLab — Fiche Technique

## Présentation

**IntraLab** est une application web intranet à destination d'une école (type ESGI), permettant aux étudiants et administrateurs de gérer des articles, un inventaire de matériel, une marketplace, un système de messagerie en temps réel et des notifications.

---

## Stack Technique

### Frontend

| Technologie | Version | Rôle |
|---|---|---|
| **Vue 3** | 3.5.21 | Framework UI réactif |
| **Nuxt 4** | 4.1.2 | Framework full-stack (SSR/SPA + routing) |
| **Tailwind CSS** | 4.1.13 | Framework CSS utilitaire |
| **Lucide Vue** | 0.577.0 | Bibliothèque d'icônes |
| **Zod** | 4.1.11 | Validation de formulaires côté client |
| **OGL** | 1.0.11 | WebGL (effets visuels) |
| **Inspira UI** | 0.0.2 | Composants UI additionnels |
| **class-variance-authority** | 0.7.1 | Gestion de variantes de composants |
| **clsx + tailwind-merge** | latest | Composition de classes CSS |

### Backend

| Technologie | Version | Rôle |
|---|---|---|
| **Nuxt 4 (Nitro)** | 4.1.2 | Serveur HTTP + API REST |
| **Prisma** | 6.16.2 | ORM TypeScript |
| **PostgreSQL** | — | Base de données relationnelle |
| **jsonwebtoken** | 9.0.2 | Authentification JWT |
| **bcryptjs** | 3.0.2 | Hashage des mots de passe |
| **Zod** | 4.1.11 | Validation des données API |
| **WebSocket (Nitro)** | — | Messagerie temps réel |

### Langage & Tooling

| Outil | Rôle |
|---|---|
| **TypeScript** | Langage principal (front + back) |
| **Vite** | Bundler (via Nuxt) |
| **npm** | Gestionnaire de paquets |
| **dotenv-cli** | Gestion des variables d'environnement |
| **PM2** | Gestionnaire de processus (production) |
| **Apache2** | Reverse proxy (production) |

---

## Base de données

- **SGBD :** PostgreSQL
- **ORM :** Prisma 6 (schéma déclaratif, migrations auto)
- **Nom de la BDD (dev) :** `IntraLab_DB`
- **Nom de la BDD (prod) :** `intralab_prod`

### Modèles Prisma

| Modèle | Description |
|---|---|
| `users` | Utilisateurs du système (rôle, classe, spé) |
| `roles` | Rôles disponibles (student, admin, rp) |
| `classes` | Niveaux académiques (B1 → M2) |
| `spec` | Spécialisations (Dev, Data, Cyber, Infra) |
| `articles` | Articles de blog avec workflow de statut |
| `user_article` | Relation auteur / modérateur d'un article |
| `inventory` | Matériel disponible à l'emprunt |
| `loan` | Demandes d'emprunt |
| `user_loan` | Suivi des transactions d'emprunt |
| `store` | Sessions de vente (marketplace) |
| `store_item` | Articles mis en vente |
| `notifications` | Notifications utilisateur |
| `chat_session` | Conversations de chat |
| `chat_participant` | Participants d'une session de chat |
| `chat_message` | Messages (chiffrés en BDD) |
| `chat_reaction` | Réactions emoji sur les messages |

---

## Fonctionnalités

### Authentification & Utilisateurs
- Inscription (rôle étudiant par défaut)
- Connexion / Déconnexion avec JWT (expiration 7 jours)
- Gestion de profil (nom, avatar, classe, spécialisation)
- Suppression de son propre compte
- Gestion admin : blocage, validation, création de compte
- Hiérarchie de rôles : **RP > Admin > Student**

### Blog / Articles
- Création, édition, suppression d'articles
- Workflow de publication : `draft → pending → published / rejected`
- Modération par les RP/Admin
- Catégorisation et support d'images
- Vues : "Mes articles", "En attente de validation", "Fil d'actualité"

### Inventaire & Emprunts
- CRUD sur les équipements (quantité, localisation, catégorie, images)
- Demande d'emprunt avec workflow d'approbation
- Suivi des retours (dates demandées vs effectives)
- Statuts : `pending → approved → returned`
- Notes associées aux prêts

### Marketplace
- Vente entre étudiants (dépôt de liste + ajout d'articles)
- Informations article : nom, description, catégorie, état, prix, marque, images
- Recherche full-text (nom, description)
- Filtres : catégorie, fourchette de prix, état, marque
- Tri : prix (asc/desc), date (asc/desc)
- Informations vendeur (nom, email, classe)

### Messagerie Temps Réel
- Chat 1-to-1 via WebSocket
- Fonctionnalités :
  - Envoi / réception de messages
  - Édition et suppression (soft delete)
  - Réponse à un message (threads)
  - Réactions emoji
  - Indicateur de frappe
  - Accusé de lecture (last read)
- Messages **chiffrés en base de données** (AES avec IV)

### Notifications
- Notifications en temps réel pour :
  - Nouvelles demandes d'emprunt
  - Validation / rejet d'article
  - Activité marketplace
  - Nouveaux messages chat
- Marquage lu / tout marquer comme lu

### Dashboard Admin
- Statistiques globales du système
- File de modération des articles
- Gestion des utilisateurs (liste, blocage, validation)
- Suivi des retours d'emprunts

---

## Architecture

```
IntraLab/
├── app/                    # Frontend Vue 3 / Nuxt
│   ├── pages/              # Routes de l'application
│   ├── components/         # Composants réutilisables
│   ├── composables/        # Logique partagée (useAuth, useChat…)
│   ├── layouts/            # Templates de mise en page
│   └── assets/             # CSS global, ressources statiques
│
├── server/                 # Backend Nitro (Nuxt)
│   ├── api/                # Endpoints REST (46 routes)
│   ├── middleware/         # Auth middleware (JWT + rôles)
│   └── utils/              # auth, prisma, crypto, notifications…
│
├── prisma/                 # Schéma, migrations, seeds
├── nuxt.config.ts          # Configuration Nuxt
├── tailwind.config.ts      # Configuration Tailwind
└── package.json            # Dépendances
```

---

## API REST — Résumé des endpoints

| Domaine | Nombre de routes | Exemples |
|---|---|---|
| Auth | 3 | `POST /api/auth/login`, `/register`, `/logout` |
| Utilisateurs | 9 | CRUD + avatar, blocage, auto-suppression |
| Articles | 7 | CRUD + statut + modération |
| Inventaire | 4 | CRUD inventaire |
| Emprunts | 4 | CRUD + retour |
| Marketplace | 5 | Liste, création, détail, achat |
| Chat | 5 | Sessions, messages, WebSocket |
| Notifications | 3 | Liste, lu, tout marquer |
| Admin | 2 | Dashboard, utilisateurs en attente |
| Classes & Spés | 3 | Listes de référence |
| Dashboard | 1 | Données dashboard utilisateur |
| Health | 1 | `GET /api/health` |

---

## Sécurité

| Mesure | Détail |
|---|---|
| **Authentification** | JWT Bearer token (header ou cookie) |
| **Hashage** | bcryptjs — 12 rounds de sel |
| **Chiffrement chat** | AES avec clé + IV (variable d'env) |
| **Autorisation** | Middleware RBAC sur chaque route |
| **Validation** | Zod sur toutes les entrées API |
| **Isolation données** | Vérification ownership (user ne voit que ses données) |

---

## Structure académique gérée

- **Niveaux :** B1, B2, B3, M1, M2
- **Spécialisations :** Dev (Web & Mobile), Data (Data & IA), Cyber (Cybersécurité), Infra (Infrastructure & Cloud)
- **Rôles :** Student, Admin, RP (Responsable Pédagogique)

---

## Déploiement (Production)

| Élément | Valeur |
|---|---|
| **OS** | Linux (Debian) |
| **Node.js** | v20+ |
| **Process manager** | PM2 |
| **Reverse proxy** | Apache2 (port 80 → 3000) |
| **WebSocket** | Apache2 RewriteRule WS |
| **Variables d'env** | `.env.production` |
| **Migrations** | `npx prisma migrate deploy` |
| **Build** | `npm run build` |
| **Démarrage** | `pm2 start "npm run preview"` |
