FROM node:20-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package files first
COPY package*.json ./

# Install global and project dependencies
RUN npm install -g typescript ts-node prisma
RUN npm install

# Copy the entire project
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Explicitly build TypeScript
RUN npm run build

# Verify dist directory contents
RUN ls -la dist

# Expose the port the app runs on
EXPOSE 3000

# Define environment variables (you'll replace these with actual values)
ENV DATABASE_URL="postgresql://db1_owner:npg_4zDnB6gTNXFA@ep-patient-block-a53e5uur-pooler.us-east-2.aws.neon.tech/db1?sslmode=require"
ENV NODE_ENV="production"
ENV TICKETE_API_KEY="6ff5c38f79a4b5c5f3e08cba86c1ff05"
ENV PORT=3000

# Update start script to use ts-node directly as a fallback
CMD ["sh", "-c", "if [ -f dist/app.js ]; then node dist/app.js; else npx ts-node src/app.ts; fi"]


# # Command to run the application
# CMD ["npm", "start"]






