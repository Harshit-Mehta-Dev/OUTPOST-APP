# Stage 1: Build the React Application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the Vite application for production SSR
RUN npm run build:ssr

# Stage 2: Serve the application with Node.js SSR
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
# Install production dependencies for the SSR server
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/ssr-server.js ./
COPY --from=builder /app/index.html ./

EXPOSE 8080

# Create a dedicated low-privilege system user group (Alpine syntax)
RUN addgroup -S outpostuser && adduser -S outpostuser -G outpostuser
RUN chown -R outpostuser:outpostuser /app

# Switch context entirely away from root authorization
USER outpostuser

CMD ["npm", "run", "start"]
