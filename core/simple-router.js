// exports
var exp = module.exports = exports;
var parseURL = require('url').parse,
	fs = require('fs'),
	util = require('util');

const METHOD_GET = 'get';
const METHOD_POST = 'post';
const METHOD_UNKNOWN = 'unknown';

const KEY_METHOD = 'method';
const KEY_ROUTE = 'route';

/*
	// demo
	var router = require('node-simple-router').newSimpleRouter();
	router
		.get('/login', function(req, res, data){
				
			})
		.post('/check', function(req, res, data){
				router.redirect('/order', req, res); // --> redirect route
			})
		.post('/order', function(req, res, data){
				
			})
		.push('put', '/file', function(req, res, data){
		
			})
		;
		
	http.createServer(router).listen(80).on('error', function(e){
		console.log('err', e);
	})
*/

// public function
exp.createRouter = function() {
	var router = function(req, res) {
		parse.call(router, req, res);
	};
	configRouter.call(router);
	return router;
}

// internal implementation
// init / configure target router
function configRouter() {
	var self = this,
		methods = self.methods = {},
		get_cbs = methods[METHOD_GET] = {},
		post_cbs = methods[METHOD_POST] = {},
		
		// about unknown methods and routes
		unknowns = self.unknowns = {}
		;
		
	self.methods = methods;
	// for chained invoking
	self.get = function (path, callback) { /* callback(req, res, extras) */
		get_cbs[path] = callback;
		return self;
	};
	
	self.post = function (path, callback) { /* callback(req, res, extras) */
		post_cbs[path] = callback;
		return self;
	};
	
	self.unKnownMethod = function (callback) { /* callback(req, res, extras) */
		unknowns[KEY_METHOD] = callback;
		return self;
	};
	
	// push a new configure with target method and route
	self.push = function (method, route, callback){ /* callback(req, res, extras) */
		method = method.toLowerCase();
		var target_method_cbs = methods[method] = methods[method] || {};
		target_method_cbs[route] = callback;
		return self;
	};
	
	self.unKnownRoute = function (callback) { /* callback(req, res, extras) */
		unknowns[KEY_ROUTE] = callback;
		return self;
	};
	
	self.redirect = function (route, req, res) {
		var extras = generateExtraData(req, res);
		var method = extras.method;
		var target_method_routes = methods[method] || {};
		var target_method_cbs = target_method_routes[route];
		if (target_method_cbs) {
			extras.pathname = route;
			target_method_cbs(req, res, extras);
		}
		return self;
	};
	
	self.__dispatchUnknown = function (key, req, res, others) {
		var tar = unknowns[key];
		if (tar) {
			tar(req, res, others);
		} else {
			// just end it
			res.end();
		}
	};
}

function parse(req, res) {
	var self = this;
	
	var extras = generateExtraData(req, res);
	console.log('router req extras = %s', util.inspect(extras));
	
	var tar_method = self.methods[extras.method];
	var tar_route = extras.pathname;
	if (tar_method) {
		var cb_ofpath = tar_method[tar_route];
		if (cb_ofpath) {
			cb_ofpath(req, res, extras);
		} else {
			// no matched paths
			self.__dispatchUnknown(KEY_ROUTE, req, res, extras);
		}
	} else {
		// no matched methods
		self.__dispatchUnknown(KEY_METHOD, req, res, extras);
	}
}

/*
req
	headers: { 
		host: 'localhost', --> 请求中的host
		connection: 'keep-alive',
		accept: '*\/*',
		'user-agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.131 Safari/537.36',
		'accept-encoding': 'gzip,deflate,sdch',
		'accept-language': 'zh-CN,zh;q=0.8,en;q=0.6' 
	},
	url: '/favicon.ico',
	method: 'GET',
*/
function generateExtraData(req, res) {
	var extras = {};
	
	// extras::headers
	extras.headers = req.headers || {};
	// extras::host
	extras.host = extras.headers.host;
	// extras::url
	extras.url = req.url;
	// extras::method
	var method = req.method || '';
	extras.method = method.toLowerCase();
	
	var urlData = parseURL(req.url, true, true);
	urlData.pathname ? extras.pathname = urlData.pathname : {};
	urlData.query ? extras.query = urlData.query : {};
	urlData.hash ? extras.hash = urlData.hash : {};
	return extras;
}