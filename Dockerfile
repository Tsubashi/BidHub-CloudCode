FROM node:6-slim

EXPOSE 80

COPY src/ /home/node/app
RUN mkdir /etc/parse
COPY config/* /etc/parse/

WORKDIR /home/node/app
RUN npm install

CMD npm start

