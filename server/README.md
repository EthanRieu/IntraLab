# API Backend IntraLab

Cette API backend pour IntraLab est construite avec Nuxt 4 et Prisma, offrant un système complet de gestion pour une école.

## 🚀 Fonctionnalités

### Authentification et Utilisateurs

- **Connexion/Déconnexion** avec JWT
- **Gestion des utilisateurs** (CRUD) avec rôles et permissions
- **Validation des comptes** par les administrateurs
- **Système de rôles** : Étudiant, RP (Responsable Pédagogique), Admin

### Articles et Publications

- **Publication d'articles** par les étudiants
- **Modération** par les RP/Admin
- **Système de statuts** : brouillon, en attente, publié, rejeté
- **Catégorisation** et recherche

### Inventaire et Emprunts

- **Gestion de l'inventaire** avec quantités et localisations
- **Système d'emprunts** complet (demande, approbation, retour)
- **Suivi des retards** et notifications automatiques
- **Statistiques d'utilisation**

### Marketplace (Store)

- **Vente entre étudiants** avec système d'annonces
- **Gestion des catégories** et filtres de recherche
- **Système de transaction** simple

### Notifications

- **Notifications temps réel** pour tous les événements
- **Types personnalisés** selon les actions
- **Marquage lu/non lu**

### Administration

- **Tableau de bord** avec statistiques complètes
- **Gestion des utilisateurs en attente**
- **Vue d'ensemble système**

## 📁 Structure des Endpoints

```
/server/api/
├── auth/
│   ├── login.post.ts          # Connexion utilisateur
│   └── logout.post.ts         # Déconnexion
├── users/
│   ├── index.get.ts           # Liste des utilisateurs
│   ├── index.post.ts          # Création d'utilisateur
│   ├── [id].get.ts            # Détails utilisateur
│   ├── [id].put.ts            # Modification utilisateur
│   └── [id].delete.ts         # Suppression utilisateur
├── classes/
│   ├── index.get.ts           # Liste des classes
│   └── [id]/specializations.get.ts # Spécialisations par classe
├── specializations/
│   └── index.get.ts           # Liste des spécialisations
├── articles/
│   ├── index.get.ts           # Articles publiés
│   ├── index.post.ts          # Création d'article
│   ├── [id].get.ts            # Détail article
│   ├── [id].put.ts            # Modification article
│   ├── [id]/status.put.ts     # Validation/Rejet article
│   └── pending.get.ts         # Articles en attente
├── inventory/
│   ├── index.get.ts           # Liste inventaire
│   ├── index.post.ts          # Ajout item
│   ├── [id].get.ts            # Détail item
│   └── [id].put.ts            # Modification item
├── loans/
│   ├── index.get.ts           # Liste emprunts
│   ├── index.post.ts          # Demande d'emprunt
│   ├── [id].put.ts            # Gestion emprunt
│   └── [id]/return.post.ts    # Traitement retour
├── store/
│   ├── index.get.ts           # Annonces actives
│   ├── index.post.ts          # Création annonce
│   ├── [id].get.ts            # Détail annonce
│   ├── [id].put.ts            # Modification annonce
│   ├── [id]/purchase.post.ts  # Achat
│   └── user/[userId].get.ts   # Annonces utilisateur
├── notifications/
│   ├── index.get.ts           # Notifications utilisateur
│   ├── [id]/read.put.ts       # Marquer comme lu
│   └── mark-all-read.put.ts   # Tout marquer lu
└── admin/
    ├── dashboard.get.ts       # Statistiques admin
    └── users/pending.get.ts   # Utilisateurs en attente
```

## 🔐 Sécurité et Permissions

### Système de Rôles

- **Student** : Accès limité à ses propres données
- **RP** : Gestion des étudiants et validation des contenus
- **Admin** : Accès complet au système

### Middleware d'Authentification

- `requireAuth()` : Authentification obligatoire
- `requireRP()` : Rôle RP ou Admin requis
- `requireAdmin()` : Rôle Admin uniquement
- `requireOwnershipOrAdmin()` : Propriétaire des données ou Admin
- `optionalAuth()` : Authentification optionnelle

### Validation des Données

- Validation avec **Zod** sur tous les endpoints
- Sanitisation des entrées utilisateur
- Vérification des UUID et formats

## 🛠️ Technologies Utilisées

- **Nuxt 4** : Framework full-stack
- **Prisma** : ORM pour la base de données
- **PostgreSQL** : Base de données
- **JWT** : Authentification
- **Zod** : Validation des schémas
- **bcryptjs** : Hachage des mots de passe

## 📊 Base de Données

Le schéma Prisma définit les modèles suivants :

- `users` : Utilisateurs avec rôles, classes et spécialisations
- `articles` : Articles avec système de validation
- `inventory` : Items d'inventaire avec quantités
- `loan` : Emprunts avec relations utilisateur-item
- `store` : Marketplace avec items à vendre
- `notifications` : Système de notifications
- `classes` & `spec` : Structure académique
- `roles` : Système de permissions

## 🚦 Codes de Réponse

- **200** : Succès
- **201** : Créé avec succès
- **400** : Données invalides
- **401** : Non authentifié
- **403** : Permissions insuffisantes
- **404** : Ressource non trouvée
- **409** : Conflit (ex: email déjà utilisé)
- **500** : Erreur serveur

## 🔄 Format de Réponse Standard

```json
{
  "success": true,
  "message": "Message descriptif",
  "data": {
    // Données de la réponse
  }
}
```

## 📝 Notes de Développement

### Pagination

Tous les endpoints de liste supportent la pagination avec :

- `page` : Numéro de page (défaut: 1)
- `limit` : Nombre d'éléments par page (défaut: 20)

### Recherche et Filtres

La plupart des endpoints supportent :

- `search` : Recherche textuelle
- `category` : Filtrage par catégorie
- Filtres spécifiques selon le contexte

### Notifications Automatiques

Le système envoie automatiquement des notifications pour :

- Nouvelles demandes d'emprunt
- Validation/Rejet d'articles
- Retards d'emprunts
- Achats sur le marketplace

## 🔧 Installation et Configuration

1. Installer les dépendances :

```bash
npm install
```

2. Configurer la base de données dans `.env` :

```
DATABASE_URL="postgresql://user:password@localhost:5432/intralab"
JWT_SECRET="your-secret-key"
```

3. Générer et appliquer les migrations Prisma :

```bash
npx prisma generate
npx prisma db push
```

4. Lancer le serveur de développement :

```bash
npm run dev
```

## 📈 Monitoring et Logs

- Logs détaillés pour toutes les opérations
- Gestion des erreurs avec stack traces
- Statistiques d'utilisation dans le dashboard admin

---

_Développé pour le projet IntraLab - ESGI B3_
