# Use the official Node.js 18 image as the base image
FROM node:18

# Set the working directory to /app
WORKDIR /app

# Copy the package.json and package-lock.json files to the container
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application files to the container
COPY . .

# Set the environment variable PORT to 8080
ENV PORT_APP=8080

# Expose port 8080
EXPOSE 8080

# Start the application
CMD ["npm", "start"]
