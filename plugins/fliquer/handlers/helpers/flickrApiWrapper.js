var Util = require('util');
var Wreck = require('wreck');
var Boom = require('boom');

var FlickrAPI = {
    options: {
        host: null,
        api_key: null,
        methods: {
            search: '?method=flickr.photos.search',
            image: '?method=flickr.photos.getSizes'
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
        },
        pagination: {
            defaults: {
                offset: 0,
                limit: 60
            }
        }
    },
    initialize: function(options) {
        var key;

        if (options.host && options.api_key && this.options.api_key === null) {

            this.options.api_key = options.api_key;

            key = "&api_key=" + options.api_key;
            this.options.host = options.host;
            this.options.methods.search += key;
            this.options.methods.image += key;

        } else if (this.options.api_key === null) {
            throw Error('Not host or api_key provided for flickr');
        }
    },
    searchImages: function(template, term, limit, offset, callback) {

        var defaultLimit = 60, defaultOffset = 0;

        limit = limit || defaultLimit;
        offset = offset || defaultOffset;

        var o = this.options,
            http = {
                method: "GET",
                uri: o.host + o.methods.search + o.uris.search(term, limit, offset),
                options:  {
                    redirects: 1,
                    timeout: 30000,
                    rejectUnauthorized: true
                }
            };

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
            if (response.stat !== 'ok' || parseInt(response.photos.total) === 0) {
                return callback(Boom.wrap(new Error(), 500));
            }

            var expandUri = function (param) {
                param = param || {};
                // offset could be 0 which for the '||' operator of js is the same as undefined
                // 'limit' is required be more than 0 in the input boundaries
                var _offset = (param.offset !== undefined) ? param.offset : offset;

                return template.expand({
                    search_term: param.term || term,
                    limit: param.limit || limit,
                    offset: _offset
                });
            };

            var first = expandUri({limit: defaultLimit, offset: defaultOffset});
            var last = expandUri({ offset: (response.photos.pages - 1) * response.photos.perpage});
            var next = expandUri({ offset: ((response.photos.page + 1) - 1) * response.photos.perpage});
            var prev = expandUri({ offset: ((response.photos.page - 1) - 1) * response.photos.perpage});

            var res = {
                meta: {
                    self: expandUri(),
                    page: {
                        offset: (response.photos.page - 1) * response.photos.perpage,
                        limit: response.photos.perpage,
                        total: parseInt(response.photos.total)
                    }
                },
                links: {
                    first: first,
                    next: (response.photos.page >= response.photos.pages)? null : next,
                    prev: (response.photos.page === 1)? null : prev,
                    last: last
                },
                data: []
            };

            res.data = response.photos.photo.map(function(photo){
                return {
                    type: 'image',
                    id: photo.id,
                    title: photo.title
                };
            });

            return callback(err, res);
        };

        var req = Wreck.request(http.method, http.uri, http.options, readResponse);
    },
    getImage: function(template, id, callback) {

        var o = this.options,
            http = {
                method: "GET",
                uri: o.host + o.methods.image + o.uris.image(id),
                options:  {
                    redirects: 1,
                    timeout: 30000,
                    rejectUnauthorized: true
                }
            };

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

            var res = {
                type: "image",
                id: id,
                links: {
                    self: template.expand({id: id})
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

var wrapper = Object.create(FlickrAPI);

module.exports = wrapper;
