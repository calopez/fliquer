var Hapi = require('hapi');
var Async = require('async');
var Wreck = require('wreck');
var Hoek = require('hoek');
var Util = require('util');

var api_key = 'c7749bb2d38cb84d3a52bcd1cc960a17';
var secreto = 'f9c2f1fda4924672';
// https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=c7749bb2d38cb84d3a52bcd1cc960a17&text=undefined&per_page=60&page=1&format=json
// https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=44ae497a4c4a7f8eb0dee6d4489cf84a&text=Lion&per_page=10&page=2&format=json&nojsoncallback=1

var Internals = {
    _defaults:{
        host: 'https://api.flickr.com/services/rest/',
        methods: {
            search: '?method=flickr.photos.search&api_key=' + api_key,
            image: 'still dont know'
        },
        uris: {
            search: function (term, limit, offset) {

                var uri = Util.format("&text=%s", term);

                limit = limit || 60;
                offset = offset || 0;

                uri += Util.format("&per_page=%s", limit);
                uri += Util.format("&page=%s", parseInt(offset/limit) + 1);
                uri += '&format=json';

                return uri;
            },
            image: function(id) {
                return Util.format("/image/%s", id);
            }
        }
    },
    initialize: function(options) {
        this.options = Hoek.applyToDefaults(this._defaults, options || {});
    },
    searchTerm: function(term, limit, offset, callback) {

        console.log('calling searchTerm');
        var o = this.options,
            http = {
                method: "GET",
                uri: o.host + o.methods.search + o.uris.search(term, limit, offset),
                options:  {
                    json: true,
                    redirects: 3,
                    timeout: 30000,
                    rejectUnauthorized: false
                }
            };
        console.log(http.uri);

        var processResponse = function (err, body) {
            // Leave room in case response modification required

            if (err) {
                return callback(err);
            }
            // TODO: change the page attribute in the response by offset which is page * per_page
            return callback(err, body);
        };

        var req = Wreck.request(http.method, http.uri, http.options, processResponse);
    }
};


var server = new Hapi.Server();
server.connection({
    port: 4000
});

var handlers = Object.create(Internals);
handlers.initialize();

server.bind({qq: handlers});

server.route({
    method: 'GET',
    path: '/favicon.ico',
    handler: function(request, reply) {
        reply('favicon');
    }
});

server.route({
    method: 'GET',
    path: '/image/{id}',
    handler: function(request, reply) {
        reply('Image: ' + encodeURIComponent(request.params.id));
    }
});

server.route({
    method: 'GET',
    path: '/{search_term}',
    handler: function (request, reply) {

        var searchTerm = this.qq.searchTerm,
            search_term = request.params.search_term,
            limit = request.params.limit,
            offset = request.params.offset;

        Async.waterfall([
            Async.apply(searchTerm.bind(this.qq), search_term, limit, offset)
        ],
                        function (err, result) {

                            if (err) {
                                return reply(err);
                            }
                            return reply(result);
                        });

    }
});

server.route({
    method: 'GET',
    path: '/{search_term}/{limit}/{offset?}',
    handler: function(request, reply) {

        var searchTerm = this.qq.searchTerm,
            search_term = request.params.search_term,
            limit = request.params.limit,
            offset = request.params.offset;

        Async.waterfall([Async.apply(searchTerm.bind(this.qq), search_term, limit, offset)],
                        function (err, result) {

                            if (err) {
                                return reply(err);
                            }
                            return reply(result);
                        });
    }
});

server.start(function() {
    console.log('Server running at:', server.info.uri);
});
