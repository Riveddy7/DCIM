# Stage 1: Build the Next.js application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and yarn.lock/package-lock.json to leverage Docker cache
COPY package.json yarn.lock* ./
# If you use npm, use this instead:
# COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --frozen-lockfile # or yarn install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the Next.js application for standalone output
ENV NEXT_OUTPUT=standalone
RUN npm run build

# Stage 2: Create the production-ready image
FROM node:20-alpine AS runner

WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy the standalone output, static assets, and public files from the builder stage
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Expose the port Next.js will run on (default is 3000)
EXPOSE 3000

# Command to run the Next.js application
CMD ["node", "server.js"]