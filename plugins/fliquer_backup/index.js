var Hapi = require('hapi');
var Routes = require('./routes.js');



var server = new Hapi.Server();
server.connection({
    port: 4000
});

server.route(Routes);

// server.on('request-error', function (request, response) {
//     console.log('request-error:');
// });


server.start(function() {
    console.log('Server running at:', server.info.uri);
});
