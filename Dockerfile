# Use an official Node runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install global dependencies
RUN npm install -g typescript ts-node prisma

# Install project dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript to JavaScript
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Define environment variables (you'll replace these with actual values)
ENV DATABASE_URL="postgresql://db1_owner:npg_4zDnB6gTNXFA@ep-patient-block-a53e5uur-pooler.us-east-2.aws.neon.tech/db1?sslmode=require"
ENV NODE_ENV="production"
ENV TICKETE_API_KEY="6ff5c38f79a4b5c5f3e08cba86c1ff05"
ENV PORT=3000

# Command to run the application
CMD ["npm", "start"]






