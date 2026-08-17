
## Frontend Dockerfile (development)
# Use Node.js image to run Vite dev server
FROM node:20-bookworm-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose Vite dev port
EXPOSE 5174

# Default command to start Vite dev server on all interfaces
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5174"]