/*
 * app.js
 * Copyright (C) 2021 Appknox <engineering@appknox.com>
 *
 * Distributed under terms of the MIT license.
 */

const http = require('http');
const pino = require('pino');
const socketio = require('socket.io');
const redisAdapter = require('socket.io-redis');
const redis = require('redis');

const port = process.env.PORT || 8008;
const redisPort = process.env.REDIS_PORT || 6379;
const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPassword = process.env.REDIS_PASSWORD;

const log = pino({
  prettyPrint: true,
  level: process.env.LOGLEVEL || 'info'
});


const server = http.createServer();
const io = socketio(server, {
  path: '/websocket',
  allowEIO3: true,
  serveClient: false,
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true
  }
});

const pubClient = redis.createClient(redisPort, redisHost, { auth_pass: redisPassword });
const subClient = pubClient.duplicate();

const adapter = redisAdapter({
  pubClient: pubClient,
  subClient: subClient
})

io.adapter(adapter);

io.on('connection', function (socket) {
  log.debug('Socket connection: ', socket.id);
  socket.on('subscribe', function(data) {
    socket.join(data.room);
    log.debug("User joined the room: ", data);
  })

  socket.on('unsubscribe', function(data) {
    socket.leave(data.room);
    log.debug("User left the room: ", data);
  })

  socket.on('disconnect', function(data) {
    if(data == "ping timeout") {
      log.debug("Ping timeout");
      return;
    }
    log.debug("User quit the room: ", data);
  })

});

subClient.on("message", function(channel, message) {
  log.debug(`New Message in Channel: ${channel}`);
  log.debug(`Message: ${message}`);
  let data = "";
  if (channel == "notify") {
    try {
      data = JSON.parse(message);
    } catch(error) {
      log.error(error, channel, message);
      return;
    }

    if(data && data.rooms && data.rooms.length) {
      io.to(data.rooms).emit(data.event, data.data);
    } else {
      log.error(`Invalid message: ${message} from channel: ${channel}`);
    }
  }
});

subClient.subscribe("notify");

log.info('server listens on port ' + port);
server.listen(port);
