FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache python3 py3-pip sqlite
COPY package*.json ./
RUN npm install --omit=dev
COPY . .

# Database lives on a mounted volume so it survives image rebuilds.
ENV SEATRELAY_DB_PATH=/app/data/seatrelay.db
ENV PORT=4000
RUN chmod +x docker-entrypoint.sh
EXPOSE 4000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "src/server.js"]
