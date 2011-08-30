/*
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var net = require("net");
var express = require("express");
var http = require("http");
var child = require('child_process');

var cmd = '/usr/bin/gst-launch-0.10';
var options = null;
var gstMuxer = null;

http.ServerResponse.prototype.getHashCode = (function() {
    var id = 0;
    return function() {
        if (!this["hashCode"]) {
            this["hashCode"] = "<hash|#" + id++ + ">";
        }
        return this["hashCode"];
    }
})();

spawGstreamer(11111);

var total_data = 0;
var clients = 0;
var app = express.createServer();
var io = require('socket.io').listen(app);
app.get('/stream', function(req, res) {
    req.shouldKeepAlive = false;
    var date = new Date();
    res.writeHead(200, {
        'Date':date.toUTCString(),
        'Connection':'close',
        'Cache-Control':'private',
        'Content-Type':'video/ogg',
        'Server':'NodeStreamer/0.0.1',
    });
    console.log("new http client");
    console.log("server writing header");

    console.log("trying to connect a socket to gstreamer tcp server.");
    var port = 11111;
    var socket = new net.createConnection(port);
    
    io.on('connection', function (s) {
            console.log('socket.io client connected');
    	setInterval(function() {
      	  s.volatile.emit({ "clients" : clients , "total" : total_data });
    	}, 1000);
    });
    socket.on('connect', function() {
        clients++;
        console.log("new client socket connected to gstreamer tcp server "+port);
    });
    socket.on('data', function (data) {
          total_data += data.length;
          /*i++;
          if(i % 500 == 0) {
              console.log("socket ["+res.getHashCode()+"] total received data from gstreamer: "+ (total_data/(1024*1024))+" MB");
          }*/
          res.write(data);
    });
    socket.on('close', function(had_error) {
          if(socket && socket.end){
              socket.end();
              socket.destroy();
          }
    });
    socket.on('end', function () {
        socket.end();
    });
    res.connection.on('close', function() {
        console.log("http connecton closed");
        if(socket && socket.end) {
              socket.end();
              socket.destroy();
        }
        clients--;
    });    
    
});
app.configure(function () {
    app.use(express.logger());
    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }));
    app.use(express.static(__dirname+'/static'));
});
app.listen(8003);

console.log("HTTP server running");

function spawGstreamer(port) {
        args =
        ['--gst-debug-level=3',
    //    'ximagesrc',
        'videotestsrc', 'is-live=1', //'horizontal-speed=2',
    //    'uridecodebin', "uri=htpp://",    
    //    'filesrc', 'location=', '!', 'decodebin name=dec',
        '!', 'videorate',
        '!', 'video/x-raw-rgb,framerate=12/1',
        '!', 'ffmpegcolorspace',
        '!', 'timeoverlay',
        '!', 'ffmpegcolorspace',    
    //    '!', 'videorate',
        '!', 'queue',
        '!', 'theoraenc','quality=10','speed-level=2',
        '!', 'queue',
        '!', 'oggmux', 'name=m',
        '!', 'queue',
        '!', 'tcpserversink', 'buffers-max=500', 'buffers-soft-max=450', 'recover-policy=1', 'protocol=none', 'blocksize='+(4096 * 2), 'sync=false', 'sync-method=1', 'port='+port];
      
        gstMuxer = child.spawn(cmd, args, options);    
        gstMuxer.stderr.on('data', onSpawnError);
        gstMuxer.on('exit', onSpawnExit);
        console.log(args.toString());
}

function onSpawnError(data) {
  console.log(data.toString());
}

function onSpawnExit(code) {
  if (code != null) {
    console.error('GStreamer error, exit code ' + code);
  }
}
