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

# Expose the port (Hugging Face Spaces default to 7860)
EXPOSE 7860

# Start the server
CMD ["npm", "start"]
