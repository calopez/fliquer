var Joi = require('joi'),
    Images = require('./handlers/images'),
    urlRegex = /^https?:\/\//, /*  TODO: create better regex for url validation */
    searchSquemaValidation = Joi.object().keys({
        meta: Joi.object().keys({
            self: Joi.string().regex(urlRegex),
            page: Joi.object().keys({
                offset: Joi.number().integer().min(0).required(),
                limit: Joi.number().integer().min(10).required(),
                total: Joi.number().integer().min(1).required()
            })
        }),
        links: Joi.object().keys({
            first: Joi.string().regex(urlRegex),
            next: Joi.alternatives().try(Joi.string().regex(urlRegex), Joi.any()),
            prev: Joi.alternatives().try(Joi.string().regex(urlRegex), Joi.any()),
            last: Joi.string().regex(urlRegex)
        }) ,
        data: Joi.array().items(Joi.object().keys({
            type: Joi.string().alphanum().required(),
            id: Joi.string().regex(/^\d+$/).required(),
            title: Joi.any()
        })).required()
    });

function Routes(options) {
    var imagesHandlers = new Images(options);

    this.routes = [
        {
            method: 'GET',
            path: '/favicon.ico',
            handler: function(request, reply) {
                // TODO: include you own favicon
                reply('favicon');
            }
        },
        {
            method: 'GET',
            path: '/image/{id}',
            handler: imagesHandlers.get
        },
        {
            method: 'GET',
            path: '/{search_term}',

            config: {
                validate: {
                    params: Joi.object().keys({
                        search_term: Joi.string().alphanum().min(3).max(20).required()
                    })
                },
                response: {
                    schema:  searchSquemaValidation
                },
                handler:function (request, reply) {
                    // This route exist because hapi only support one optional parameter
                    // (the last one of the route). So I 'decorate' the request for the purpose of -
                    // let the Images.search handler to know the route which I expect the current one to be.
                    // this is ok here since limit and offset have default values.

                    // I could have done it in the Images.search handler however I prefer do it
                    // in this way and here since this function is visibly near to the route definition.
                    request.route.inner_path = '/{search_term}/{limit}/{offset}';
                    imagesHandlers.search(request, reply);
                }
            }
        },
        {
            method: 'GET',
            path: '/{search_term}/{limit}/{offset?}',
            config: {
                validate: {
                    params: Joi.object().keys({
                        search_term: Joi.string().alphanum().min(3).max(20).required(),
                        limit: Joi.number().integer().min(10).max(100),
                        offset: Joi.number().integer().min(0)
                    })
                },
                response: {
                    schema:  searchSquemaValidation
                },
                handler: imagesHandlers.search
            }
        }
    ];
}

module.exports = Routes;

