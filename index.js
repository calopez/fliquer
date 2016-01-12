var Confidence = require('confidence');
var Glue = require('glue');
var Hoek = require('hoek');

// Heroku require set up the PORT- init
var jsonfile = require('jsonfile');
var configuration = jsonfile.readFileSync('./config.json');
delete configuration.connections.production;
Hoek.merge(configuration, {connections: {production: [{ port: process.env.PORT, labels: ['api'] }]}});
// Heroku require set up the PORT- end

var manifest = new Confidence.Store(configuration).get('/', {
    env: process.env.NODE_ENV
});

var options = { relativeTo: __dirname };

Glue.compose(manifest, options, function (err, server) {


    Hoek.assert(!err, err);
    server.start(function (err){

        Hoek.assert(!err, err);
        console.log('Server started at: ' + server.info.uri);
    });
});
