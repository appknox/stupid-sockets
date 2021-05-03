FROM node:16-alpine

WORKDIR /code

COPY package*.json /code/
RUN apk --update add --virtual build-dependencies \
    && npm install \
    && apk del build-dependencies

COPY . /code/

EXPOSE 8008

CMD ["node", "index.js"]
