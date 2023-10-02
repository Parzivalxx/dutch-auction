# Use an official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of the application code to the container
COPY . .

# Expose the port your Node.js application is listening on
EXPOSE 3000

# Command to start your Node.js application using server.js
CMD ["node", "server.js"]
