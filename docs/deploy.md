# Deploy Guide — CoupleSpace

CoupleSpace is a **static PWA** built with React + Vite. Deploy to any static hosting platform.

## Prerequisites

- Node.js 18+
- npm 9+
- Supabase project with URL and anon key

## Environment Variables

Set these in your hosting platform's dashboard:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

## Build Commands

```bash
cd FRONTEND
npm install
npm run build   # Output: dist/
```

## Platform Guides

### Vercel (Recommended)

1. Connect your GitHub repo to Vercel
2. Set root directory to `FRONTEND`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variables in dashboard

### Netlify

1. Connect repo to Netlify
2. Base directory: `FRONTEND`
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables

### Cloudflare Pages

1. Connect repo to Cloudflare Pages
2. Build command: `cd FRONTEND && npm run build`
3. Output directory: `FRONTEND/dist`
4. Add environment variables

### GitHub Pages

1. Add to `vite.config.js`:
   ```js
   base: '/couple-space/'
   ```
2. Run `npm run build`
3. Deploy `dist/` to `gh-pages` branch

### Self-hosted (Nginx/Apache)

```bash
cd FRONTEND
npm run build
# Copy dist/ to your web server's document root
```

Nginx config for SPA:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## Supabase Migrations

Apply database migrations before first deploy:

```bash
cd FRONTEND/supabase
supabase db push   # Or apply via Supabase dashboard
```

## Post-deploy Checklist

- [ ] Verify PWA installs on mobile
- [ ] Test service worker updates
- [ ] Confirm Supabase connection
- [ ] Check real-time subscriptions work
- [ ] Validate authentication flow

## Custom Domain

After deploy, configure your custom domain in the hosting platform's dashboard. Ensure HTTPS is enabled (required for PWA and service workers).
