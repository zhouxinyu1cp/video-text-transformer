# backend/Dockerfile
FROM node:20-slim

# Install build essentials for compiling whisper.cpp and FFmpeg for audio/video processing
RUN apt-get update && apt-get install -y \
    ffmpeg \
    build-essential \
    cmake \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create data directory
RUN mkdir -p /tmp/video-transcriber

# Expose port
EXPOSE 3001

# Start the server
CMD ["npm", "start"]
