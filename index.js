/*
 * app.js
 * Copyright (C) 2014 dhilipsiva <dhilipsiva@gmail.com>
 *
 * Distributed under terms of the MIT license.
 */

var port = process.env.PORT || 8008
  , server = require('http').createServer()
  , io = require('socket.io')(server)
// , redis = require('redis')
  , redis = require('socket.io-redis')
  , redisPort = 6379
  , redisHost = 'redis.pubsub'
  , adapter = redis({host: redisHost , port: redisPort})

io.adapter(adapter)

io.on('connection', function (socket) {

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

adapter.subClient.on("message", function (channel, message) {

  console.log("New Message in Channel: %s", channel);
  if (channel == "notify") {
    data = JSON.parse(message);
    data.rooms.forEach(function(room){
      io.in(room).emit(data.event, data.data);
    });

    console.log("new message: ", message);
  }

});


adapter.subClient.subscribe("notify");

console.log('server listens on port ' + port);
server.listen(port);

/*
 * Usage on client side
 *
 * socket.send("subscribe", { room: "user uuid" });
 *
 */
