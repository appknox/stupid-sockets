/*
 * app.js
 * Copyright (C) 2020 Appknox <engineering@appknox.com>
 *
 * Distributed under terms of the MIT license.
 */

const port = process.env.PORT || 8008;
const server = require('http').createServer();
const io = require('socket.io')(server, {
  path: '/websocket',
  serveClient: false
});
const socketIORedis = require('socket.io-redis');
const redisPort = process.env.REDIS_PORT || 6379;
const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPassword = process.env.REDIS_PASSWORD;
const redis = require('redis').createClient;
const pub = redis(redisPort, redisHost, { auth_pass: redisPassword });
const sub = redis(redisPort, redisHost, { auth_pass: redisPassword });
const adapter = socketIORedis({ pubClient: pub, subClient: sub });
const pino = require('pino');
const log = pino({
    prettyPrint: true,
    level: process.env.LOGLEVEL || 'info'
});

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

adapter.subClient.on("message", function (channel, message) {
  log.debug(`New Message in Channel: ${channel}`);
  log.debug(`Message: ${message}`);
  if (channel == "notify") {
    try {
      data = JSON.parse(message);
    } catch(error) {
      log.error(error, channel, message);
      return;
    }
    if(data && data.rooms && data.rooms.length) {
      data.rooms.forEach(function(room){
        io.in(room).emit(data.event, data.data);
      });
    } else {
      log.error(`Invalid message: ${message} from channel: ${channel}`);
    }
  } else {
    log.error(`Invalid channel: ${channel} with message: ${message}`);
  }
});


adapter.subClient.subscribe("notify");

log.info('server listens on port ' + port);
server.listen(port);
