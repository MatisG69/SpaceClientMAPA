# MAPA — Espace Client

Portail de suivi de projet destiné aux clients de MAPA Développement. Application web isolée (auth email + mot de passe) qui partage la même base Supabase que le CRM interne (`../MAPACRM`).

## Fonctionnalités

- **Connexion email + mot de passe** — les identifiants sont créés depuis le CRM (page « Identifiants »).
- **Timeline projet** — étapes à venir / en cours / terminées, avec pourcentage d'avancement global.
- **Messagerie bidirectionnelle** — le client pose ses questions, l'équipe MAPA répond. Realtime Supabase : nouvelles réponses visibles sans refresh.
- **Isolation stricte** — chaque client ne voit que SON projet (Row Level Security Supabase).
- **Une seule base, deux interfaces** — le CRM (anon, interne, ouvert) et l'espace client (auth, scopé par RLS) partagent les tables `projects`, `project_steps`, `portal_messages`, `portal_users`.

## Architecture

```
MAPA Developpement/
├── MAPACRM/              ← CRM interne (anon key, pas d'auth — admin)
│   ├── supabase/migrations/20260424120000_client_portal_v2.sql
│   ├── src/pages/IdentifiantsPage.tsx
│   ├── src/components/projects/ClientPortalSection.tsx
│   └── src/hooks/
│       ├── usePortalUsers.ts
│       ├── useProjectSteps.ts
│       └── usePortalMessages.ts
│
└── MAPA-Espace-Client/   ← Ce projet (auth Supabase — clients)
    ├── src/App.tsx
    ├── src/pages/LoginPage.tsx
    ├── src/pages/ProjectPage.tsx
    ├── src/components/{ProjectTimeline,MessageThread,StatusBadge}.tsx
    └── src/hooks/{useAuth,useProjectData}.ts
```

## Installation initiale (à faire une fois)

### 1. Appliquer la migration Supabase

Depuis le dashboard Supabase → SQL Editor, coller le contenu de :

```
MAPACRM/supabase/migrations/20260424120000_client_portal_v2.sql
```

Cette migration crée les tables `portal_users`, `project_steps`, `portal_messages` et configure la RLS (anon full-access pour le CRM + authenticated scopé par projet pour le client).

### 2. Désactiver la confirmation d'email dans Supabase

**IMPORTANT** — sans ça, les clients créés depuis le CRM ne pourront pas se connecter immédiatement.

Dashboard Supabase → **Authentication** → **Providers** → **Email** → décocher **« Confirm email »** → Save.

### 3. Installer les dépendances

```bash
cd "MAPA-Espace-Client"
npm install
```

Le fichier `.env` est déjà créé (copié depuis `MAPACRM/.env`). Vérifier qu'il contient :

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Démarrage

```bash
# Espace client (port 5180)
cd "MAPA-Espace-Client"
npm run dev

# CRM interne (port 5173)
cd "../MAPACRM"
npm run dev
```

- CRM → http://localhost:5173
- Espace client → http://localhost:5180

## Workflow côté équipe MAPA

### Créer un identifiant client

1. Ouvrir le CRM → sidebar **Espace client** → **Identifiants**
2. Cliquer **Nouvel identifiant**
3. Renseigner email + nom + projet à rattacher. Le mot de passe est auto-généré (bouton « Régénérer » pour en produire un autre).
4. Cliquer **Créer le compte** → l'écran affiche les identifiants.
5. Utiliser **Copier les identifiants** puis coller dans un email au client (ou SMS).

### Gérer les étapes d'un projet

1. Ouvrir un projet depuis la page **Projets** du CRM
2. Faire défiler jusqu'à la section **Espace client**
3. **Nouvelle étape** pour ajouter une étape (titre + description facultative)
4. Cliquer l'icône de statut pour cycler : `À venir` → `En cours` → `Terminée` → `À venir`
5. Flèches haut/bas pour réordonner, crayon pour éditer, poubelle pour supprimer
6. Les horodatages (démarrage, fin) sont posés automatiquement au changement de statut

### Répondre aux questions du client

Dans la même section **Espace client** du projet, le fil de messagerie se trouve sous la timeline. Badge **x nouveau(x)** en en-tête si le client a écrit depuis la dernière ouverture. ⌘+Entrée pour envoyer.

## Workflow côté client

1. Reçoit l'email avec ses identifiants
2. Se rend sur l'URL de l'espace client
3. Se connecte → arrive sur son projet unique
4. Consulte l'avancement + écrit ses questions
5. Reçoit les réponses en temps réel

## Sécurité

- Les politiques RLS Supabase empêchent tout client authentifié d'accéder à un autre projet que le sien — testé via `auth.uid() IN (SELECT project_id FROM portal_users WHERE auth_user_id = auth.uid())`.
- Les clés anon exposées (CRM et portail) ne donnent pas accès à `auth.users` directement.
- Le mot de passe client est généré par `crypto.getRandomValues` (14 caractères, alphabet 60+ symboles).
- Suppression d'identifiant : retire la ligne `portal_users` (le client ne peut plus accéder). L'utilisateur `auth.users` reste en base — le supprimer manuellement depuis Supabase Dashboard → Authentication → Users si besoin (nécessite la service_role key, impossible depuis le CRM).

## Déploiement

### Espace client

- **Vercel** : `vercel` depuis `MAPA-Espace-Client/`, mettre les env vars dans le dashboard Vercel. Aucune configuration particulière, Vite est supporté nativement.
- **Recommandé** : sous-domaine dédié (`espace.mapa-developpement.fr` ou `suivi.mapa-developpement.fr`).

### CRM

Inchangé — toujours utilisable sur localhost sans auth. Si déployé publiquement, prévoir une protection au niveau hébergeur (Vercel Protection, Basic Auth Cloudflare, etc.) puisque l'anon key donne un accès complet aux données.

## Notes techniques

- **Realtime** : `useProjectData` souscrit aux INSERT/UPDATE sur `portal_messages` et `project_steps` du projet du client connecté → synchro instantanée quand l'équipe envoie un message ou modifie une étape.
- **Création de compte** : `usePortalUsers.createUser` utilise un client Supabase éphémère (pas de persistSession) pour ne pas polluer l'état de la session CRM pendant le signup.
- **Design system** : couleurs et polices calquées sur le CRM (`ws-accent` bronze, Plus Jakarta Sans, Cormorant Garamond pour les titres éditoriaux).
