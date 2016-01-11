var Hapi = require('hapi');
var Routes = require('./routes.js');

exports.register = function (server, options, next) {
    server.route(new Routes(options).routes);
    next();
};

exports.register.attributes = require('./package');



