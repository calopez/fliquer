var Hapi = require('hapi');

var server = new Hapi.Server();
server.connection({
    port: 4000
});


server.route({
    method: 'GET',
    path: '/{search_term}',
    handler: function(request, reply) {
        reply('Search Term: ' + encodeURIComponent(request.params.search_term));
    }
});

server.route({
    method: 'GET',
    path: '/{search_term}/{limit}',
    handler: function(request, reply) {


        reply({
            search_term: request.params.search_term,
            limit: request.params.limit
        });
    }
});

server.route({
    method: 'GET',
    path: '/{search_term}/{limit}/{offset}',
    handler: function(request, reply) {

        reply({
            search_term: request.params.search_term,
            limit: request.params.limit,
            offset: request.params.offset
        });
    }
});
server.route({
    method: 'GET',
    path: '/image/{id}',
    handler: function(request, reply) {
        reply('Image: ' + encodeURIComponent(request.params.id));
    }
});

server.start(function() {
    console.log('Server running at:', server.info.uri);
});
