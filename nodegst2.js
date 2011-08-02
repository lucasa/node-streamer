var express = require('express')
var net = require('net');
var child = require('child_process');
var io = require('socket.io');
var cmd = 'gst-launch';
var args = '';
var options = null;
  // {env: {LD_LIBRARY_PATH: '/usr/local/lib',
  // PATH: '/usr/local/bin:/usr/bin:/bin'}};

var args =
    [
//    'ximagesrc',
    'videotestsrc', 'is-live=1',
    '!', 'videoscale',
    '!', 'videorate',
    '!', 'video/x-raw-rgb,framerate=3/1,width=400,height=300',
    '!', 'ffmpegcolorspace',
    '!', 'timeoverlay',
    '!', 'ffmpegcolorspace',
    '!', 'theoraenc',
    //'max-latency=2', 'max-keyframe-distance=30',
    '!', 'queue',
    '!', 'm.', 'audiotestsrc', //'audiotestsrc',
    '!', 'volume', 'volume=0.1',
    '!', 'audioconvert',
    '!', 'audiorate',
    '!', 'vorbisenc',
    '!', 'queue',
    '!', 'm.', 'oggmux', 'name=m',
    '!', 'tcpserversink',
//    'port='+server.address().port];
    'port=9000'];
/*
    args =
    [//'ximagesrc',
    'filesrc', 'location=/var/www/softwarelivre/audiencia_CASE_serpro.ogv',
    '!', 'decodebin name=dec',
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
/*    
    args =
    [//'ximagesrc',
    'filesrc', 'location=/var/www/softwarelivre/audiencia_CASE_serpro.ogv',
    '!', 'decodebin name=dec',
    '!', 'ffmpegcolorspace',
    '!', 'timeoverlay',
    '!', 'ffmpegcolorspace',
//    '!', 'videorate',
//    '!', 'video/x-raw-rgb,framerate=20/1',
    '!', 'theoraenc',
    '!', 'queue',
    '!', 'oggmux', 'name=m',
    '!', 'tcpclientsink', 'host=localhost',
    'port='+server.address().port];
*/

var server = express.createServer(); 

var global_socket = null;
var global_res = [];
var first = true;

server.get('/', function(req, res) {

  var date = new Date();
  res.writeHead(200, {
    'Date':date.toUTCString(),
    'Connection':'close',
    'Cache-Control':'private',
    'Content-Type':'video/ogg',
    'Server':'CustomStreamer/0.0.1',
    });
  
  global_res.push(res);
  
/*  if(first) {
      var bcast = net.createServer(function (socket) {
    //  socket.write("Echo server\r\n");
        console.log("broadcast socket ON");
        //global_socket.pipe(socket);
        socket.on('data', function (data) {
          console.log("send data to " + global_res.length + " clients");
          console.log("write");
          for(r in global_res) {
             global_res[r].write(data);
          }
//          res.write(data);
        });
        socket.on('close', function(had_error) {
          for(r in global_res) {
              global_res[r].end();
          }
        });
      });
      bcast.listen(9000);
  }
*/
  var server = net.createServer(function (socket) {  });
  
  if(false && first) {
      console.log("need to start gstreamer");
      server.listen(function() {
            console.log(args.toString());
            var gstMuxer = child.spawn(cmd, args, options);
            console.log("gstreamer server active");
            gstMuxer.stderr.on('data', onSpawnError);
            gstMuxer.on('exit', onSpawnExit);

            res.connection.on('close', function() {
              gstMuxer.kill();
            });
      });
  }
  
  var stream = net.createConnection(9000);
  stream.addListener("connect", function() {
        console.log("new client connected");
  });
  stream.addListener("data", function(data) {
        console.log("new data");
  });
  
 first = false;
 
});

server.listen(9001);


function onSpawnError(data) {
  console.log(data.toString());
}

function onSpawnExit(code) {
  if (code != null) {
    console.error('GStreamer error, exit code ' + code);
  }
}

process.on('uncaughtException', function(err) {
  console.debug(err);
});


