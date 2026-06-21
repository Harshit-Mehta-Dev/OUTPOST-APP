# Use official Node.js lightweight Alpine image
FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy only package files first for optimal caching
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy the rest of the server code
COPY . .

# Expose the port the app runs on
EXPOSE 10000

# Set environment to production
ENV NODE_ENV=production

# Create a dedicated low-privilege system user group (Alpine syntax)
RUN addgroup -S outpostuser && adduser -S outpostuser -G outpostuser
RUN chown -R outpostuser:outpostuser /app

# Switch context entirely away from root authorization
USER outpostuser

# Start the server
CMD ["node", "server.js"]
