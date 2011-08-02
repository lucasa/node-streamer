var http = require('http'),
    sys = require('sys'),
    querystring = require('querystring');
 
http.createServer(function(request, response)
{
    sys.puts('Request for ' + request.url);
 
    switch (request.url)
    {
        case '/':
            response.writeHead(200, { 'Content-Type' : 'text/html' });
            response.write(
                '<form action="/cadastrar" method="post">' +
            'Nome: <input type="text" name="nome"><br />' +
            'Email: <input type="text" name="email"><br />' +
            'Telefone: <input type="text" name="telefone"><br />' +
            '<input type="submit" value="Submit">' +
            '</form>'
            );
            response.end();
            break;
        case '/cadastrar':
            response.writeHead(200, { 'Content-Type' : 'text/html' });
          post_handler(request, function(request_data){
              response.write(
                    'JSON object:<br />' +
                    '<pre>' + sys.inspect(request_data) + '</pre>' +
                    '<hr>' +
                    'Dados:<br />' +
                    'Nome: <strong>' + request_data.nome + '</strong><br />' +
                    'Email: <strong>' + request_data.email + '</strong><br />'+
                    'Telefone: <strong>' + request_data.telefone + '</strong><br />'
              );
                  response.end();
            });
            break;
         default:
            response.writeHead(400, { 'Content-Type' : 'text/html' });
            response.write(
                    'Pagina nao encontrada!'
                    );
                  response.end();
       };
}).listen(8001);
console.log("Servidor rodando na porta 8001");
 
function post_handler(request, callback)
{
    var _REQUEST = { };
    var _CONTENT = '';
 
    if (request.method == 'POST')
    {
        request.addListener('data', function(chunk)
    {
        _CONTENT+= chunk;
    });
 
    request.addListener('end', function()
    {
            _REQUEST = querystring.parse(_CONTENT);
        callback(_REQUEST);
    });
    };
};
