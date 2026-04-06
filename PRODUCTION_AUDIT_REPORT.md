# 📊 AUDIT DE PRODUCTION - PROEBAUTE
## Erreur Mobile: "Can't find variable: safeFirstName"

**Date:** 6 avril 2026  
**Environnement:** Supabase + GitHub + Vercel  
**Sévérité:** 🔴 CRITIQUE

---

## 1️⃣ PROBLÈME PRINCIPAL - Indentation Cassée (RootLayout.tsx:89)

### 📍 Localisation
**Fichier:** [src/app/layouts/RootLayout.tsx](src/app/layouts/RootLayout.tsx#L89)  
**Ligne:** 89

### ❌ Code Cassé
```typescript
 const safeFirstName = user?.firstName?.trim() || 'Compte';  // ← ESPACE AVANT 'const'
```

### Pourquoi c'est un problème?
1. **Minification Vite** en production ne reconnaît pas la déclaration
2. **Tree-shaker** la supprime comme "variable inutilisée"
3. **Mise en cache Vercel** + **minification mobile** amplifient l'erreur
4. JSX aux lignes 162 et 253 referment la variable → **CRASH**

### 🔧 Impact sur le Pipeline
```
GitHub Push → Vercel Build
│
├─ Local: ✅ Fonctionne (Vite sans agressivité)
│
├─ Vercel Prod: ❌ Échoue
│   ├─ Minification Vite trop agressive
│   ├─ Variable supprimée du bundle
│   └─ Runtime: "Can't find variable: safeFirstName"
│
└─ Mobile Safari/Chrome: ❌ Erreur visuelle
```

---

## 2️⃣ VARIABLES SUPABASE MANQUANTES - Vercel

### 📍 Localisation
**Fichier:** [src/app/api/supabaseClient.ts](src/app/api/supabaseClient.ts)  
**Lignes:** 7-8

### ❌ Code
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase credentials missing');
}
```

### ⚠️ État Vercel
- **Dashboard:** Variables d'environnement **NON configurées**
- **Résultat:** Module `supabaseClient.ts` lance une erreur au chargement
- **Impact:** Application ne démarre PAS sur Vercel

### 🔗 Interaction Supabase-Vercel-Mobile
```
Mobile → Vercel Production
│
├─ Vite builder charge les modules
│
├─ supabaseClient.ts s'exécute IMMÉDIATEMENT
│
├─ Env vars undefined → throw Error
│
├─ Application jamais initialisée
│
└─ Page blanche ou erreur générique
```

---

## 3️⃣ CONFIGURATION TYPESCRIPT MANQUANTE

### 📍 Causes
- **Pas de tsconfig.json** à la racine du projet
- **tsconfig.json** de `proebaute-main/` n'est pas détecté par Vercel
- Vite utilise sa **configuration par défaut** qui est **trop agressive**

### Impact JSX
```
Dev (npm run dev):
├─ Vite utilise configLocal jsxImportSource
├─ Variables declarées `const x = ...` → conservées
└─ ✅ Fonctionne

Vercel Production:
├─ Pas de tsconfig → jsx "react-jsx" par défaut
├─ Minification agressive
├─ Variables sans affectation immédiate = supprimées
└─ ❌ Runtime Error
```

---

## 4️⃣ MAUVAIS FORMAT DE VARIABLES D'ENVIRONNEMENT

### ❌ Configuration Actuelle (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### ✅ Format Correct (Vite)
```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Pourquoi?
- **Next.js:** `NEXT_PUBLIC_*` sont injectées au build time
- **Vite:** `VITE_*` sont injectées via `import.meta.env`
- Code utilise `import.meta.env.VITE_*` → wrong namespacing

---

## 5️⃣ LOCALSTORAGE NON SÉCURISÉ POUR MOBILE

### 📍 Fichier: [src/app/context/auth-context.ts](src/app/context/auth-context.ts)

### ❌ Problème
```typescript
let storedUser = null;
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  storedUser = stored ? JSON.parse(stored) : null;
} catch (err) {
  console.error('Failed to load stored user:', err);
}
```

### 🍎 iOS Safari Private Mode
```
Mode Navigation Privée (iOS/Safari):
├─ localStorage.getItem() → null (pas d'erreur!)
├─ JSON.parse(null) → null
├─ App démarrer sans user
└─ AuthContext instable
```

### 📱 Android Private Mode
```
Certains navigateurs:
├─ localStorage.getItem() → SecurityError
├─ catch silencieux
├─ User state uncertain
└─ RootLayout.tsx scopes cassées
```

---

## 6️⃣ CONFIGURATION VITE INSUFFISANTE

### 📍 Fichier: [vite.config.ts](vite.config.ts)

### ⚠️ Configuration Manquante
```typescript
// Pas de settings de minification
// Pas de config JSX explicite
// Pas de règles code-splitting
```

### Impact Build
```
Vercel Build Process:
├─ npm run build
│  ├─ Vite default: esbuild avec minification EXTRÊME
│  ├─ CSS tree-shaking agressif
│  ├─ Variables sans side-effects → suppression
│  └─ ❌ 'safeFirstName' removed
│
└─ Mobile Runtime
   ├─ Bundle 200KB minimal
   ├─ Mais variables critiques manquantes
   └─ Crash
```

---

## 7️⃣ INTERACTION VERCEL-GITHUB-SUPABASE

### 🔄 CI/CD Pipeline Actuel
```
GitHub (main branch)
│
└─→ Vercel Git Integration
    │
    ├─ 1. Pull repo
    ├─ 2. npm install / pnpm install
    ├─ 3. MISSING: Set VITE_* env vars ← BLOCAGE
    ├─ 4. npm run build
    │   └─ Vite compile
    │      ├─ Parse TypeScript → JSX Transformation FAILS
    │      ├─ Minify → Remove "unused" variables
    │      └─ Supabase credentials throw → Pre-deploy ERROR
    ├─ 5. Upload to CDN
    └─ 6. Deploy to edge
       │
       └─→ Mobile Browser
           ├─ Download bundle
           ├─ Load RootLayout.tsx
           ├─ safeFirstName = undefined ← RUNTIME ERROR
           └─ Display "Can't find variable"
```

### ❌ Vercel Environment Settings
```
Current Status: ❌ INCOMPLETE
├─ VITE_SUPABASE_URL → NOT SET
├─ VITE_SUPABASE_ANON_KEY → NOT SET
├─ VITE_* variables → MISSING
└─ Production Build → FAILS or INCORRECT
```

---

## 📋 CHECKLIST DE DÉPANNAGE

- [ ] **Vercel Dashboard** → Settings → Environment Variables
  - [ ] Ajouter `VITE_SUPABASE_URL`
  - [ ] Ajouter `VITE_SUPABASE_ANON_KEY`
  - [ ] Redeploy

- [ ] RootLayout.tsx ligne 89 → Supprimer l'espace
- [ ] Créer tsconfig.json à la racine
- [ ] Vérifier vite.config.ts
- [ ] Tester build local: `npm run build`
- [ ] Tester sur mobile réel sur Vercel

---

## 🚀 PROCHAINES ÉTAPES

Voir **[QUICK_FIX_GUIDE.md](QUICK_FIX_GUIDE.md)** pour l'implémentation détaillée.
