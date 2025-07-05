# Use official Node.js 20 LTS image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if present)
COPY package.json ./
# If you have package-lock.json, uncomment the next line
# COPY package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "run", "dev"]