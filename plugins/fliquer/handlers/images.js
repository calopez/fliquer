var Async = require('async');
var URI = require('urijs');
var URITemplate = require('urijs/src/URITemplate');
var flickrApi = require('./helpers/flickrApiWrapper.js');

function Images(options) {

    flickrApi.initialize(options);

    this.get = function(request, reply) {

        var getImage = flickrApi.getImage,
            id = request.params.id,
            uri = request.server.info.uri + request.route.path,
            template = new URITemplate(uri);

        Async.waterfall([
                Async.apply(getImage.bind(flickrApi), template, id)
            ],
            function(err, result) {
                return reply(err ? err : result);
            });
    };

    this.search = function(request, reply) {

        var searchTerm = flickrApi.searchImages,
            term = request.params.search_term,
            limit = request.params.limit,
            offset = request.params.offset,
            uri = request.server.info.uri + (request.route.inner_path || request.route.path),
            template = new URITemplate(uri.replace(/\?/, ''));

        Async.waterfall([
                Async.apply(searchTerm.bind(flickrApi), template, term, limit, offset)
            ],
            function(err, result) {
                return reply(err ? err : result);
            });
    };
}

module.exports = Images;
