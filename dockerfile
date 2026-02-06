FROM node:20-slim

WORKDIR /app

# install deps
COPY package*.json ./
RUN npm install --production

# copy source
COPY . .

ENV PORT=3000
EXPOSE 3000

CMD ["npm","start"]

