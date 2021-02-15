FROM node:10

WORKDIR /app

COPY package.json .
COPY index.js index.js
COPY scripts scripts
COPY oracle oracle
COPY auction auction

RUN npm install
RUN mv ./scripts/.env  .env

CMD ["node", "./scripts/oracle.js"]
