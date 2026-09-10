# Production image for the static PWA. Secrets are never copied into the image.
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_SUPABASE_URL
ARG SUPABASE_ANON_KEY_PUBLIC
ARG VITE_VAPID_PUBLIC_KEY
ARG VITE_SPOTIFY_CLIENT_ID
ARG VITE_SPOTIFY_REDIRECT_URI
RUN test -n "$VITE_SUPABASE_URL" && test -n "$SUPABASE_ANON_KEY_PUBLIC" || (echo "VITE_SUPABASE_URL and SUPABASE_ANON_KEY_PUBLIC are required" >&2; exit 1)
RUN VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
    VITE_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY_PUBLIC" \
    VITE_VAPID_PUBLIC_KEY="$VITE_VAPID_PUBLIC_KEY" \
    VITE_SPOTIFY_CLIENT_ID="$VITE_SPOTIFY_CLIENT_ID" \
    VITE_SPOTIFY_REDIRECT_URI="$VITE_SPOTIFY_REDIRECT_URI" \
    npm run build

FROM nginx:1.29-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
