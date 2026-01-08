FROM node:20-alpine

WORKDIR /app

# Install build dependencies (required for mediasoup compilation)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    gcc \
    bash

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# Expose WebSocket port and RTC ports
EXPOSE 8888 40000-41000/udp 40000-41000/tcp

# Health check
HEALTHCHECK --interval=5s --timeout=5s --retries=5 \
  CMD node -e "require('net').createConnection({port: 8888}, () => process.exit(0)).on('error', () => process.exit(1))"

# Start the server
CMD ["npm", "start"]
