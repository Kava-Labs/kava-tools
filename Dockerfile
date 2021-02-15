FROM node:10

WORKDIR /app

COPY package.json .
COPY index.js index.js
COPY scripts scripts
COPY oracle oracle
COPY auction auction
COPY yarn.lock yarn.lock

RUN yarn
RUN mv ./scripts/.env  .env

CMD ["node", "./scripts/oracle.js"]
