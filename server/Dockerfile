FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install --omit=dev
RUN npx prisma generate
COPY dist ./dist/
EXPOSE 5000
CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]

