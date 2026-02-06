FROM node:20-slim

WORKDIR /app

# install deps
COPY package*.json ./
RUN npm install --production

# copy source
COPY . .

ENV PORT=8080
EXPOSE 8080

CMD ["npm","start"]

