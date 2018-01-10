FROM node:9.3.0-stretch

WORKDIR /code

COPY package*.json /code/
RUN npm install

COPY . /code/

EXPOSE 8008

CMD ["node", "index.js"]
