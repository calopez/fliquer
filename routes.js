var Images = require('./handlers/images');

module.exports = [
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
        handler: Images.get
    },
    {
        method: 'GET',
        path: '/{search_term}',
        handler: function (request, reply) {
            // This route exist because hapi only support one optional parameter,
            // the last one of the route. So I 'decorate' the request for the purpose of -
            // let the Images.search handler to know the route which I expect the current one to be.
            // this is ok here since limit and offset have default values.

            // I could have done it in the Images.search handler however I prefer do it
            // in this way and here since this function is visibly near to the route definition.
            request.route.inner_path = '/{search_term}/{limit}/{offset}';
            Images.search(request, reply);
        }
    },
    {
        method: 'GET',
        path: '/{search_term}/{limit}/{offset?}',
        handler: Images.search
    }
];
