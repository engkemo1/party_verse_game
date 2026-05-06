FROM node:20

# Set the working directory
WORKDIR /app

# Copy everything
COPY . .

# Install dependencies (this automatically triggers the postinstall script in package.json to build the client and install server dependencies)
RUN npm install

# Expose the port (Railway will use its own PORT env var, but we keep 7860 as fallback)
EXPOSE 7860

# Start the server
CMD ["npm", "start"]
