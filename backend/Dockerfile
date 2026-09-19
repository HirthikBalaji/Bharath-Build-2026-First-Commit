FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache python3 py3-pip sqlite
COPY package*.json ./
RUN npm install
COPY . .
RUN python3 db_init.py && node src/seed.js
EXPOSE 4000
CMD ["node", "src/server.js"]
