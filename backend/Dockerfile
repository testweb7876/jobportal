FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN mkdir -p logs uploads

FROM base AS production
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "src/server.js"]
