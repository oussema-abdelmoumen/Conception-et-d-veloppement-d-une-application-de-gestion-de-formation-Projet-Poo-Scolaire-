# 🚀 Lancer le projet en LOCAL (Spring Boot + MySQL + React)

Guide complet pour faire tourner **Excellent Training** entièrement sur ta machine,
sans aucun service cloud.

---

## 📋 Prérequis

| Outil | Version | Lien |
|---|---|---|
| **Node.js** | 18+ | https://nodejs.org |
| **Java JDK** | 17 (LTS) | https://adoptium.net |
| **Maven** | 3.8+ | https://maven.apache.org/download.cgi |
| **XAMPP** (MySQL) | dernière | https://www.apachefriends.org |

Vérifie avec :
```bash
node -v       # v18+
java -version # 17.x
mvn -version  # 3.8+
```

---

## 🗄️ Étape 1 — MySQL via XAMPP

1. Ouvre **XAMPP Control Panel** → démarre **MySQL** (Apache facultatif).
2. La base `greenbuilding` sera créée **automatiquement** au premier lancement
   du backend (grâce à `createDatabaseIfNotExist=true` dans `application.yml`).
3. Si tu préfères la créer manuellement : ouvre <http://localhost/phpmyadmin>
   et importe `schema_mysql.sql`.

> Configuration par défaut : utilisateur `root`, **sans mot de passe**, port `3306`.
> Si ton MySQL a un mot de passe, modifie `backend/src/main/resources/application.yml` →
> `spring.datasource.password`.

---

## ☕ Étape 2 — Backend Spring Boot

1. Décompresse `backend-springboot.zip` à la racine du projet (tu obtiens un dossier `backend/`).
2. Dans un terminal :

```bash
cd backend
mvn spring-boot:run
```

3. Au premier démarrage, Hibernate crée toutes les tables, puis `data.sql` insère :
   - 3 comptes utilisateurs (mot de passe : `Admin123!`)
   - 4 domaines, 3 profils, 3 structures, 2 employeurs

L'API tourne sur **http://localhost:8081** (logs visibles dans le terminal).

### Comptes de test

| Email | Rôle |
|---|---|
| `admin@greenbuilding.com` | Administrateur |
| `responsable@greenbuilding.com` | Responsable |
| `utilisateur@greenbuilding.com` | Simple utilisateur |

Mot de passe pour tous : **`Admin123!`**

---

## 💻 Étape 3 — Frontend React

Dans un **autre terminal** (à la racine du projet) :

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Ouvre <http://localhost:8080> → tu devrais voir l'écran de connexion.

> ℹ️ Le frontend ne contacte **plus** Lovable Cloud. Toutes les requêtes vont
> vers `http://localhost:8081/api` (configurable via `VITE_API_URL`).

---

## 🏗️ Architecture

```
Frontend (React/Vite)        Backend (Spring Boot)        DB (MySQL)
http://localhost:8080  ───►  http://localhost:8081  ───►  localhost:3306
                              JWT Auth + REST API           greenbuilding
```

- **JWT** stocké dans `localStorage` (`et_jwt`).
- **CORS** activé pour `localhost:8080` (modifiable dans `application.yml`).
- Couche d'adaptation `src/lib/api/supabaseCompat.ts` qui simule l'API Supabase
  pour minimiser les changements dans les pages.

---

## 🛠️ Dépannage

| Problème | Solution |
|---|---|
| `Connection refused` côté frontend | Vérifie que Spring Boot tourne sur 8081 |
| `Access denied for user 'root'` | Vide ou corrige `spring.datasource.password` |
| `Table doesn't exist` | Supprime la base et relance Spring Boot (recréation auto) |
| Erreur CORS | Ajoute ton URL dans `app.cors.allowed-origins` |
| Token expiré | Reconnecte-toi (durée par défaut : 24h) |

---

## 📦 Build de production

**Backend** :
```bash
cd backend && mvn clean package
java -jar target/excellent-training-backend-1.0.0.jar
```

**Frontend** :
```bash
npm run build
# dossier dist/ servable par n'importe quel serveur statique (nginx, Apache…)
```
