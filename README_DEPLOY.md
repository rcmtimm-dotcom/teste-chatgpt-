# Deploy do Frontend + Backend

## Stack detectada
- **Frontend:** Vite + React (`src/`, `vite.config.js`).  
- **Backend:** Node + Express (`server.js`) com rotas `/api/*` e webhook `/api/telegram/webhook`.  

---

## Cloudflare Pages (preferencial)

### 1) Conectar o repositório
1. Acesse Cloudflare Pages.
2. Clique em **Create a project** → **Connect to Git**.
3. Selecione o repositório.

### 2) Build settings
- **Framework preset:** Vite
- **Build command:** `npm ci && npm run build`
- **Build output directory:** `dist`

### 3) Variáveis de ambiente (Pages)
Defina em **Settings → Environment Variables**:
- `VITE_API_URL` = `https://SEU_BACKEND.onrender.com`
- `VITE_SUPABASE_URL` = `https://SEU_PROJECT.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `sua_anon_key`

### 4) SPA routing
O arquivo `public/_redirects` já foi incluído para fallback em `/index.html`.

---

## Alternativa: Netlify

### 1) Conectar o repositório
1. Acesse Netlify.
2. Clique em **Add new site** → **Import from Git**.

### 2) Build settings
- **Build command:** `npm ci && npm run build`
- **Publish directory:** `dist`

### 3) Variáveis de ambiente
Mesmo conjunto do Cloudflare Pages:
- `VITE_API_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 4) SPA routing
O arquivo `public/_redirects` já fornece o fallback:
```
/* /index.html 200
```

---

## Backend (Render)

### Variáveis de ambiente obrigatórias
- `BOT_TOKEN` (token do BotFather)
- `SUPABASE_JWKS_URL` (JWKS da sua instância Supabase)
- `SUPABASE_ISSUER` (ex: `https://SEU_PROJECT.supabase.co/auth/v1`)
- `SUPABASE_AUDIENCE` (padrão `authenticated`)
- `FRONTEND_ORIGINS` (ex: `https://seu-projeto.pages.dev,https://seu-projeto.netlify.app`)
- `DEBUG_KEY` (chave para `/debug/last-expenses`)

---

## Checklist final
- [ ] Webhook do Telegram continua gravando (POST `/api/telegram/webhook`).
- [ ] Front faz login (Supabase Auth).
- [ ] Rota `/gastos` bloqueada sem login.
- [ ] Listagem aparece após login.
- [ ] CORS ok com o domínio do Pages/Netlify.

---

## Comando único de diagnóstico
```bash
npm run diagnose
```

---

## Scripts úteis
- `npm run diagnose` → gera `diagnose_report.md`.
