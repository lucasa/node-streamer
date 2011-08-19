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

var GSTREAMER_PORT = 12345;

var DO_BURST_CONNECTION = false;

http.ServerResponse.prototype.getHashCode = (function() {
    var id = 0;
    return function() {
        if (!this["hashCode"]) {
            this["hashCode"] = "<hash|#" + id++ + ">";
        }
        return this["hashCode"];
    }
})();

try {
    spawGstreamer(GSTREAMER_PORT, "http://radiolivre.org:8000/muda.ogg");// "http://gonod.softwarelivre.org:8000/radiosl.ogg");
} catch(err) {
    console.log("Error starting the gstreamer pipeline.");
}

var buffer = [];
// Implementing a simple "burts-on-connect"
if(DO_BURST_CONNECTION) {
    var bufferSize = 1 * 1024 *1024; // 1mb in bytes
    setTimeout(function() {
        console.log("Buffering data from gstreamer");
        var stream = net.createConnection(GSTREAMER_PORT);
        //stream.setTimeout(30 * 1000);
        stream.addListener("connect", function() {
            console.log("Connected to gstreamer");
            stream.addListener("data", function(data){
                 var size = currentBufferSize();
                 console.log("Add data " + data.length + " bytes from gstreamer to buffer. Total: "+ size);
                 while (size > bufferSize) {
                    buffer.shift();
                 }
                 buffer.push(data);
            });
        });
        		
    }, 10 * 1000);
    function currentBufferSize() {
      var size = 0, i=0, l=buffer.length;
      for (; i<l; i++) {
        size += buffer[i].length;
      }
      return size;
    }
}


var total_data = 0;
var clients = 0;
var app = express.createServer();
var io = require('socket.io').listen(app);
app.get('/radiosl.mp3', function(req, res) {
    req.shouldKeepAlive = false;
    var date = new Date();
    res.writeHead(200, {
        'Date':date.toUTCString(),
        'Connection':'close',
        'Cache-Control':'no-cache',
        'Content-Type':'application/mpeg',
        'Server':'NodeTranscoder/0.0.1',
    });
    console.log("new http client");
    console.log("server writing header");

    console.log("trying to connect a socket to gstreamer tcp server.");   
    var socket = new net.createConnection(GSTREAMER_PORT);
    
    io.on('connection', function (s) {
            console.log('socket.io client connected');
    	setInterval(function() {
      	  s.volatile.emit({ "clients" : clients , "total" : total_data });
    	}, 1000);
    });
    socket.on('connect', function() {
        clients++;
        console.log("new client socket connected to gstreamer tcp server "+GSTREAMER_PORT);
    });
    
    // First, send what's inside the "Burst-on-Connect" buffers.
    var t = 0;
    for (var i=0, l=buffer.length; i<l; i++) {
        if(res.writable) {
              //res.write(buffer[i]);
              t += buffer[i].length;
        }
    }
    console.log("Sent " + t + " bytes from burst-connection buffers.");
    total_data = t;
    
    console.log("now sending the live buffers direct from gstreamer");
    socket.on('data', function (data) {
          if(res.writable) {
              total_data += data.length;
              res.write(data);
          }
	  //console.log("sending "+data.length)
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
app.listen(9001);

console.log("HTTP server running");

function spawGstreamer(port, url) {
        args =
        ['--gst-debug-level=2',
        'uridecodebin', 'use-buffering=true', "uri="+url,
    	  '!', 'audiorate',
        '!', 'audioconvert',
        '!', 'audioresample',
        '!', 'queue',
        '!', 'lame','bitrate=64',
//        '!', 'queue',
//        '!', 'oggmux', 'name=m',
        '!', 'queue',
//        '!', 'progressreport',
        '!', 'tcpserversink', 'buffers-max=500', 'buffers-soft-max=450', /*'burst-unit=3',*/ 'recover-policy=1', 'protocol=none', 'blocksize='+(4096 * 1), 'sync=false', 'sync-method=2', 'port='+port];
        //http://www.flumotion.net/doc/flumotion/reference/trunk/flumotion.component.consumers.httpstreamer.httpstreamer-pysrc.html
        gstMuxer = child.spawn(cmd, args, options);    
        gstMuxer.stderr.on('data', onSpawnError);
        gstMuxer.on('exit', onSpawnExit);
        console.log(args.toString());
}

function onSpawnError(data) {
  console.log(data.toString());
}

function onSpawnExit(code) {
  if (code == 0) {
    console.error('GStreamer error, exit code ' + code);
/*    setTimeout(function() {
    		console.log("Caiu, tentando depois de 5 segundos.");
      	spawGstreamer(12345);
    	}, 5 * 1000);*/
  }
}
