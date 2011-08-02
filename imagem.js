var URL = require('url'),
    sURL = 'http://softwarelivre.org/articles/0021/5721/wikipedia-Gnulinux.png?1276286225',
    oURL = URL.parse(sURL),
    http = require('http'),
    client = http.createClient(23456, oURL.hostname),
    request = client.request('GET', oURL.pathname, {'host': oURL.hostname})
;
//var Png = require('png'); 

http.createServer(function (req, res) {
    var url = req.url.substr(1);
    var oURL = URL.parse(url);
    var options = {
      host:  oURL.hostname,
      port: 80,
      path:  oURL.pathname
    };
    //console.log(options);
    
    http.get(options, function(gres) {
        res.writeHead(200, {'Content-Type': 'text/html'});    
        var data = '';
        
        console.log(options);
        console.log("Got response: " + gres.statusCode);
        
        gres.on('data', function (chunk) {
            //console.log(chunk);
            data += chunk;
        });
        gres.on('end', function (chunk) {
            //if(chunk)
              //  data += chunk;
            var prefix = "data:" + gres.headers["content-type"] + ";base64,";
            //res.write("base64...");
            var base64 = new Buffer(data, 'binary').toString('base64');
            var img = prefix + base64;
            //console.log(data);
            //res.write(img);
            res.write("\n<img src=\""+img+"\">");
            res.write("\n<img src=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==\">"); //http://upload.wikimedia.org/wikipedia/commons/3/31/Red-dot-5px.png
            res.end();
        });
        gres.on('error', function(e) {
            console.log("Got error on remote image loading: " + e.message);
        });
        
        //console.log(gres);
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
    });
}).listen(2345);

function image(width, height){   
    var p = new Png(height, width, 50);
    var background = p.color(1, 1, 1, 1);
    return 'data:image/png;base64,'+p.getBase64();
}

