FROM node:20-bookworm-slim

WORKDIR /app
COPY package*.json ./
RUN npm install \
    && npx playwright install --with-deps chromium \
    && npm cache clean --force

COPY . .
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["npm","start"]
