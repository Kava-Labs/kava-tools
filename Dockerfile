FROM node:16-alpine

WORKDIR /app

COPY package.json .
COPY index.js index.js
COPY scripts scripts
COPY oracle oracle
COPY auction auction
COPY yarn.lock yarn.lock

RUN yarn
RUN mv ./scripts/.env .env

ENV ENV_FILE=.env

CMD ["node", "./scripts/oracle.js"]
