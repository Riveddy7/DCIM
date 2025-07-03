# --- Etapa 1: Dependencias ---
    FROM node:20-alpine AS deps
    WORKDIR /app
    
    COPY package.json package-lock.json ./
    RUN npm install --frozen-lockfile
    
    # --- Etapa 2: Construcción (Build) ---
    FROM node:20-alpine AS builder
    WORKDIR /app
    COPY --from=deps /app/node_modules ./node_modules
    COPY . .
    
    # Next.js encontrará y usará el archivo .env automáticamente
    RUN npm run build
    
    # --- Etapa 3: Producción (Runner) ---
    FROM node:20-alpine AS runner
    WORKDIR /app
    
    ENV NODE_ENV=production
    
    COPY --from=builder /app/public ./public
    COPY --from=builder /app/.next ./.next
    COPY --from=builder /app/node_modules ./node_modules
    COPY --from=builder /app/package.json ./package.json
    
    EXPOSE 3000
    CMD ["npm", "start"]