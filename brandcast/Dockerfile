# Stage 1: Build Next.js
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json first (better for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Build the Next.js application
RUN npm run build

# Stage 2: Run the Built Next.js App
FROM node:18-alpine

WORKDIR /app

# Copy only the built files and production dependencies
COPY --from=builder /app/package.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

# Expose port 3000
EXPOSE 3000

# Start the Next.js production server
CMD ["npm", "start"]