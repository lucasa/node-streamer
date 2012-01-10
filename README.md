Nodestreamer
============

Nodestreamer is a set of experiments with multimedia live streaming using nodejs and gstreamer pipelines. All the streaming "magic" is done by the gstreamer element "tcpserversink" that can handle multiple socket connections gracefully.


VIDEO STREAMING
---------------

Simple experiment with ogg theora streaming.

    Command line: "node node-streamer.js"
    Live video url: http://localhost:8003/stream
    Monitoring webpage (need a borwser that supports websockets): http://localhost:8003/



TRANSCODING AND STREAMING
---------------

Live transcoding of audio streams from RTMP, OGG, MP3, WMV to Ogg+Vorbis or MP3.

    Command line: "node node-transcoder-ogg-mp3.js URL STREAM_FILE_OUT[.mp3 or .ogg] PORT"
    Example: "node node-transcoder-ogg-mp3.js mms://karazhan.senado.gov.br/wmtencoder/radio.wmv senado.ogg 9100"
    The output url is: http://localhost:9100/senado.ogg

Live transcoding of video streams from RTMP, OGG, WebM, WMV to Ogg+Theora or WebM.

    Command line: "node node-transcoder-ogg-thera.js URL STREAM_FILE_OUT[.webm or .ogg] PORT"
    Example: "node node-transcoder-ogg-theora.js mms://midia.al.rs.gov.br/tval assembeliars.ogg 1234"
    The output url is: http://localhost:1234/assembeliars.ogg


TODO
----

- Improve fault tolerance.
- Support output RTMP streaming.
- When avaiable, use a javascript native gstreamer binding.

DONE: Implement live transcoding from mp3 to ogg and vice versa.
DONE: Live video transcoding.

