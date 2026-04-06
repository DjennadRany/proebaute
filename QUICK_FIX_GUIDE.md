# 🔧 GUIDE DES FIXES RAPIDES
## Résoudre "Can't find variable: safeFirstName" - 20 minutes

---

## ⚡ PRIORITÉ 1 - CRITIQUE (2 minutes)

### Fix #1: Indentation RootLayout.tsx

**Fichier:** [src/app/layouts/RootLayout.tsx](src/app/layouts/RootLayout.tsx#L89)

**Avant (CASSÉ):**
```typescript
88   useEffect(() => {
89    const safeFirstName = user?.firstName?.trim() || 'Compte';  // ← ESPACE EN TROP!
90   const safeLastName = user?.lastName?.trim() || '';
```

**Après (CORRECT):**
```typescript
88   useEffect(() => {
89   const safeFirstName = user?.firstName?.trim() || 'Compte';
90   const safeLastName = user?.lastName?.trim() || '';
```

**Action:** Supprimer le **1 espace** avant `const` ligne 89

---

### Fix #2: Variables Supabase sur Vercel

**Actions:**
1. Ouvrir https://vercel.com/dashboard
2. Sélectionner projet `proebaute`
3. Settings → Environment Variables
4. Ajouter ces variables (copy les valeurs de `.env.local`):

```
Name: VITE_SUPABASE_URL
Value: [votre_supabase_url]
Vercel Environments: Production, Preview, Development

Name: VITE_SUPABASE_ANON_KEY
Value: [votre_anon_key]
Vercel Environments: Production, Preview, Development
```

**Après:** Click "Save" et **Vercel redéploiera automatiquement**

---

## ⚡ PRIORITÉ 2 - HIGH (10 minutes)

### Fix #3: Créer tsconfig.json

**Créer fichier:** [tsconfig.json](tsconfig.json) à la racine du projet

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "jsxImportSource": "react",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

### Fix #4: Créer tsconfig.node.json

**Créer fichier:** [tsconfig.node.json](tsconfig.node.json) à la racine du projet

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

---

### Fix #5: Mettre à jour vite.config.ts

**Fichier:** [vite.config.ts](vite.config.ts)

**Remplacer la config entière par:**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'ES2020',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-router'],
          'ui-vendor': ['lucide-react'],
        },
      },
    },
    cssCodeSplit: true,
    sourcemap: false,
  },
  server: {
    port: 3000,
    strictPort: false,
  },
  preview: {
    port: 4173,
  },
});
```

---

### Fix #6: Mettre à jour .env.local

**Fichier:** [.env.local](.env.local)

**Remplacer:**
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_ENDPOINT=...
```

**Par:**
```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_API_ENDPOINT=...
```

⚠️ **Important:** Aussi mettre à jour `[src/app/api/supabaseClient.ts](src/app/api/supabaseClient.ts)` si elle referme `NEXT_PUBLIC_*`

---

## ⚡ PRIORITÉ 3 - MEDIUM (5 minutes)

### Fix #7: Sécuriser localStorage pour Mobile

**Fichier:** [src/app/context/auth-context.ts](src/app/context/auth-context.ts)

**Avant:**
```typescript
let storedUser = null;
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  storedUser = stored ? JSON.parse(stored) : null;
} catch (err) {
  console.error('Failed to load stored user:', err);
}
```

**Après:**
```typescript
let storedUser = null;
try {
  // Check localStorage availability (iOS private mode, etc.)
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = localStorage.getItem(STORAGE_KEY);
    storedUser = stored ? JSON.parse(stored) : null;
  }
} catch (err) {
  console.error('Failed to load stored user:', err);
  storedUser = null; // Explicit null fallback
}
```

---

## 📋 VÉRIFICATION LOCALE

Avant de déployer:

```bash
# 1. Install dependencies
pnpm install

# 2. Build production
npm run build

# 3. Check for errors
# Devrait voir: "Built in Xms" SANS erreurs

# 4. Preview build
npm run preview
# Ouvrir http://localhost:4173 et tester
```

**Sur mobile locale:** Ouvrir l'app avec adresse IP (`192.168.x.x:4173`)

---

## 🚀 DEPLOYMENT CHECKLIST

**Avant de push sur GitHub:**

- [ ] Fix #1: RootLayout.tsx indentation ✓
- [ ] Fix #2: Vercel env vars configurées ✓
- [ ] Fix #3: tsconfig.json créé ✓
- [ ] Fix #4: tsconfig.node.json créé ✓
- [ ] Fix #5: vite.config.ts mis à jour ✓
- [ ] Fix #6: .env.local renommé (NEXT_PUBLIC → VITE_) ✓
- [ ] Fix #7: localStorage check ajouté ✓
- [ ] npm run build passed ✓
- [ ] npm run preview tested ✓

**Deploy:**
```bash
git add .
git commit -m "fix: resolve 'safeFirstName' undefined on mobile production"
git push origin main
```

**Après push:**
- Vercel déploiera automatiquement
- Attendre ~60s pour la build
- Ouvrir l'app sur Vercel avec un mobile réel
- Tester la connexion et le menu utilisateur

---

## 📊 RÉSULTATS ATTENDUS

| Before | After |
|--------|-------|
| 🔴 Page blanche sur mobile | ✅ App charge correct |
| 🔴 "Can't find variable" console | ✅ Console clean |
| 🔴 localStorage échoue iOS | ✅ Fallback graceful |
| 🔴 Supabase non-initialisé | ✅ Auth fonctionne |

---

## ⚠️ EN CAS DE PROBLÈME

**Build échoue localement:**
```bash
# Clear cache
rm -rf node_modules .pnpm-store dist

# Reinstall
pnpm install

# Try again
npm run build
```

**Vercel build échoue:**
1. Check Vercel dashboard → Deployment Logs
2. Verify env vars sont SET dans Vercel Settings (pas dans .env)
3. Redeploy manuellement

**Mobile toujours blanc:**
1. Inspector DevTools (Safari/Chrome mobile)
2. Check Console pour les erreurs
3. Vérifier que Supabase credentials sont correctes dans Vercel
4. Hard refresh (Cmd+Shift+R ou Ctrl+Shift+R)

---

**Temps total estimé:** 20 minutes  
**Difficulté:** Easy-Medium  
**Impact:** Critical fix → Production stable 🎉
