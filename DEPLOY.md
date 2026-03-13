# Guide de déploiement — IntraLab

Serveur cible : VM Linux (Debian/Ubuntu) + Apache2 + PostgreSQL

---

## 1. Préparer la VM

```bash
sudo apt update && sudo apt upgrade -y

# Node.js v20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Git
sudo apt install -y git

# Apache2 (si pas déjà installé)
sudo apt install -y apache2
```

---

## 2. Créer la base de données PostgreSQL

```bash
sudo -u postgres psql
```

Dans le shell psql :

```sql
CREATE USER intralab_user WITH PASSWORD 'qVDeUYQai5yGiW5z';
CREATE DATABASE intralab_prod OWNER intralab_user;
GRANT ALL PRIVILEGES ON DATABASE intralab_prod TO intralab_user;
\q
```

---

## 3. Récupérer le code

```bash
cd /var/www
git clone https://github.com/EthanRieu/IntraLab.git IntraLab
cd IntraLab
npm install
```

---

## 4. Configurer le fichier `.env.production`

```bash
nano .env.production
```

Contenu à remplir :

```env
DATABASE_URL="postgresql://intralab_user:qVDeUYQai5yGiW5z@localhost:5432/intralab_prod?schema=public"
JWT_SECRET="générer_avec_commande_ci-dessous"
JWT_EXPIRES_IN="7d"
CHAT_ENCRYPTION_KEY="générer_avec_commande_ci-dessous"
```

Pour générer les clés aléatoires :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Lancer 2 fois : une fois pour JWT_SECRET, une fois pour CHAT_ENCRYPTION_KEY
```

---

## 5. Créer les tables (migration)

```bash
npx dotenv -e .env.production -- npx prisma db push
```

---

## 6. Injecter les données de base (seed)

```bash
psql postgresql://intralab_user:qVDeUYQai5yGiW5z@localhost:5432/intralab_prod -f prisma/seed.sql
```

Cela crée :
- Les rôles : `rp`, `admin`, `student`
- Les classes : B1 → M2
- Les spécialités : dev, data, cyber, infra
- L'utilisateur Thomas Pierson (`t.pierson@myskolae.fr` / `11111111`) avec le rôle RP

---

## 7. Build du projet

```bash
npm run build
```

---

## 8. Démarrer l'app avec PM2

```bash
npm install -g pm2
pm2 start "npm run preview" --name intralab
pm2 save
pm2 startup
# Exécuter la commande affichée par pm2 startup
```

L'app tourne sur le port **3000** en local.

---

## 9. Configurer Apache2 en reverse proxy

### Activer les modules nécessaires

```bash
sudo a2enmod proxy proxy_http proxy_wstunnel rewrite
sudo systemctl restart apache2
```

### Créer le VirtualHost

```bash
sudo nano /etc/apache2/sites-available/intralab.conf
```

```apache
<VirtualHost *:80>
    ServerName ton-domaine-ou-ip

    ProxyPreserveHost On
    ProxyPass        / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    # WebSocket (nécessaire pour le chat temps réel)
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*)           ws://localhost:3000/$1 [P,L]
</VirtualHost>
```

### Activer le site

```bash
sudo a2ensite intralab.conf
sudo a2dissite 000-default.conf   # désactiver le site par défaut si besoin
sudo systemctl reload apache2
```

---

## Résumé de l'ordre

```
1. apt install (node, postgresql, git, apache2)
2. Créer la DB et l'utilisateur PostgreSQL
3. git clone + npm install
4. Remplir .env.production
5. npx prisma db push
6. Exécuter seed.sql
7. npm run build
8. pm2 start
9. Configurer Apache2 reverse proxy
```

---

## Commandes utiles après déploiement

```bash
# Voir les logs de l'app
pm2 logs intralab

# Redémarrer l'app
pm2 restart intralab

# Mettre à jour le code
git pull
npm install
npm run build
pm2 restart intralab
```