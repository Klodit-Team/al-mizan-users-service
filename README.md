# al-mizan-users-service

> **Service de Gestion des Utilisateurs** — Profils, organisations, rôles, services contractants et opérateurs économiques pour la plateforme Al-Mizan.

---

## Table des matières

1. [Aperçu](#aperçu)
2. [Technologies](#technologies)
3. [Architecture & Réseau](#architecture--réseau)
4. [Base de données](#base-de-données)
5. [Variables d'environnement](#variables-denvironnement)
6. [API REST](#api-rest)
7. [Messagerie RabbitMQ](#messagerie-rabbitmq)
8. [Commandes utiles](#commandes-utiles)
9. [Docker](#docker)

---

## Aperçu

`al-mizan-users-service` est le service de gestion des identités métier. Il ne gère **pas** l'authentification (déléguée à `auth-service`), mais prend en charge :

- La création des **profils utilisateurs** (nom, prénom, téléphone, langue).
- La création et gestion des **organisations** (EPA, EPIC, Ministère, Entreprise...).
- La gestion des **Services Contractants** (organismes publics) et **Opérateurs Économiques** (entreprises soumissionnaires).
- L'assignation des **rôles** (`SERVICE_CONTRACTANT`, `OPERATEUR_ECONOMIQUE`, `ADMIN`, `MEMBRE_COMMISSION`, `CONTROLEUR`).
- Le suivi des **références de documents d'organisation** uploadés par `documents-service`.

Il est déclenché exclusivement via **RabbitMQ** sur l'événement `user.registered` émis par `auth-service`.

Le service fonctionne en **NestJS** avec **Prisma ORM** sur **MySQL**, et expose une **API REST** complémentaire pour les interrogations directes.

---

## Technologies

| Technologie        | Version  | Rôle                                        |
|--------------------|----------|---------------------------------------------|
| Node.js            | 20 LTS   | Runtime                                     |
| TypeScript         | ^5.9     | Langage                                     |
| NestJS             | ^11.1    | Framework (modules, DI, guards)             |
| Prisma ORM         | 6.16.2   | ORM + migrations MySQL                      |
| MySQL              | 8.x      | Base de données principale                  |
| amqplib            | ^0.10    | Client RabbitMQ bas niveau                  |
| class-validator    | ^0.15    | Validation des DTOs                         |
| class-transformer  | ^0.5     | Transformation des payloads                 |
| @nestjs/swagger    | ^11.2    | Documentation OpenAPI auto-générée          |
| swagger-ui-express | ^5.0     | UI Swagger intégrée                         |

---

## Architecture & Réseau

```
RabbitMQ ──[user.registered]──► users-service (:3002)
                                        │
                                        ├── MySQL  (mysql:3306 → al_mizan_users)
                                        └── RabbitMQ (rabbitmq:5672)

API Gateway (:3000) ──► users-service (:3002)   [REST direct]
```

- **Port exposé** : `3002`
- **Réseau Docker** : `al-mizan-network`
- **Nom du conteneur** : `users-service`
- **Swagger UI** : `http://localhost:3002/api/docs` (si `SWAGGER_ENABLED=true`)

---

## Base de données

**Moteur** : MySQL 8 · **Schema** : `al_mizan_users`

### Modèles Prisma

#### `Organisation`
| Champ             | Type              | Description                                    |
|-------------------|-------------------|------------------------------------------------|
| `id`              | String (UUID)     | PK                                             |
| `denomination`    | String            | Nom de l'organisation                          |
| `nif`, `nis`      | String?           | Identifiants fiscaux                           |
| `registreCommerce`| String?           | Numéro RC                                      |
| `adresse`, `wilaya`, `commune` | String? | Localisation                        |
| `type`            | OrganisationType  | EPA, EPIC, MINISTERE, ENTREPRISE_PRIVEE, ENTREPRISE_PUBLIQUE, GROUPEMENT |
| `isVerified`      | Boolean           | Vérifié par contrôleur                         |

#### `Profile`
| Champ      | Type     | Description              |
|------------|----------|--------------------------|
| `id`       | String   | PK                       |
| `userId`   | String   | UNIQUE, réf. auth-service|
| `nom`      | String   |                          |
| `prenom`   | String   |                          |
| `telephone`| String?  |                          |
| `langue`   | Language | `fr` (défaut) ou `ar`    |

#### `ServiceContractant`
| Champ           | Type    | Description                       |
|-----------------|---------|-----------------------------------|
| `id`            | String  | PK                                |
| `organisationId`| String  | FK → Organisation                 |
| `userId`        | String  | Réf. auth-service                 |
| `codeService`   | String  | Code unique du service            |
| `secteurActivite`| String?|                                   |
| `ordonateur`    | String? |                                   |

#### `OperateurEconomique`
| Champ            | Type    | Description                          |
|------------------|---------|--------------------------------------|
| `id`             | String  | PK                                   |
| `organisationId` | String  | FK → Organisation                    |
| `userId`         | String  | Réf. auth-service                    |
| `qualifications` | String? |                                      |
| `categories`     | String? |                                      |
| `isEligible`     | Boolean | Défaut `false`                       |
| `isBlacklisted`  | Boolean | Défaut `false` — blacklistage        |
| `raisonBlacklist`| String? | Motif de blacklistage                |

#### `Role` & `UserRole`
| Rôle                  | Description                              |
|-----------------------|------------------------------------------|
| `ADMIN`               | Administrateur plateforme                |
| `SERVICE_CONTRACTANT` | Organisme public acheteur                |
| `OPERATEUR_ECONOMIQUE`| Entreprise soumissionnaire               |
| `MEMBRE_COMMISSION`   | Membre de commission d'évaluation        |
| `CONTROLEUR`          | Contrôleur externe                       |

#### `OrganisationDocumentReference`
Stocke les références (IDs MinIO) des documents uploadés pour une organisation (NIF, NIS, DENOMINATION).

---

## Variables d'environnement

Copier `.env.example` → `.env` :

```env
PORT=3002
NODE_ENV=development

# Swagger
SWAGGER_ENABLED=true
SWAGGER_PATH=api/docs

# MySQL
DATABASE_URL="mysql://root@localhost:3306/al_mizan_users"

# RabbitMQ
RABBITMQ_URL="amqp://guest:guest@localhost:5672"
RABBITMQ_EXCHANGE="al-mizan.events"
```

> ⚠️ En production (Docker), remplacer `localhost` par les noms de conteneurs : `mysql`, `rabbitmq`.

> ⚠️ `NODE_ENV=development` est requis pour que les migrations Prisma s'exécutent automatiquement au démarrage.

---

## API REST

Base URL (via Gateway) : `http://localhost:3000/users`  
Base URL (directe) : `http://localhost:3002`  
Swagger : `http://localhost:3002/api/docs`

### Profils

| Méthode | Endpoint               | Auth | Description                     |
|---------|------------------------|------|---------------------------------|
| `GET`   | `/profiles/:userId`    | Oui  | Récupérer le profil d'un user   |
| `PATCH` | `/profiles/:userId`    | Oui  | Mettre à jour le profil         |

### Organisations

| Méthode | Endpoint                    | Auth | Description                          |
|---------|-----------------------------|------|--------------------------------------|
| `GET`   | `/organisations`            | Oui  | Lister toutes les organisations      |
| `GET`   | `/organisations/:id`        | Oui  | Détail d'une organisation            |
| `PATCH` | `/organisations/:id`        | Oui  | Mettre à jour une organisation       |

### Services Contractants

| Méthode | Endpoint                          | Auth | Description                            |
|---------|-----------------------------------|------|----------------------------------------|
| `GET`   | `/services-contractants`          | Oui  | Lister les services contractants       |
| `GET`   | `/services-contractants/:userId`  | Oui  | Récupérer par user ID                  |

### Opérateurs Économiques

| Méthode | Endpoint                              | Auth | Description                             |
|---------|---------------------------------------|------|-----------------------------------------|
| `GET`   | `/operateurs-economiques`             | Oui  | Lister les OEs                          |
| `GET`   | `/operateurs-economiques/:userId`     | Oui  | Récupérer par user ID                   |
| `PATCH` | `/operateurs-economiques/:id/blacklist`| Oui | Blacklister un OE                       |

### Rôles

| Méthode | Endpoint              | Auth | Description           |
|---------|-----------------------|------|-----------------------|
| `GET`   | `/roles`              | Oui  | Lister les rôles      |
| `POST`  | `/user-roles`         | Oui  | Assigner un rôle      |
| `GET`   | `/user-roles/:userId` | Oui  | Rôles d'un utilisateur|

---

## Messagerie RabbitMQ

**Exchange** : `al-mizan.events` (type: `topic`, durable: `true`)

### Événements consommés

| Routing Key (Queue)                                                   | Source           | Action réalisée                                                 |
|-----------------------------------------------------------------------|------------------|-----------------------------------------------------------------|
| `user.registered` (`users-service.user.registered`)                   | auth-service     | Créer organisation + profil + enregistrement rôle              |
| `documentation.organisation.documents.uploaded` (`users-service.documentation.organisation.documents.uploaded`) | documents-service | Mettre à jour les références de documents de l'organisation |
| `documentation.organisation.documents.failed` (`users-service.documentation.organisation.documents.failed`)   | documents-service | Mettre à jour avec statut d'échec                           |

### Événements publiés

| Routing Key                                    | Déclencheur                                 | Payload clés                                                   |
|------------------------------------------------|---------------------------------------------|----------------------------------------------------------------|
| `user.registered.response`                     | Traitement `user.registered` terminé (OK)   | `user_id`, `organisation_id`, `profile_id`, `status: success` |
| `user.registered.failed`                       | Traitement `user.registered` échoué         | `user_id`, `reason`, `status: failed`                         |
| `user.organisation.documents.upload.response`  | Documents reçus de documents-service        | `organisation_id`, `uploaded_documents`, `status`             |
| `user.organisation.documents.uploaded`         | Documents uploadés avec succès              | `organisation_id`, références complètes                        |
| `user.organisation.documents.upload.failed`    | Échec upload documents                      | `organisation_id`, `failed_documents`                          |

#### Flux complet d'inscription :

```
auth-service
  └─[user.registered]──► users-service
                              │
                              ├─ Crée Organisation
                              ├─ Crée Profile
                              ├─ Crée ServiceContractant ou OperateurEconomique
                              ├─ Assigne Role
                              │
                              ├─ OK  ──[user.registered.response {status:success}]──► auth-service
                              └─ KO  ──[user.registered.failed]──► auth-service
                                      [user.registered.response {status:failed}]──► auth-service
```

---

## Commandes utiles

### Développement local

```bash
# Installer les dépendances
npm install

# Démarrer en mode dev (hot-reload NestJS watch)
npm run start:dev

# Compiler TypeScript
npm run build

# Démarrer en production
npm run start:prod
```

### Base de données

```bash
# Appliquer le schéma Prisma à la base (sans migration versionnée)
npx prisma db push

# Générer le client Prisma
npm run prisma:generate

# Créer une migration versionnée
npm run prisma:migrate

# Lancer le seed (rôles par défaut)
npm run db:seed

# Ouvrir Prisma Studio
npm run prisma:studio
```

---

## Docker

### Build de l'image

```bash
docker build -t al-mizan-users-service .
```

### Notes importantes sur le Dockerfile

- Image de base : `node:20-alpine`
- Au démarrage du conteneur : `npx prisma db push && node dist/main.js`
- **Pas de `openssl` explicite** — utiliser `node:20-alpine` suffit ici (Prisma 6.x).

### Déploiement via docker-compose

```bash
# Depuis al-mizan-deployments/
docker-compose up -d users-service
docker-compose logs -f users-service
```

---

*Maintenu par l'équipe Al-Mizan — voir `al-mizan-deployments` pour la configuration de déploiement complète.*
