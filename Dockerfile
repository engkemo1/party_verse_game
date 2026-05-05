# Use Node.js 18 as the base image
FROM node:18-slim

# Set the working directory
WORKDIR /app

# Copy the root package.json
COPY package.json ./

# Install dependencies for both client and server
# We use a custom script to handle the monorepo structure
COPY . .
RUN npm install
RUN cd client && npm install && npm run build
RUN cd server && npm install

# Expose the port (Render/HF usually use 7860 for Spaces or PORT env)
EXPOSE 3001

# Start the server
CMD ["npm", "start"]
