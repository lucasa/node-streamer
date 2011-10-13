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

var GSTREAMER_PORT = new Number(1000+Math.random() * 9000).toFixed(0); //random port

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

if(process.argv.length < 5) {
    console.log("Please inform all the 3 parameters: URL OGG_STREAM_LINK PORT");
    return;
}
//var URL = "rtsp://stream.camara.gov.br/tvcamara1t200";
var URL = process.argv[2];
var STREAM_OUT = process.argv[3];
var SERVER_PORT = new Number(process.argv[4]);

try {
    console.log("Starting the gstreamer pipeline...");
    spawGstreamer(GSTREAMER_PORT, URL);
    console.log("Gstreamer pipeline started.");
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
app.get('/'+STREAM_OUT, function(req, res) {
    req.shouldKeepAlive = false;
    var date = new Date();
    res.writeHead(200, {
        'Date':date.toUTCString(),
        'Connection':'close',
        'Cache-Control':'no-cache',
        'Content-Type':'application/ogg',
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
              t += buffer[i].length;node-augmented-reality-streamer.js
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

app.listen(SERVER_PORT, function(){
    console.log("Server listening "+SERVER_PORT);
});

console.log("HTTP server running");

function spawGstreamer(port, url) {
        args = ["--gst-debug-level=1"];
        args = args.concat(['uridecodebin', 'name=dec', 'download=true', 'use-buffering=true', "uri=\""+url+"\"",
        '!', 'queue',
    	'!', 'audiorate',
        '!', 'audioconvert',
        '!', 'vorbisenc','bitrate=56000',
        '!', 'queue',
        '!', 'mux.',
             'dec.',
        '!', 'queue',
    	'!', 'ffmpegcolorspace',
        '!', 'theoraenc', 'bitrate=196',
        '!', 'queue',
        '!', 'oggmux', 'name=mux',
        '!', 'queue',
//        '!', 'shout2send', 'ip=localhost', 'mount=live.ogg', 'password=*******']);
        '!', 'tcpserversink', 'buffers-max=500', 'buffers-soft-max=450', /*'burst-unit=3',*/ 'recover-policy=1', 'protocol=none', 'blocksize='+(4096 * 1), 'sync=false', 'sync-method=2', 'port='+port]);
        
        console.log(args.toString());
        
        //http://www.flumotion.net/doc/flumotion/reference/trunk/flumotion.component.consumers.httpstreamer.httpstreamer-pysrc.html
        gstMuxer = child.spawn(cmd, args, options);    
        gstMuxer.stderr.on('data', onSpawnError);
        gstMuxer.on('exit', onSpawnExit);
        return gstMuxer;
}

var DELAY = 1000; //1s
function onSpawnError(data) {
    console.error('GStreamer error: ' + data);
    /*
    gstMuxer.kill();
    setTimeout(function() {
    		console.log("Trying up gstreamer after "+(DELAY/1000)+" seconds.");
      	    spawGstreamer(GSTREAMER_PORT, URL);
    }, DELAY*=2); // wait a little more before try again
    */
}
function onSpawnExit(code) {
    console.error('GStreamer error, exit code ' + code);
    gstMuxer.stdin.end();
    console.log("Waiting "+(DELAY/1000)+" seconds before run againg.");
    setTimeout(function() {
    		console.log("Try up gstreamer after "+(DELAY/1000)+" seconds.");
      	    spawGstreamer(GSTREAMER_PORT, URL);
    }, DELAY*=2);
}

