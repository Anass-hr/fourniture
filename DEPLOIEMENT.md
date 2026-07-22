# 🚀 Déploiement OfficeStock — Vercel + Supabase

Objectif : mettre l'application en ligne avec une base de données **partagée**,
accessible partout (vous, Hassan, etc.), sans que votre PC soit allumé.

- **Supabase** = la base de données PostgreSQL (vos données, en ligne).
- **Vercel** = l'hébergement de l'application (site web + API).

> ✅ Votre application locale continue de fonctionner normalement pendant toute
> la préparation. On ne bascule qu'à la fin, une fois tout vérifié.
> Votre sauvegarde est déjà faite : `backend/backup-*.json`.

---

## Étape 1 — Créer la base de données Supabase  *(vous, ~5 min)*

1. Aller sur **https://supabase.com** → **Start your project** → créer un compte
   (le plus simple : « Continue with GitHub »).
2. **New project** :
   - Name : `officestock`
   - Database Password : choisir un **mot de passe fort** et **le noter** (important).
   - Region : **West EU (Paris)** ou **Central EU (Frankfurt)**.
3. Attendre ~2 minutes que le projet se crée.
4. En haut, cliquer sur **Connect** (ou Project Settings → Database) et récupérer
   **deux** chaînes de connexion :
   - **Connection pooling** (mode *Transaction*, port **6543**) → ce sera `DATABASE_URL`
   - **Direct connection** (port **5432**) → ce sera `DIRECT_URL`

5. Ouvrir le fichier `backend/.env` et y coller ces deux lignes (remplacer par vos
   valeurs). **Ajouter `?pgbouncer=true` à la fin de la ligne pooler** :

   ```
   DATABASE_URL="postgresql://...:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://...:5432/postgres"
   ```

   👉 Puis me dire **« c'est fait »**. Je m'occupe de l'étape 2.

---

## Étape 2 — Créer les tables + importer vos données  *(moi, avec vous)*

Je bascule le schéma en PostgreSQL et je lance :

```bash
cd backend
npx prisma migrate deploy      # crée les tables sur Supabase
npm run import                 # réinjecte votre sauvegarde (23 articles, etc.)
```

On vérifie ensemble que la connexion et les données fonctionnent sur Supabase.

---

## Étape 3 — Mettre le code sur GitHub  *(vous + moi)*

Vercel déploie à partir d'un dépôt GitHub.

1. Créer un compte **https://github.com** (si pas déjà fait).
2. Créer un dépôt **privé** vide nommé `officestock`.
3. Je prépare le dépôt local (git init + commit) et je vous donne les 2 commandes
   pour l'envoyer sur GitHub.

---

## Étape 4 — Déployer sur Vercel  *(vous, guidé)*

1. Aller sur **https://vercel.com** → se connecter **avec GitHub**.
2. **Add New → Project** → importer le dépôt `officestock`.
3. Dans **Environment Variables**, ajouter :
   - `DATABASE_URL`  (la même que Supabase, pooler)
   - `DIRECT_URL`    (Supabase, direct)
   - `JWT_SECRET`    (une longue chaîne aléatoire)
4. **Deploy**. Au bout de ~2 min, Vercel donne une adresse du type
   `https://officestock.vercel.app`.

---

## Étape 5 — Utilisation

- Vous et Hassan ouvrez l'adresse Vercel dans n'importe quel navigateur, partout.
- Connexion identique : `anas@strapexmaroc.com` / `hassan@strapexmaroc.com`.
- La version locale (`OfficeStock.bat`) n'est plus nécessaire — le cloud devient
  la référence unique. (On peut la garder en secours, pointée sur Supabase.)

---

### Récapitulatif de la répartition

| Qui | Fait quoi |
|-----|-----------|
| **Vous** | Créer les comptes Supabase, GitHub, Vercel ; coller les valeurs ; cliquer Deploy |
| **Moi**  | Tout le code, la migration des données, les commandes, le guidage pas à pas |

**Prochaine action → Étape 1 : créer le projet Supabase et coller les 2 lignes dans `backend/.env`.**
