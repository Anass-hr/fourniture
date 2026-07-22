# 📦 OfficeStock — Gestion de l'inventaire des fournitures de bureau

Application web locale pour suivre les **fournitures de bureau** : ce que vous
**achetez** (entrées de stock) et ce que vous **distribuez** (sorties : à qui, quand).
Le stock de chaque article est toujours **calculé automatiquement** (achats − sorties).

## Fonctionnalités

- **Tableau de bord** — stock en un coup d'œil + alertes de stock bas
- **Nouvelle sortie** — l'action quotidienne : article → quantité → personne
- **Nouvel achat** — enregistrer une entrée de stock (prix unitaire facultatif)
- **Catalogue** — gérer les articles, catégories, seuils d'alerte (admin)
- **Personnes** — les employés à qui vous attribuez des fournitures
- **Historique** — journal filtrable de tous les mouvements
- **Rapports** — réapprovisionnement · consommation par personne/département · dépenses
- **Utilisateurs** — comptes admin / personnel (admin)

## Stack

- **Frontend** : React + Vite (port 5173)
- **Backend** : Node.js + Express (port 4000)
- **Base de données** : SQLite (fichier local `backend/prisma/dev.db`) via Prisma
- **Auth** : JWT + bcrypt · Interface **en français**

## Installation

Depuis le dossier `D:\FORNITURE` :

```bash
# 1. Installer toutes les dépendances (racine + backend + frontend)
npm run install:all

# 2. Créer la base de données, appliquer le schéma et insérer les données de démo
npm run setup

# 3. Démarrer l'API + le frontend en même temps
npm run dev
```

Ouvrez ensuite **http://localhost:5173**.

## Connexion par défaut

| Email                    | Mot de passe |
|--------------------------|--------------|
| `anas@strapexmaroc.com`  | `admin123`   |

> Modifiable dans `backend/.env` (avant le premier `npm run setup`).
> Pensez à changer le mot de passe et `JWT_SECRET` pour une utilisation réelle.

## Notes

- Aucune donnée n'est jamais supprimée : articles, personnes et utilisateurs
  sont **archivés/désactivés** afin de préserver l'historique.
- Le **prix unitaire** est facultatif à l'achat ; le renseigner active le
  rapport de dépenses.
- Pour repartir de zéro : supprimez `backend/prisma/dev.db` puis relancez `npm run setup`.

## Structure

```
FORNITURE/
├── backend/
│   ├── prisma/schema.prisma   # Modèle de données
│   └── src/
│       ├── server.js          # API Express
│       ├── seed.js            # Compte admin + données de démo
│       ├── lib/               # prisma, auth (JWT), calcul du stock
│       └── routes/            # auth, items, people, purchases, issues, reports, users
└── frontend/
    └── src/
        ├── pages/             # Écrans (Dashboard, Issue, Purchase, …)
        ├── components/        # Layout
        ├── api.js             # Client HTTP
        └── auth.jsx           # Contexte d'authentification
```
