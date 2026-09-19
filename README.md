# MenuCraft — Multi-tenant Restaurant Menu Platform

A responsive React app where restaurants sign up, fill in their menu data, upload a logo and hero image, and share a public menu page via UUID.

## Features

- **Auth** — Email/password sign up & sign in (Supabase Auth)
- **Dashboard** — Create and manage multiple restaurants
- **Restaurant form** — Name, tagline, phone, address, logo, hero image, menu JSON
- **Public menu** — `/menu/:uuid` renders that restaurant's menu (mobile-first, filters, section nav)
- **Storage** — Logo & hero images stored in Supabase Storage

## Setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a project
2. In **SQL Editor**, run the contents of `supabase/schema.sql`
3. In **Authentication → Providers**, enable Email (disable "Confirm email" for faster local testing if you prefer)

### 2. Environment variables

Copy `.env.example` to `.env` and fill in your project credentials from **Project Settings → API**:

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install & run

```bash
npm install
npm run dev
```

Open `http://localhost:5173`

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/signup` | Create account |
| `/login` | Sign in |
| `/dashboard` | Manage restaurants (protected) |
| `/dashboard/new` | Create restaurant + menu (protected) |
| `/dashboard/edit/:id` | Edit restaurant (protected) |
| `/menu/:uuid` | Public menu page |

## Menu data format

The form accepts the `menus` object from `src/data/menu.json`. Click **Load sample template** to pre-fill the full Indian + Chinese menu.

Each restaurant gets a UUID on creation. Share:

```
https://yoursite.com/menu/<uuid>
```

## Deploy notes

For client-side routing (`/menu/:uuid`), configure your host to serve `index.html` for all paths (SPA fallback). On Vite preview / most static hosts, add a `_redirects` or `vercel.json` rewrite as needed.

### Vercel environment variables

Your local `.env` file is **not** uploaded to Vercel. Vite reads `VITE_*` variables at **build time**, so you must set them in the Vercel dashboard before deploying:

1. Open your project on [vercel.com](https://vercel.com) → **Settings → Environment Variables**
2. Add both variables (same values as your local `.env`):
   - `VITE_SUPABASE_URL` — e.g. `https://xxxx.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` — your anon / publishable key from Supabase **Settings → API**
3. Enable them for **Production**, **Preview**, and **Development**
4. **Redeploy** the project (Deployments → ⋯ → Redeploy) so the build picks up the new values

Without a redeploy after adding env vars, the live site will still show "Supabase is not configured."

### Admin image uploads

The admin image editor uses a secure Supabase Edge Function. It verifies a short-lived upload token created by the existing admin-password check, then writes with the server-only Supabase service-role key. This allows an admin to update any restaurant's logo or cover image without loosening the `restaurant-assets` Storage policies.

After running `supabase/admin.sql` in the Supabase SQL Editor, deploy the function from the project root:

```bash
supabase functions deploy admin-upload-asset --no-verify-jwt
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are supplied automatically to deployed Supabase Edge Functions. Sign out and sign in to `/admin` once after deploying so the browser receives a fresh upload token.

## Tech stack

- React 19 + Vite
- React Router
- Supabase (Auth, Postgres, Storage)
- Sass
