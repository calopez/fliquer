var Joi = require('joi'),
    Hoek = require('hoek'),
    Images = require('./handlers/images'),
    urlRegex = /^https?:\/\//; /*  TODO: create better regex for url validation */

var offset = Joi.number().integer().min(0).default(0).description('Offset of the first result to return');
var limit = Joi.number().integer().min(1).default(60).description('Maximum number of results to return');
var total = Joi.number().integer().min(1).description('Total number of results available');

var metaPage = {
    offset: offset.required(),
    limit: limit.required(),
    total: total.required()
};

var getImageResponseModel =  Joi.object().keys({

    type: Joi.string().alphanum().required().description('Resource type'),
    id: Joi.string().regex(/^\d+$/).required(),
    links: Joi.object().keys({
        self: Joi.string().regex(urlRegex).required()
            .description(' Link that identifies the resource represented by the resource object')
    }).required(),
    attributes: Joi.object().keys({
        sizes: Joi.array().items(Joi.object().keys({
            label: Joi.string().regex(/\w+/).required().description('Size description'),
            width: Joi.number().integer().required(),
            height: Joi.number().integer().required(),
            source: Joi.string().regex(urlRegex).required().description('Download link of the image'),
            url: Joi.string().regex(urlRegex).required(),
            media: Joi.string().alphanum().required()
        })).required()
    })

});
var searchResponseModel = Joi.object().keys({
    meta: Joi.object().keys({
        self: Joi.string().regex(urlRegex).required(),
        page: Joi.object().keys(metaPage).required()
    }).required().description('Meta information about pagination'),

    links: Joi.object().keys({
        first: Joi.string().regex(urlRegex).required(),
        next: Joi.alternatives().try(Joi.string().regex(urlRegex), Joi.any()),
        prev: Joi.alternatives().try(Joi.string().regex(urlRegex), Joi.any()),
        last: Joi.string().regex(urlRegex).required()
    }).required().description('The standard JSON API `next`, `prev`, `first`, and `last`') ,

    data: Joi.array().items(Joi.object().keys({
        type: Joi.string().alphanum().required(),
        id: Joi.string().regex(/^\d+$/).required(),
        title: Joi.any().required()
    })).required()
}).description('Json object for search image.');


var searchHTTPStatus = {
    500: {
        description: 'Internal Server Error'
    }
};

var Notes = function() {


    var notes =  [
        'The fliquer API uses simple offset and limit-based pagination. '+
        'Paginated resources will include the standard JSON API `next`, `prev`, `first`, and `last` ' +
        'pagination links in the top-level `links` object when they are not `null`. ',

        'In addition, a `page` member will be added to the top-level `meta` object '+
        'that includes the following members: `offset`, `limit`, and `total`. The ' +
        '`total` member represents the total count of resources in the paginated ' +
        'collection. You can use the `offset` and `limit` members to construct your ' +
        'own custom pagination links with the query parameters `offset` and`limit`.'
    ];

    this.search = notes.slice();
    this.search.push('By default the api use a `offset` of 0 and a `limit` of 60.');

    this.searchLimit = notes.slice();
    this.searchLimit.push('By default the api use a `offset` of 0.');

    this.searchLimitOffset = notes;

};

var notes = new Notes();

var routePlugins = {
        'hapi-swagger': {
            responses: searchHTTPStatus
        }
};
var getImageResponse = {schema: getImageResponseModel};
var searchResponse = {schema:  searchResponseModel};

function Routes() {

    var imagesHandlers = new Images();

    var defaultHandler = function (request, reply) {
        request.route.inner_path = '/fliquer/v1/{search_term}/{limit}/{offset}';
        imagesHandlers.search(request, reply);
    };

    this.routes = [
        {
            method: 'GET',
            path: '/favicon.ico',
            handler: function(request, reply) {
                // TODO: include your own favicon
                reply('favicon');
            }
        },
        {
            method: 'GET',
            path: '/fliquer/v1/image/{id}',
            config: {
                validate: {
                    params: Joi.object().keys({
                        id: Joi.string().alphanum().min(1).max(30).required()
                    })
                },
                description: 'Get Image by the id in the path',
                notes: 'Returns a image resource (list of sizes) by the id passed in the path',
                tags: ['api'],
                response: getImageResponse,
                handler: imagesHandlers.get
            }
        },
        {
            method: 'GET',
            path: '/fliquer/v1/{search_term}',
            config: {
                validate: {
                    params: Joi.object().keys({
                        search_term: Joi.string().alphanum().min(3).max(20)
                            .required().description('search criteria'),
                        limit: limit,
                        offset: offset
                    })
                },
                description: 'Search for images by the search term in the path',
                notes: notes.search,
                tags: ['api'],
                plugins: routePlugins,
                response: searchResponse,
                handler: defaultHandler
            }
        },
        {
            method: 'GET',
            path: '/fliquer/v1/{search_term}/{limit}',
            config: {
                validate: {
                    params: Joi.object().keys({
                        search_term: Joi.string().alphanum().min(3).max(20)
                            .required().description('search criteria'),
                        limit: limit.required()
                    })
                },
                description: 'Search for images by the search term in the path',
                notes: notes.searchLimit,
                tags: ['api'],
                plugins: routePlugins,
                response: searchResponse,
                handler: defaultHandler
            }
        },
        {
            method: 'GET',
            path: '/fliquer/v1/{search_term}/{limit}/{offset}',
            config: {
                validate: {
                    params: Joi.object().keys({
                        search_term: Joi.string().alphanum().min(3).max(20)
                            .required().description('search criteria'),
                        limit: limit.required(),
                        offset: offset.required()
                    })
                },
                description: 'Search for images by the search term in the path',
                notes: notes.searchLimitOffset,
                tags: ['api'],
                plugins: routePlugins,
                response: searchResponse,
                handler: imagesHandlers.search
            }
        }
    ];
}

module.exports = Routes;

