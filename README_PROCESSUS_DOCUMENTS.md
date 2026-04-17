# README — Processus d’intégration Documents (Users Service ↔ Documentation Service)

Ce guide explique **toutes les étapes** pour faire fonctionner le processus de documents d’organisation en local, avec RabbitMQ, et vérifier que les références sont bien sauvegardées dans `users-service`.

---

## 1) Objectif fonctionnel

Quand un document est uploadé côté `documentation-service`, ce service publie un événement RabbitMQ.

`users-service` doit alors :

1. Consommer l’événement
2. Vérifier que l’organisation existe
3. Sauvegarder la/les référence(s) document(s)
4. Publier un ACK de résultat

---

## 2) Pattern implémenté actuellement

### Responsabilités

- **documentation-service**
  - Gère upload + stockage fichier
  - Publie :
    - `documentation.organisation.documents.uploaded`
    - `documentation.organisation.documents.failed`

- **users-service**
  - Consomme ces événements
  - Sauvegarde les références dans la table `organisation_document_references`
  - Publie ACK :
    - `user.organisation.documents.upload.response`
    - `user.organisation.documents.uploaded`
    - `user.organisation.documents.upload.failed`

---

## 3) Prérequis local

- PostgreSQL démarré
- RabbitMQ démarré
- `users-service` configuré avec `.env`

Exemple minimum `.env`:

```env
PORT=3002
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_EXCHANGE=al-mizan.events
DATABASE_URL=postgresql://postgres:password@localhost:5432/al_mizan_users?schema=public
```

---

## 4) Démarrer users-service

```bash
npm run start:dev
```

Si le port est déjà occupé :

```bash
lsof -i :3002
fuser -k 3002/tcp
```

> ⚠️ Attention à la faute de frappe : c’est `lsof` (pas `iosf`).

---

## 5) Créer une organisation (étape obligatoire)

L’`organisation_id` utilisé dans l’événement documentation **doit exister** dans users-service.

```bash
curl -s -X POST http://localhost:3002/api/v1/organisations \
  -H 'Content-Type: application/json' \
  -d '{"denomination":"Organisation Test Locale","type":"ENTREPRISE_PRIVEE"}'
```

Récupérer `id` de la réponse JSON.

---

## 6) Événement à publier depuis documentation-service

### Routing key (success)

`documentation.organisation.documents.uploaded`

### Payload attendu

```json
{
  "event_id": "uuid",
  "correlation_id": "uuid",
  "organisation_id": "ID_REEL_DE_L_ORGANISATION",
  "user_id": "uuid-optionnel",
  "status": "success",
  "uploaded_documents": [
    {
      "type": "NIF",
      "document_id": "doc-id-unique",
      "storage_key": "ORGANISATION/<org-id>/file.pdf",
      "file_name": "file.pdf",
      "url": "https://...",
      "status": "uploaded"
    }
  ],
  "failed_documents": [],
  "processed_at": "2026-04-17T15:00:16.239Z"
}
```

### Types autorisés

- `NIF`
- `NIS`
- `DENOMINATION`

---

## 7) Ce que users-service fait à réception

1. Consomme `documentation.organisation.documents.uploaded`
2. Vérifie `organisation_id`
3. Upsert référence(s) documents en base
4. Publie ACK `user.organisation.documents.upload.response`
5. Publie aussi `user.organisation.documents.uploaded`

---

## 8) Vérifier que les références sont sauvegardées

Exemple de vérification via Node + Prisma:

```bash
node -e 'const {PrismaClient}=require("@prisma/client");(async()=>{const p=new PrismaClient();const rows=await p.organisationDocumentReference.findMany({where:{organisationId:"<ORG_ID>"},orderBy:{type:"asc"}});console.log(JSON.stringify(rows,null,2));await p.$disconnect();})();'
```

Tu dois voir les lignes avec :

- `type` (`NIF/NIS/DENOMINATION`)
- `documentId`
- `storageKey`
- `fileName`
- `status`

---

## 9) Erreur fréquente et solution

### Erreur

`Organisation <id> not found`

### Cause

`documentation-service` publie un `organisation_id` inexistant (souvent UUID d’exemple Swagger)

### Solution

Toujours utiliser l’ID réel retourné par :

`POST /api/v1/organisations`

---

## 10) Routing keys — Récapitulatif

### Publiées par documentation-service

- `documentation.organisation.documents.uploaded`
- `documentation.organisation.documents.failed`

### Consommées par documentation-service (pour voir le retour users)

- `user.organisation.documents.upload.response`
- (optionnel) `user.organisation.documents.uploaded`
- (optionnel) `user.organisation.documents.upload.failed`

---

## 11) Critères de réussite (checklist)

- [ ] users-service démarre sans erreur
- [ ] RabbitMQ connecté + subscriptions OK
- [ ] organisation créée et `id` réel récupéré
- [ ] event `documentation...uploaded` publié avec bon `organisation_id`
- [ ] logs users montrent `references_processed > 0`
- [ ] ACK `user.organisation.documents.upload.response` publié
- [ ] références présentes en base

---

## 12) Notes techniques

- `Exit code 130` après `npm run start:dev` est normal si tu as fait `Ctrl+C`.
- Pour test local stable, lancer une seule instance de users-service.
- En cas de conflit port 3002, tuer le process avant relance.

---

## 13) Commandes utiles rapides

```bash
# Voir process sur 3002
lsof -i :3002

# Kill process sur 3002
fuser -k 3002/tcp

# Démarrer users-service
npm run start:dev
```
