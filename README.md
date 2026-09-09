# 💻 Netaa École - Portail Web Administration 🇲🇱

Application web d'administration conçue avec **Next.js 16** (App Router) pour la gestion centrale des établissements scolaires.

---

## 🛠️ Stack Technique

- **Framework Web** : Next.js 16 (App Router) + React 19
- **Style & UI** : CSS vanilla / UI glassmorphic — _refonte prévue en Phase 3 (Tailwind + shadcn/ui)_
- **Langage** : TypeScript
- **Client HTTP** : Axios avec gestion des tokens JWT

---

## 🌟 Fonctionnalités Principales

- **Tableau de Bord Exécutif** : Métriques en temps réel (Total Élèves, Enseignants, Classes actives).
- **Gestion des Élèves & Inscriptions** : Inscription, affectation de classe, suivi des tuteurs parents.
- **Gestion des Enseignants** : Attribution des matières et suivi des emplois du temps.
- **Gestion des Classes & Matières** : Création des classes (Terminale, 11ème, 10ème...) et affectation des coefficients.
- **Suivi Financier & Reçus** : Historique des paiements de scolarité, solde restant par élève.
- **Génération des Bulletins PDF** : Calcul automatique des moyennes générales et rangs de classe.

---

## 🚀 Lancement Rapide en Local

1. Installez les dépendances :
   ```bash
   npm install
   ```

2. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```

3. Ouvrez l'application sur [http://localhost:3000](http://localhost:3000).

---

## ⚙️ Variables d'Environnement

Copiez `.env.example` vers `.env.local` :
```bash
cp .env.example .env.local
```
```env
NEXT_PUBLIC_API_URL=http://localhost:8089/api
```

> ⚠️ En production (Vercel), `NEXT_PUBLIC_API_URL` **doit** être défini dans
> _Settings → Environment Variables_. À défaut, l'application ciblera `localhost`.
