var net = require("net");
var express = require("express");
var http = require("http");
var child = require('child_process');
var cmd = '/usr/bin/gst-launch-0.10';
var args = '';
var options = null;
var gstMuxer = null;
var emitter = new process.EventEmitter();
var clients = [];

http.ServerResponse.prototype.getHashCode = (function() {
    var id = 0;
    return function() {
        if (!this["hashCode"]) {
            this["hashCode"] = "<hash|#" + id++ + ">";
        }
        return this["hashCode"];
    }
})();

spawGstreamer(12345);
 
console.log("TCP server running");

var app = express.createServer();
var http_clients = []
app.get('/', function(req, res) {
    var date = new Date();
    res.writeHead(200, {
        'Date':date.toUTCString(),
        'Connection':'close',
        'Cache-Control':'private',
        'Content-Type':'video/ogg',
        'Server':'CustomStreamer/0.0.1',
    });
    console.log("new http client");
    console.log("server writing header");
    
    
    emitter.on("videodata", function(data){    
        //console.log(data);
        //console.log("http server received video data "+data.length+ " bytes to send to "+res.getHashCode());
        //res.write(data);
//        res.writeContinue();
    });

    var i = 0;
    var total_data = 0;
    var alive = false;    
    //while(!alive)
    {
        console.log("trying to connect a socket to gstreamer tcp server.");
        var socket = new net.createConnection(12345);
        socket.on('connect', function() {
            alive = true;
            console.log("new client socket connected to gstreamer tcp server.");
        });
        socket.on('data', function (data) {
              total_data += data.length;
              i++;
              if(i % 500 == 0) {
                  console.log("socket ["+res.getHashCode()+"] total received data from gstreamer: "+ (total_data/(1024*1024))+" MB");
              }
              res.write(data);
        });
        socket.on('close', function(had_error) {
              res.end();
        });
    }
    
/*    var server = net.createServer(function (socket) {
        socket.on('data', function (data) {
          res.write(data);
        });
        socket.on('close', function(had_error) {
          res.end();
        });
    });
    server.listen(12345);
*/    
    
    res.connection.on('close', function() {
        console.log("http connecton closed");
        //gstMuxer.kill();
    });    
});
app.listen(9001);
console.log("HTTP server running");


function spawGstreamer(port) {
    if(gstMuxer == null)
    {
/*    
    args =
    [ '--gst-debug-level=0',
//    'ximagesrc',
    'videotestsrc', 'is-live=1',// 'horizontal-speed=3',
    '!', 'videoscale',
    '!', 'videorate',
    '!', 'video/x-raw-rgb,framerate=3/1,width=400,height=300',
    '!', 'ffmpegcolorspace',
    '!', 'timeoverlay',
    '!', 'ffmpegcolorspace',
    '!', 'vp8enc', 'speed=2',
    '!', 'queue',
    '!', 'm.',
    'audiotestsrc', //'audiotestsrc',
    '!', 'volume', 'volume=0.1',
    '!', 'audioconvert',
    '!', 'audiorate',
    '!', 'vorbisenc',
    '!', 'queue',
    '!', 'm.',
    'webmmux', 'name=m', 'streamable=true',
    '!', 'queue',
    '!', 'tcpclientsink', 'host=localhost',// 'port=9001'
    'port='+server.address().port
    ];
*/
/*
    args =
    [//'ximagesrc',
    'filesrc', 'location=/var/www/softwarelivre/audiencia_CASE_serpro.ogv',
    '!', 'decodebin', 'name=dec',
    '!', 'ffmpegcolorspace',
    '!', 'timeoverlay',
    '!', 'ffmpegcolorspace',
//    '!', 'videorate',
//    '!', 'video/x-raw-rgb,framerate=20/1',
    '!', 'theoraenc',
    '!', 'queue',
    '!', 'm.', 'dec.',
    '!', 'volume', 'volume=0.8',
    '!', 'audioconvert',
    '!', 'audiorate',
    '!', 'vorbisenc',
    '!', 'queue',
    '!', 'm.', 'oggmux', 'name=m',
    '!', 'tcpclientsink', 'host=localhost',
    'port='+server.address().port];
*/
    args =
    ['--gst-debug-level=2',
//    'ximagesrc',
    'videotestsrc', 'is-live=1',
//    'uridecodebin', "uri=\"http://gonod.softwarelivre.org:8000/tvsl.ogg\"",    
//    'filesrc', 'location=/var/www/softwarelivre/audiencia_CASE_serpro.ogv',
//    '!', 'decodebin name=dec',
    '!', 'queue',
    '!', 'videorate',
    '!', 'video/x-raw-rgb,framerate=2/1',
    '!', 'ffmpegcolorspace',
    '!', 'timeoverlay',
    '!', 'ffmpegcolorspace',    
//    '!', 'videorate',
    '!', 'queue',
    '!', 'theoraenc',"quality=1",
    '!', 'queue',
    '!', 'oggmux', 'name=m',
    '!', 'queue',
    '!', 'tcpserversink','port='+port];
  
        gstMuxer = child.spawn(cmd, args, options);    
        gstMuxer.stderr.on('data', onSpawnError);
        gstMuxer.on('exit', onSpawnExit);
        console.log(args.toString());
    }
}

function onSpawnError(data) {
  console.log(data.toString());
}

function onSpawnExit(code) {
  if (code != null) {
    console.error('GStreamer error, exit code ' + code);
  }
}
