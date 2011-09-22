
Nodestreamer
============

Nodestreamer is a experiment with live audio and video streaming using nodejs and gstreamer pipelines. All the streaming "magic" is done by the gstreamer element "tcpserversink" that can handle multiple socket connections gracefully.


VIDEO STREAMING
---------------

- Simple experiment with ogg theora streaming.
Command line: "node node-streamer.js"
Live video url: http://localhost:8003/stream
Monitoring webpage (need a borwser that supports websockets): http://localhost:8003/



AUDIO STREAMING
---------------

- Live transcoding of audio streams from RTMP, OGG, MP3, WMV to Ogg or MP3.
Command line: "node node-transcoder-ogg-mp3.js URL STREAM_FILE_OUT[.mp3 or .ogg] PORT"
Example: "node node-transcoder-ogg-mp3.js mms://karazhan.senado.gov.br/wmtencoder/radio.wmv senado.ogg 9100"
The output url is: http://localhost:9100/senado.ogg


TODO

- DONE: Implement live transcoding from mp3 to ogg and vice versa.
- Live video transcoding.
- Improve fault tolerance.
- Support output RTMP streaming.
- When avaiable, use a javascript native gstreamer binding.

