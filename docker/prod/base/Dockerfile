FROM node:24-slim

RUN mkdir /solaris-command

WORKDIR /solaris-command

ADD package.json package.json
ADD package-lock.json package-lock.json
ADD . .

RUN rm -f client/.env
RUN rm -f client-prototype/.env
RUN rm -f server/.env

RUN npm install
RUN npm run build
