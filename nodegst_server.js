var express = require('express')
var net = require('net');
var child = require('child_process');
var io = require('socket.io');
var cmd = 'gst-launch';
var args = '';
var options = null;



var bcast = net.createServer(function (socket) {
//  socket.write("Echo server\r\n");
  console.log("broadcast socket ON");
//socket.pipe(socket);
});
bcast.listen(9000, 'localhost');

function onSpawnError(data) {
  console.log(data.toString());
}

function onSpawnExit(code) {
  if (code != null) {
    console.error('GStreamer error, exit code ' + code);
  }
}

