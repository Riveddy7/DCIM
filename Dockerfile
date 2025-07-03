# Dockerfile

# Al principio, define TODOS los argumentos que necesitarás
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_N8N_FLOORPLAN_WEBHOOK_URL

# --- Etapa 2: Construcción (Build) ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Pasa TODOS los argumentos al entorno de la construcción
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_N8N_FLOORPLAN_WEBHOOK_URL=$NEXT_PUBLIC_N8N_FLOORPLAN_WEBHOOK_URL

RUN npm run build
    
    # --- Etapa 3: Producción (Runner) ---
    FROM node:18-alpine AS runner
    WORKDIR /app
    
    ENV NODE_ENV=production
    
    COPY --from=builder /app/public ./public
    COPY --from=builder /app/.next ./.next
    COPY --from=builder /app/node_modules ./node_modules
    COPY --from=builder /app/package.json ./package.json
    
    EXPOSE 3000
    CMD ["npm", "start"]