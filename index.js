/*
 * app.js
 * Copyright (C) 2014 dhilipsiva <dhilipsiva@gmail.com>
 *
 * Distributed under terms of the MIT license.
 */

var parseArgs = require('minimist')
  , port = argv.port || 8008
  , io = require('socket.io')(port)
  , redis = require('redis')
  , argv = parseArgs(process.argv)
  , redisPort = 6379
  , redisHost = argv.host || 'localhost'
  , client = redis.createClient(parseInt(redisPort), redisHost);

console.log('server listens on port ' + port);

io.sockets.on('connection', function (socket) {

  socket.on('subscribe', function(data) {
    socket.join(data.room);
    console.log("User joined the room: ", data);
  })

  socket.on('unsubscribe', function(data) {
    socket.leave(data.room);
    console.log("User left the room: ", data);
  })

  socket.on('disconnect', function(data) {
    socket.leave(data.room);
    console.log("User quit the room: ", data);
  })

});

client.on("message", function (channel, message) {

  console.log("channel:%s - message:%s",channel, message);

  data = JSON.parse(message);
  data.rooms.forEach(function(room){
    io.sockets.in(room).emit(data.event, data.data);
  });

  console.log("Got a new message: ", data.rooms);

});

client.subscribe("notify");

/*
 * Usage on client side
 *
 * socket.send("subscribe", { room: "user uuid" });
 *
 */
