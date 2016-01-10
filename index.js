var Hapi = require('hapi');
var Async = require('async');
var Wreck = require('wreck');
var Hoek = require('hoek');
var Util = require('util');
var _    = require('lodash');
var Boom = require('Boom');

var api_key = 'c7749bb2d38cb84d3a52bcd1cc960a17';
var secreto = 'f9c2f1fda4924672';

var Internals = {
    _defaults:{
        host: 'https://api.flickr.com/services/rest/',
        methods: {
            search: '?method=flickr.photos.search&api_key=' + api_key,
            image: '?method=flickr.photos.getSizes&api_key=' + api_key
        },
        uris: {
            search: function (term, limit, offset) {

                var uri = Util.format("&text=%s", term);

                uri += Util.format("&per_page=%s", limit);
                uri += Util.format("&page=%s", parseInt(offset/limit) + 1);
                uri += '&format=json&nojsoncallback=1';

                return uri;
            },
            image: function(id) {
                return Util.format("&photo_id=%s&format=json&nojsoncallback=1", id);
            }
        }
    },
    initialize: function(options) {
        this.options = Hoek.applyToDefaults(this._defaults, options || {});
    },
    search: function(path, term, limit, offset, callback) {

        limit = limit || 60;
        offset = offset || 0;

        var o = this.options,
            http = {
                method: "GET",
                uri: o.host + o.methods.search + o.uris.search(term, limit, offset),
                options:  {
                    redirects: 3,
                    timeout: 30000,
                    rejectUnauthorized: false
                }
            };

        console.log(http.uri);

        var readResponse = function (err, res) {

            if (err) {
                return callback(err);
            }

            Wreck.read(res, {json:true}, processResponse);
        };

        var processResponse = function (err, response) {

            if (err) {
                return callback(err);
            }

            // respond with a 500 if due to whatever reason no images are found
            if (response.stat !== 'ok') {
                return callback(Boom.wrap(new Error(), 500));
            }

            var first = path + term;

            var last = path + [
                term,
                limit,
                (response.photos.pages - 1) * response.photos.perpage
            ].join('/');

            var next = path + [
                term,
                limit,
                ((response.photos.page + 1) - 1) * response.photos.perpage
            ].join('/');

            var prev = path + [
                term,
                limit,
                ((response.photos.page - 1) - 1) * response.photos.perpage
            ].join('/');


            var res = {
                meta: {
                    self: path + [term, limit, offset].join('/'),
                    page: {
                        offset: (response.photos.page - 1) * response.photos.perpage,
                        limit: response.photos.perpage,
                        total: parseInt(response.photos.total)
                    }
                },
                links: {
                    first: first,
                    next: (response.photos.page > response.photos.pages)? null : next,
                    prev: (response.photos.page === 1)? null : prev,
                    last: last
                },
                data: []
            };

            res.data = response.photos.photo.map(function(photo){
                return {
                    id: photo.id,
                    title: photo.title
                };
            });

            return callback(err, res);
        };

        var req = Wreck.request(http.method, http.uri, http.options, readResponse);
    },
    image: function(path, id, callback) {

        var o = this.options,
            http = {
                method: "GET",
                uri: o.host + o.methods.image + o.uris.image(id),
                options:  {
                    redirects: 3,
                    timeout: 30000,
                    rejectUnauthorized: false
                }
            };
        console.info(http.uri);

        var readResponse = function (err, res) {

            if (err) {
                return callback(err);
            }

            Wreck.read(res, {json:true}, processResponse);
        };

        var processResponse = function (err, response) {


            if (err) {
                return callback(err);
            }

            // respond with a 500 if due to whatever reason no image is found
            if (response.stat !== 'ok') {
                return callback(Boom.wrap(new Error(), 500));
            }

            console.info(response);
            var res = {
                type: "image",
                id: id,
                links: {
                    self: path + '/' + id
                },
                attributes: {
                    sizes: response.sizes.size
                }
            };

            return callback(err, res);
        };

        var req = Wreck.request(http.method, http.uri, http.options, readResponse);
    }
};


var server = new Hapi.Server();
server.connection({
    port: 4000
});

var handlers = Object.create(Internals);
handlers.initialize();

server.bind({handler: handlers});

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

        var getImage = this.handler.image,
            id = request.params.id;

        Async.waterfall([
            Async.apply(getImage.bind(this.handler), server.info.uri + '/image', id)
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
    path: '/{search_term}',
    handler: function (request, reply) {

        var searchTerm = this.handler.search,
            search_term = request.params.search_term,
            limit = request.params.limit,
            offset = request.params.offset;

        Async.waterfall([
            // TODO: find a way to get the path
            Async.apply(searchTerm.bind(this.handler), server.info.uri + '/', search_term, limit, offset)
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

        var searchTerm = this.handler.search,
            search_term = request.params.search_term,
            limit = request.params.limit,
            offset = request.params.offset;

        Async.waterfall([Async.apply(searchTerm.bind(this.handler), server.info.uri + '/', search_term, limit, offset)],
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
