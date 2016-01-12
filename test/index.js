// The structure of the API input/ouput bundaries is very well tested by Joi.js
// I will focus on the assumptions regarding to offset pagination method

var Hapi = require('hapi');
var Code = require('code');
var Lab = require('lab');
var Nock = require("nock");

var Fliquer = require('../plugins/fliquer');

var fliquerOptions =  {
    api_key: "c7749bb2d38cb84d3a52bcd1cc960a17",
    host: "https://api.flickr.com/services/rest/"
};


var lab = exports.lab = Lab.script();
var api;


lab.experiment('Fliquer API', function() {

    lab.beforeEach(function(done) {
        server = this.server = new Hapi.Server();
        server.connection({port: 8000});

        server.register([
            {
                register: Fliquer,
                options:  fliquerOptions
            }
        ]);
        done();
    });

    lab.after(function(done) {

        if (!api.isDone()) {
            throw Error('Pending http mocks' + JSON.stringify(api.pendingMocks()));
        }

        done();
    });

    lab.experiment('Create offset pagination method based on Flickr page pagination', function() {

        var photoList = [
                {
                    id: "24328072465",
                    owner: "124599006@N03",
                    secret: "ebc73c3c3f",
                    server: "1467",
                    title: "Carlos Huertas - #18 Dale Coyne Racing Honda Dallara DW12"
                },
                {
                    id: "23701250323",
                    owner: "124599006@N03",
                    secret: "9eeef4b2be",
                    server: "1508",
                    title: "Carlos Huertas - #18 & James Davison - #19 Dale Coyne Racing Honda Dallara DW12s"
                }
        ];

        lab.experiment('request `first` page fliquer/v1/carlos ', function() {

            var flickrResponse = {
                photos: {
                    page: 1,
                    pages: 5,
                    perpage: 60,
                    total: "300",
                    photo: photoList
                },
                stat: 'ok'
            };

            lab.beforeEach(function(done) {

                // capture http request make to Flickr and mock the response
                api = Nock( fliquerOptions.host, {allowUnmocked: false})
                        .get('/')
                        .query({
                            method: 'flickr.photos.search',
                            api_key: fliquerOptions.api_key,
                            text: 'carlos',
                            per_page: 60,
                            page: 1,
                            format: 'json',
                            nojsoncallback: 1
                        }) .reply(200, flickrResponse);
                done();
            });


            lab.test('Pagination meta information set up', function(done){

                this.server.inject('/fliquer/v1/carlos', function(res) {

                    Code.expect(res.statusCode).to.equal(200);
                    var page = res.result.meta.page;

                    Code.expect(page.offset).to.equal(0);
                    Code.expect(page.limit).to.equal(60);
                    Code.expect(page.total).to.equal(300);

                    api.done();
                    done();
                });
            });


            lab.test('Pagination links are generated', function(done){

                this.server.inject('/fliquer/v1/carlos', function(res) {

                    Code.expect(res.statusCode).to.equal(200);

                    var links = res.result.links;

                    Code.expect(links.first).to.match(/fliquer\/v1\/carlos\/60\/0$/);
                    Code.expect(links.next).to.match(/fliquer\/v1\/carlos\/60\/60$/);
                    Code.expect(links.prev).to.be.null();
                    Code.expect(links.last).to.match(/fliquer\/v1\/carlos\/60\/240$/);

                    api.done();
                    done();
                });
            });

        });


        lab.experiment('request `next` page fliquer/v1/carlos/60/60 ', function() {

            var flickrResponse = {
                photos: {
                    page: 2, // second page
                    pages: 5,
                    perpage: 60,
                    total: 300,
                    photo: photoList
                },
                stat: 'ok'
            };

            lab.beforeEach(function(done) {

                // capture http request make to Flickr and mock the response
                api = Nock( fliquerOptions.host, {allowUnmocked: false})
                        .get('/')
                        .query({
                            method: 'flickr.photos.search',
                            api_key: fliquerOptions.api_key,
                            text: 'carlos',
                            per_page: flickrResponse.photos.perpage,
                            page: flickrResponse.photos.page,
                            format: 'json',
                            nojsoncallback: 1
                        }) .reply(200, flickrResponse);
                done();
            });

            lab.test('Pagination meta information set up', function(done){

                this.server.inject('/fliquer/v1/carlos/60/60', function(res) {

                    Code.expect(res.statusCode).to.equal(200);
                    var page = res.result.meta.page;

                    Code.expect(page.offset).to.equal(60);
                    Code.expect(page.limit).to.equal(60);
                    Code.expect(page.total).to.equal(300);

                    api.done();
                    done();
                });
            });


            lab.test('Pagination links are generated', function(done){

                this.server.inject('/fliquer/v1/carlos/60/60', function(res) {

                    Code.expect(res.statusCode).to.equal(200);

                    var links = res.result.links;

                    Code.expect(links.first).to.match(/fliquer\/v1\/carlos\/60\/0$/);
                    Code.expect(links.next).to.match(/fliquer\/v1\/carlos\/60\/120$/);
                    Code.expect(links.prev).to.match(/fliquer\/v1\/carlos\/60\/0$/);
                    Code.expect(links.last).to.match(/fliquer\/v1\/carlos\/60\/240$/);

                    api.done();
                    done();
                });
            });


        });


        lab.experiment('request `last` page uri fliquer/v1/carlos/60/240 ', function() {

            var flickrResponse = {
                photos: {
                    page: 5, // second page
                    pages: 5,
                    perpage: 60,
                    total: 300,
                    photo: photoList
                },
                stat: 'ok'
            };

            lab.beforeEach(function(done) {

                // capture http request make to Flickr and mock the response
                api = Nock( fliquerOptions.host, {allowUnmocked: false})
                        .get('/')
                        .query({
                            method: 'flickr.photos.search',
                            api_key: fliquerOptions.api_key,
                            text: 'carlos',
                            per_page: flickrResponse.photos.perpage,
                            page: flickrResponse.photos.page,
                            format: 'json',
                            nojsoncallback: 1
                        }) .reply(200, flickrResponse);
                done();
            });

            lab.test('Pagination meta information set up', function(done){

                this.server.inject('/fliquer/v1/carlos/60/240', function(res) {

                    Code.expect(res.statusCode).to.equal(200);
                    var page = res.result.meta.page;

                    Code.expect(page.offset).to.equal(240);
                    Code.expect(page.limit).to.equal(60);
                    Code.expect(page.total).to.equal(300);

                    api.done();
                    done();
                });
            });


            lab.test('Pagination links are generated', function(done){

                this.server.inject('/fliquer/v1/carlos/60/240', function(res) {

                    Code.expect(res.statusCode).to.equal(200);

                    var links = res.result.links;

                    Code.expect(links.first).to.match(/fliquer\/v1\/carlos\/60\/0$/);
                    Code.expect(links.next).to.be.null();
                    Code.expect(links.prev).to.match(/fliquer\/v1\/carlos\/60\/180$/);
                    Code.expect(links.last).to.match(/fliquer\/v1\/carlos\/60\/240$/);

                    api.done();
                    done();
                });
            });

        });


        lab.experiment('request to uri fliquer/v1/carlos/60 ', function() {

            var flickrResponse = {
                photos: {
                    page: 1,
                    pages: 5,
                    perpage: 60,
                    total: 300,
                    photo: photoList
                },
                stat: 'ok'
            };

            lab.beforeEach(function(done) {

                // capture http request make to Flickr and mock the response
                api = Nock( fliquerOptions.host, {allowUnmocked: false})
                        .get('/')
                        .query({
                            method: 'flickr.photos.search',
                            api_key: fliquerOptions.api_key,
                            text: 'carlos',
                            per_page: flickrResponse.photos.perpage,
                            page: flickrResponse.photos.page,
                            format: 'json',
                            nojsoncallback: 1
                        }) .reply(200, flickrResponse);
                done();
            });

            lab.test('fallback to uri filter/v1/60/0', function(done){

                this.server.inject('/fliquer/v1/carlos/60', function(res) {
                    Code.expect(res.statusCode).to.equal(200);
                    var page = res.result.meta.page;
                    Code.expect(page.offset).to.equal(0);
                    api.done();
                    done();
                });
            });
        });
    });

});
