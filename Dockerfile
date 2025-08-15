# Use Node.js LTS version
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install dependencies for native modules and process management
RUN apk add --no-cache python3 make g++ bash

# Install PM2 globally for process management
RUN npm install -g pm2

# Copy package files for both frontend and backend
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install frontend dependencies (including dev dependencies for build)
WORKDIR /app/frontend
RUN npm ci

# Install backend dependencies  
WORKDIR /app/backend
RUN npm ci

# Copy source code
WORKDIR /app
COPY frontend/ ./frontend/
COPY backend/ ./backend/
COPY .env ./

# Build frontend
WORKDIR /app/frontend
RUN npm run build

# Build backend
WORKDIR /app/backend
RUN npm run build:backend

# Create PM2 ecosystem file with proper dependency management
WORKDIR /app
RUN echo 'module.exports = { \
    apps: [{ \
    name: "nextjs", \
    cwd: "/app/frontend", \
    script: "npm", \
    args: "start", \
    env: { \
    NODE_ENV: "production", \
    PORT: "3000", \
    HOSTNAME: "0.0.0.0" \
    }, \
    wait_ready: true, \
    listen_timeout: 10000, \
    kill_timeout: 5000 \
    }, { \
    name: "express", \
    cwd: "/app/backend", \
    script: "npm", \
    args: "start", \
    env: { \
    NODE_ENV: "production", \
    PORT: "3001" \
    }, \
    wait_ready: false \
    }] \
    }' > ecosystem.config.js

# Expose the port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Start both servers using PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
