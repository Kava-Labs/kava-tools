FROM node:19

WORKDIR /app

COPY package.json .
COPY index.js index.js
COPY scripts scripts
COPY oracle oracle
COPY auction auction
COPY yarn.lock yarn.lock

RUN yarn

ENV ENV_FILE=.env

CMD ["node", "./scripts/oracle.js"]
