var Hapi = require('hapi');
var Routes = require('./routes.js');
var attributes = require('./package');


exports.register = function (server, options, next) {
    server.route(new Routes().routes);
    next();
};

exports.register.attributes = attributes;

exports.register.attributes = {
    pkg: require('./package.json'),
    dependencies: 'hapi-swagger'
};

