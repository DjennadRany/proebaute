# BeautyHub Premium Marketplace

Application SaaS type marketplace beauté : connexion entre professionnels (coiffeurs, esthéticiennes, etc.) et clients. Stack : **front React/Vite**, **backend PHP**, **MongoDB**.

## Architecture

```
├── src/                    # Frontend (React + Vite)
│   ├── app/
│   │   ├── api/            # Client API (appels backend)
│   │   ├── context/        # AuthContext (utilisateur courant)
│   │   ├── components/     # Composants réutilisables (ServiceCard, ProfessionalCard, etc.)
│   │   ├── layouts/        # RootLayout (sidebar + navigation)
│   │   ├── pages/          # Pages (Dashboard, Services, Réservations, etc.)
│   │   ├── data/           # Données mock (currentUser pour dev)
│   │   └── routes.tsx
│   └── main.tsx
├── backend/                # API PHP
│   ├── config/             # config.php (MongoDB, Stripe, règles annulation)
│   ├── public/             # index.php (point d’entrée, routage)
│   └── src/                # Contrôleurs (Auth, Booking, Service, etc.)
└── .env.example            # VITE_API_URL pour le front
```

- **Front** : toutes les pages du menu (Tableau de bord, Services, Professionnels, Messages, Réservations, Favoris, Avis, Profil, Paramètres) sont branchées sur l’API.
- **Back** : endpoints REST (auth, user, professionals, services, bookings, messages, social/favoris/avis, settings). Règles d’annulation 48h/24h et commission 10 % gérées côté back.
- **Data** : MongoDB (collections users, professional_profiles, services, bookings, messages, conversations, reviews, favorites, likes, etc.).

## Démarrage

### 1. Backend (API PHP)

- PHP avec extension **MongoDB** (`pecl install mongodb` ou équivalent).
- Depuis la racine du projet :
  ```bash
  cd backend/public
  php -S localhost:8000
  ```
- L’API est disponible sur `http://localhost:8000`.

### 2. Frontend

- Créer un fichier `.env` à la racine (voir `.env.example`) :
  ```
  VITE_API_URL=http://localhost:8000
  ```
- Puis :
  ```bash
  npm install
  npm run dev
  ```

### 3. MongoDB et données de test (seed)

- Démarrer MongoDB localement (ou utiliser une instance distante).
- Dans `backend/config/config.php`, adapter `MONGO_DSN` et `MONGO_DB_NAME` (ex. `beauty_marketplace` ou `beautyhub`).

Pour remplir la base avec des données de test (2 clients + 920 professionnels avec SIREN, téléphones, emails, services et images) :

```bash
cd backend
php scripts/seed/import_seed.php
```

Les CSV se trouvent dans `backend/scripts/seed/` (clients.csv fourni, professionals.csv déjà généré). Mot de passe commun des comptes de test : **TestPassword123!**. Voir `backend/scripts/seed/README-SEED.md` pour les détails.

## Principales routes API

| Méthode | Route | Description |
|--------|--------|-------------|
| POST | `/auth/register` | Inscription (client / pro) |
| POST | `/auth/login` | Connexion |
| GET | `/user/profile?userId=` | Profil utilisateur |
| GET | `/professionals` | Liste des professionnels |
| GET | `/professionals/:id` | Détail pro + services + avis |
| GET | `/services` | Liste des services (`?professionalId=`, `?category=`) |
| GET | `/services/:id` | Détail service + pro + avis |
| GET | `/bookings?clientId=` | Réservations du client |
| POST | `/bookings` | Créer une réservation |
| GET | `/bookings/:id` | Détail réservation |
| POST | `/bookings/:id?action=cancel` | Annuler (règles 48h/24h) |
| GET | `/favorites?userId=` | Liste des favoris |
| POST | `/social/favorite` | Toggle favori (service / pro) |
| GET | `/social/reviews?clientId=` | Avis donnés par le client |
| GET/PATCH | `/settings/privacy?userId=` | Paramètres confidentialité |
| GET/PATCH | `/settings/notifications?userId=` | Paramètres notifications |

## Mise en production

- **Front** : `npm run build` puis déployer le contenu de `dist/` (ou configurer un reverse proxy).
- **Back** : exposer `backend/public` via un serveur web (Apache/Nginx) avec PHP et l’extension MongoDB ; configurer les vrais `MONGO_DSN`, clés Stripe et CORS si le front est sur un autre domaine.
- **Env** : en prod, définir `VITE_API_URL` vers l’URL réelle de l’API au moment du build.
