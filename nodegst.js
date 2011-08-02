var express = require('express')
var net = require('net');
var child = require('child_process');
var io = require('socket.io');
var cmd = '/usr/bin/gst-launch-0.10';
var args = '';
var options = null;
  // {env: {LD_LIBRARY_PATH: '/usr/local/lib',
  // PATH: '/usr/local/bin:/usr/bin:/bin'}};
var gstMuxer = null;
var dataToWrite = null;
var clients = [];

function onSpawnError(data) {
  console.log(data.toString());n
}

function onSpawnExit(code) {
  if (code != null) {
    console.error('GStreamer error, exit code ' + code);
  }
}

function spawGstreamer(server) {
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
    ['--gst-debug-level=3','ximagesrc',
    //'filesrc', 'location=/var/www/softwarelivre/audiencia_CASE_serpro.ogv',
//    '!', 'decodebin name=dec',
    '!', 'queue',
    '!', 'ffmpegcolorspace',
    '!', 'timeoverlay',
    '!', 'ffmpegcolorspace',    
//    '!', 'videorate',
//    '!', 'video/x-raw-rgb,framerate=20/1',
    '!', 'queue',
    '!', 'vp8enc',
    '!', 'queue',
    '!', 'webmmux', 'name=m',
    '!', 'queue',
    '!', 'progressreport',    
    '!', 'tcpclientsink', 'host=localhost',
    'port='+server.address().port];
  
        gstMuxer = child.spawn(cmd, args, options);    
        gstMuxer.stderr.on('data', onSpawnError);
        gstMuxer.on('exit', onSpawnExit);
        console.log(args.toString());
        console.log("running gstreamer "+ server);
    }
}
var app = express.createServer();
var server = null;

app.get('/', function(req, res) {
    var date = new Date();
    res.writeHead(200, {
        'Date':date.toUTCString(),
        'Connection':'close',
        'Cache-Control':'private',
        'Content-Type':'video/webm',
        'Server':'CustomStreamer/0.0.1',
    });
    console.log("new client...");
    console.log("server writing header");
    
    clients.push(res);

    //if(server == null)
    {
        server = net.createServer(function (socket) {
              socket.on('data', function (data) {
              dataToWrite = data;
              for(c in clients) {
                try {
                  console.log("server write data "+data.length+ " bytes to client "+c);
                  clients[c].write(data);
                } catch (err) {
                    console.log("Error "+err);
                }
              }
            });
            socket.on('close', function(had_error) {
              for(c in clients) {
                try {
                  console.log("server client "+c+" end.");
                  clients[c].end();
                } catch (err) {
                    console.log("Error "+err);
                }
              }
            });
        });
        
        server.listen(function() {
            spawGstreamer(server);
            res.connection.on('close', function() {
                console.log("client closed");
                //console.log("removing client "+res);
                //clients.remove(res);
                //gstMuxer.kill();
            });
        });
    }
}); 

app.listen(9001);

/*var socket = new io.Socket('localhost', {port:9000});
socket.connect();
socket.send('some data');
socket.addEvent('message', function(data){
   alert('got some data' + data);
});*/


console.log("server running");

process.on('uncaughtException', function(err) {
  console.debug(err);
});
