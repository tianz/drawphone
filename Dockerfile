FROM node:12.18.1-stretch-slim

WORKDIR /node

ADD . /node

RUN npm install
RUN cp node_modules/dom-to-image/dist/dom-to-image.min.js public/js/thirdparty
RUN cp node_modules/file-saver/dist/FileSaver.min.js public/js/thirdparty

CMD npm start
