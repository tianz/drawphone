FROM node:12.18.1-stretch-slim

WORKDIR /node

ADD . /node

RUN npm install

CMD npm start
